-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  username TEXT UNIQUE,
  avatar_url TEXT,
  prediction_score INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create catalysts table
CREATE TABLE catalysts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('fda', 'earnings', 'fed_rates', 'macro', 'sec')),
  ticker TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMPTZ NOT NULL,
  impact_score NUMERIC(3,2) CHECK (impact_score >= 0 AND impact_score <= 1),
  confidence_score NUMERIC(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create portfolio connections table
CREATE TABLE portfolios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  broker TEXT NOT NULL,
  holdings JSONB NOT NULL,
  last_sync TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create predictions table
CREATE TABLE predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  catalyst_id UUID REFERENCES catalysts NOT NULL,
  predicted_direction TEXT CHECK (predicted_direction IN ('up', 'down')),
  predicted_percentage NUMERIC(5,2),
  timeframe_days INTEGER NOT NULL,
  actual_percentage NUMERIC(5,2),
  score INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  UNIQUE(user_id, catalyst_id)
);

-- Create historical catalyst outcomes table
CREATE TABLE catalyst_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  catalyst_id UUID REFERENCES catalysts NOT NULL,
  ticker TEXT NOT NULL,
  price_before NUMERIC(10,2),
  price_after NUMERIC(10,2),
  percentage_change NUMERIC(5,2),
  days_after INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_catalysts_event_date ON catalysts(event_date);
CREATE INDEX idx_catalysts_ticker ON catalysts(ticker);
CREATE INDEX idx_catalysts_type ON catalysts(type);
CREATE INDEX idx_predictions_user_id ON predictions(user_id);
CREATE INDEX idx_catalyst_outcomes_ticker ON catalyst_outcomes(ticker);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalysts ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalyst_outcomes ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Profiles: Users can only see and update their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);
  
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Catalysts: Public read, admin write
CREATE POLICY "Anyone can view catalysts" ON catalysts
  FOR SELECT USING (true);

-- Portfolios: Users can only manage their own
CREATE POLICY "Users can view own portfolios" ON portfolios
  FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY "Users can create own portfolios" ON portfolios
  FOR INSERT WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY "Users can update own portfolios" ON portfolios
  FOR UPDATE USING (auth.uid() = user_id);
  
CREATE POLICY "Users can delete own portfolios" ON portfolios
  FOR DELETE USING (auth.uid() = user_id);

-- Predictions: Users can manage their own, view others
CREATE POLICY "Users can view all predictions" ON predictions
  FOR SELECT USING (true);
  
CREATE POLICY "Users can create own predictions" ON predictions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY "Users can update own predictions" ON predictions
  FOR UPDATE USING (auth.uid() = user_id);

-- Catalyst outcomes: Public read
CREATE POLICY "Anyone can view catalyst outcomes" ON catalyst_outcomes
  FOR SELECT USING (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at trigger to catalysts table
CREATE TRIGGER update_catalysts_updated_at BEFORE UPDATE ON catalysts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (new.id, new.raw_user_meta_data->>'username');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();