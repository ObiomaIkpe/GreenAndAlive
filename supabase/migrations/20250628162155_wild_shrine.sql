/*
  # Add AI Model Performance Metrics

  1. New Tables
    - `ai_model_performance` - Track model performance metrics for different request types
  
  2. Security
    - Enable RLS on the table
    - Add policies for authenticated users
*/

-- Create ai_model_performance table
CREATE TABLE IF NOT EXISTS ai_model_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model TEXT NOT NULL,
  request_type TEXT NOT NULL,
  accuracy DECIMAL(5,2),
  latency INTEGER,
  cost_per_1k_tokens DECIMAL(10,4),
  tokens_per_request INTEGER,
  sample_size INTEGER,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE ai_model_performance ENABLE ROW LEVEL SECURITY;

-- Create policies for ai_model_performance table
CREATE POLICY "Anyone can view AI model performance" 
  ON ai_model_performance FOR SELECT 
  TO authenticated 
  USING (true);

-- Create trigger for last_updated
CREATE TRIGGER update_ai_model_performance_last_updated
  BEFORE UPDATE ON ai_model_performance
  FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Insert initial performance data for different models
INSERT INTO ai_model_performance (model, request_type, accuracy, latency, cost_per_1k_tokens, tokens_per_request, sample_size)
VALUES
  ('gpt-4', 'recommendations', 92.5, 2450, 0.06, 850, 1000),
  ('gpt-4', 'prediction', 89.8, 1850, 0.06, 650, 800),
  ('gpt-4', 'behavior', 91.2, 2100, 0.06, 750, 900),
  ('gpt-3.5-turbo', 'recommendations', 85.3, 1250, 0.002, 950, 2000),
  ('gpt-3.5-turbo', 'prediction', 82.7, 980, 0.002, 720, 1800),
  ('gpt-3.5-turbo', 'behavior', 84.1, 1100, 0.002, 830, 1900),
  ('claude-3-sonnet', 'recommendations', 90.6, 1950, 0.03, 780, 500),
  ('claude-3-sonnet', 'prediction', 88.2, 1650, 0.03, 620, 450),
  ('claude-3-sonnet', 'behavior', 89.5, 1800, 0.03, 700, 480);