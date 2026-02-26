

## Plano: Sincronizacao em tempo real para o painel de IA

### Problema

O hook `useAdminRealtimeSync` (montado no layout `AdminV2Page`) nao inclui subscricoes para as tabelas de IA. Quando um usuario faz uma chamada de chat, os dados de `ai_analytics`, `ai_chat_sessions` e `ai_chat_messages` sao inseridos no banco, mas o dashboard admin nao atualiza ate o refresh manual.

### Solucao

Adicionar 4 novas subscricoes no `useAdminRealtimeSync.ts` para as tabelas de IA:

| Tabela | Query keys invalidadas |
|---|---|
| `ai_analytics` | `ai-analytics-raw`, `ai-model-pricing` |
| `ai_chat_sessions` | `ai-chat-sessions-admin` |
| `ai_chat_messages` | `ai-chat-sessions-admin` |
| `ai_model_pricing` | `ai-model-pricing`, `ai-pricing-history` |

### Arquivo afetado

`src/hooks/admin/useAdminRealtimeSync.ts` — adicionar 4 blocos `.on()` antes do `.subscribe()`.

### Detalhes tecnicos

Cada bloco `.on("postgres_changes", ...)` escuta INSERT/UPDATE/DELETE na tabela correspondente e chama `queryClient.invalidateQueries()` para as query keys usadas nos hooks de `useAIUsageStats.ts`:

- `ai-analytics-raw` (usado em `useAIAnalyticsRaw`)
- `ai-chat-sessions-admin` (usado em `useAIChatSessions`)
- `ai-model-pricing` (usado em `useModelPricing`)
- `ai-pricing-history` (usado em `usePricingHistory`)
- `ai-usage-limits` (usado em `useUsageLimits`)
- `companies-map-with-ai` (usado em `useCompaniesMap`)
- `profiles-map-admin` (usado em `useProfilesMap`)

