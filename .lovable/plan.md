

## Problem

When clicking "Propriedades" (Edit) on certain KRs, the edit form (`KREditModal`) opens with all fields empty. This is a data initialization bug with two root causes:

### Root Cause 1: Race condition between refresh and modal open
In `KROverviewModal`, when the modal opens, `refreshKeyResult()` is called asynchronously (line 160-164). If the user clicks "Propriedades" before the refresh completes, `currentKeyResult` might still hold the old/incomplete data passed from the parent view.

### Root Cause 2: React `useEffect` dependency on object reference
The `KREditModal` initialization effect (line 310-348) depends on `[open, keyResult]`. When the user closes and reopens the edit modal:
- `open` toggles `false → true` (triggers correctly)
- But `keyResult` is the same `currentKeyResult` object reference

This should work in theory, but the issue is that some parent views (Dashboard, Indicators) pass **partial KR objects** that only contain summary fields (id, title, progress) without the full data. The `refreshKeyResult` in KROverviewModal fetches the complete data, but if the edit modal is opened before that async fetch completes, it initializes with the partial/empty data.

## Solution

### 1. Guard `KREditModal` against incomplete data (in `KREditModal.tsx`)
- Add a loading/initialization check: if `keyResult` has no `title` (the most basic field), show a loading state instead of empty fields
- Use `keyResult.id` as an additional trigger to force re-initialization when the KR data is refreshed

### 2. Ensure fresh data before opening edit modal (in `KROverviewModal.tsx`)
- When the user clicks "Propriedades", first await `refreshKeyResult()`, then set `showEditModal(true)` -- this guarantees the modal always gets complete data
- Change the click handler from:
  ```tsx
  onClick={() => setShowEditModal(true)}
  ```
  to an async handler that refreshes first:
  ```tsx
  onClick={async () => {
    await refreshKeyResult();
    setShowEditModal(true);
  }}
  ```

### 3. Stabilize the useEffect dependency (in `KREditModal.tsx`)
- Change the effect dependency from `[open, keyResult]` to `[open, keyResult?.id, keyResult?.updated_at]` so it re-triggers when the KR data is actually refreshed from the database, not just when the object reference changes

These three changes combined ensure the edit form always opens with complete, up-to-date data regardless of which view the user came from.

