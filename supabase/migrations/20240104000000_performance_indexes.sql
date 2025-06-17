-- Performance indexes for common queries
CREATE INDEX idx_catalysts_impact_score ON catalysts(impact_score DESC);
CREATE INDEX idx_catalysts_confidence_score ON catalysts(confidence_score DESC);
CREATE INDEX idx_catalysts_type_date ON catalysts(type, event_date DESC);
CREATE INDEX idx_catalysts_ticker_impact ON catalysts(ticker, impact_score DESC);

-- Composite index for timeline queries
CREATE INDEX idx_catalysts_timeline ON catalysts(event_date, impact_score DESC) 
WHERE event_date >= CURRENT_DATE;

-- Index for embedding similarity searches (if not exists)
CREATE INDEX IF NOT EXISTS idx_catalysts_embedding ON catalysts 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Function to clean up old catalysts (>6 months)
CREATE OR REPLACE FUNCTION cleanup_old_catalysts()
RETURNS void AS $$
BEGIN
  DELETE FROM catalysts 
  WHERE event_date < CURRENT_DATE - INTERVAL '6 months'
  AND type NOT IN ('earnings', 'fda'); -- Keep historical earnings/FDA for ML training
END;
$$ LANGUAGE plpgsql;

-- Optional: Schedule cleanup (requires pg_cron extension)
-- SELECT cron.schedule('cleanup-old-catalysts', '0 2 * * 0', 'SELECT cleanup_old_catalysts();');