-- Fix temp_reset_expires for users who had passwords reset before the new policy was deployed
-- Update from the old 15-minute expiration to 7 days (168 hours) from their reset time
UPDATE public.profiles 
SET temp_reset_expires = updated_at + INTERVAL '168 hours'
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email IN (
    'carlos.rezende@starian.com.br', 
    'clovis.netto@softplan.com.br', 
    'willian.lima@projuris.com.br'
  )
) AND must_change_password = true;