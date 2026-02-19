
CREATE TABLE public.release_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version TEXT NOT NULL,
  title TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  summary TEXT,
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  published BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE public.release_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read published releases"
  ON public.release_notes FOR SELECT
  USING (published = true);

CREATE POLICY "Admins manage releases"
  ON public.release_notes FOR ALL
  USING (public.is_system_admin(auth.uid()))
  WITH CHECK (public.is_system_admin(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_release_notes_updated_at
  BEFORE UPDATE ON public.release_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
