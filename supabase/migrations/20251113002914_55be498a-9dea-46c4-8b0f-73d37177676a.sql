-- Improve logging in publish_landing_page_content function
CREATE OR REPLACE FUNCTION public.publish_landing_page_content()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_is_admin boolean;
  v_row_count int;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  -- Log user attempting to publish
  RAISE NOTICE 'User % attempting to publish landing page', v_user_id;
  
  -- Check if user is admin
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = v_user_id
    AND user_roles.role = 'admin'::app_role
  ) INTO v_is_admin;
  
  RAISE NOTICE 'User % admin status: %', v_user_id, v_is_admin;
  
  -- Verify user is admin
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Only admins can publish landing page content. User ID: %', v_user_id;
  END IF;

  -- Clear current content
  DELETE FROM public.landing_page_content;
  GET DIAGNOSTICS v_row_count = ROW_COUNT;
  RAISE NOTICE 'Deleted % rows from landing_page_content', v_row_count;

  -- Copy draft to production
  INSERT INTO public.landing_page_content
  SELECT * FROM public.landing_page_content_draft;
  GET DIAGNOSTICS v_row_count = ROW_COUNT;
  RAISE NOTICE 'Copied % rows to landing_page_content', v_row_count;

  -- Log success
  RAISE NOTICE 'Landing page published successfully by user %', v_user_id;
END;
$$;