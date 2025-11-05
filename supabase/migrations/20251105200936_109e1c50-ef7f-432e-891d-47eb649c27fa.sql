-- Remove diego@cofound.com.br como System Admin
DELETE FROM public.user_roles 
WHERE user_id = '35749be5-8520-4d39-a98f-299af5ca5af9' 
  AND role = 'admin'::app_role;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "System admins can view user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "System admins can manage user_roles" ON public.user_roles;

-- Create policies for admins to manage user_roles
CREATE POLICY "System admins can view user_roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System admins can manage user_roles"
ON public.user_roles FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));