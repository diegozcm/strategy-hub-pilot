

## Diagnostico: Dashboard IA Atlas carregando infinito + dados incorretos

### Problemas identificados

**Problema 1 — Dashboard IA carrega infinito (causa raiz: RLS)**

A tabela `ai_analytics` tem esta politica de SELECT:
```
"Users can view their own analytics" → user_id = auth.uid()
```

O dashboard admin precisa ver dados de TODOS os usuarios, mas a RLS so permite ver os proprios. A query fica retornando vazio ou falhando silenciosamente, e o React Query mantem o estado de loading.

**Problema 2 — Tabela `ai_model_pricing` inacessivel (causa raiz: funcao chamada errada)**

As politicas de RLS da `ai_model_pricing` chamam `is_system_admin()` **sem argumentos**, mas a funcao exige 1 argumento (`_user_id uuid`). Isso causa erro SQL, impedindo o carregamento dos precos e, consequentemente, o calculo de custos.

Politicas atuais (todas quebradas):
```sql
USING (public.is_system_admin())  -- ERRADO: falta auth.uid()
```

Deveria ser:
```sql
USING (public.is_system_admin(auth.uid()))
```

**Problema 3 — Contagens de usuarios no FilterCompaniesPage**

As contagens de usuarios estao menores que o real. A query busca `user_company_relations` sem `.select("company_id")` com contagem server-side — ela traz todas as relations e conta no frontend, mas a RLS pode limitar quais relations o admin ve dependendo de como as policies se combinam. Na pratica, o admin (com role `admin` em `user_roles`) deveria ver tudo via policy `System admins can manage company relations`, entao isso pode ser um problema de cache ou da forma como o `select("company_id")` retorna dados.

### Solucao

**Migracao SQL** — Corrigir RLS de 2 tabelas:

1. **`ai_analytics`**: Adicionar policy para system admins verem todos os registros
```sql
CREATE POLICY "System admins can view all analytics"
  ON public.ai_analytics FOR SELECT
  USING (public.is_system_admin(auth.uid()));
```

2. **`ai_model_pricing`**: Recriar as 4 policies com `auth.uid()`:
```sql
-- DROP das 4 policies existentes
-- Recriar com is_system_admin(auth.uid())
```

**Frontend** — Melhorias no hook e dashboard:

3. **`useAIUsageStats.ts`**: Garantir que o hook trata erro de RLS graciosamente (nao fica em loading infinito)

4. **`AIUsageDashboardPage.tsx`**: Adicionar tratamento de estado vazio e erro, para que mesmo sem dados o dashboard renderize (em vez de spinner infinito)

### Arquivos afetados

| Arquivo | Acao |
|---|---|
| Nova migracao SQL | Corrigir RLS de `ai_analytics` e `ai_model_pricing` |
| `src/hooks/admin/useAIUsageStats.ts` | Adicionar tratamento de erro |
| `src/components/admin-v2/pages/ai/AIUsageDashboardPage.tsx` | Tratar estados de erro/vazio |

