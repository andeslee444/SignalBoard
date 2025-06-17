import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CatalystInput {
  type: 'fda' | 'earnings' | 'fed_rates' | 'macro'
  ticker: string
  title: string
  description?: string
  event_date: string
  source_data?: any
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { catalyst }: { catalyst: CatalystInput } = await req.json()
    
    if (!catalyst) {
      throw new Error('Missing catalyst data')
    }
    
    console.log(`Processing catalyst: ${catalyst.type} - ${catalyst.ticker}`)
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Calculate impact and confidence scores
    const scores = await calculateScores(catalyst, supabase)
    
    // Prepare catalyst for insertion
    const processedCatalyst = {
      type: catalyst.type,
      ticker: catalyst.ticker,
      title: catalyst.title,
      description: catalyst.description || await generateDescription(catalyst),
      event_date: catalyst.event_date,
      impact_score: scores.impact,
      confidence_score: scores.confidence,
      metadata: {
        source_data: catalyst.source_data,
        processed_at: new Date().toISOString(),
        similar_events_count: scores.similarEventsCount
      }
    }
    
    // Insert catalyst
    const { data: insertedCatalyst, error: insertError } = await supabase
      .from('catalysts')
      .insert(processedCatalyst)
      .select()
      .single()
    
    if (insertError) {
      throw insertError
    }
    
    console.log(`Catalyst inserted with ID: ${insertedCatalyst.id}`)
    
    // Find historical similar catalysts for pattern analysis
    const { data: historicalCatalysts } = await supabase
      .from('catalysts')
      .select('*, catalyst_outcomes(*)')
      .eq('type', catalyst.type)
      .eq('ticker', catalyst.ticker)
      .lt('event_date', catalyst.event_date)
      .order('event_date', { ascending: false })
      .limit(10)
    
    // Analyze historical outcomes
    let predictedImpact = null
    if (historicalCatalysts && historicalCatalysts.length > 0) {
      const outcomes = historicalCatalysts
        .flatMap(c => c.catalyst_outcomes || [])
        .filter(o => o.percentage_change !== null)
      
      if (outcomes.length > 0) {
        const avgChange = outcomes.reduce((sum, o) => sum + (o.percentage_change || 0), 0) / outcomes.length
        const avgDays = outcomes.reduce((sum, o) => sum + (o.days_after || 0), 0) / outcomes.length
        
        predictedImpact = {
          expected_change: avgChange,
          confidence: Math.min(0.9, 0.5 + (outcomes.length * 0.05)), // More data = higher confidence
          timeframe_days: Math.round(avgDays),
          sample_size: outcomes.length
        }
        
        // Update catalyst with prediction
        await supabase
          .from('catalysts')
          .update({
            metadata: {
              ...processedCatalyst.metadata,
              predicted_impact: predictedImpact
            }
          })
          .eq('id', insertedCatalyst.id)
      }
    }
    
    // Broadcast real-time update
    const channel = supabase.channel('catalyst-updates')
    await channel.send({
      type: 'broadcast',
      event: 'catalyst_processed',
      payload: {
        ...insertedCatalyst,
        predicted_impact: predictedImpact
      }
    })
    
    return new Response(
      JSON.stringify({
        success: true,
        catalyst: insertedCatalyst,
        predicted_impact: predictedImpact,
        historical_data_points: historicalCatalysts?.length || 0
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Processing error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

async function calculateScores(catalyst: CatalystInput, supabase: any) {
  let impactScore = 0.5 // Default
  let confidenceScore = 0.5 // Default
  
  // Type-based scoring
  switch (catalyst.type) {
    case 'fda':
      impactScore = 0.7 // FDA events are high impact
      confidenceScore = 0.6 // Moderate confidence due to binary outcomes
      break
    case 'earnings':
      // Check if it's a major company
      const majorTickers = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'TSLA', 'META']
      if (majorTickers.includes(catalyst.ticker)) {
        impactScore = 0.9
        confidenceScore = 0.8
      } else {
        impactScore = 0.5
        confidenceScore = 0.7
      }
      break
    case 'fed_rates':
      impactScore = 0.95 // Fed decisions impact entire market
      confidenceScore = 0.7
      break
    case 'macro':
      impactScore = 0.6
      confidenceScore = 0.5
      break
  }
  
  // Check for similar historical events
  const { data: similarEvents } = await supabase
    .from('catalysts')
    .select('id')
    .eq('type', catalyst.type)
    .eq('ticker', catalyst.ticker)
    .lt('event_date', catalyst.event_date)
    .limit(20)
  
  const similarEventsCount = similarEvents?.length || 0
  
  // Adjust confidence based on historical data
  if (similarEventsCount > 10) {
    confidenceScore = Math.min(0.95, confidenceScore + 0.2)
  } else if (similarEventsCount > 5) {
    confidenceScore = Math.min(0.9, confidenceScore + 0.1)
  }
  
  return {
    impact: Math.round(impactScore * 100) / 100,
    confidence: Math.round(confidenceScore * 100) / 100,
    similarEventsCount
  }
}

async function generateDescription(catalyst: CatalystInput): Promise<string> {
  // Simple description generation based on type
  switch (catalyst.type) {
    case 'fda':
      return `FDA regulatory event for ${catalyst.ticker}. This could significantly impact the stock price based on the decision outcome.`
    case 'earnings':
      return `Quarterly earnings report for ${catalyst.ticker}. Market expectations and guidance will drive price movement.`
    case 'fed_rates':
      return `Federal Reserve interest rate decision. This macro event typically impacts all sectors, with particular sensitivity in financials and tech.`
    case 'macro':
      return `Macroeconomic data release that may impact ${catalyst.ticker} and broader market sentiment.`
    default:
      return catalyst.title
  }
}