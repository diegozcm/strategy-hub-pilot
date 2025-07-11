-- Create indicators table
CREATE TABLE indicators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strategic_objective_id UUID REFERENCES strategic_objectives(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL, -- 'financial', 'operational', 'customer', 'people', 'quality'
  unit VARCHAR(50) NOT NULL, -- '%', 'R$', 'unidades', 'dias', 'score'
  target_value DECIMAL(15,2) NOT NULL,
  current_value DECIMAL(15,2) DEFAULT 0,
  measurement_frequency VARCHAR(50) NOT NULL, -- 'daily', 'weekly', 'monthly', 'quarterly', 'yearly'
  owner_id UUID NOT NULL,
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'paused', 'completed'
  priority VARCHAR(20) DEFAULT 'medium', -- 'high', 'medium', 'low'
  last_updated TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indicator_values table (historical values)
CREATE TABLE indicator_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  indicator_id UUID REFERENCES indicators(id) ON DELETE CASCADE,
  value DECIMAL(15,2) NOT NULL,
  period_date DATE NOT NULL,
  comments TEXT,
  recorded_by UUID NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE indicator_values ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for indicators
CREATE POLICY "Users can view indicators" 
ON indicators 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create indicators" 
ON indicators 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update indicators" 
ON indicators 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete indicators" 
ON indicators 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Create RLS policies for indicator_values
CREATE POLICY "Users can view indicator values" 
ON indicator_values 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create indicator values" 
ON indicator_values 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update indicator values" 
ON indicator_values 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete indicator values" 
ON indicator_values 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Create updated_at trigger for indicators
CREATE TRIGGER update_indicators_updated_at
BEFORE UPDATE ON indicators
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_indicators_category ON indicators(category);
CREATE INDEX idx_indicators_status ON indicators(status);
CREATE INDEX idx_indicators_owner_id ON indicators(owner_id);
CREATE INDEX idx_indicator_values_indicator_id ON indicator_values(indicator_id);
CREATE INDEX idx_indicator_values_period_date ON indicator_values(period_date);