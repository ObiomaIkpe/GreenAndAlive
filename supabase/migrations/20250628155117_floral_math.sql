/*
  # Add AI Usage Metrics Table

  1. New Tables
    - `ai_usage_metrics` - Tracks AI model usage, requests, and performance
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users)
      - `model` (text, AI model used)
      - `request_type` (text, type of AI request)
      - `tokens_used` (integer, number of tokens consumed)
      - `response_time` (integer, milliseconds to respond)
      - `success` (boolean, whether request succeeded)
      - `fallback_used` (boolean, whether fallback was used)
      - `error_message` (text, error if any)
      - `created_at` (timestamp)
  
  2. Security
    - Enable RLS on the new table
    - Add policies for authenticated users
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
CREATE POLICY "Users can view their own AI usage metrics" 
  ON ai_usage_metrics FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own AI usage metrics" 
  ON ai_usage_metrics FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_ai_usage_metrics_user_id ON ai_usage_metrics(user_id);
CREATE INDEX idx_ai_usage_metrics_request_type ON ai_usage_metrics(request_type);
CREATE INDEX idx_ai_usage_metrics_created_at ON ai_usage_metrics(created_at);