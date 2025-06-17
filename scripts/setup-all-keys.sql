-- Quick setup script to add all API keys to Supabase
-- Run this in the Supabase SQL Editor

-- Insert or update all API keys
INSERT INTO api_keys (service_name, api_key, rate_limit, rate_window)
VALUES 
  ('polygon', 'aTpSJXa0ATFpgwLQPURzxgkZFoMgdeMa', 5, 'minute'),
  ('fda', 'Jc2ltDitYMMPSZimEONJyAqPiTlwVuIBRKollkLw', 1000, 'day'),
  ('sec_api', 'ea943fb0900c9b3982d173c836f318ac58f3d0f34575620a9a2d9570ee95014e', 100, 'minute')
ON CONFLICT (service_name) 
DO UPDATE SET 
  api_key = EXCLUDED.api_key,
  rate_limit = EXCLUDED.rate_limit,
  rate_window = EXCLUDED.rate_window,
  updated_at = NOW();

-- Verify keys were inserted
SELECT service_name, rate_limit, rate_window, created_at 
FROM api_keys 
ORDER BY created_at DESC;