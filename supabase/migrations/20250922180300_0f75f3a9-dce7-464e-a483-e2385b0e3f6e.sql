-- Fix search_path for the landing page content trigger
CREATE OR REPLACE FUNCTION public.update_landing_page_content_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;