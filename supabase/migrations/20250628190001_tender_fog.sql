/*
  # Add Bolt.new blockchain integration

  1. New Tables
    - `bolt_blockchain_transactions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `transaction_type` (text)
      - `amount` (numeric)
      - `token_type` (text)
      - `tx_hash` (text)
      - `status` (text)
      - `metadata` (jsonb)
      - `created_at` (timestamp)
  2. Security
    - Enable RLS on `bolt_blockchain_transactions` table
    - Add policy for authenticated users to read their own transactions
    - Add policy for authenticated users to insert their own transactions
*/

CREATE TABLE IF NOT EXISTS bolt_blockchain_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  transaction_type text NOT NULL,
  amount numeric(18,8) NOT NULL,
  token_type text NOT NULL,
  tx_hash text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE bolt_blockchain_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own bolt transactions"
  ON bolt_blockchain_transactions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bolt transactions"
  ON bolt_blockchain_transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_bolt_blockchain_transactions_user_id ON bolt_blockchain_transactions(user_id);
CREATE INDEX idx_bolt_blockchain_transactions_tx_hash ON bolt_blockchain_transactions(tx_hash);