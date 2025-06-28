/*
  # AI Metrics Dashboard Support

  1. New Tables
    - `ai_model_comparison` - Comparison data between different AI models
    - `ai_cost_tracking` - Track costs associated with AI usage
  
  2. Views
    - `ai_usage_summary` - Aggregated view of AI usage metrics
  
  3. Functions
    - `calculate_ai_cost` - Calculate cost based on tokens and model
*/

-- Create ai_model_comparison table
CREATE TABLE IF NOT EXISTS ai_model_comparison (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_a TEXT NOT NULL,
  model_b TEXT NOT NULL,
  request_type TEXT NOT NULL,
  accuracy_diff DECIMAL(5,2),
  latency_diff INTEGER,
  cost_diff DECIMAL(10,4),
  recommendation TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE ai_model_comparison ENABLE ROW LEVEL SECURITY;

-- Create policies for ai_model_comparison table
CREATE POLICY "Anyone can view AI model comparisons" 
  ON ai_model_comparison FOR SELECT 
  TO authenticated 
  USING (true);

-- Create ai_cost_tracking table
CREATE TABLE IF NOT EXISTS ai_cost_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  model TEXT NOT NULL,
  tokens_used INTEGER NOT NULL,
  cost DECIMAL(10,4) NOT NULL,
  request_type TEXT NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE ai_cost_tracking ENABLE ROW LEVEL SECURITY;

-- Create policies for ai_cost_tracking table
CREATE POLICY "Users can view their own AI costs" 
  ON ai_cost_tracking FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own AI costs" 
  ON ai_cost_tracking FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create ai_usage_summary view
CREATE OR REPLACE VIEW ai_usage_summary AS
SELECT
  user_id,
  model,
  request_type,
  COUNT(*) as request_count,
  SUM(CASE WHEN success = true THEN 1 ELSE 0 END) as successful_requests,
  SUM(CASE WHEN fallback_used = true THEN 1 ELSE 0 END) as fallback_requests,
  SUM(tokens_used) as total_tokens,
  AVG(response_time) as avg_response_time,
  MIN(created_at) as first_request,
  MAX(created_at) as last_request
FROM
  ai_usage_metrics
GROUP BY
  user_id, model, request_type;

-- Create calculate_ai_cost function
CREATE OR REPLACE FUNCTION calculate_ai_cost(
  p_model TEXT,
  p_tokens INTEGER,
  p_is_input BOOLEAN DEFAULT true
)
RETURNS DECIMAL(10,4) AS $$
DECLARE
  cost_per_token DECIMAL(10,8);
BEGIN
  -- Set cost per token based on model and whether it's input or output
  CASE p_model
    WHEN 'gpt-4' THEN
      cost_per_token := CASE WHEN p_is_input THEN 0.00003 ELSE 0.00006 END;
    WHEN 'gpt-4-32k' THEN
      cost_per_token := CASE WHEN p_is_input THEN 0.00006 ELSE 0.00012 END;
    WHEN 'gpt-3.5-turbo' THEN
      cost_per_token := CASE WHEN p_is_input THEN 0.0000015 ELSE 0.000002 END;
    WHEN 'gpt-3.5-turbo-16k' THEN
      cost_per_token := CASE WHEN p_is_input THEN 0.000003 ELSE 0.000004 END;
    WHEN 'claude-3-sonnet' THEN
      cost_per_token := CASE WHEN p_is_input THEN 0.000003 ELSE 0.000015 END;
    WHEN 'claude-3-opus' THEN
      cost_per_token := CASE WHEN p_is_input THEN 0.000015 ELSE 0.000075 END;
    ELSE
      cost_per_token := 0.000002; -- Default fallback rate
  END CASE;
  
  -- Calculate and return cost
  RETURN (p_tokens * cost_per_token)::DECIMAL(10,4);
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically calculate and insert cost tracking records
CREATE OR REPLACE FUNCTION insert_ai_cost_tracking()
RETURNS TRIGGER AS $$
DECLARE
  input_tokens INTEGER;
  output_tokens INTEGER;
  input_cost DECIMAL(10,4);
  output_cost DECIMAL(10,4);
  total_cost DECIMAL(10,4);
BEGIN
  -- Extract tokens from metadata if available
  IF NEW.metadata IS NOT NULL AND NEW.metadata ? 'usage' THEN
    input_tokens := (NEW.metadata->'usage'->>'prompt_tokens')::INTEGER;
    output_tokens := (NEW.metadata->'usage'->>'completion_tokens')::INTEGER;
  ELSE
    -- If no detailed token info, use total tokens
    input_tokens := COALESCE(NEW.tokens_used, 0) * 0.7; -- Estimate 70% input
    output_tokens := COALESCE(NEW.tokens_used, 0) * 0.3; -- Estimate 30% output
  END IF;
  
  -- Calculate costs
  input_cost := calculate_ai_cost(NEW.model, input_tokens, true);
  output_cost := calculate_ai_cost(NEW.model, output_tokens, false);
  total_cost := input_cost + output_cost;
  
  -- Insert cost tracking record
  INSERT INTO ai_cost_tracking (
    user_id, model, tokens_used, cost, request_type, date
  ) VALUES (
    NEW.user_id, 
    NEW.model, 
    COALESCE(NEW.tokens_used, input_tokens + output_tokens),
    total_cost,
    NEW.request_type,
    CURRENT_DATE
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on ai_usage_metrics
CREATE TRIGGER trigger_insert_ai_cost_tracking
AFTER INSERT ON ai_usage_metrics
FOR EACH ROW
EXECUTE FUNCTION insert_ai_cost_tracking();

-- Create index for ai_cost_tracking
CREATE INDEX idx_ai_cost_tracking_user_id ON ai_cost_tracking(user_id);
CREATE INDEX idx_ai_cost_tracking_date ON ai_cost_tracking(date);

-- Insert initial model comparison data
INSERT INTO ai_model_comparison (model_a, model_b, request_type, accuracy_diff, latency_diff, cost_diff, recommendation)
VALUES
  ('gpt-4', 'gpt-3.5-turbo', 'recommendations', 7.2, 1200, 0.058, 'Use GPT-4 for complex, nuanced recommendations where accuracy is critical. Use GPT-3.5 Turbo for simpler recommendations or when cost is a concern.'),
  ('gpt-4', 'gpt-3.5-turbo', 'prediction', 7.1, 870, 0.058, 'GPT-4 provides more accurate predictions but at significantly higher cost. For routine predictions, GPT-3.5 Turbo offers good value.'),
  ('gpt-4', 'claude-3-sonnet', 'recommendations', 1.9, 500, 0.03, 'GPT-4 has slightly better accuracy, but Claude 3 Sonnet offers better latency and lower cost for similar quality recommendations.'),
  ('claude-3-sonnet', 'gpt-3.5-turbo', 'behavior', 5.4, 700, 0.028, 'Claude 3 Sonnet provides significantly better behavioral analysis than GPT-3.5 Turbo, justifying the moderate cost increase.');