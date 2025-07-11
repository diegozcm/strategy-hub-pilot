-- Criar tabela de profiles de usuários
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  email VARCHAR(255),
  role VARCHAR(100) DEFAULT 'member',
  department VARCHAR(100),
  position VARCHAR(100),
  phone VARCHAR(50),
  hire_date DATE,
  avatar_url TEXT,
  skills TEXT[],
  bio TEXT,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para profiles
CREATE POLICY "Users can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Função para criar profile automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, first_name, last_name, email)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''),
    NEW.email
  );
  RETURN NEW;
END;
$$;

-- Trigger para criar profile quando usuário é criado
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Tabela para alocações de colaboradores em projetos
CREATE TABLE public.project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.strategic_projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role VARCHAR(100) DEFAULT 'member',
  allocation_percentage INTEGER DEFAULT 100,
  start_date DATE DEFAULT CURRENT_DATE,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS para project_members
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view project members" 
ON public.project_members 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can manage project members" 
ON public.project_members 
FOR ALL 
USING (auth.uid() IS NOT NULL);

-- Tabela para histórico de performance
CREATE TABLE public.performance_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  reviewer_id UUID NOT NULL,
  review_period_start DATE NOT NULL,
  review_period_end DATE NOT NULL,
  overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5),
  goals_achievement INTEGER CHECK (goals_achievement >= 1 AND goals_achievement <= 5),
  collaboration_rating INTEGER CHECK (collaboration_rating >= 1 AND collaboration_rating <= 5),
  technical_skills INTEGER CHECK (technical_skills >= 1 AND technical_skills <= 5),
  comments TEXT,
  strengths TEXT,
  improvement_areas TEXT,
  goals_next_period TEXT,
  status VARCHAR(50) DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS para performance_reviews
ALTER TABLE public.performance_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view relevant performance reviews" 
ON public.performance_reviews 
FOR SELECT 
USING (auth.uid() = user_id OR auth.uid() = reviewer_id OR auth.uid() IS NOT NULL);

CREATE POLICY "Users can manage performance reviews" 
ON public.performance_reviews 
FOR ALL 
USING (auth.uid() IS NOT NULL);

-- Trigger para performance_reviews
CREATE TRIGGER update_performance_reviews_updated_at
BEFORE UPDATE ON public.performance_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Adicionar índices para performance
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_profiles_department ON public.profiles(department);
CREATE INDEX idx_profiles_status ON public.profiles(status);
CREATE INDEX idx_project_members_project_id ON public.project_members(project_id);
CREATE INDEX idx_project_members_user_id ON public.project_members(user_id);
CREATE INDEX idx_performance_reviews_user_id ON public.performance_reviews(user_id);
CREATE INDEX idx_performance_reviews_period ON public.performance_reviews(review_period_start, review_period_end);