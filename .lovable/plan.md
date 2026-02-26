

## Root Cause

`AIUsageDashboardPage.tsx` line 26:
```
const dateFrom = subDays(new Date(), parseInt(days)).toISOString();
```

`new Date()` produces a different millisecond value on every render. This changes the `queryKey` in `useAIAnalyticsRaw(dateFrom)`, which triggers a refetch, which causes a re-render, which produces a new `dateFrom`, creating an **infinite fetch loop**. The spinner never resolves because `isLoading` resets to `true` every cycle.

All 4 network queries (analytics, pricing, companies, profiles) return 200 OK with correct data — the issue is purely a render loop.

## Fix

1. **`AIUsageDashboardPage.tsx`**: Wrap `dateFrom` in `useMemo` depending only on `days`, truncating to date-only precision (no milliseconds):
```ts
const dateFrom = useMemo(() => {
  const d = subDays(new Date(), parseInt(days));
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}, [days]);
```

This stabilizes the queryKey so React Query only refetches when the user changes the period selector.

2. **Same fix in any other AI page** that computes `dateFrom` inline (check `AIByCompanyPage`, `AIByUserPage`).

One-line root cause, one-line fix. No other changes needed — the page already has correct data handling, KPIs, charts, and table rendering. Once the infinite loop stops, everything will render properly.

