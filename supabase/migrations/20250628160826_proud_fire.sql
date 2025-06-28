/*
  # Add AI Usage Metrics Table

  1. New Tables
    - `ai_usage_metrics` - Tracks AI model usage, performance, and costs
  
  2. Features
    - Records request types, token usage, and response times
    - Tracks success rates and fallback usage
    - Stores error messages for troubleshooting
    - Includes metadata for detailed analysis
  
  3. Security
    - Enable RLS on the table
    - Add policies for authenticated users
    - Create indexes for efficient querying
*/

-- Create ai_usage_metrics table
CREATE TABLE IF NOT EXISTS ai_usage_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  model TEXT NOT NULL,
  request_type TEXT NOT NULL,
  tokens_used INTEGER,
  response_time INTEGER,
  success BOOLEAN DEFAULT TRUE,
  fallback_used BOOLEAN DEFAULT FALSE,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE ai_usage_metrics ENABLE ROW LEVEL SECURITY;

-- Create policies for ai_usage_metrics table
CREATE POLICY "Users can insert their own AI usage metrics" 
  ON ai_usage_metrics FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own AI usage metrics" 
  ON ai_usage_metrics FOR SELECT 
  USING (auth.uid() = user_id);

-- Create indexes for faster queries
CREATE INDEX idx_ai_usage_metrics_user_id ON ai_usage_metrics(user_id);
CREATE INDEX idx_ai_usage_metrics_request_type ON ai_usage_metrics(request_type);
CREATE INDEX idx_ai_usage_metrics_created_at ON ai_usage_metrics(created_at);