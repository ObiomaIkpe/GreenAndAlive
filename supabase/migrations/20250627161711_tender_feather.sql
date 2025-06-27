/*
  # Initial Schema for CarbonAI Platform

  1. New Tables
    - `users` - User accounts and profiles
    - `user_preferences` - User settings and preferences
    - `carbon_footprints` - Carbon emission calculations
    - `carbon_credits` - Marketplace carbon credits
    - `purchases` - Credit purchase transactions
    - `ai_recommendations` - AI-generated recommendations
  
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL UNIQUE,
  first_name TEXT,
  last_name TEXT,
  wallet_address TEXT,
  total_credits DECIMAL(10, 2) DEFAULT 0,
  total_value DECIMAL(12, 2) DEFAULT 0,
  monthly_offset DECIMAL(8, 2) DEFAULT 0,
  reduction_goal DECIMAL(8, 2) DEFAULT 24,
  token_balance DECIMAL(10, 2) DEFAULT 0,
  staking_rewards DECIMAL(10, 2) DEFAULT 0,
  reputation_score INT DEFAULT 50,
  achievements TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  location TEXT DEFAULT 'San Francisco, CA',
  lifestyle TEXT[] DEFAULT '{"urban", "tech_worker"}',
  budget INT DEFAULT 500,
  notifications BOOLEAN DEFAULT TRUE,
  theme TEXT DEFAULT 'light',
  preferences TEXT[] DEFAULT '{"renewable_energy", "forest_conservation"}',
  risk_tolerance TEXT DEFAULT 'medium',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create carbon_footprints table
CREATE TABLE IF NOT EXISTS carbon_footprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  electricity DECIMAL(8, 2) NOT NULL,
  transportation DECIMAL(8, 2) NOT NULL,
  heating DECIMAL(8, 2) NOT NULL,
  air_travel DECIMAL(8, 2) NOT NULL,
  total_emissions DECIMAL(8, 2) NOT NULL,
  calculation_date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create carbon_credits table
CREATE TABLE IF NOT EXISTS carbon_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  quantity INT NOT NULL,
  location TEXT NOT NULL,
  verified BOOLEAN DEFAULT TRUE,
  description TEXT NOT NULL,
  vintage INT NOT NULL,
  seller TEXT NOT NULL,
  certification TEXT NOT NULL,
  token_id TEXT,
  contract_address TEXT,
  blockchain_verified BOOLEAN DEFAULT FALSE,
  metadata TEXT,
  tags TEXT[],
  rating DECIMAL(3, 1) DEFAULT 4.0,
  review_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create purchases table
CREATE TABLE IF NOT EXISTS purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  carbon_credit_id UUID NOT NULL REFERENCES carbon_credits(id),
  quantity INT NOT NULL,
  total_price DECIMAL(12, 2) NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  status TEXT DEFAULT 'completed',
  tx_hash TEXT,
  block_number INT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create ai_recommendations table
CREATE TABLE IF NOT EXISTS ai_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  impact DECIMAL(8, 2) NOT NULL,
  confidence INT NOT NULL,
  category TEXT NOT NULL,
  reward_potential INT,
  action_steps TEXT[] DEFAULT '{}',
  estimated_cost DECIMAL(10, 2),
  timeframe TEXT DEFAULT '1-3 months',
  priority TEXT DEFAULT 'medium',
  implemented BOOLEAN DEFAULT FALSE,
  dismissed BOOLEAN DEFAULT FALSE,
  implementation_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE carbon_footprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE carbon_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_recommendations ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can view their own data" 
  ON users FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own data" 
  ON users FOR UPDATE 
  USING (auth.uid() = id);

-- Create policies for user_preferences table
CREATE POLICY "Users can view their own preferences" 
  ON user_preferences FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" 
  ON user_preferences FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create policies for carbon_footprints table
CREATE POLICY "Users can view their own carbon footprints" 
  ON carbon_footprints FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own carbon footprints" 
  ON carbon_footprints FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own carbon footprints" 
  ON carbon_footprints FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own carbon footprints" 
  ON carbon_footprints FOR DELETE 
  USING (auth.uid() = user_id);

-- Create policies for carbon_credits table
CREATE POLICY "Anyone can view carbon credits" 
  ON carbon_credits FOR SELECT 
  TO authenticated 
  USING (true);

-- Create policies for purchases table
CREATE POLICY "Users can view their own purchases" 
  ON purchases FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own purchases" 
  ON purchases FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create policies for ai_recommendations table
CREATE POLICY "Users can view their own recommendations" 
  ON ai_recommendations FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own recommendations" 
  ON ai_recommendations FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create functions for updated_at timestamps
CREATE OR REPLACE FUNCTION update_modified_column() 
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_users_modtime
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_user_preferences_modtime
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_carbon_footprints_modtime
  BEFORE UPDATE ON carbon_footprints
  FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_carbon_credits_modtime
  BEFORE UPDATE ON carbon_credits
  FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_purchases_modtime
  BEFORE UPDATE ON purchases
  FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_ai_recommendations_modtime
  BEFORE UPDATE ON ai_recommendations
  FOR EACH ROW EXECUTE FUNCTION update_modified_column();