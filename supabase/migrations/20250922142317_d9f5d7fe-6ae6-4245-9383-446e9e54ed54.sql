-- Create table for vision alignment objectives (post-its)
CREATE TABLE public.vision_alignment_objectives (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vision_alignment_id UUID NOT NULL,
  dimension TEXT NOT NULL CHECK (dimension IN ('objectives', 'commitments', 'resources', 'risks')),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  color VARCHAR(7) DEFAULT '#3B82F6', -- hex color for post-it
  created_by UUID NOT NULL,
  updated_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_vision_alignment_objectives_vision_alignment 
    FOREIGN KEY (vision_alignment_id) REFERENCES public.vision_alignment(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.vision_alignment_objectives ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for vision alignment objectives
CREATE POLICY "Users can create company vision alignment objectives" 
ON public.vision_alignment_objectives 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.vision_alignment va
    JOIN public.user_company_relations ucr ON ucr.company_id = va.company_id
    WHERE va.id = vision_alignment_objectives.vision_alignment_id 
    AND ucr.user_id = auth.uid()
  ) 
  AND auth.uid() = created_by
);

CREATE POLICY "Users can view company vision alignment objectives" 
ON public.vision_alignment_objectives 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.vision_alignment va
    JOIN public.user_company_relations ucr ON ucr.company_id = va.company_id
    WHERE va.id = vision_alignment_objectives.vision_alignment_id 
    AND ucr.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update company vision alignment objectives" 
ON public.vision_alignment_objectives 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.vision_alignment va
    JOIN public.user_company_relations ucr ON ucr.company_id = va.company_id
    WHERE va.id = vision_alignment_objectives.vision_alignment_id 
    AND ucr.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete company vision alignment objectives" 
ON public.vision_alignment_objectives 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.vision_alignment va
    JOIN public.user_company_relations ucr ON ucr.company_id = va.company_id
    WHERE va.id = vision_alignment_objectives.vision_alignment_id 
    AND ucr.user_id = auth.uid()
  )
);

-- Create trigger for auto-updating updated_at
CREATE OR REPLACE FUNCTION public.update_vision_alignment_objectives_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_vision_alignment_objectives_updated_at
  BEFORE UPDATE ON public.vision_alignment_objectives
  FOR EACH ROW
  EXECUTE FUNCTION public.update_vision_alignment_objectives_updated_at();

-- Create index for better performance
CREATE INDEX idx_vision_alignment_objectives_vision_alignment_id 
ON public.vision_alignment_objectives(vision_alignment_id);

CREATE INDEX idx_vision_alignment_objectives_dimension 
ON public.vision_alignment_objectives(dimension);

CREATE INDEX idx_vision_alignment_objectives_order 
ON public.vision_alignment_objectives(vision_alignment_id, dimension, order_index);