
# Plano: Correção de Permissões para Iniciativas

## Problemas Identificados

### 1. Usuário com Role Incorreta
O usuário **Tiago Fachini** (`tiago.fachini@projuris.com.br`) está cadastrado como **member** no Strategy HUB, mas deveria ser **manager** (Gestor).

| Email | Role Atual | Role Esperada |
|-------|------------|---------------|
| tiago.fachini@projuris.com.br | member | **manager** |

### 2. Frontend Exibe Botões para Todos
O componente `SortableInitiativeCard` mostra botões de Editar/Excluir para todos os usuários, independente da role.

## Ações Necessárias

### Opção A: Corrigir Role do Usuário (se for apenas esse caso)

Executar SQL para atualizar a role do Tiago:

```sql
UPDATE user_module_roles
SET role = 'manager'
WHERE user_id = '1c0de795-7fde-4c79-9a7a-328fbf2cd40d'
AND module_id = 'cc86887a-1f7c-40b6-807b-22a2e304293b';
```

### Opção B: Permitir Membros Atualizarem Progresso (se for requisito do sistema)

Se membros devem poder atualizar progresso das iniciativas:

#### 1. Nova Migration SQL

```sql
-- Permitir UPDATE para todos da empresa (não apenas managers)
DROP POLICY IF EXISTS "Managers can update KR initiatives" ON kr_initiatives;

CREATE POLICY "Company users can update KR initiatives"
ON kr_initiatives FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_company_relations ucr
    WHERE ucr.user_id = auth.uid() 
    AND ucr.company_id = kr_initiatives.company_id
  )
);

-- Trigger para proteger campos sensíveis
CREATE OR REPLACE FUNCTION restrict_initiative_updates()
RETURNS TRIGGER AS $$
BEGIN
  -- Se não é manager, só permite alterar progresso e status
  IF NOT is_strategy_hub_manager(auth.uid()) THEN
    NEW.title := OLD.title;
    NEW.description := OLD.description;
    NEW.start_date := OLD.start_date;
    NEW.end_date := OLD.end_date;
    NEW.responsible := OLD.responsible;
    NEW.budget := OLD.budget;
    NEW.priority := OLD.priority;
    NEW.completion_notes := OLD.completion_notes;
    NEW.position := OLD.position;
    -- Apenas progress_percentage e status são permitidos
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_restrict_initiative_updates
BEFORE UPDATE ON kr_initiatives
FOR EACH ROW
EXECUTE FUNCTION restrict_initiative_updates();
```

#### 2. Atualizar useKRPermissions.tsx

Adicionar permissões específicas para iniciativas:

```typescript
// Após linha 53, adicionar:
// Permissões de iniciativas
canCreateInitiative: isManagerOrAdmin,
canEditInitiativeConfig: isManagerOrAdmin,
canDeleteInitiative: isManagerOrAdmin,
canUpdateInitiativeProgress: true, // Todos podem atualizar progresso
```

#### 3. Atualizar SortableInitiativeCard.tsx

Receber prop de permissão e esconder botões:

```typescript
interface SortableInitiativeCardProps {
  // ... props existentes
  canEditConfig?: boolean; // Nova prop
}

// No JSX, envolver botões com condição:
{canEditConfig !== false && (
  <div className="flex gap-1">
    <Button onClick={() => onEdit(initiative)}>...</Button>
    <Button onClick={() => onDelete(initiative.id)}>...</Button>
  </div>
)}
```

#### 4. Atualizar KRInitiativesModal.tsx

Importar hook e passar permissão:

```typescript
import { useKRPermissions } from '@/hooks/useKRPermissions';

// Dentro do componente:
const { canEditInitiativeConfig, canCreateInitiative } = useKRPermissions();

// Esconder botão "Nova Iniciativa" para membros:
{canCreateInitiative && !showNewForm && (
  <Button onClick={() => setShowNewForm(true)}>
    Nova Iniciativa
  </Button>
)}

// Passar para o card:
<SortableInitiativeCard 
  canEditConfig={canEditInitiativeConfig}
  {...outrasProps}
/>
```

## Resumo das Mudanças

| Arquivo | Mudança |
|---------|---------|
| Nova migration SQL | Permitir UPDATE + trigger de proteção |
| `src/hooks/useKRPermissions.tsx` | Adicionar permissões de iniciativas |
| `src/components/strategic-map/initiatives/SortableInitiativeCard.tsx` | Esconder botões para membros |
| `src/components/strategic-map/KRInitiativesModal.tsx` | Verificar permissões antes de exibir ações |

## Verificação Pós-Implementação

1. ✅ Gestor (manager) pode criar/editar/deletar iniciativas
2. ✅ Gestor pode atualizar progresso
3. ✅ Membro NÃO vê botão "Nova Iniciativa"
4. ✅ Membro NÃO vê botões de Editar/Excluir nas iniciativas
5. ✅ Membro CONSEGUE arrastar slider de progresso
6. ✅ Se membro tentar editar via API, campos protegidos são ignorados pelo trigger

## Recomendação

Se o Tiago deveria ser **Gestor**, a **Opção A** (atualizar a role) é mais simples. Se membros em geral devem poder atualizar progresso, implementar a **Opção B** completa.
