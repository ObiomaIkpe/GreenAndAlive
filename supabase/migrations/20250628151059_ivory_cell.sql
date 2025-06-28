/*
  # Add Blockchain Transactions Table

  1. New Tables
    - `blockchain_transactions` - Records of all blockchain transactions
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `type` (text) - mint, stake, claim, offset, purchase
      - `tx_hash` (text) - blockchain transaction hash
      - `amount` (decimal) - transaction amount
      - `token_symbol` (text) - token symbol (e.g., CARB)
      - `description` (text) - transaction description
      - `status` (text) - pending, confirmed, failed
      - `block_number` (int) - block number where transaction was confirmed
      - `gas_used` (decimal) - gas used for transaction
      - `gas_price` (decimal) - gas price in wei
      - `contract_address` (text) - smart contract address
      - `metadata` (text) - additional transaction data
      - `created_at` (timestamptz) - creation timestamp
      - `updated_at` (timestamptz) - update timestamp
  
  2. Security
    - Enable RLS on the table
    - Add policies for authenticated users
*/

-- Create blockchain_transactions table
CREATE TABLE IF NOT EXISTS blockchain_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- mint, stake, claim, offset, purchase
  tx_hash TEXT NOT NULL,
  amount DECIMAL(18, 8) NOT NULL,
  token_symbol TEXT,
  description TEXT,
  status TEXT DEFAULT 'pending', -- pending, confirmed, failed
  block_number INT,
  gas_used DECIMAL(18, 8),
  gas_price DECIMAL(18, 8),
  contract_address TEXT,
  metadata TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE blockchain_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies for blockchain_transactions table
CREATE POLICY "Users can view their own blockchain transactions" 
  ON blockchain_transactions FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own blockchain transactions" 
  ON blockchain_transactions FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_blockchain_transactions_modtime
  BEFORE UPDATE ON blockchain_transactions
  FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Add blockchain_transactions relation to User entity
ALTER TABLE users ADD COLUMN IF NOT EXISTS blockchain_verified BOOLEAN DEFAULT FALSE;