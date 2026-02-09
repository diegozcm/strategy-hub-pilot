

## Correcao da Funcao de Exclusao de Usuarios

### Problema

O erro persiste porque as migracoes anteriores (`20260204201951` e `20260204201537`) ja foram aplicadas ao banco com o nome errado da tabela (`company_user_relations`). Migracoes ja aplicadas nao sao re-executadas, entao a correcao precisa ser uma **nova migracao**.

### Causa Raiz

Duas funcoes SQL referenciam `company_user_relations` quando a tabela real se chama `user_company_relations`:

| Funcao | Linha com erro |
|--------|----------------|
| `safe_delete_user` | Linha 35: `DELETE FROM public.company_user_relations` |
| `safe_delete_user_with_replacement` | Linha 192: `DELETE FROM company_user_relations` |

Adicionalmente, ha um segundo erro nos logs: `column user_module_roles.is_active does not exist` - a funcao `find_compatible_replacement_users` provavelmente usa `is_active` quando a coluna real se chama `active`.

### Solucao

Criar uma **nova migracao SQL** que faz `CREATE OR REPLACE` de ambas as funcoes com as correcoes:

1. **`safe_delete_user`**: Remover a linha `DELETE FROM public.company_user_relations` (duplicada - a linha seguinte ja deleta de `user_company_relations` corretamente)

2. **`safe_delete_user_with_replacement`**: Trocar `DELETE FROM company_user_relations` por `DELETE FROM user_company_relations`

3. **`find_compatible_replacement_users`**: Corrigir referencia a `user_module_roles.is_active` para `user_module_roles.active`

### Detalhes Tecnicos

**Arquivo a criar:**
- Uma nova migracao SQL com `CREATE OR REPLACE FUNCTION` para as 3 funcoes

**Conteudo da migracao:**
- Drop e recriacao de `safe_delete_user(uuid, uuid)` - copia exata da versao atual mas sem a linha 35 (`company_user_relations`)
- Drop e recriacao de `safe_delete_user_with_replacement(uuid, uuid, uuid)` - copia exata mas com `user_company_relations` na linha 192
- Correcao de `find_compatible_replacement_users` para usar `active` em vez de `is_active` na tabela `user_module_roles`

Nenhuma alteracao de codigo frontend e necessaria - o problema e exclusivamente no banco de dados.

