-- Create api_keys table for secure storage of external API credentials
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  service_name TEXT UNIQUE NOT NULL,
  api_key TEXT NOT NULL,
  rate_limit INTEGER,
  rate_window TEXT CHECK (rate_window IN ('second', 'minute', 'hour', 'day')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Only service role can access api_keys
CREATE POLICY "Service role can manage api_keys" ON api_keys
  USING (auth.jwt()->>'role' = 'service_role');

-- Update trigger for updated_at
CREATE TRIGGER update_api_keys_updated_at BEFORE UPDATE ON api_keys
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comment for security
COMMENT ON TABLE api_keys IS 'Secure storage for external API keys. Only accessible via service role.';

-- Add indexes
CREATE INDEX idx_api_keys_service_name ON api_keys(service_name);