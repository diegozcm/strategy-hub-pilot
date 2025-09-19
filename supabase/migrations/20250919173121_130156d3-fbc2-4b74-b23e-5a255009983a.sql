-- Create vision_alignment table
CREATE TABLE public.vision_alignment (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL,
  shared_objectives text,
  shared_commitments text,
  shared_resources text,
  shared_risks text,
  created_by uuid NOT NULL,
  updated_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create vision_alignment_history table
CREATE TABLE public.vision_alignment_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vision_alignment_id uuid NOT NULL,
  previous_shared_objectives text,
  previous_shared_commitments text,
  previous_shared_resources text,
  previous_shared_risks text,
  changed_by uuid NOT NULL,
  change_reason text,
  changed_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.vision_alignment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vision_alignment_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for vision_alignment
CREATE POLICY "Users can view company vision alignment" 
ON public.vision_alignment 
FOR SELECT 
USING (EXISTS ( SELECT 1
   FROM user_company_relations ucr
  WHERE ((ucr.user_id = auth.uid()) AND (ucr.company_id = vision_alignment.company_id))));

CREATE POLICY "Users can create company vision alignment" 
ON public.vision_alignment 
FOR INSERT 
WITH CHECK (((EXISTS ( SELECT 1
   FROM user_company_relations ucr
  WHERE ((ucr.user_id = auth.uid()) AND (ucr.company_id = vision_alignment.company_id)))) AND (auth.uid() = created_by)));

CREATE POLICY "Users can update company vision alignment" 
ON public.vision_alignment 
FOR UPDATE 
USING (EXISTS ( SELECT 1
   FROM user_company_relations ucr
  WHERE ((ucr.user_id = auth.uid()) AND (ucr.company_id = vision_alignment.company_id))));

CREATE POLICY "Users can delete company vision alignment" 
ON public.vision_alignment 
FOR DELETE 
USING (EXISTS ( SELECT 1
   FROM user_company_relations ucr
  WHERE ((ucr.user_id = auth.uid()) AND (ucr.company_id = vision_alignment.company_id))));

-- Create RLS policies for vision_alignment_history
CREATE POLICY "Users can view company vision alignment history" 
ON public.vision_alignment_history 
FOR SELECT 
USING (EXISTS ( SELECT 1
   FROM (vision_alignment va
     JOIN user_company_relations ucr ON ((ucr.company_id = va.company_id)))
  WHERE ((va.id = vision_alignment_history.vision_alignment_id) AND (ucr.user_id = auth.uid()))));

CREATE POLICY "System can create history records" 
ON public.vision_alignment_history 
FOR INSERT 
WITH CHECK (auth.uid() = changed_by);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_vision_alignment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_vision_alignment_updated_at
BEFORE UPDATE ON public.vision_alignment
FOR EACH ROW
EXECUTE FUNCTION public.update_vision_alignment_updated_at();