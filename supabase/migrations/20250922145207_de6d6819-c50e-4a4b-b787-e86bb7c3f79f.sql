-- Fix Vision Alignment duplicates and enforce one record per company
-- 1) Create backup table for removed duplicates (idempotent)
CREATE TABLE IF NOT EXISTS public.vision_alignment_removed_dupes AS
SELECT * FROM public.vision_alignment WHERE false;

-- 2) Backup duplicates (keep the most recently updated/created row per company)
WITH ranked AS (
  SELECT 
    id,
    company_id,
    ROW_NUMBER() OVER (
      PARTITION BY company_id 
      ORDER BY COALESCE(updated_at, created_at) DESC, id DESC
    ) AS rn
  FROM public.vision_alignment
),

dupes AS (
  SELECT va.*
  FROM public.vision_alignment va
  JOIN ranked r ON r.id = va.id
  WHERE r.rn > 1
)
INSERT INTO public.vision_alignment_removed_dupes
SELECT * FROM dupes;

-- 3) Delete duplicates
WITH ranked AS (
  SELECT 
    id,
    company_id,
    ROW_NUMBER() OVER (
      PARTITION BY company_id 
      ORDER BY COALESCE(updated_at, created_at) DESC, id DESC
    ) AS rn
  FROM public.vision_alignment
)
DELETE FROM public.vision_alignment va
USING ranked r
WHERE va.id = r.id
  AND r.rn > 1;

-- 4) Enforce uniqueness (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_indexes 
    WHERE schemaname = 'public' AND indexname = 'uniq_vision_alignment_company_id'
  ) THEN
    EXECUTE 'CREATE UNIQUE INDEX uniq_vision_alignment_company_id ON public.vision_alignment (company_id)';
  END IF;
END $$;
