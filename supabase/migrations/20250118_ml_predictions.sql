-- Create ML predictions table to track model outputs
CREATE TABLE IF NOT EXISTS ml_predictions (
  id BIGSERIAL PRIMARY KEY,
  catalyst_id BIGINT REFERENCES catalysts(id) ON DELETE CASCADE,
  impact_prediction DECIMAL(3,2) NOT NULL CHECK (impact_prediction >= 0 AND impact_prediction <= 1),
  confidence_score DECIMAL(3,2) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
  price_range_lower DECIMAL(5,2),
  price_range_upper DECIMAL(5,2),
  risk_factors TEXT[],
  model_version VARCHAR(50) DEFAULT 'v1.0',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indexes
  INDEX idx_ml_predictions_catalyst_id (catalyst_id),
  INDEX idx_ml_predictions_created_at (created_at DESC)
);

-- Create catalyst history table for historical comparisons
CREATE TABLE IF NOT EXISTS catalyst_history (
  id BIGSERIAL PRIMARY KEY,
  type catalyst_type NOT NULL,
  ticker VARCHAR(10) NOT NULL,
  event_date DATE NOT NULL,
  title TEXT,
  description TEXT,
  impact_score DECIMAL(3,2),
  price_change_percent DECIMAL(5,2),
  volume_change_percent DECIMAL(5,2),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indexes for similarity searches
  INDEX idx_catalyst_history_type (type),
  INDEX idx_catalyst_history_ticker (ticker),
  INDEX idx_catalyst_history_event_date (event_date DESC)
);

-- Create function to automatically generate predictions for new catalysts
CREATE OR REPLACE FUNCTION generate_catalyst_prediction()
RETURNS TRIGGER AS $$
BEGIN
  -- Call the Edge Function asynchronously
  PERFORM net.http_post(
    url := get_service_url() || '/functions/v1/predict-catalyst',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key')
    ),
    body := jsonb_build_object('catalyst_id', NEW.id)
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate predictions for new catalysts
CREATE TRIGGER trigger_generate_catalyst_prediction
AFTER INSERT ON catalysts
FOR EACH ROW
EXECUTE FUNCTION generate_catalyst_prediction();

-- Helper function to get service URL
CREATE OR REPLACE FUNCTION get_service_url()
RETURNS TEXT AS $$
BEGIN
  RETURN current_setting('app.supabase_url', true);
END;
$$ LANGUAGE plpgsql;

-- Add RLS policies
ALTER TABLE ml_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalyst_history ENABLE ROW LEVEL SECURITY;

-- Read access for authenticated users
CREATE POLICY "ml_predictions_read_policy" ON ml_predictions
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "catalyst_history_read_policy" ON catalyst_history
  FOR SELECT
  TO authenticated
  USING (true);

-- Insert access only for service role (Edge Functions)
CREATE POLICY "ml_predictions_insert_policy" ON ml_predictions
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "catalyst_history_insert_policy" ON catalyst_history
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Sample historical data for MVP
INSERT INTO catalyst_history (type, ticker, event_date, title, price_change_percent, metadata) VALUES
  ('earnings', 'AAPL', '2024-11-02', 'Apple Q4 2024 Earnings Beat', 7.2, '{"eps_actual": 1.64, "eps_estimate": 1.60, "revenue_beat": true}'),
  ('earnings', 'MSFT', '2024-10-24', 'Microsoft Q1 2025 Earnings', 5.1, '{"eps_actual": 3.30, "eps_estimate": 3.10}'),
  ('fda', 'MRNA', '2024-09-15', 'FDA Approves Updated COVID Vaccine', 4.8, '{"drug_name": "Spikevax", "approval_type": "supplemental"}'),
  ('fed_rates', 'SPY', '2024-09-18', 'Fed Cuts Rates 50bps', 1.7, '{"rate_change": -0.50, "surprise": true}'),
  ('earnings', 'NVDA', '2024-08-28', 'NVIDIA Crushes Q2 Estimates', 9.1, '{"revenue_actual": 30.04, "revenue_estimate": 28.70}'),
  ('fda', 'BIIB', '2024-07-02', 'Biogen Alzheimer Drug Approval', 38.3, '{"drug_name": "Leqembi", "indication": "Alzheimer disease"}'),
  ('earnings', 'TSLA', '2024-07-23', 'Tesla Q2 Margins Disappoint', -12.3, '{"gross_margin": 16.9, "expected_margin": 18.7}'),
  ('sec', 'META', '2024-06-15', 'Meta Discloses AI Investment Plans', 2.1, '{"filing_type": "8-K", "material_event": "Strategic update"}')
ON CONFLICT DO NOTHING;