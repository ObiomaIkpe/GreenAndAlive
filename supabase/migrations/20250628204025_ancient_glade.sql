/*
  # Add OpenAI API Usage Tracking

  1. New Tables
    - `openai_api_usage`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users)
      - `request_id` (text)
      - `model` (text)
      - `endpoint` (text)
      - `prompt_tokens` (integer)
      - `completion_tokens` (integer)
      - `total_tokens` (integer)
      - `estimated_cost_usd` (numeric)
      - `response_time_ms` (integer)
      - `success` (boolean)
      - `error_code` (text)
      - `error_message` (text)
      - `metadata` (jsonb)
      - `created_at` (timestamptz)
  2. Security
    - Enable RLS on `openai_api_usage` table
    - Add policy for authenticated users to insert their own usage data
    - Add policy for authenticated users to view their own usage data
*/

-- Create OpenAI API usage tracking table
CREATE TABLE IF NOT EXISTS openai_api_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  request_id text,
  model text NOT NULL,
  endpoint text NOT NULL,
  prompt_tokens integer,
  completion_tokens integer,
  total_tokens integer,
  estimated_cost_usd numeric(10,6),
  response_time_ms integer,
  success boolean DEFAULT true,
  error_code text,
  error_message text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable row level security
ALTER TABLE openai_api_usage ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can insert their own OpenAI API usage"
  ON openai_api_usage
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own OpenAI API usage"
  ON openai_api_usage
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_openai_api_usage_user_id ON openai_api_usage(user_id);
CREATE INDEX idx_openai_api_usage_model ON openai_api_usage(model);
CREATE INDEX idx_openai_api_usage_created_at ON openai_api_usage(created_at);

-- Create view for usage summary
CREATE OR REPLACE VIEW openai_usage_summary AS
SELECT
  user_id,
  model,
  endpoint,
  COUNT(*) as request_count,
  SUM(prompt_tokens) as total_prompt_tokens,
  SUM(completion_tokens) as total_completion_tokens,
  SUM(total_tokens) as total_tokens,
  SUM(estimated_cost_usd) as total_cost_usd,
  AVG(response_time_ms) as avg_response_time_ms,
  SUM(CASE WHEN success = true THEN 1 ELSE 0 END) as successful_requests,
  SUM(CASE WHEN success = false THEN 1 ELSE 0 END) as failed_requests,
  MIN(created_at) as first_request_at,
  MAX(created_at) as last_request_at
FROM
  openai_api_usage
GROUP BY
  user_id, model, endpoint;

-- Create function to calculate estimated cost based on model and tokens
CREATE OR REPLACE FUNCTION calculate_openai_cost(
  model_name text,
  prompt_tokens integer,
  completion_tokens integer
) RETURNS numeric AS $$
DECLARE
  prompt_cost_per_1k numeric;
  completion_cost_per_1k numeric;
  total_cost numeric;
BEGIN
  -- Set costs based on model
  -- Prices as of 2025, update as needed
  IF model_name LIKE 'gpt-4%' THEN
    prompt_cost_per_1k := 0.03;
    completion_cost_per_1k := 0.06;
  ELSIF model_name LIKE 'gpt-3.5-turbo%' THEN
    prompt_cost_per_1k := 0.0015;
    completion_cost_per_1k := 0.002;
  ELSE
    -- Default pricing for unknown models
    prompt_cost_per_1k := 0.01;
    completion_cost_per_1k := 0.02;
  END IF;
  
  -- Calculate cost
  total_cost := 
    (COALESCE(prompt_tokens, 0) * prompt_cost_per_1k / 1000) +
    (COALESCE(completion_tokens, 0) * completion_cost_per_1k / 1000);
  
  RETURN total_cost;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically calculate cost
CREATE OR REPLACE FUNCTION set_openai_cost() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.prompt_tokens IS NOT NULL OR NEW.completion_tokens IS NOT NULL THEN
    NEW.estimated_cost_usd := calculate_openai_cost(
      NEW.model,
      NEW.prompt_tokens,
      NEW.completion_tokens
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_openai_cost
BEFORE INSERT ON openai_api_usage
FOR EACH ROW
EXECUTE FUNCTION set_openai_cost();