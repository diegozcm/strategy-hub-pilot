-- Add temporary password reset token fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN temp_reset_token TEXT NULL,
ADD COLUMN temp_reset_expires TIMESTAMP WITH TIME ZONE NULL;

-- Add index for faster token lookups
CREATE INDEX idx_profiles_temp_reset_token ON public.profiles(temp_reset_token) 
WHERE temp_reset_token IS NOT NULL;