-- Fix current user's must_change_password status for logged-in users
-- This corrects the flag for users who got stuck in the loop

UPDATE public.profiles 
SET must_change_password = false, 
    updated_at = now()
WHERE must_change_password = true 
  AND status = 'active';