# Supabase Implementation Guide for SignalBoard MVP

## Project Configuration

**Project URL**: `https://yjaxznsrysvazxqtvcvm.supabase.co`  
**Project ID**: `yjaxznsrysvazxqtvcvm`

## Database Schema

### Tables

```sql
-- Users table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  username TEXT UNIQUE,
  avatar_url TEXT,
  prediction_score INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Catalysts table
CREATE TABLE catalysts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('fda', 'earnings', 'fed_rates', 'macro')),
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

-- Portfolio connections
CREATE TABLE portfolios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  broker TEXT NOT NULL,
  holdings JSONB NOT NULL,
  last_sync TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Predictions
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

-- Historical catalyst outcomes
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
CREATE INDEX idx_predictions_user_id ON predictions(user_id);
CREATE INDEX idx_catalyst_outcomes_ticker ON catalyst_outcomes(ticker);
```

### Row Level Security (RLS) Policies

```sql
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalysts ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can only see and update their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

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

-- Predictions: Users can manage their own, view others
CREATE POLICY "Users can view all predictions" ON predictions
  FOR SELECT USING (true);
CREATE POLICY "Users can create own predictions" ON predictions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own predictions" ON predictions
  FOR UPDATE USING (auth.uid() = user_id);
```

## Edge Functions

