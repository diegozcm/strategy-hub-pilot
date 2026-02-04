
# Plano: Correção de Permissões para Iniciativas ✅ CONCLUÍDO

## Implementação Realizada

### 1. Migration SQL (Backend)
Aplicada migration que:
- Permite UPDATE para todos os membros da empresa (não apenas managers)
- Trigger `restrict_initiative_updates()` protege campos sensíveis:
  - **Membros podem alterar**: `progress_percentage`, `status`
  - **Campos protegidos (somente gestores)**: `title`, `description`, `start_date`, `end_date`, `responsible`, `budget`, `priority`, `completion_notes`, `position`

### 2. Frontend Updates

| Arquivo | Mudança |
|---------|---------|
| `src/hooks/useKRPermissions.tsx` | Adicionado: `canCreateInitiative`, `canEditInitiativeConfig`, `canDeleteInitiative`, `canUpdateInitiativeProgress` |
| `src/components/strategic-map/initiatives/SortableInitiativeCard.tsx` | Nova prop `canEditConfig` - esconde botões Edit/Delete para membros |
| `src/components/strategic-map/KRInitiativesModal.tsx` | Usa `useKRPermissions` para controlar visibilidade do botão "Nova Iniciativa" e passa `canEditConfig` para os cards |

## Comportamento Final

| Ação | Gestor (manager) | Membro (member) |
|------|-----------------|-----------------|
| Ver iniciativas | ✅ | ✅ |
| Criar iniciativas | ✅ | ❌ |
| Editar título, datas, responsável, etc | ✅ | ❌ |
| Deletar iniciativas | ✅ | ❌ |
| Atualizar progresso (slider) | ✅ | ✅ |
| Ver status mudar automaticamente | ✅ | ✅ |
| Reordenar iniciativas (drag) | ✅ | ❌ (posição protegida) |

## Segurança

Mesmo que um membro tente editar campos protegidos via API direta, o trigger no banco de dados vai ignorar essas alterações e preservar os valores originais.
