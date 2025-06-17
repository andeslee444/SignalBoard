-- Enable pgvector extension for similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Create drug mapping table
CREATE TABLE drug_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drug_name TEXT NOT NULL,
  generic_name TEXT,
  brand_names TEXT[],
  primary_ticker TEXT NOT NULL,
  related_tickers TEXT[],
  drug_class TEXT,
  indication TEXT,
  manufacturer TEXT,
  rxnorm_id TEXT,
  drugbank_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(drug_name, primary_ticker)
);

-- Add embeddings column to catalysts for similarity search
ALTER TABLE catalysts 
ADD COLUMN embedding vector(384),
ADD COLUMN processed_text TEXT;

-- Create similarity search index
CREATE INDEX ON catalysts USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Create earnings calendar table for better tracking
CREATE TABLE earnings_calendar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticker TEXT NOT NULL,
  company_name TEXT NOT NULL,
  report_date DATE NOT NULL,
  report_time TEXT CHECK (report_time IN ('before_open', 'after_close', 'unknown')),
  fiscal_period TEXT,
  fiscal_year INTEGER,
  eps_estimate NUMERIC(10,4),
  eps_actual NUMERIC(10,4),
  revenue_estimate NUMERIC(15,2),
  revenue_actual NUMERIC(15,2),
  source TEXT DEFAULT 'polygon',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ticker, report_date)
);

-- Create scraper configuration table
CREATE TABLE scraper_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scraper_name TEXT NOT NULL UNIQUE,
  schedule TEXT NOT NULL, -- cron expression
  enabled BOOLEAN DEFAULT true,
  last_run TIMESTAMPTZ,
  last_success TIMESTAMPTZ,
  last_error TEXT,
  config JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default scraper configurations
INSERT INTO scraper_config (scraper_name, schedule, config) VALUES
  ('fda', '*/30 * * * *', '{"priority": "high", "batch_size": 100}'::jsonb),
  ('earnings', '0 */6 * * *', '{"priority": "medium", "days_ahead": 30}'::jsonb),
  ('sec', '*/15 * * * *', '{"priority": "high", "forms": ["8-K", "10-K", "10-Q", "S-1", "DEF 14A"]}'::jsonb),
  ('fed_rates', '0 8,16 * * *', '{"priority": "medium", "sources": ["fed", "ecb"]}'::jsonb);

-- Create API keys table for external services
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name TEXT NOT NULL UNIQUE,
  api_key TEXT NOT NULL,
  api_secret TEXT,
  rate_limit INTEGER,
  rate_window TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sample drug mappings for top biotech drugs
INSERT INTO drug_mappings (drug_name, generic_name, brand_names, primary_ticker, related_tickers, drug_class, indication, manufacturer) VALUES
  ('KEYTRUDA', 'pembrolizumab', ARRAY['Keytruda'], 'MRK', ARRAY['PFE', 'BMY'], 'PD-1 inhibitor', 'Various cancers', 'Merck'),
  ('HUMIRA', 'adalimumab', ARRAY['Humira'], 'ABBV', ARRAY['JNJ', 'AMGN'], 'TNF inhibitor', 'Autoimmune diseases', 'AbbVie'),
  ('ELIQUIS', 'apixaban', ARRAY['Eliquis'], 'BMY', ARRAY['PFE'], 'Anticoagulant', 'Stroke prevention', 'Bristol Myers Squibb/Pfizer'),
  ('OPDIVO', 'nivolumab', ARRAY['Opdivo'], 'BMY', ARRAY['MRK', 'RHHBY'], 'PD-1 inhibitor', 'Various cancers', 'Bristol Myers Squibb'),
  ('REVLIMID', 'lenalidomide', ARRAY['Revlimid'], 'BMY', ARRAY['CELG'], 'Immunomodulator', 'Multiple myeloma', 'Bristol Myers Squibb'),
  ('IBRANCE', 'palbociclib', ARRAY['Ibrance'], 'PFE', ARRAY['NVS', 'RHHBY'], 'CDK4/6 inhibitor', 'Breast cancer', 'Pfizer'),
  ('XARELTO', 'rivaroxaban', ARRAY['Xarelto'], 'JNJ', ARRAY['BAYN.DE'], 'Anticoagulant', 'Blood clots', 'Johnson & Johnson/Bayer'),
  ('STELARA', 'ustekinumab', ARRAY['Stelara'], 'JNJ', ARRAY['ABBV', 'AMGN'], 'IL-12/23 inhibitor', 'Psoriasis, Crohns', 'Johnson & Johnson'),
  ('ENBREL', 'etanercept', ARRAY['Enbrel'], 'AMGN', ARRAY['PFE'], 'TNF inhibitor', 'Rheumatoid arthritis', 'Amgen/Pfizer'),
  ('PROLIA', 'denosumab', ARRAY['Prolia', 'Xgeva'], 'AMGN', ARRAY[], 'RANKL inhibitor', 'Osteoporosis', 'Amgen');

-- Create indexes for drug mapping
CREATE INDEX idx_drug_mappings_drug_name ON drug_mappings(drug_name);
CREATE INDEX idx_drug_mappings_ticker ON drug_mappings(primary_ticker);
CREATE INDEX idx_earnings_calendar_date ON earnings_calendar(report_date);
CREATE INDEX idx_earnings_calendar_ticker ON earnings_calendar(ticker);

-- Enable RLS on new tables
ALTER TABLE drug_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE earnings_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraper_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- RLS policies for new tables
CREATE POLICY "Public read drug mappings" ON drug_mappings FOR SELECT USING (true);
CREATE POLICY "Public read earnings calendar" ON earnings_calendar FOR SELECT USING (true);
CREATE POLICY "Admin only scraper config" ON scraper_config FOR ALL USING (false); -- Only service role
CREATE POLICY "Admin only API keys" ON api_keys FOR ALL USING (false); -- Only service role

-- Function to find similar catalysts using embeddings
CREATE OR REPLACE FUNCTION find_similar_catalysts(
  catalyst_id UUID,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  ticker TEXT,
  title TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
DECLARE
  query_embedding vector;
BEGIN
  -- Get the embedding for the given catalyst
  SELECT embedding INTO query_embedding
  FROM catalysts
  WHERE catalysts.id = catalyst_id;

  IF query_embedding IS NULL THEN
    RETURN;
  END IF;

  -- Find similar catalysts
  RETURN QUERY
  SELECT 
    c.id,
    c.ticker,
    c.title,
    1 - (c.embedding <=> query_embedding) as similarity
  FROM catalysts c
  WHERE c.id != catalyst_id
    AND c.embedding IS NOT NULL
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;