-- Add company_id to ai_insights table
ALTER TABLE public.ai_insights 
ADD COLUMN company_id uuid;

-- Add company_id to ai_chat_sessions table  
ALTER TABLE public.ai_chat_sessions
ADD COLUMN company_id uuid;

-- Update RLS policies for ai_insights to be company-wide
DROP POLICY IF EXISTS "Users can view their own insights" ON public.ai_insights;
DROP POLICY IF EXISTS "Users can create insights" ON public.ai_insights;
DROP POLICY IF EXISTS "Users can update their own insights" ON public.ai_insights;
DROP POLICY IF EXISTS "Users can delete their own insights" ON public.ai_insights;

-- New RLS policies for ai_insights (company-wide)
CREATE POLICY "Users can view company insights" 
ON public.ai_insights 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM user_company_relations ucr 
    WHERE ucr.user_id = auth.uid() 
    AND ucr.company_id = ai_insights.company_id
  )
);

CREATE POLICY "Users can create company insights" 
ON public.ai_insights 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_company_relations ucr 
    WHERE ucr.user_id = auth.uid() 
    AND ucr.company_id = ai_insights.company_id
  )
  AND auth.uid() = user_id
);

CREATE POLICY "Users can update company insights" 
ON public.ai_insights 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM user_company_relations ucr 
    WHERE ucr.user_id = auth.uid() 
    AND ucr.company_id = ai_insights.company_id
  )
);

CREATE POLICY "Users can delete company insights" 
ON public.ai_insights 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM user_company_relations ucr 
    WHERE ucr.user_id = auth.uid() 
    AND ucr.company_id = ai_insights.company_id
  )
);

-- Update RLS policies for ai_chat_sessions to filter by company
DROP POLICY IF EXISTS "Users can view their own chat sessions" ON public.ai_chat_sessions;
DROP POLICY IF EXISTS "Users can create their own chat sessions" ON public.ai_chat_sessions;
DROP POLICY IF EXISTS "Users can update their own chat sessions" ON public.ai_chat_sessions;
DROP POLICY IF EXISTS "Users can delete their own chat sessions" ON public.ai_chat_sessions;

-- New RLS policies for ai_chat_sessions (user + company filtered)
CREATE POLICY "Users can view their own company chat sessions" 
ON public.ai_chat_sessions 
FOR SELECT 
USING (
  auth.uid() = user_id 
  AND EXISTS (
    SELECT 1 FROM user_company_relations ucr 
    WHERE ucr.user_id = auth.uid() 
    AND ucr.company_id = ai_chat_sessions.company_id
  )
);

CREATE POLICY "Users can create their own company chat sessions" 
ON public.ai_chat_sessions 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id 
  AND EXISTS (
    SELECT 1 FROM user_company_relations ucr 
    WHERE ucr.user_id = auth.uid() 
    AND ucr.company_id = ai_chat_sessions.company_id
  )
);

CREATE POLICY "Users can update their own company chat sessions" 
ON public.ai_chat_sessions 
FOR UPDATE 
USING (
  auth.uid() = user_id 
  AND EXISTS (
    SELECT 1 FROM user_company_relations ucr 
    WHERE ucr.user_id = auth.uid() 
    AND ucr.company_id = ai_chat_sessions.company_id
  )
);

CREATE POLICY "Users can delete their own company chat sessions" 
ON public.ai_chat_sessions 
FOR DELETE 
USING (
  auth.uid() = user_id 
  AND EXISTS (
    SELECT 1 FROM user_company_relations ucr 
    WHERE ucr.user_id = auth.uid() 
    AND ucr.company_id = ai_chat_sessions.company_id
  )
);