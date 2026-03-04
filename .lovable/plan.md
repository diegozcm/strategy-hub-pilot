

## Simulation: Current State vs After Fix

### Root Cause (confirmed via DB query)

The database has **two overloaded functions**:
1. `get_company_users(_company_id uuid)` — the OLD version
2. `get_company_users(_company_id uuid, _relation_type text DEFAULT NULL)` — the NEW version from our migration

PostgREST cannot resolve which to call when only `_company_id` is passed → **HTTP 300 error**.

### Current Impact — Who Breaks, Who Works

| Caller | Params Sent | Status |
|--------|-------------|--------|
| **IndicatorsPage** (filtro Responsável) | `{ _company_id }` | **BROKEN — 300 error, lista vazia** |
| **ProjectsPage** | `{ _company_id }` | **BROKEN — 300 error** |
| **ManageCompanyUsersModal** (admin) | `{ _company_id }` | **BROKEN — 300 error, 0 users** |
| **CompanyDetailsModal** (admin) | `{ _company_id }` | **BROKEN — 300 error** |
| KREditModal | `{ _company_id, _relation_type: 'member' }` | Works (2 params = unambiguous) |
| AddResultadoChaveModal | `{ _company_id, _relation_type: 'member' }` | Works |
| StandaloneKeyResultForm | `{ _company_id, _relation_type: 'member' }` | Works |
| InlineKeyResultForm | `{ _company_id, _relation_type: 'member' }` | Works |
| MeetingDetailModal | `{ _company_id, _relation_type: 'member' }` | Works |

### After Fix — Drop Old Function

**Migration**: `DROP FUNCTION IF EXISTS public.get_company_users(uuid);`

This leaves only the 2-param version. When called with just `_company_id`, PostgREST uses the DEFAULT NULL for `_relation_type`.

| Caller | Params Sent | After Fix Result |
|--------|-------------|-----------------|
| **IndicatorsPage** | `{ _company_id }` | Returns ALL users (NULL = no filter) — correct for display/filter sidebar |
| **ProjectsPage** | `{ _company_id }` | Returns ALL users — correct for project views |
| **ManageCompanyUsersModal** | `{ _company_id }` | Returns ALL users with relation_type — correct for admin toggle |
| **CompanyDetailsModal** | `{ _company_id }` | Returns ALL users — correct for admin |
| KR forms (4 files) | `{ _company_id, _relation_type: 'member' }` | Returns only members — consultants excluded from selects |
| MeetingDetailModal | `{ _company_id, _relation_type: 'member' }` | Returns only members |

### What to implement

**One SQL migration** — single line:
```sql
DROP FUNCTION IF EXISTS public.get_company_users(uuid);
```

**No frontend changes needed.** The `useCompanyUsers` hook already conditionally includes `_relation_type` only when a filter is provided (line 37-39), which is exactly the right behavior.

### Risk assessment

- Zero risk: the old 1-param function body is a subset of the new 2-param function (same query, just without the `_relation_type` filter)
- All existing callers continue working with identical or better behavior
- The admin toggle in ManageCompanyUsersModal will work again for setting member/consultant

