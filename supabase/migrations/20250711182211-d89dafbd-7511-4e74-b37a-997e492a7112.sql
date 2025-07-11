-- Insights gerados pela IA
CREATE TABLE ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  insight_type VARCHAR(100) NOT NULL, -- 'pattern', 'risk', 'opportunity', 'recommendation'
  category VARCHAR(100) NOT NULL, -- 'projects', 'indicators', 'people', 'objectives'
  title VARCHAR(255) NOT NULL,
  description TEXT,
  severity VARCHAR(50) DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  confidence_score DECIMAL(3,2) DEFAULT 0.75, -- 0.00 a 1.00
  related_entity_type VARCHAR(100), -- 'project', 'indicator', 'objective', 'user'
  related_entity_id UUID,
  actionable BOOLEAN DEFAULT true,
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'acknowledged', 'dismissed', 'resolved'
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ações recomendadas pela IA
CREATE TABLE ai_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  insight_id UUID REFERENCES ai_insights(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  action_type VARCHAR(100) NOT NULL, -- 'adjust_target', 'reassign_task', 'increase_resources', 'escalate'
  priority VARCHAR(50) DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
  estimated_impact VARCHAR(50) DEFAULT 'medium', -- 'low', 'medium', 'high'
  effort_required VARCHAR(50) DEFAULT 'medium', -- 'low', 'medium', 'high'
  deadline DATE,
  assigned_to UUID,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'rejected'
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Histórico de conversas do chat
CREATE TABLE ai_chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  session_title VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE ai_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES ai_chat_sessions(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL, -- 'user', 'assistant'
  content TEXT NOT NULL,
  message_type VARCHAR(50) DEFAULT 'text', -- 'text', 'chart', 'recommendation', 'data'
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Configurações de IA por usuário
CREATE TABLE ai_user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  notification_frequency VARCHAR(50) DEFAULT 'daily', -- 'realtime', 'daily', 'weekly', 'monthly'
  insight_categories TEXT[] DEFAULT ARRAY['projects', 'indicators', 'objectives'],
  min_confidence_score DECIMAL(3,2) DEFAULT 0.70,
  auto_dismiss_low_priority BOOLEAN DEFAULT false,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics de uso da IA
CREATE TABLE ai_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  event_type VARCHAR(100) NOT NULL, -- 'insight_viewed', 'recommendation_accepted', 'chat_message', 'feedback_given'
  event_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_analytics ENABLE ROW LEVEL SECURITY;

-- Create policies for ai_insights
CREATE POLICY "Users can view their own insights" ON ai_insights FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can create insights" ON ai_insights FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update their own insights" ON ai_insights FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete their own insights" ON ai_insights FOR DELETE USING (auth.uid() IS NOT NULL);

-- Create policies for ai_recommendations
CREATE POLICY "Users can view recommendations" ON ai_recommendations FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can create recommendations" ON ai_recommendations FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update recommendations" ON ai_recommendations FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete recommendations" ON ai_recommendations FOR DELETE USING (auth.uid() IS NOT NULL);

-- Create policies for ai_chat_sessions
CREATE POLICY "Users can view their own chat sessions" ON ai_chat_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own chat sessions" ON ai_chat_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own chat sessions" ON ai_chat_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own chat sessions" ON ai_chat_sessions FOR DELETE USING (auth.uid() = user_id);

-- Create policies for ai_chat_messages
CREATE POLICY "Users can view their own chat messages" ON ai_chat_messages 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM ai_chat_sessions 
    WHERE ai_chat_sessions.id = ai_chat_messages.session_id 
    AND ai_chat_sessions.user_id = auth.uid()
  )
);
CREATE POLICY "Users can create their own chat messages" ON ai_chat_messages 
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM ai_chat_sessions 
    WHERE ai_chat_sessions.id = ai_chat_messages.session_id 
    AND ai_chat_sessions.user_id = auth.uid()
  )
);

-- Create policies for ai_user_preferences
CREATE POLICY "Users can view their own preferences" ON ai_user_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own preferences" ON ai_user_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own preferences" ON ai_user_preferences FOR UPDATE USING (auth.uid() = user_id);

-- Create policies for ai_analytics
CREATE POLICY "Users can create analytics" ON ai_analytics FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own analytics" ON ai_analytics FOR SELECT USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_ai_insights_user_id ON ai_insights(user_id);
CREATE INDEX idx_ai_insights_status ON ai_insights(status);
CREATE INDEX idx_ai_insights_category ON ai_insights(category);
CREATE INDEX idx_ai_insights_created_at ON ai_insights(created_at);

CREATE INDEX idx_ai_recommendations_insight_id ON ai_recommendations(insight_id);
CREATE INDEX idx_ai_recommendations_status ON ai_recommendations(status);
CREATE INDEX idx_ai_recommendations_priority ON ai_recommendations(priority);

CREATE INDEX idx_ai_chat_sessions_user_id ON ai_chat_sessions(user_id);
CREATE INDEX idx_ai_chat_messages_session_id ON ai_chat_messages(session_id);
CREATE INDEX idx_ai_chat_messages_created_at ON ai_chat_messages(created_at);

CREATE INDEX idx_ai_analytics_user_id ON ai_analytics(user_id);
CREATE INDEX idx_ai_analytics_event_type ON ai_analytics(event_type);
CREATE INDEX idx_ai_analytics_created_at ON ai_analytics(created_at);

-- Create trigger for updated_at
CREATE TRIGGER update_ai_insights_updated_at
  BEFORE UPDATE ON ai_insights
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ai_recommendations_updated_at
  BEFORE UPDATE ON ai_recommendations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ai_chat_sessions_updated_at
  BEFORE UPDATE ON ai_chat_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ai_user_preferences_updated_at
  BEFORE UPDATE ON ai_user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();