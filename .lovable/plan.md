
## Correção: Atlas não consegue criar FCAs e falha ao buscar KRs

### Diagnóstico

O erro "JSON object requested, multiple (or no) rows returned" tem **três causas**:

1. **Não existe ação `create_fca`**: O Atlas não possui nenhum tipo de ação para criar FCAs. Quando o usuário pede para registrar análises FCA, o Atlas improvisa usando `update_key_result`, o que falha.

2. **Busca de KR sem filtro de empresa**: Na resolução por título (linha 501), a query `ilike` não filtra por `company_id`. Isso pode retornar KRs de outra empresa ou nenhum resultado.

3. **`.single()` no update**: Após o update, o código usa `.single()` que lança erro se 0 linhas são retornadas (bloqueio de RLS ou KR não encontrado). Deveria usar `.maybeSingle()`.

### Correções

**Arquivo 1: `supabase/functions/ai-agent-execute/index.ts`**

- Adicionar novo tipo de ação `create_fca` que aceita:
  - `kr_id` ou `kr_title` (para resolver o KR)
  - `title`, `fact`, `cause` (obrigatórios)
  - `description`, `priority`, `status` (opcionais)
  - `linked_update_month`, `linked_update_value` (opcionais, para vincular ao desvio)

- Corrigir a busca de KR por título em `update_key_result`: adicionar filtro `.eq('company_id', company_id)` na query `ilike`

- Trocar `.single()` por `.maybeSingle()` no update de KR (linha 535) e tratar o caso de retorno nulo

**Arquivo 2: `supabase/functions/ai-chat/index.ts`**

- Adicionar `create_fca` na lista de tipos de ação do system prompt:
  ```text
  17. **create_fca** -- Cria uma analise FCA (Fato-Causa-Acao) vinculada a um KR
      - Campos: kr_id ou kr_title (obrigatorio), title, fact, cause (obrigatorios), description, priority (low/medium/high), status (active/resolved/cancelled), linked_update_month (ex: "2026-02"), linked_update_value (valor numerico do desvio)
  ```

- Documentar no prompt que quando o usuario pedir para justificar desvios ou registrar FCAs, o Atlas deve usar `create_fca` (e nao `update_key_result`)

**Deploy**: Redeployar ambas as edge functions.

### Resultado Esperado

Quando o usuario pedir "registre FCAs para os KRs com alerta", o Atlas gerara:

```text
[ATLAS_PLAN]
{"actions": [
  {"type": "create_fca", "data": {
    "kr_title": "Ticket Medio",
    "title": "Desvio positivo Ticket Medio Fev/2026",
    "fact": "Ticket medio superou a meta em 6.9%",
    "cause": "Campanha de cross-sell performou acima do esperado",
    "priority": "medium",
    "linked_update_month": "2026-02"
  }}
]}
[/ATLAS_PLAN]
```
