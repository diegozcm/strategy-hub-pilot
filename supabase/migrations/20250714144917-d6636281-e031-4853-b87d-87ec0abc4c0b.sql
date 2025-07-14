-- Add DELETE policy for key_results table
CREATE POLICY "Users can delete key results" ON public.key_results
FOR DELETE 
USING (auth.uid() IS NOT NULL);