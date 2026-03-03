

## Investigation Results

I compared the two KRs in the database:

**Broken KR** ("Reduzir o tempo médio de onboarding..."):
- `unit: "h"` / `title: "Reduzir o tempo médio..."` / `objective_id: "2f73edc5..."` / all data present

**Working KR** ("Unificar 100% das jornadas..."):
- `unit: "%"` / `title: "Unificar 100%..."` / `objective_id: "6caccbd1..."` / all data present

Both KRs have complete data in the database. The problem is NOT missing data.

## Root Causes Found

### 1. Unit "h" (horas) is not a valid Select option
The `KREditModal` unit dropdown only has: `%`, `R$`, `number`, `dias`, `score`, `pontos`. The KR has `unit: "h"`. Radix Select renders **empty** when the value doesn't match any option. This is why the unit appears empty.

The working KR uses `unit: "%"` which IS in the options, so it displays correctly.

### 2. Form initialization relies on useEffect timing (race condition)
The `basicInfo` state starts empty (`title: ''`, `unit: ''`, etc.) and is only populated by a `useEffect` that runs AFTER the first render. Combined with the `pendingEditOpen` pattern (which involves multiple state updates and re-renders), there's a timing window where React renders the form with empty state and the `useEffect` closure may not fire correctly due to stale dependencies or batched updates.

## Solution

### Fix 1: Add missing unit option (`KREditModal.tsx`)
Add `"h"` (Horas) to the Select options for unit, matching what already exists in the database.

### Fix 2: Initialize form state directly from props (`KREditModal.tsx`)
Replace the empty `useState` + `useEffect` pattern with a **lazy initializer** that reads from `keyResult` on mount:

```tsx
const [basicInfo, setBasicInfo] = useState(() => ({
  title: keyResult?.title || '',
  unit: keyResult?.unit || '',
  objective_id: keyResult?.objective_id || 'none',
  target_direction: (keyResult?.target_direction as TargetDirection) || 'maximize',
  // ... etc
}));
```

Since the `KREditModal` already receives a `key` prop that forces a full remount when data changes, initializing from props directly is safe and eliminates all timing issues. The `useEffect` becomes a fallback that only runs if the prop updates after mount (which the `key` pattern prevents).

### Files to modify
- `src/components/strategic-map/KREditModal.tsx` -- add `"h"` option + initialize from props

