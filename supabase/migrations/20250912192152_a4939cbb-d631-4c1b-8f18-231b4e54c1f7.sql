-- Criar tabela kr_fca (Fato, Causa, Ações)
CREATE TABLE public.kr_fca (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key_result_id UUID NOT NULL REFERENCES public.key_results(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  fact TEXT NOT NULL,
  cause TEXT NOT NULL,
  description TEXT,
  priority VARCHAR(50) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'cancelled')),
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Adicionar coluna fca_id na tabela kr_monthly_actions
ALTER TABLE public.kr_monthly_actions 
ADD COLUMN fca_id UUID REFERENCES public.kr_fca(id) ON DELETE SET NULL;

-- Habilitar RLS na nova tabela
ALTER TABLE public.kr_fca ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para kr_fca baseadas no acesso à empresa via KR
CREATE POLICY "Users can view FCAs for company KRs" 
ON public.kr_fca 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM user_company_relations ucr
    JOIN strategic_plans sp ON (sp.id = (
      SELECT so.plan_id 
      FROM strategic_objectives so 
      WHERE so.id = (
        SELECT kr.objective_id 
        FROM key_results kr 
        WHERE kr.id = kr_fca.key_result_id
      )
    ))
    WHERE ucr.user_id = auth.uid() 
    AND ucr.company_id = sp.company_id
  )
);

CREATE POLICY "Users can create FCAs for company KRs" 
ON public.kr_fca 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM user_company_relations ucr
    JOIN strategic_plans sp ON (sp.id = (
      SELECT so.plan_id 
      FROM strategic_objectives so 
      WHERE so.id = (
        SELECT kr.objective_id 
        FROM key_results kr 
        WHERE kr.id = kr_fca.key_result_id
      )
    ))
    WHERE ucr.user_id = auth.uid() 
    AND ucr.company_id = sp.company_id
  ) 
  AND created_by = auth.uid()
);

CREATE POLICY "Users can update FCAs for company KRs" 
ON public.kr_fca 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 
    FROM user_company_relations ucr
    JOIN strategic_plans sp ON (sp.id = (
      SELECT so.plan_id 
      FROM strategic_objectives so 
      WHERE so.id = (
        SELECT kr.objective_id 
        FROM key_results kr 
        WHERE kr.id = kr_fca.key_result_id
      )
    ))
    WHERE ucr.user_id = auth.uid() 
    AND ucr.company_id = sp.company_id
  )
);

CREATE POLICY "Users can delete FCAs for company KRs" 
ON public.kr_fca 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 
    FROM user_company_relations ucr
    JOIN strategic_plans sp ON (sp.id = (
      SELECT so.plan_id 
      FROM strategic_objectives so 
      WHERE so.id = (
        SELECT kr.objective_id 
        FROM key_results kr 
        WHERE kr.id = kr_fca.key_result_id
      )
    ))
    WHERE ucr.user_id = auth.uid() 
    AND ucr.company_id = sp.company_id
  )
);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_kr_fca_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at na kr_fca
CREATE TRIGGER update_kr_fca_updated_at
  BEFORE UPDATE ON public.kr_fca
  FOR EACH ROW
  EXECUTE FUNCTION public.update_kr_fca_updated_at();

-- Índices para melhorar performance
CREATE INDEX idx_kr_fca_key_result_id ON public.kr_fca(key_result_id);
CREATE INDEX idx_kr_fca_status ON public.kr_fca(status);
CREATE INDEX idx_kr_fca_priority ON public.kr_fca(priority);
CREATE INDEX idx_kr_monthly_actions_fca_id ON public.kr_monthly_actions(fca_id);