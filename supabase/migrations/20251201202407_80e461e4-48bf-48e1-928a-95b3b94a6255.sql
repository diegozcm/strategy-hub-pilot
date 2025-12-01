-- Remove the outdated assign_user_to_company_v2 function that uses the non-existent 'role' column
-- This function signature has 4 arguments: (uuid, uuid, uuid, varchar)
DROP FUNCTION IF EXISTS public.assign_user_to_company_v2(uuid, uuid, uuid, varchar);

-- The correct version with 3 arguments (_admin_id uuid, _user_id uuid, _company_id uuid) remains active
-- and does not use the removed 'role' column