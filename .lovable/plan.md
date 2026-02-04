
# Plano: Corrigir Erro de FK na Exclusão de Usuário

## Problema Identificado

Ao tentar excluir o usuário "User Test Betinha", o sistema retorna:

> "update or delete on table 'profiles' violates foreign key constraint 'key_results_assigned_owner_id_fkey' on table 'key_results'"

### Causa Raiz

A função `safe_delete_user_with_replacement` não está transferindo **2 colunas** que referenciam a tabela `profiles`:

| Tabela | Coluna | Situação |
|--------|--------|----------|
| `key_results` | `owner_id` | ✅ Já transferida |
| `key_results` | `assigned_owner_id` | ❌ **Não transferida** |
| `strategic_projects` | `owner_id` | ✅ Já transferida |
| `strategic_projects` | `responsible_id` | ❌ **Não transferida** |

## Solução

Criar uma migration para atualizar a função `safe_delete_user_with_replacement` adicionando as transferências faltantes.

## Detalhamento Técnico

### Nova Migration SQL

A migration irá adicionar dois `UPDATE` statements antes da exclusão do perfil:

```sql
-- Após a transferência de owner_id de key_results (linha ~349)

-- Transfer key results assigned owner
UPDATE key_results 
SET assigned_owner_id = _replacement_user_id, updated_at = now()
WHERE assigned_owner_id = _user_id;

GET DIAGNOSTICS affected_records = ROW_COUNT;
IF affected_records > 0 THEN
  operations_log := operations_log || 
    ('Transferiu responsabilidade de ' || affected_records || ' resultado(s) chave');
END IF;

-- Após a transferência de owner_id de strategic_projects (linha ~329)

-- Transfer strategic projects responsible
UPDATE strategic_projects 
SET responsible_id = _replacement_user_id, updated_at = now()
WHERE responsible_id = _user_id;

GET DIAGNOSTICS affected_records = ROW_COUNT;
IF affected_records > 0 THEN
  operations_log := operations_log || 
    ('Transferiu responsável de ' || affected_records || ' projeto(s) estratégico(s)');
END IF;
```

## Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| Nova migration SQL | Atualizar função `safe_delete_user_with_replacement` |

## Verificação Pós-Implementação

1. ✅ Exclusão de usuário com `assigned_owner_id` em key_results funciona
2. ✅ Exclusão de usuário com `responsible_id` em strategic_projects funciona
3. ✅ Log de operações mostra as novas transferências
4. ✅ Dados críticos são transferidos para o usuário substituto
