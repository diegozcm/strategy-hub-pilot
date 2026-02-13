
# Plano: Realtime Sync Gradual (Fase 1)

## Escopo: Apenas `useActivePlan` + `useObjectivesData` + hook de Realtime

**NÃO** mexer em `useStrategicMap` nesta fase. Deixar para Fase 2 futura.

---

## Mudança 1: Criar `useStrategyRealtimeSync.ts` (NOVO)

Hook leve que escuta Supabase Realtime em tabelas estratégicas e invalida queries do react-query. Montado no `AppLayout`.

**Tabelas monitoradas:**
- `strategic_plans` → invalida `["active-plan"]`, `["strategic-plans"]`
- `strategic_pillars` → invalida `["strategic-pillars"]`
- `strategic_objectives` → invalida `["strategic-objectives"]`
- `key_results` → invalida `["key-results"]`
- `kr_fca`, `kr_monthly_actions`, `kr_initiatives` → invalida `["key-results"]`

**Padrão:** idêntico ao `useAdminRealtimeSync` que já funciona no Admin V2.

---

## Mudança 2: Migrar `useActivePlan.tsx` para react-query

- Substituir `useState` + `useEffect` + `useCallback` por `useQuery`
- Query key: `["active-plan", companyId]`
- Manter mesma interface de retorno: `{ activePlan, loading, hasActivePlan, refreshActivePlan }`

---

## Mudança 3: Migrar `useObjectivesData.tsx` para react-query

- Substituir 4 `useState` por 4 `useQuery`:
  - `["strategic-plans", companyId]`
  - `["strategic-pillars", companyId]`
  - `["strategic-objectives", planId]`
  - `["key-results", planId]` (busca por objective_ids do plano ativo)
- `refreshData()` vira `invalidateQueries`
- Manter mesma interface de retorno para não quebrar consumidores
- Remover `useHealthMonitor` e `useOperationState` (simplificar)

---

## Mudança 4: Montar hook no `AppLayout.tsx`

Adicionar `useStrategyRealtimeSync()` ao lado do `useRealtimePresence()` já existente.

---

## O que NÃO muda nesta fase

- `useStrategicMap.tsx` — continua com `useState`/`loadData` (Fase 2)
- Nenhuma página/componente consumidor precisa mudar (interface idêntica)
- Nenhum modal precisa mudar

---

## Resultado esperado

- Dashboard, Objetivos e Indicadores atualizam automaticamente quando dados mudam no banco
- Dois usuários na mesma página veem mudanças em tempo real
- Risco mínimo: se algo falhar, apenas essas 2 hooks são afetadas
