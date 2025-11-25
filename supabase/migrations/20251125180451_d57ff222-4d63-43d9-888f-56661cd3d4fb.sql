-- Permitir que usuários vejam as relações de outros usuários da mesma empresa
CREATE POLICY "Users can view company relations of same company members" 
ON user_company_relations
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM user_company_relations my_relations
    WHERE my_relations.user_id = auth.uid() 
    AND my_relations.company_id = user_company_relations.company_id
  )
);