

## Current State

**Database:** `user_company_relations` links users to companies but has no distinction between "member" and "consultant." The `profiles.company_id` field was being used as a proxy for "native company," but it's inconsistent — COFOUND users have primary companies set to Perville, Projuris, Movimento e Cia, etc.

**Impact:** When viewing Projuris KRs, the responsible dropdown (image 3) shows COFOUND consultants (Raianne Borges, Marketing COFOUND, etc.) who shouldn't be selectable as owners. The filter page (image 1) also doesn't distinguish native vs consultant users.

## Plan

### 1. Add `relation_type` column to `user_company_relations`

New migration:
- Add column `relation_type TEXT DEFAULT 'member'` with check constraint `('member', 'consultant')`
- `member` = native/belongs to the company (appears in selects, filters, metrics)
- `consultant` = external advisor (can access data, cannot be assigned as responsible)
- Create index on `(company_id, relation_type)` for fast filtering

### 2. Data migration — set correct relation types

In the same migration:
- Set all existing relations to `'member'` (default, safe baseline)
- The admin can then manually adjust COFOUND users to be `'consultant'` in other companies via the UI (step 4)

### 3. Update `get_company_users` RPC

Modify the function to accept an optional `_relation_type` parameter:
- Default behavior (no filter): returns ALL users (for admin views)
- `_relation_type = 'member'`: returns only native members (for responsible selects, KR filters)
- This way, existing admin panels still work, but selects can request members only

### 4. Admin UI — Manage relation types

**In `ManageCompanyUsersModal`:**
- Show a badge next to each user: "Membro" or "Consultor"
- Add a toggle/button to switch between member and consultant
- When adding a user, default to "Membro" with option to add as "Consultor"

**In `FilterUsersPage`:**
- Add a "Tipo de Relação" column showing whether the user is member or consultant for the filtered company
- Add filter option for relation type

**In `CompanyDetailsModal` (users section):**
- Show member vs consultant count

### 5. Update frontend selects to use `relation_type = 'member'`

**`useCompanyUsers` hook:** Pass `_relation_type: 'member'` to `get_company_users` RPC — this filters out consultants from all responsible/owner dropdowns across KRs, projects, objectives, etc.

**KR filter sidebar (image 2, "RESPONSÁVEL"):** Already uses `useCompanyUsers`, so it will automatically exclude consultants.

### Files to modify

| File | Change |
|---|---|
| New migration SQL | Add `relation_type` column, update `get_company_users` RPC |
| `src/hooks/useCompanyUsers.tsx` | Pass `relation_type: 'member'` to RPC |
| `src/components/admin-v2/pages/companies/modals/ManageCompanyUsersModal.tsx` | Add member/consultant toggle per user |
| `src/components/admin-v2/pages/users/FilterUsersPage.tsx` | Show relation type column |
| `src/hooks/admin/useUsersStats.tsx` | Include relation_type in user details |
| `src/integrations/supabase/types.ts` | Update RPC types for new parameter |

### Technical notes

- The `relation_type` column replaces the need for `profiles.company_id` as a "native company" indicator
- No RLS changes needed — consultants still have access via `user_company_relations`, they're just filtered out of UI selects
- The `get_company_users` RPC change is backward-compatible (default returns all)

