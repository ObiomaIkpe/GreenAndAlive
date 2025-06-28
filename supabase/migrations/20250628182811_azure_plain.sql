/*
  # AI Usage Metrics Table

  1. New Tables
    - `ai_usage_metrics`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `model` (text, AI model used)
      - `request_type` (text, type of AI request)
      - `tokens_used` (integer, number of tokens consumed)
      - `response_time` (integer, response time in milliseconds)
      - `success` (boolean, whether request was successful)
      - `fallback_used` (boolean, whether fallback was used)
      - `error_message` (text, error details if any)
      - `metadata` (jsonb, additional request metadata)
      - `created_at` (timestamptz, creation timestamp)

  2. Security
    - Enable RLS on `ai_usage_metrics` table
    - Add policies for users to manage their own AI usage data

  3. Performance
    - Add indexes for user_id, request_type, and created_at columns
*/

-- Create ai_usage_metrics table if it doesn't exist
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

-- Drop existing policies if they exist and recreate them
DO $$
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Users can insert their own AI usage metrics" ON ai_usage_metrics;
  DROP POLICY IF EXISTS "Users can view their own AI usage metrics" ON ai_usage_metrics;
  
  -- Create new policies
  CREATE POLICY "Users can insert their own AI usage metrics" 
    ON ai_usage_metrics FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

  CREATE POLICY "Users can view their own AI usage metrics" 
    ON ai_usage_metrics FOR SELECT 
    USING (auth.uid() = user_id);
END $$;

-- Create indexes if they don't exist
DO $$
BEGIN
  -- Create index for user_id if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'ai_usage_metrics' 
    AND indexname = 'idx_ai_usage_metrics_user_id'
  ) THEN
    CREATE INDEX idx_ai_usage_metrics_user_id ON ai_usage_metrics(user_id);
  END IF;

  -- Create index for request_type if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'ai_usage_metrics' 
    AND indexname = 'idx_ai_usage_metrics_request_type'
  ) THEN
    CREATE INDEX idx_ai_usage_metrics_request_type ON ai_usage_metrics(request_type);
  END IF;

  -- Create index for created_at if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'ai_usage_metrics' 
    AND indexname = 'idx_ai_usage_metrics_created_at'
  ) THEN
    CREATE INDEX idx_ai_usage_metrics_created_at ON ai_usage_metrics(created_at);
  END IF;
END $$;