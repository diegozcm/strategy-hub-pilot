-- Allow mentors to delete their own action items
CREATE POLICY "Mentors can delete their own action items" 
ON public.action_items 
FOR DELETE 
USING (auth.uid() = created_by);

-- Allow mentors to update their own action items
CREATE POLICY "Mentors can update their own action items" 
ON public.action_items 
FOR UPDATE 
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);