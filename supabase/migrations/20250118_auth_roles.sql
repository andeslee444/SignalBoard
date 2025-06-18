-- Create user roles enum
CREATE TYPE user_role AS ENUM ('trader', 'admin', 'guest');

-- Create user profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  username TEXT UNIQUE,
  avatar_url TEXT,
  role user_role DEFAULT 'guest',
  portfolio_public BOOLEAN DEFAULT false,
  prediction_accuracy DECIMAL(3,2) DEFAULT 0.5,
  total_predictions INTEGER DEFAULT 0,
  successful_predictions INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create watchlists table
CREATE TABLE IF NOT EXISTS watchlists (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  ticker VARCHAR(10) NOT NULL,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  UNIQUE(user_id, ticker)
);

-- Create alerts table
CREATE TABLE IF NOT EXISTS alerts (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  catalyst_id UUID REFERENCES catalysts(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('price_movement', 'event_approaching', 'prediction_ready')),
  threshold DECIMAL(5,2),
  is_active BOOLEAN DEFAULT true,
  triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, catalyst_id, alert_type)
);

-- Create user predictions table (for gamification)
CREATE TABLE IF NOT EXISTS user_predictions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  catalyst_id UUID REFERENCES catalysts(id) ON DELETE CASCADE,
  predicted_movement DECIMAL(5,2) NOT NULL,
  predicted_direction TEXT NOT NULL CHECK (predicted_direction IN ('up', 'down', 'neutral')),
  confidence_level INTEGER CHECK (confidence_level >= 1 AND confidence_level <= 10),
  prediction_date TIMESTAMPTZ DEFAULT NOW(),
  resolution_date TIMESTAMPTZ,
  actual_movement DECIMAL(5,2),
  was_correct BOOLEAN,
  points_earned INTEGER DEFAULT 0,
  UNIQUE(user_id, catalyst_id)
);

-- Create indexes
CREATE INDEX idx_user_profiles_role ON user_profiles(role);
CREATE INDEX idx_user_profiles_username ON user_profiles(username);
CREATE INDEX idx_watchlists_user_id ON watchlists(user_id);
CREATE INDEX idx_alerts_user_id ON alerts(user_id);
CREATE INDEX idx_alerts_catalyst_id ON alerts(catalyst_id);
CREATE INDEX idx_user_predictions_user_id ON user_predictions(user_id);
CREATE INDEX idx_user_predictions_catalyst_id ON user_predictions(catalyst_id);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_predictions ENABLE ROW LEVEL SECURITY;

-- User profiles policies
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Public profiles are viewable" ON user_profiles
  FOR SELECT USING (portfolio_public = true);

-- Watchlist policies
CREATE POLICY "Users can manage own watchlist" ON watchlists
  FOR ALL USING (auth.uid() = user_id);

-- Alerts policies
CREATE POLICY "Users can manage own alerts" ON alerts
  FOR ALL USING (auth.uid() = user_id);

-- User predictions policies
CREATE POLICY "Users can create own predictions" ON user_predictions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own predictions" ON user_predictions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Public predictions from public portfolios" ON user_predictions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = user_predictions.user_id 
      AND user_profiles.portfolio_public = true
    )
  );

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    CASE 
      WHEN NEW.email LIKE '%@signalboard.admin%' THEN 'admin'::user_role
      ELSE 'guest'::user_role
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Create function to upgrade user to trader
CREATE OR REPLACE FUNCTION upgrade_to_trader(user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE user_profiles 
  SET role = 'trader'::user_role,
      updated_at = NOW()
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION upgrade_to_trader TO authenticated;