-- Drop existing data and recreate structure for multi-tenant system
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS ai_analytics CASCADE;
DROP TABLE IF EXISTS ai_chat_messages CASCADE;
DROP TABLE IF EXISTS ai_chat_sessions CASCADE;
DROP TABLE IF EXISTS ai_insights CASCADE;
DROP TABLE IF EXISTS ai_recommendations CASCADE;
DROP TABLE IF EXISTS ai_user_preferences CASCADE;
DROP TABLE IF EXISTS key_result_values CASCADE;
DROP TABLE IF EXISTS key_results CASCADE;
DROP TABLE IF EXISTS performance_reviews CASCADE;
DROP TABLE IF EXISTS project_kr_relations CASCADE;
DROP TABLE IF EXISTS project_members CASCADE;
DROP TABLE IF EXISTS project_objective_relations CASCADE;
DROP TABLE IF EXISTS project_tasks CASCADE;
DROP TABLE IF EXISTS strategic_objectives CASCADE;
DROP TABLE IF EXISTS strategic_pillars CASCADE;
DROP TABLE IF EXISTS strategic_plans CASCADE;
DROP TABLE IF EXISTS strategic_projects CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS companies CASCADE;

-- Drop existing enum if exists
DROP TYPE IF EXISTS app_role CASCADE;

-- Create enum for user roles
CREATE TYPE app_role AS ENUM ('system_admin', 'company_admin', 'manager', 'collaborator');

-- Create companies table
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  document VARCHAR(50) UNIQUE,
  email VARCHAR(255),
  phone VARCHAR(20),
  address TEXT,
  logo_url TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create profiles table with company association
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(20),
  position VARCHAR(255),
  department VARCHAR(255),
  role app_role DEFAULT 'collaborator',
  status VARCHAR(20) DEFAULT 'pending',
  avatar_url TEXT,
  bio TEXT,
  skills TEXT[],
  hire_date DATE,
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create strategic plans table with company isolation
CREATE TABLE strategic_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  mission TEXT,
  vision TEXT,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create strategic pillars table
CREATE TABLE strategic_pillars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  color VARCHAR(7) DEFAULT '#3B82F6',
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create strategic objectives table
CREATE TABLE strategic_objectives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES strategic_plans(id) ON DELETE CASCADE,
  pillar_id UUID REFERENCES strategic_pillars(id) ON DELETE SET NULL,
  owner_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'not_started',
  progress NUMERIC DEFAULT 0,
  weight INTEGER DEFAULT 1,
  target_date DATE,
  deadline DATE,
  responsible VARCHAR(255),
  monthly_targets JSONB DEFAULT '{}',
  monthly_actual JSONB DEFAULT '{}',
  yearly_target NUMERIC DEFAULT 0,
  yearly_actual NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create key results table
