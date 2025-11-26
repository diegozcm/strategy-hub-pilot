-- Drop existing policy
DROP POLICY IF EXISTS "Managers can manage module settings" ON company_module_settings;

-- Recreate policy with proper WITH CHECK clause
CREATE POLICY "Managers can manage module settings" ON company_module_settings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_company_relations ucr
      JOIN profiles p ON p.user_id = ucr.user_id
      WHERE ucr.company_id = company_module_settings.company_id 
        AND ucr.user_id = auth.uid() 
        AND p.role IN ('manager', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_company_relations ucr
      JOIN profiles p ON p.user_id = ucr.user_id
      WHERE ucr.company_id = company_module_settings.company_id 
        AND ucr.user_id = auth.uid() 
        AND p.role IN ('manager', 'admin')
    )
  );