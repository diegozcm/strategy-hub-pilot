-- Drop existing policies
DROP POLICY IF EXISTS "Managers can manage module settings" ON company_module_settings;
DROP POLICY IF EXISTS "Module managers can manage settings" ON company_module_settings;

-- Create policy that checks user_module_roles for the specific module
CREATE POLICY "Module managers can manage settings" ON company_module_settings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 
      FROM user_company_relations ucr
      JOIN user_module_roles umr ON umr.user_id = ucr.user_id
      JOIN system_modules sm ON sm.id = umr.module_id
      WHERE ucr.company_id = company_module_settings.company_id 
        AND ucr.user_id = auth.uid()
        AND sm.slug = company_module_settings.module_slug
        AND umr.role IN ('manager', 'admin')
        AND umr.active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM user_company_relations ucr
      JOIN user_module_roles umr ON umr.user_id = ucr.user_id
      JOIN system_modules sm ON sm.id = umr.module_id
      WHERE ucr.company_id = company_module_settings.company_id 
        AND ucr.user_id = auth.uid()
        AND sm.slug = company_module_settings.module_slug
        AND umr.role IN ('manager', 'admin')
        AND umr.active = true
    )
  );