CREATE TABLE key_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  objective_id UUID NOT NULL REFERENCES strategic_objectives(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  unit TEXT DEFAULT 'number',
  metric_type VARCHAR(50) DEFAULT 'percentage',
  frequency VARCHAR(50) DEFAULT 'monthly',
  target_value NUMERIC NOT NULL,
  current_value NUMERIC DEFAULT 0,
  yearly_target NUMERIC DEFAULT 0,
  yearly_actual NUMERIC DEFAULT 0,
  monthly_targets JSONB DEFAULT '{}',
  monthly_actual JSONB DEFAULT '{}',
  status TEXT DEFAULT 'not_started',
  priority VARCHAR(50) DEFAULT 'medium',
  category VARCHAR(255),
  responsible VARCHAR(255),
  due_date DATE,
  deadline DATE,
  last_updated TIMESTAMP DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create key result values table
CREATE TABLE key_result_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  key_result_id UUID REFERENCES key_results(id) ON DELETE CASCADE,
  recorded_by UUID NOT NULL,
  value NUMERIC NOT NULL,
  period_date DATE NOT NULL,
  comments TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- Create strategic projects table
CREATE TABLE strategic_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES strategic_plans(id) ON DELETE SET NULL,
  owner_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'planning',
  priority TEXT DEFAULT 'medium',
  progress NUMERIC DEFAULT 0,
  budget NUMERIC,
  start_date DATE,
  end_date DATE,
  responsible VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create project members table
CREATE TABLE project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  project_id UUID REFERENCES strategic_projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role VARCHAR(50) DEFAULT 'member',
  allocation_percentage INTEGER DEFAULT 100,
  start_date DATE DEFAULT CURRENT_DATE,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create project tasks table
CREATE TABLE project_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES strategic_projects(id) ON DELETE CASCADE,
  assignee_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'todo',
  priority TEXT DEFAULT 'medium',
  estimated_hours INTEGER,
  actual_hours INTEGER DEFAULT 0,
  due_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create project relations tables
CREATE TABLE project_objective_relations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES strategic_projects(id) ON DELETE CASCADE,
  objective_id UUID NOT NULL REFERENCES strategic_objectives(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE project_kr_relations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES strategic_projects(id) ON DELETE CASCADE,
  kr_id UUID NOT NULL REFERENCES key_results(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create performance reviews table
CREATE TABLE performance_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  reviewer_id UUID NOT NULL,
  review_period_start DATE NOT NULL,
  review_period_end DATE NOT NULL,
  overall_rating INTEGER,
  goals_achievement INTEGER,
  technical_skills INTEGER,
  collaboration_rating INTEGER,
  strengths TEXT,
  improvement_areas TEXT,
  goals_next_period TEXT,
  comments TEXT,
  status VARCHAR(50) DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create AI related tables
CREATE TABLE ai_chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  session_title VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE ai_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  session_id UUID REFERENCES ai_chat_sessions(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL,
  content TEXT NOT NULL,
  message_type VARCHAR(50) DEFAULT 'text',
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(255) NOT NULL,
  insight_type VARCHAR(255) NOT NULL,
  severity VARCHAR(50) DEFAULT 'medium',
  confidence_score NUMERIC DEFAULT 0.75,
  actionable BOOLEAN DEFAULT true,
  status VARCHAR(50) DEFAULT 'active',
  related_entity_type VARCHAR(255),
  related_entity_id UUID,
  metadata JSONB,
  confirmed_by UUID,
  confirmed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE ai_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  insight_id UUID REFERENCES ai_insights(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  action_type VARCHAR(255) NOT NULL,
  priority VARCHAR(50) DEFAULT 'medium',
  estimated_impact VARCHAR(50) DEFAULT 'medium',
  effort_required VARCHAR(50) DEFAULT 'medium',
  status VARCHAR(50) DEFAULT 'pending',
  assigned_to UUID,
  deadline DATE,
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE ai_user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  notification_frequency VARCHAR(50) DEFAULT 'daily',
  min_confidence_score NUMERIC DEFAULT 0.70,
  insight_categories TEXT[] DEFAULT ARRAY['projects', 'indicators', 'objectives'],
  auto_dismiss_low_priority BOOLEAN DEFAULT false,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE ai_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  event_type VARCHAR(255) NOT NULL,
  event_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_strategic_plans_updated_at BEFORE UPDATE ON strategic_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_strategic_pillars_updated_at BEFORE UPDATE ON strategic_pillars FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_strategic_objectives_updated_at BEFORE UPDATE ON strategic_objectives FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_key_results_updated_at BEFORE UPDATE ON key_results FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_strategic_projects_updated_at BEFORE UPDATE ON strategic_projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_project_tasks_updated_at BEFORE UPDATE ON project_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_performance_reviews_updated_at BEFORE UPDATE ON performance_reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ai_chat_sessions_updated_at BEFORE UPDATE ON ai_chat_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ai_insights_updated_at BEFORE UPDATE ON ai_insights FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ai_recommendations_updated_at BEFORE UPDATE ON ai_recommendations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ai_user_preferences_updated_at BEFORE UPDATE ON ai_user_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, first_name, last_name, email, role)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''),
    NEW.email,
    'collaborator'
  );
  RETURN NEW;
END;
$$;

-- Create trigger for automatic profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create helper functions
CREATE OR REPLACE FUNCTION has_role(_user_id uuid, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION is_admin(_user_id uuid)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT public.has_role(_user_id, 'system_admin') OR public.has_role(_user_id, 'company_admin')
$$;

CREATE OR REPLACE FUNCTION get_user_company(_user_id uuid)
RETURNS UUID
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT company_id
  FROM public.profiles
  WHERE user_id = _user_id
$$;

-- Enable RLS on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategic_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategic_pillars ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategic_objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE key_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE key_result_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategic_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_objective_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_kr_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_analytics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- Companies policies
CREATE POLICY "System admins can manage all companies" ON companies
  FOR ALL USING (has_role(auth.uid(), 'system_admin'));

CREATE POLICY "Users can view their own company" ON companies
  FOR SELECT USING (
    id = get_user_company(auth.uid()) OR 
    has_role(auth.uid(), 'system_admin')
  );

-- Profiles policies
CREATE POLICY "Users can view all profiles in their company" ON profiles
  FOR SELECT USING (
    company_id = get_user_company(auth.uid()) OR 
    has_role(auth.uid(), 'system_admin')
  );

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admins can manage profiles" ON profiles
  FOR ALL USING (
    has_role(auth.uid(), 'system_admin') OR 
    (has_role(auth.uid(), 'company_admin') AND company_id = get_user_company(auth.uid()))
  );

-- Generic company-scoped policies for all other tables
CREATE POLICY "Company data access" ON strategic_plans
  FOR ALL USING (
    company_id = get_user_company(auth.uid()) OR 
    has_role(auth.uid(), 'system_admin')
  );

CREATE POLICY "Company data access" ON strategic_pillars
  FOR ALL USING (
    company_id = get_user_company(auth.uid()) OR 
    has_role(auth.uid(), 'system_admin')
  );

CREATE POLICY "Company data access" ON strategic_objectives
  FOR ALL USING (
    company_id = get_user_company(auth.uid()) OR 
    has_role(auth.uid(), 'system_admin')
  );

CREATE POLICY "Company data access" ON key_results
  FOR ALL USING (
    company_id = get_user_company(auth.uid()) OR 
    has_role(auth.uid(), 'system_admin')
  );

CREATE POLICY "Company data access" ON key_result_values
  FOR ALL USING (
    company_id = get_user_company(auth.uid()) OR 
    has_role(auth.uid(), 'system_admin')
  );

CREATE POLICY "Company data access" ON strategic_projects
  FOR ALL USING (
    company_id = get_user_company(auth.uid()) OR 
    has_role(auth.uid(), 'system_admin')
  );

CREATE POLICY "Company data access" ON project_members
  FOR ALL USING (
    company_id = get_user_company(auth.uid()) OR 
    has_role(auth.uid(), 'system_admin')
  );

CREATE POLICY "Company data access" ON project_tasks
  FOR ALL USING (
    company_id = get_user_company(auth.uid()) OR 
    has_role(auth.uid(), 'system_admin')
  );

CREATE POLICY "Company data access" ON project_objective_relations
  FOR ALL USING (
    company_id = get_user_company(auth.uid()) OR 
    has_role(auth.uid(), 'system_admin')
  );

CREATE POLICY "Company data access" ON project_kr_relations
  FOR ALL USING (
    company_id = get_user_company(auth.uid()) OR 
    has_role(auth.uid(), 'system_admin')
  );

CREATE POLICY "Company data access" ON performance_reviews
  FOR ALL USING (
    company_id = get_user_company(auth.uid()) OR 
    has_role(auth.uid(), 'system_admin')
  );

CREATE POLICY "Company data access" ON ai_chat_sessions
  FOR ALL USING (
    company_id = get_user_company(auth.uid()) OR 
    has_role(auth.uid(), 'system_admin')
  );

CREATE POLICY "Company data access" ON ai_chat_messages
  FOR ALL USING (
    company_id = get_user_company(auth.uid()) OR 
    has_role(auth.uid(), 'system_admin')
  );

CREATE POLICY "Company data access" ON ai_insights
  FOR ALL USING (
    company_id = get_user_company(auth.uid()) OR 
    has_role(auth.uid(), 'system_admin')
  );

CREATE POLICY "Company data access" ON ai_recommendations
  FOR ALL USING (
    company_id = get_user_company(auth.uid()) OR 
    has_role(auth.uid(), 'system_admin')
  );

CREATE POLICY "Company data access" ON ai_user_preferences
  FOR ALL USING (
    company_id = get_user_company(auth.uid()) OR 
    has_role(auth.uid(), 'system_admin')
  );

CREATE POLICY "Company data access" ON ai_analytics
  FOR ALL USING (
    company_id = get_user_company(auth.uid()) OR 
    has_role(auth.uid(), 'system_admin')
  );

-- Insert default company and admin user data
INSERT INTO companies (id, name, active) 
VALUES ('00000000-0000-0000-0000-000000000001', 'Sistema Principal', true);

-- Create indexes for performance
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_company_id ON profiles(company_id);
CREATE INDEX idx_strategic_plans_company_id ON strategic_plans(company_id);
CREATE INDEX idx_strategic_pillars_company_id ON strategic_pillars(company_id);
CREATE INDEX idx_strategic_objectives_company_id ON strategic_objectives(company_id);
CREATE INDEX idx_key_results_company_id ON key_results(company_id);
CREATE INDEX idx_strategic_projects_company_id ON strategic_projects(company_id);
CREATE INDEX idx_project_members_company_id ON project_members(company_id);
CREATE INDEX idx_project_tasks_company_id ON project_tasks(company_id);
CREATE INDEX idx_performance_reviews_company_id ON performance_reviews(company_id);
CREATE INDEX idx_ai_chat_sessions_company_id ON ai_chat_sessions(company_id);
CREATE INDEX idx_ai_insights_company_id ON ai_insights(company_id);
CREATE INDEX idx_ai_analytics_company_id ON ai_analytics(company_id);