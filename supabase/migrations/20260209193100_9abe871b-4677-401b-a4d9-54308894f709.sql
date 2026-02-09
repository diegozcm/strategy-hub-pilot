
-- Remove all MFA factors for admin@example.com
DELETE FROM auth.mfa_factors
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'admin@example.com'
);