### 1. Catalyst Processor (`/functions/process-catalyst`)

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { type, data } = await req.json()
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Process catalyst based on type
    let catalyst = null
    switch(type) {
      case 'fda':
        catalyst = await processFDAData(data)
        break
      case 'earnings':
        catalyst = await processEarningsData(data)
        break
      // ... other types
    }

    // Insert into database
    const { error } = await supabase
      .from('catalysts')
      .insert(catalyst)

    if (error) throw error

    // Trigger real-time update
    await supabase
      .from('catalyst_updates')
      .insert({ catalyst_id: catalyst.id, action: 'created' })

    return new Response(
      JSON.stringify({ success: true, catalyst }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
```

### 2. ML Prediction (`/functions/predict-catalyst`)

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const { catalyst_id } = await req.json()
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Get catalyst data
  const { data: catalyst } = await supabase
    .from('catalysts')
    .select('*')
    .eq('id', catalyst_id)
    .single()

  // Get historical similar catalysts
  const { data: historicalData } = await supabase
    .from('catalyst_outcomes')
    .select('*')
    .eq('ticker', catalyst.ticker)
    .limit(10)

  // Simple prediction logic (replace with actual ML model)
  const prediction = {
    direction: historicalData.length > 0 && 
      historicalData.filter(h => h.percentage_change > 0).length > 
      historicalData.length / 2 ? 'up' : 'down',
    confidence: 0.65 + Math.random() * 0.3,
    expected_change: calculateExpectedChange(historicalData)
  }

  return new Response(
    JSON.stringify(prediction),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
```

### 3. Data Scraper (`/functions/scrape-fda`)

```typescript
serve(async (req) => {
  // Scheduled function to scrape FDA data
  const fdaUrl = 'https://api.fda.gov/drug/event.json?limit=100'
  
  const response = await fetch(fdaUrl)
  const data = await response.json()
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Process and insert catalysts
  const catalysts = data.results.map(processFDAEvent).filter(Boolean)
  
  const { error } = await supabase
    .from('catalysts')
    .upsert(catalysts, { onConflict: 'ticker,event_date' })

  return new Response(
    JSON.stringify({ processed: catalysts.length }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
```

## Frontend Integration

### Initialize Supabase Client

```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### Real-time Catalyst Updates

```typescript
// hooks/useCatalysts.ts
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export function useCatalysts() {
  const [catalysts, setCatalysts] = useState([])

  useEffect(() => {
    // Initial fetch
    fetchCatalysts()

    // Subscribe to real-time updates
    const subscription = supabase
      .channel('catalyst_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'catalysts' },
        handleCatalystChange
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const fetchCatalysts = async () => {
    const { data } = await supabase
      .from('catalysts')
      .select('*')
      .gte('event_date', new Date().toISOString())
      .order('event_date', { ascending: true })
      .limit(100)
    
    setCatalysts(data || [])
  }

  const handleCatalystChange = (payload) => {
    if (payload.eventType === 'INSERT') {
      setCatalysts(prev => [...prev, payload.new])
    }
    // Handle UPDATE and DELETE
  }

  return catalysts
}
```

### Authentication

```typescript
// components/Auth.tsx
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { supabase } from '@/lib/supabase'

export function AuthComponent() {
  return (
    <Auth
      supabaseClient={supabase}
      appearance={{ 
        theme: ThemeSupa,
        variables: {
          default: {
            colors: {
              brand: '#00ffff',
              brandAccent: '#007bff'
            }
          }
        }
      }}
      providers={['google', 'github']}
    />
  )
}
```

## Deployment

### Environment Variables

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://yjaxznsrysvazxqtvcvm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Edge Functions (set in Supabase dashboard)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Deploy Edge Functions

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref yjaxznsrysvazxqtvcvm

# Deploy functions
supabase functions deploy process-catalyst
supabase functions deploy predict-catalyst
supabase functions deploy scrape-fda
```

### Schedule Scrapers

In Supabase dashboard, set up cron jobs:
- FDA scraper: Every 30 minutes
- Earnings scraper: Every hour
- Fed data: Every 4 hours

## Monitoring

Use Supabase dashboard for:
- Real-time database activity
- Edge function logs
- Performance metrics
- Error tracking

## Security Notes

1. **Never expose service role key** in frontend code
2. **Use RLS policies** for all data access
3. **Validate all inputs** in Edge Functions
4. **Rate limit** API calls to prevent abuse
5. **Monitor costs** - real-time subscriptions can add up

## Development Workflow

1. Use Supabase CLI for local development
2. Test Edge Functions locally before deploying
3. Use database migrations for schema changes
4. Monitor real-time subscription performance
5. Implement connection pooling for high traffic

## Implementation Learnings & Gotchas

### Database Setup

1. **Empty Array Syntax**: When inserting empty arrays in PostgreSQL, use typed array syntax:
   ```sql
   -- Wrong: ARRAY[]
   -- Correct:
   ARRAY[]::TEXT[]
   ```

2. **Unique Constraints for Upserts**: When using `upsert` with `onConflict`, ensure unique constraints exist:
   ```sql
   -- Add unique constraint before using upsert
   ALTER TABLE catalysts ADD CONSTRAINT unique_catalyst_ticker_event_date 
   UNIQUE (ticker, event_date);
   ```

3. **pgvector Extension**: Enable pgvector for embeddings:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```

### Edge Functions Deployment

1. **Direct Deployment via MCP**: You can deploy Edge Functions without Docker using Supabase MCP tools:
   ```typescript
   await mcp__supabase__deploy_edge_function({
     project_id: "yjaxznsrysvazxqtvcvm",
     name: "scrape-fda",
     files: [{
       name: "index.ts",
       content: functionCode
     }]
   })
   ```

2. **API Key Storage**: Store API keys securely in database:
   ```sql
   CREATE TABLE api_keys (
     id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
     service_name TEXT UNIQUE NOT NULL,
     api_key TEXT NOT NULL,
     rate_limit INTEGER,
     rate_window TEXT CHECK (rate_window IN ('second', 'minute', 'hour', 'day')),
     created_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```

### FDA API Integration

1. **Date Format**: FDA API returns dates in YYYYMMDD format. Parse them properly:
   ```typescript
   const parseDate = (dateStr: string) => {
     const year = dateStr.substring(0, 4)
     const month = dateStr.substring(4, 6)
     const day = dateStr.substring(6, 8)
     return new Date(`${year}-${month}-${day}`).toISOString()
   }
   ```

2. **Data Availability**: FDA data may be delayed. Implement fallback date ranges:
   ```typescript
   // Try 30 days first
   let response = await fetch(fdaUrl30Days)
   
   // If 404, try 90 days
   if (response.status === 404) {
     response = await fetch(fdaUrl90Days)
   }
   
   // If still 404, get most recent regardless of date
   if (response.status === 404) {
     response = await fetch(fdaUrlMostRecent)
   }
   ```

3. **Drug Mapping**: Create a comprehensive drug mapping table:
   ```sql
   CREATE TABLE drug_mappings (
     drug_name TEXT NOT NULL,
     primary_ticker TEXT NOT NULL,
     related_tickers TEXT[],
     drug_class TEXT,
     manufacturer TEXT,
     UNIQUE(drug_name, primary_ticker)
   );
   ```

### Mock Data Fallback Pattern

Implement mock data for development/testing when APIs are unavailable:
```typescript
async function processMockEarnings(supabase: any) {
  const mockData = [
    { ticker: 'AAPL', name: 'Apple Inc.', marketCap: 2800000000000 },
    // ... more mock data
  ]
  
  // Process mock data same as real data
  return processEarnings(mockData)
}

// In main function
if (!apiKey || apiError) {
  return await processMockEarnings(supabase)
}
```

### OpenAI Embeddings Integration

1. **Batch Processing**: Process embeddings in batches to avoid rate limits:
   ```typescript
   const batchSize = 50
   for (let i = 0; i < catalysts.length; i += batchSize) {
     const batch = catalysts.slice(i, i + batchSize)
     await processEmbeddingsBatch(batch)
   }
   ```

2. **Text Preparation**: Combine relevant fields for better embeddings:
   ```typescript
   const processedText = `${catalyst.type} ${catalyst.ticker} ${catalyst.title} ${catalyst.description}`
   ```

### Testing Edge Functions

Test Edge Functions locally with service role key:
```bash
curl -X POST https://yjaxznsrysvazxqtvcvm.supabase.co/functions/v1/scrape-fda \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json"
```

### Common Errors and Solutions

1. **"Invalid JWT"**: Use service role key for Edge Function testing
2. **"Invalid time value"**: Check date parsing logic (especially FDA dates)
3. **"No unique constraint"**: Add unique constraints before using upsert
4. **"Transform failed with 1 error"**: Check async/await syntax in TypeScript