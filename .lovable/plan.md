
# Plano: Ajustar RLS para Membros Sempre Verem KRs

## Problema Identificado

A política atual de SELECT na tabela `key_results` exige que a configuração `members_can_view_all` esteja habilitada para membros verem os KRs. O comportamento esperado é que **membros SEMPRE vejam todos os KRs da empresa**, independente dessa configuração.

### Política Atual (Problemática)

```sql
-- Membros só veem KRs se:
-- 1. São manager/admin
-- 2. São donos do KR
-- 3. OU se members_can_view_all = true (configuração)  ❌ Problema aqui
```

### Comportamento Esperado

| Ação | Manager/Admin | Membro |
|------|---------------|--------|
| Ver todos os KRs | ✅ | ✅ (SEMPRE) |
| Criar KR | ✅ | ❌ |
| Editar configurações do KR | ✅ | ❌ |
| Deletar KR | ✅ | ❌ |
| Fazer check-in (inserir valores) | ✅ | ✅ (apenas nos seus KRs) |
| Criar/Editar/Deletar Iniciativas | ✅ | ❌ |
| Marcar suas tarefas como concluídas | ✅ | ✅ (apenas suas) |

---

## Estratégia de Implementação

### 1. Atualizar Política SELECT de key_results

Remover a dependência da configuração `members_can_view_all` - membros sempre veem todos os KRs da empresa.

**Nova lógica:**
```sql
-- Pode ver se:
-- 1. Pertence à empresa (via user_company_relations)
-- Simples assim - qualquer usuário da empresa pode ver todos os KRs
```

### 2. Atualizar Política UPDATE de key_results

Manter a lógica atual que já permite membros fazerem check-in nos seus KRs:
- Managers/Admins: podem editar qualquer KR
- Membros: podem editar apenas KRs onde são `assigned_owner_id`

A restrição de **quais campos** podem ser editados será tratada no frontend (já está implementado em `useKRPermissions`).

### 3. Atualizar Políticas de kr_initiatives

Atualmente qualquer usuário da empresa pode criar/editar/deletar iniciativas. Precisamos restringir para apenas managers/admins.

### 4. Atualizar Frontend (useKRPermissions)

O hook já está corretamente configurado:
- `canViewAllKRs` precisa ser `true` para todos os membros (sem depender de configuração)
- `canEditAnyKR` é `false` para membros
- `canCheckInKR` permite membros nos seus próprios KRs

---

## Detalhamento Técnico

### Arquivo 1: Nova Migration SQL

```sql
-- 1. Simplificar política SELECT para permitir todos da empresa verem KRs
DROP POLICY IF EXISTS "Users can view key results based on role" ON public.key_results;

CREATE POLICY "Company users can view all key results"
ON public.key_results
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM user_company_relations ucr
    JOIN strategic_plans sp ON sp.id = (
      SELECT so.plan_id 
      FROM strategic_objectives so 
      WHERE so.id = key_results.objective_id
    )
    WHERE ucr.user_id = auth.uid()
    AND ucr.company_id = sp.company_id
  )
);

-- 2. Manter política UPDATE (já está correta)
-- Managers editam todos, Members editam apenas onde são owner (check-in)

-- 3. Restringir políticas de kr_initiatives para managers/admins
DROP POLICY IF EXISTS "Users can create company KR initiatives" ON public.kr_initiatives;
DROP POLICY IF EXISTS "Users can update company KR initiatives" ON public.kr_initiatives;
DROP POLICY IF EXISTS "Users can delete company KR initiatives" ON public.kr_initiatives;

-- Manter SELECT aberto para membros verem
-- CREATE (apenas managers/admins)
CREATE POLICY "Managers can create KR initiatives"
ON public.kr_initiatives
FOR INSERT
TO authenticated
WITH CHECK (
  is_strategy_hub_manager(auth.uid())
  AND EXISTS (
    SELECT 1 FROM user_company_relations ucr
    WHERE ucr.user_id = auth.uid() 
    AND ucr.company_id = kr_initiatives.company_id
  )
  AND created_by = auth.uid()
);

-- UPDATE (apenas managers/admins)
CREATE POLICY "Managers can update KR initiatives"
ON public.kr_initiatives
FOR UPDATE
TO authenticated
USING (
  is_strategy_hub_manager(auth.uid())
  AND EXISTS (
    SELECT 1 FROM user_company_relations ucr
    WHERE ucr.user_id = auth.uid() 
    AND ucr.company_id = kr_initiatives.company_id
  )
);

-- DELETE (apenas managers/admins)
CREATE POLICY "Managers can delete KR initiatives"
ON public.kr_initiatives
FOR DELETE
TO authenticated
USING (
  is_strategy_hub_manager(auth.uid())
  AND EXISTS (
    SELECT 1 FROM user_company_relations ucr
    WHERE ucr.user_id = auth.uid() 
    AND ucr.company_id = kr_initiatives.company_id
  )
);
```

### Arquivo 2: Atualizar useKRPermissions.tsx

Simplificar a lógica de `canViewAllKRs` para sempre retornar `true` para qualquer membro do Strategy HUB (remover dependência de `membersCanViewAll`).

```typescript
// ANTES
canViewAllKRs: isManagerOrAdmin || (isMemberOnly && (settingsLoading || membersCanViewAll)),

// DEPOIS
canViewAllKRs: true, // Qualquer membro do módulo pode ver todos os KRs
```

### Arquivo 3: Remover Toggle de Visibilidade (Opcional)

A configuração `members_can_view_all` no `ModulesSettingsTab.tsx` pode ser removida ou mantida para futuro uso. Recomendo manter a UI mas ela ficará sem efeito prático.

---

## Resumo das Mudanças

| Arquivo | Mudança |
|---------|---------|
| Nova migration SQL | Simplificar SELECT policy, restringir initiativas |
| `src/hooks/useKRPermissions.tsx` | `canViewAllKRs` sempre `true` |
| `src/components/settings/ModulesSettingsTab.tsx` | Opcional: remover toggle ou deixar |

---

## Verificação Pós-Implementação

Após as mudanças, testar com um usuário **Membro** do Strategy HUB:

1. ✅ Consegue ver todos os KRs da empresa
2. ✅ Consegue fazer check-in nos KRs onde é dono
3. ❌ NÃO consegue criar novos KRs
4. ❌ NÃO consegue editar configurações de KRs
5. ❌ NÃO consegue deletar KRs
6. ❌ NÃO consegue criar/editar/deletar iniciativas
7. ✅ Consegue ver todas as iniciativas

