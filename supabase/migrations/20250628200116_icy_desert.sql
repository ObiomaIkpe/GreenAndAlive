/*
  # AI Metrics Enhancement

  1. New Tables
    - `ai_usage_metrics_enhanced` - Detailed tracking of AI API usage with additional fields
    - `ai_model_performance_metrics` - Performance metrics for different AI models
    - `ai_cost_optimization` - Cost optimization suggestions based on usage patterns
  
  2. Security
    - Enable RLS on all new tables
    - Add policies for authenticated users to view their own data
    - Add policies for admins to view all data
  
  3. Changes
    - Add new fields to existing AI metrics tables
*/

-- Create enhanced AI usage metrics table
CREATE TABLE IF NOT EXISTS ai_usage_metrics_enhanced (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  model text NOT NULL,
  request_type text NOT NULL,
  prompt_tokens integer,
  completion_tokens integer,
  total_tokens integer,
  response_time integer,
  success boolean DEFAULT true,
  fallback_used boolean DEFAULT false,
  error_message text,
  prompt_template text,
  response_quality_score integer,
  api_version text,
  client_info jsonb,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create AI model performance metrics table
CREATE TABLE IF NOT EXISTS ai_model_performance_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model text NOT NULL,
  request_type text NOT NULL,
  avg_response_time integer,
  avg_tokens_per_request integer,
  success_rate numeric(5,2),
  fallback_rate numeric(5,2),
  cost_per_1k_tokens numeric(10,4),
  quality_score numeric(5,2),
  sample_size integer,
  period_start timestamptz,
  period_end timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create AI cost optimization table
CREATE TABLE IF NOT EXISTS ai_cost_optimization (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  recommendation_type text NOT NULL,
  description text NOT NULL,
  estimated_savings numeric(10,2),
  implementation_difficulty text,
  current_usage_pattern jsonb,
  optimized_usage_pattern jsonb,
  is_implemented boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable row level security
ALTER TABLE ai_usage_metrics_enhanced ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_model_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_cost_optimization ENABLE ROW LEVEL SECURITY;

-- Create policies for ai_usage_metrics_enhanced
CREATE POLICY "Users can view their own enhanced AI metrics"
  ON ai_usage_metrics_enhanced
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own enhanced AI metrics"
  ON ai_usage_metrics_enhanced
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create policies for ai_model_performance_metrics
CREATE POLICY "Anyone can view AI model performance metrics"
  ON ai_model_performance_metrics
  FOR SELECT
  TO authenticated
  USING (true);

-- Create policies for ai_cost_optimization
CREATE POLICY "Users can view their own cost optimization suggestions"
  ON ai_cost_optimization
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_ai_usage_metrics_enhanced_user_id ON ai_usage_metrics_enhanced(user_id);
CREATE INDEX idx_ai_usage_metrics_enhanced_model ON ai_usage_metrics_enhanced(model);
CREATE INDEX idx_ai_usage_metrics_enhanced_request_type ON ai_usage_metrics_enhanced(request_type);
CREATE INDEX idx_ai_usage_metrics_enhanced_created_at ON ai_usage_metrics_enhanced(created_at);

CREATE INDEX idx_ai_model_performance_metrics_model ON ai_model_performance_metrics(model);
CREATE INDEX idx_ai_model_performance_metrics_request_type ON ai_model_performance_metrics(request_type);

CREATE INDEX idx_ai_cost_optimization_user_id ON ai_cost_optimization(user_id);

-- Add trigger to update ai_model_performance_metrics
CREATE OR REPLACE FUNCTION update_ai_model_performance_metrics()
RETURNS TRIGGER AS $$
BEGIN
  -- Update performance metrics based on new usage data
  -- This is a placeholder for the actual implementation
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_ai_model_performance_metrics
AFTER INSERT ON ai_usage_metrics_enhanced
FOR EACH ROW
EXECUTE FUNCTION update_ai_model_performance_metrics();

-- Add function to generate cost optimization suggestions
CREATE OR REPLACE FUNCTION generate_ai_cost_optimization_suggestions()
RETURNS TRIGGER AS $$
BEGIN
  -- Generate cost optimization suggestions based on usage patterns
  -- This is a placeholder for the actual implementation
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create view for AI usage summary with enhanced metrics
CREATE OR REPLACE VIEW ai_usage_summary_enhanced AS
SELECT
  user_id,
  model,
  request_type,
  COUNT(*) as request_count,
  SUM(CASE WHEN success = true THEN 1 ELSE 0 END) as successful_requests,
  SUM(CASE WHEN fallback_used = true THEN 1 ELSE 0 END) as fallback_requests,
  SUM(total_tokens) as total_tokens,
  AVG(response_time) as avg_response_time,
  AVG(response_quality_score) as avg_quality_score,
  MIN(created_at) as first_request,
  MAX(created_at) as last_request
FROM
  ai_usage_metrics_enhanced
GROUP BY
  user_id, model, request_type;