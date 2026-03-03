

## Problem

The previous fix (`await refreshKeyResult()` then `setShowEditModal(true)`) doesn't actually work because of how React state updates work. Here's what happens:

1. `refreshKeyResult()` fetches data from DB and calls `setCurrentKeyResult(data)` 
2. The `await` resolves (the async function completed), but **React hasn't re-rendered yet** -- state updates are batched
3. `setShowEditModal(true)` fires in the same render cycle
4. The KREditModal receives the **old** `currentKeyResult` because the state hasn't committed yet
5. The `useEffect` in KREditModal checks `keyResult.title` -- if the old data was partial (no title), it skips initialization entirely

This is a classic React state batching problem: `await` waits for the promise, not for the state to be reflected in the next render.

## Solution

### 1. Use a pending-open pattern in `KROverviewModal.tsx`

Replace the direct `setShowEditModal(true)` with a two-phase approach:

- Add a `pendingEditOpen` ref/state
- On click: call `refreshKeyResult()` and set `pendingEditOpen = true`
- Add a `useEffect` that watches `currentKeyResult` + `pendingEditOpen`: when both are ready (data is fresh), then call `setShowEditModal(true)` and reset the flag

This guarantees the modal only opens **after** React has committed the updated `currentKeyResult` from the refresh.

### 2. Make `refreshKeyResult` return the data in `KROverviewModal.tsx`

Change `refreshKeyResult` to return the fetched data so it can optionally be used directly. This is a minor refactor for future-proofing.

### 3. Remove the `keyResult.title` guard in `KREditModal.tsx`

The title guard causes a deadlock: if data arrives without a title (edge case), the form never initializes. Instead, always initialize when `open` is true and `keyResult` exists, using fallback empty strings. The pending-open pattern in step 1 already guarantees complete data.

### 4. Add a `key` prop to force remount in `KROverviewModal.tsx`

On the `<KREditModal>` component, add `key={currentKeyResult.id + currentKeyResult.updated_at}` so React fully remounts the form when data changes. This is the nuclear option that bypasses all `useEffect` timing issues.

### Files to modify
- `src/components/strategic-map/KROverviewModal.tsx` -- pending-open pattern + key prop on KREditModal
- `src/components/strategic-map/KREditModal.tsx` -- remove title guard, always initialize

