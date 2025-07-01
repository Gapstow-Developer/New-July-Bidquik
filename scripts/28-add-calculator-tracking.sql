-- Create calculator_starts table to track when people begin the quote process
CREATE TABLE IF NOT EXISTS calculator_starts (
  id SERIAL PRIMARY KEY,
  customer_type VARCHAR(20) NOT NULL CHECK (customer_type IN ('residential', 'commercial')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_agent TEXT,
  referrer TEXT
);

-- Add index for analytics queries
CREATE INDEX IF NOT EXISTS idx_calculator_starts_created_at ON calculator_starts(created_at);
CREATE INDEX IF NOT EXISTS idx_calculator_starts_customer_type ON calculator_starts(customer_type);

-- Add session_id to incomplete quotes for better tracking
ALTER TABLE quotes 
ADD COLUMN IF NOT EXISTS session_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS calculator_start_tracked BOOLEAN DEFAULT FALSE;

-- Add index for session tracking
CREATE INDEX IF NOT EXISTS idx_quotes_session_id ON quotes(session_id);
