import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CatalystFeatures {
  catalyst_type: string
  ticker: string
  market_cap?: number
  sector?: string
  historical_volatility_30d?: number
  sentiment_delta_24h?: number
  debt_to_equity?: number
  sector_momentum?: number
  macro_rate_environment?: number
  days_until_event: number
  pre_market_volume?: number
  option_flow_sentiment?: number
}

interface PredictionRequest {
  catalyst_id?: string
  features?: CatalystFeatures
}

interface PredictionResponse {
  catalyst_id?: string
  impact_prediction: number
  confidence_score: number
  price_movement_range: {
    lower_bound: number
    upper_bound: number
  }
  risk_factors: string[]
  similar_historical_events: Array<{
    ticker: string
    event_date: string
    actual_movement: number
    similarity_score: number
  }>
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { catalyst_id, features } = await req.json() as PredictionRequest
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get catalyst data if only ID is provided
    let catalystFeatures: CatalystFeatures
    
    if (catalyst_id) {
      const { data: catalyst, error } = await supabase
        .from('catalysts')
        .select('*')
        .eq('id', catalyst_id)
        .single()
      
      if (error || !catalyst) {
        throw new Error('Catalyst not found')
      }
      
      // Extract features from catalyst
      catalystFeatures = await extractFeatures(supabase, catalyst)
    } else if (features) {
      catalystFeatures = features
    } else {
      throw new Error('Either catalyst_id or features must be provided')
    }

    // Generate prediction using our ML model
    const prediction = await generatePrediction(supabase, catalystFeatures)
    
    // Store prediction for tracking
    if (catalyst_id) {
      await supabase
        .from('ml_predictions')
        .insert({
          catalyst_id,
          impact_prediction: prediction.impact_prediction,
          confidence_score: prediction.confidence_score,
          price_range_lower: prediction.price_movement_range.lower_bound,
          price_range_upper: prediction.price_movement_range.upper_bound,
          risk_factors: prediction.risk_factors,
          created_at: new Date().toISOString()
        })
    }
    
