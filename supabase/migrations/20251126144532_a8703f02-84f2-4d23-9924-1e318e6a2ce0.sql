-- ============================================================================
-- Phase 1: Consolidate Role System - RLS Policies Cleanup
-- ============================================================================

-- 1. Remove duplicate policy on company_module_settings
DROP POLICY IF EXISTS "Managers can view module settings" ON company_module_settings;

-- 2. Update startup_hub_profiles policies
-- Drop old policies that used profiles.role
DROP POLICY IF EXISTS "Admin can manage all startup hub profiles" ON startup_hub_profiles;
DROP POLICY IF EXISTS "Users can view startup hub profiles with module access" ON startup_hub_profiles;

-- Create new policies using is_system_admin()
CREATE POLICY "System admins can manage all startup hub profiles" ON startup_hub_profiles
  FOR ALL
  USING (public.is_system_admin(auth.uid()))
  WITH CHECK (public.is_system_admin(auth.uid()));

-- Users can manage their own profile
CREATE POLICY "Users can manage own startup hub profile" ON startup_hub_profiles
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users with module access can view profiles
CREATE POLICY "Module users can view startup hub profiles" ON startup_hub_profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_modules um
      JOIN system_modules sm ON sm.id = um.module_id
      WHERE um.user_id = auth.uid()
        AND um.active = true
        AND sm.slug = 'startup-hub'
    )
  );