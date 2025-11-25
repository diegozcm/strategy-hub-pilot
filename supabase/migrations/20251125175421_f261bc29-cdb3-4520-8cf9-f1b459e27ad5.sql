-- Permitir que usuários vejam os perfis de outros usuários da mesma empresa
CREATE POLICY "Users can view profiles of same company users" 
ON profiles
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM user_company_relations ucr1
    JOIN user_company_relations ucr2 ON ucr1.company_id = ucr2.company_id
    WHERE ucr1.user_id = auth.uid() 
    AND ucr2.user_id = profiles.user_id
  )
);