## Consultant vs Member - Implementation Complete

### What was done

1. **Database migration**: Added `relation_type` column (`'member'` | `'consultant'`) to `user_company_relations` with validation trigger and index.

2. **Updated `get_company_users` RPC**: Now accepts optional `_relation_type` parameter. When `'member'` is passed, only native members are returned. Default (NULL) returns all users for admin views.

3. **Frontend selects filter by `'member'`**: All responsible/owner dropdowns now pass `'member'` to `useCompanyUsers`:
   - `InlineKeyResultForm` 
   - `StandaloneKeyResultForm`
   - `KREditModal`
   - `AddResultadoChaveModal`
   - `MeetingDetailModal` (governance)

4. **Admin UI**: `ManageCompanyUsersModal` shows clickable "Membro"/"Consultor" badge per user to toggle relation type.

### How it works
- All existing relations default to `'member'`
- Admin can toggle users to `'consultant'` in the company users modal
- Consultants can still access/view company data but don't appear in responsible selects
- The `useCompanyUsers` hook accepts an optional `relationTypeFilter` parameter