    return new Response(
      JSON.stringify(prediction),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
    
  } catch (error) {
    console.error('Prediction error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

async function extractFeatures(supabase: any, catalyst: any): Promise<CatalystFeatures> {
  // Get stock data for additional features
  const { data: stockData } = await supabase
    .from('stocks')
    .select('*')
    .eq('ticker', catalyst.ticker)
    .single()
  
  // Calculate days until event
  const daysUntilEvent = Math.ceil(
    (new Date(catalyst.event_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )
  
  // Get historical volatility (simplified - in production would use real price data)
  const historicalVolatility = await calculateHistoricalVolatility(supabase, catalyst.ticker)
  
  // Get sentiment data
  const sentimentDelta = await getSentimentDelta(supabase, catalyst.ticker)
  
  return {
    catalyst_type: catalyst.type,
    ticker: catalyst.ticker,
    market_cap: stockData?.market_cap || catalyst.metadata?.market_cap,
    sector: stockData?.sector || catalyst.metadata?.sector,
    historical_volatility_30d: historicalVolatility,
    sentiment_delta_24h: sentimentDelta,
    debt_to_equity: stockData?.debt_to_equity,
    sector_momentum: await getSectorMomentum(supabase, stockData?.sector),
    macro_rate_environment: await getMacroEnvironment(),
    days_until_event: daysUntilEvent,
    pre_market_volume: stockData?.pre_market_volume,
    option_flow_sentiment: await getOptionFlowSentiment(supabase, catalyst.ticker)
  }
}

async function generatePrediction(
  supabase: any, 
  features: CatalystFeatures
): Promise<PredictionResponse> {
  // For MVP, we'll use a rule-based system that mimics XGBoost output
  // In production, this would call a real XGBoost model served via API
  
  let impactScore = 0.5 // Base score
  let confidence = 0.7 // Base confidence
  const riskFactors: string[] = []
  
  // Catalyst type weights
  const typeWeights: Record<string, number> = {
    'fed_rates': 0.95,
    'earnings': 0.8,
    'fda': 0.75,
    'sec': 0.4
  }
  
  impactScore = typeWeights[features.catalyst_type] || 0.5
  
  // Market cap impact
  if (features.market_cap) {
    if (features.market_cap > 500_000_000_000) {
      impactScore *= 1.2 // Mega cap multiplier
      confidence += 0.1
    } else if (features.market_cap < 10_000_000_000) {
      impactScore *= 0.8 // Small cap penalty
      confidence -= 0.1
      riskFactors.push('Small cap - higher volatility risk')
    }
  }
  
  // Volatility impact
  if (features.historical_volatility_30d) {
    if (features.historical_volatility_30d > 0.4) {
      impactScore *= 1.1
      riskFactors.push('High historical volatility')
    }
  }
  
  // Days until event
  if (features.days_until_event <= 3) {
    confidence += 0.15 // Higher confidence for near-term events
  } else if (features.days_until_event > 30) {
    confidence -= 0.2
    riskFactors.push('Event >30 days out - lower prediction accuracy')
  }
  
  // Sentiment factors
  if (features.sentiment_delta_24h && features.sentiment_delta_24h > 0.2) {
    impactScore *= 1.05
    riskFactors.push('Positive sentiment momentum')
  }
  
  // Option flow
  if (features.option_flow_sentiment && features.option_flow_sentiment > 0.7) {
    impactScore *= 1.1
    confidence += 0.05
  }
  
  // Normalize scores
  impactScore = Math.min(Math.max(impactScore, 0), 1)
  confidence = Math.min(Math.max(confidence, 0.3), 0.95)
  
  // Calculate price movement range based on impact and volatility
  const baseMovement = impactScore * 10 // Base: up to 10% movement
  const volatilityMultiplier = features.historical_volatility_30d || 0.2
  
  const priceRange = {
    lower_bound: -(baseMovement * volatilityMultiplier * 1.5),
    upper_bound: baseMovement * (1 + volatilityMultiplier)
  }
  
  // Find similar historical events
  const similarEvents = await findSimilarHistoricalEvents(
    supabase, 
    features.catalyst_type, 
    features.ticker,
    features.sector || ''
  )
  
  return {
    catalyst_id: undefined,
    impact_prediction: impactScore,
    confidence_score: confidence,
    price_movement_range: priceRange,
    risk_factors: riskFactors,
    similar_historical_events: similarEvents
  }
}

async function calculateHistoricalVolatility(supabase: any, ticker: string): Promise<number> {
  // Simplified - in production would calculate from actual price data
  // For MVP, return estimated values based on ticker
  const volatileStocks = ['TSLA', 'NVDA', 'AMD', 'MRNA', 'GME']
  const stableStocks = ['JNJ', 'PG', 'KO', 'WMT', 'JPM']
  
  if (volatileStocks.includes(ticker)) return 0.35 + Math.random() * 0.15
  if (stableStocks.includes(ticker)) return 0.15 + Math.random() * 0.1
  return 0.2 + Math.random() * 0.1
}

async function getSentimentDelta(supabase: any, ticker: string): Promise<number> {
  // In production, would aggregate from news/social sentiment APIs
  // For MVP, return random sentiment between -0.5 and 0.5
  return Math.random() - 0.5
}

async function getSectorMomentum(supabase: any, sector?: string): Promise<number> {
  if (!sector) return 0
  
  // In production, calculate from sector ETF performance
  // For MVP, return estimated values
  const hotSectors = ['Technology', 'AI', 'Biotechnology', 'Clean Energy']
  const coldSectors = ['Real Estate', 'Utilities', 'Consumer Staples']
  
  if (hotSectors.some(s => sector.includes(s))) return 0.2 + Math.random() * 0.3
  if (coldSectors.some(s => sector.includes(s))) return -0.1 + Math.random() * 0.2
  return Math.random() * 0.2 - 0.1
}

async function getMacroEnvironment(): Promise<number> {
  // In production, would use Fed data, VIX, yield curve, etc.
  // For MVP, return current environment estimate
  return 0.1 // Slightly positive macro environment
}

async function getOptionFlowSentiment(supabase: any, ticker: string): Promise<number> {
  // In production, would analyze option flow data
  // For MVP, return random sentiment
  return Math.random()
}

async function findSimilarHistoricalEvents(
  supabase: any,
  catalystType: string,
  ticker: string,
  sector: string
): Promise<Array<any>> {
  // Find historical catalysts of same type
  const { data: historicalEvents } = await supabase
    .from('catalyst_history')
    .select('*')
    .eq('type', catalystType)
    .neq('ticker', ticker)
    .limit(5)
  
  if (!historicalEvents || historicalEvents.length === 0) {
    // Return mock data for MVP
    return [
      {
        ticker: catalystType === 'earnings' ? 'AAPL' : 'MRNA',
        event_date: '2024-01-25',
        actual_movement: 5.2,
        similarity_score: 0.82
      },
      {
        ticker: catalystType === 'earnings' ? 'GOOGL' : 'PFE',
        event_date: '2024-01-18',
        actual_movement: -2.8,
        similarity_score: 0.75
      }
    ]
  }
  
  // Calculate similarity scores and return top matches
  return historicalEvents
    .map(event => ({
      ticker: event.ticker,
      event_date: event.event_date,
      actual_movement: event.price_change_percent || 0,
      similarity_score: calculateSimilarity(
        { type: catalystType, sector },
        { type: event.type, sector: event.metadata?.sector }
      )
    }))
    .sort((a, b) => b.similarity_score - a.similarity_score)
    .slice(0, 3)
}

function calculateSimilarity(catalyst1: any, catalyst2: any): number {
  let score = 0
  
  // Same type
  if (catalyst1.type === catalyst2.type) score += 0.5
  
  // Same sector
  if (catalyst1.sector && catalyst2.sector && catalyst1.sector === catalyst2.sector) {
    score += 0.3
  }
  
  // Add some randomness for MVP
  score += Math.random() * 0.2
  
  return Math.min(score, 1)
}