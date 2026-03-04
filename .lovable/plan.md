

## Fix: Select dropdown closing the Dialog

### Problem
Radix `<Select>` renders its `<SelectContent>` in a **Portal** (separate DOM node at the body level). When you click "Membro" or "Consultor", the `<DialogContent>` sees that click as happening **outside** itself and closes the modal.

### Solution
Add `onInteractOutside` to the `<DialogContent>` in `ManageCompanyUsersModal.tsx` to prevent closing when the interaction target is inside a Radix Select portal.

**File**: `src/components/admin-v2/pages/companies/modals/ManageCompanyUsersModal.tsx`

Change the `<DialogContent>` (line 240) to:

```tsx
<DialogContent 
  className="sm:max-w-4xl max-h-[85vh] flex flex-col overflow-hidden p-0"
  onInteractOutside={(e) => e.preventDefault()}
>
```

This prevents the Dialog from closing on any outside interaction (the Select portal click). The user can still close the modal via the X button or the "Fechar" button. This is a single-line change.

