/*
  # AI Usage Metrics Table

  1. New Tables
    - `ai_usage_metrics` - Tracks AI service usage, performance, and errors
  
  2. Features
    - Records model, request type, tokens used, and response times
    - Tracks success rates and fallback usage
    - Stores error messages for troubleshooting
    - Includes metadata for detailed analysis
  
  3. Security
    - Enable RLS on the table
    - Add policies for authenticated users
    - Create indexes for performance
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

-- Create policies for ai_usage_metrics table (only if they don't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'ai_usage_metrics' AND policyname = 'Users can insert their own AI usage metrics'
  ) THEN
    CREATE POLICY "Users can insert their own AI usage metrics" 
      ON ai_usage_metrics FOR INSERT 
      WITH CHECK (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'ai_usage_metrics' AND policyname = 'Users can view their own AI usage metrics'
  ) THEN
    CREATE POLICY "Users can view their own AI usage metrics" 
      ON ai_usage_metrics FOR SELECT 
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create indexes for faster queries (only if they don't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_ai_usage_metrics_user_id'
  ) THEN
    CREATE INDEX idx_ai_usage_metrics_user_id ON ai_usage_metrics(user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_ai_usage_metrics_request_type'
  ) THEN
    CREATE INDEX idx_ai_usage_metrics_request_type ON ai_usage_metrics(request_type);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_ai_usage_metrics_created_at'
  ) THEN
    CREATE INDEX idx_ai_usage_metrics_created_at ON ai_usage_metrics(created_at);
  END IF;
END $$;