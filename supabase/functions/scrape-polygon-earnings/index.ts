import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PolygonStock {
  ticker: string
  name: string
  market_cap?: number
  sector?: string
}

interface PolygonEarnings {
  ticker: string
  company_name: string
  report_date: string
  report_time?: string
  eps_estimate?: number
  eps_actual?: number
  revenue_estimate?: number
  revenue_actual?: number
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Starting Polygon.io earnings scraper...')
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get Polygon API key from secure storage
    const { data: apiKeyData, error: keyError } = await supabase
      .from('api_keys')
      .select('api_key')
      .eq('service_name', 'polygon')
      .single()

    if (keyError || !apiKeyData?.api_key) {
      console.log('Polygon API key not found, using mock data for MVP')
      // For MVP, continue with mock data
      return await processMockEarnings(supabase)
    }
    
    // FOR TESTING: Force use of mock data
    return await processMockEarnings(supabase)

    const polygonApiKey = apiKeyData.api_key
    
    // Get earnings calendar for next 30 days
    const today = new Date()
    const thirtyDaysFromNow = new Date(today)
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
    
    const fromDate = today.toISOString().split('T')[0]
    const toDate = thirtyDaysFromNow.toISOString().split('T')[0]
    
    // Polygon.io calendar endpoint for earnings dates
    const earningsUrl = `https://api.polygon.io/vX/reference/financials?` +
      `filing_date.gte=${fromDate}&` +
      `filing_date.lte=${toDate}&` +
      `include_sources=true&` +
      `order=asc&` +
      `limit=100&` +
      `apiKey=${polygonApiKey}`
    
    console.log(`Fetching earnings data from Polygon.io`)
    
    const response = await fetch(earningsUrl)
    
    if (!response.ok) {
      console.error(`Polygon API error: ${response.status}`)
      // Fallback to mock data
      return await processMockEarnings(supabase)
    }
    
    const data = await response.json()
    const tickers = data.results || []
    
    // For each ticker, get detailed earnings info
    const catalysts = []
    const earningsEntries = []
    
    for (const ticker of tickers.slice(0, 20)) { // Limit to 20 for rate limits
      try {
        // Get company details
        const detailsUrl = `https://api.polygon.io/v3/reference/tickers/${ticker.ticker}?apiKey=${polygonApiKey}`
        const detailsResponse = await fetch(detailsUrl)
        
        if (!detailsResponse.ok) continue
        
        const details = await detailsResponse.json()
        const company = details.results
        
        // Calculate impact score based on market cap
        let impactScore = 0.5
        if (company.market_cap) {
          if (company.market_cap > 500_000_000_000) impactScore = 0.95 // Mega cap
          else if (company.market_cap > 100_000_000_000) impactScore = 0.85 // Large cap
          else if (company.market_cap > 10_000_000_000) impactScore = 0.7 // Mid cap
          else impactScore = 0.5 // Small cap
        }
        
        // Create catalyst
        const reportDate = new Date()
        reportDate.setDate(reportDate.getDate() + Math.floor(Math.random() * 30)) // Mock date
        
        const catalyst = {
          type: 'earnings',
          ticker: company.ticker,
          title: `${company.name} Earnings Report`,
          description: `Quarterly earnings report. Company operates in ${company.primary_exchange} exchange, ${company.locale} market.`,
          event_date: reportDate.toISOString(),
          impact_score: impactScore,
          confidence_score: 0.85,
          metadata: {
            company_name: company.name,
            market_cap: company.market_cap,
            sector: company.type,
            primary_exchange: company.primary_exchange,
            currency: company.currency_name,
            polygon_ticker: company.ticker
          }
        }
        
        catalysts.push(catalyst)
        
        // Also add to earnings calendar
        earningsEntries.push({
          ticker: company.ticker,
          company_name: company.name,
          report_date: reportDate.toISOString().split('T')[0],
          report_time: 'after_close',
          source: 'polygon'
        })
        
        // Small delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 100))
        
      } catch (err) {
        console.error(`Error processing ticker ${ticker.ticker}:`, err)
      }
    }
    
    console.log(`Processed ${catalysts.length} earnings catalysts from Polygon`)
    
    // Insert into database
    if (catalysts.length > 0) {
      const { error: catalystError } = await supabase
        .from('catalysts')
        .upsert(catalysts, {
          onConflict: 'ticker,event_date',
          ignoreDuplicates: true
        })
      
      if (catalystError) {
        console.error('Error inserting catalysts:', catalystError)
      }
      
      // Insert into earnings calendar
      const { error: calendarError } = await supabase
        .from('earnings_calendar')
        .upsert(earningsEntries, {
          onConflict: 'ticker,report_date',
          ignoreDuplicates: true
        })
      
      if (calendarError) {
        console.error('Error inserting earnings calendar:', calendarError)
      }
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        processed: catalysts.length,
        message: 'Polygon earnings scraper completed'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
    
  } catch (error) {
    console.error('Scraper error:', error)
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

// Fallback function for when Polygon API is not available
async function processMockEarnings(supabase: any) {
  const mockEarnings = [
    { ticker: 'AAPL', name: 'Apple Inc.', marketCap: 2800000000000, date: 7 },
    { ticker: 'MSFT', name: 'Microsoft Corporation', marketCap: 2700000000000, date: 5 },
    { ticker: 'GOOGL', name: 'Alphabet Inc.', marketCap: 1700000000000, date: 10 },
    { ticker: 'AMZN', name: 'Amazon.com Inc.', marketCap: 1500000000000, date: 12 },
    { ticker: 'NVDA', name: 'NVIDIA Corporation', marketCap: 1100000000000, date: 21 },
    { ticker: 'META', name: 'Meta Platforms Inc.', marketCap: 900000000000, date: 8 },
    { ticker: 'TSLA', name: 'Tesla Inc.', marketCap: 800000000000, date: 15 },
    { ticker: 'BRK.B', name: 'Berkshire Hathaway', marketCap: 750000000000, date: 18 },
    { ticker: 'JPM', name: 'JPMorgan Chase', marketCap: 450000000000, date: 14 },
    { ticker: 'JNJ', name: 'Johnson & Johnson', marketCap: 400000000000, date: 20 }
  ]

  const catalysts = []
  const today = new Date()
  
  for (const company of mockEarnings) {
    const reportDate = new Date(today)
    reportDate.setDate(reportDate.getDate() + company.date)
    
    // Calculate impact based on market cap
    let impactScore = 0.5
    if (company.marketCap > 500_000_000_000) impactScore = 0.95
    else if (company.marketCap > 100_000_000_000) impactScore = 0.85
    else if (company.marketCap > 10_000_000_000) impactScore = 0.7
    
    catalysts.push({
      type: 'earnings',
      ticker: company.ticker,
      title: `${company.name} Q4 Earnings Report`,
      description: `Quarterly earnings announcement. Market cap: $${(company.marketCap / 1e9).toFixed(0)}B`,
      event_date: reportDate.toISOString(),
      impact_score: impactScore,
      confidence_score: 0.85,
      metadata: {
        company_name: company.name,
        market_cap: company.marketCap,
        report_time: 'after_close',
        source: 'mock_data'
      }
    })
  }
  
  // Insert catalysts
  const { error } = await supabase
    .from('catalysts')
    .upsert(catalysts, {
      onConflict: 'ticker,event_date',
      ignoreDuplicates: true
    })
  
  if (error) {
    console.error('Database error:', error)
  }
  
  return new Response(
    JSON.stringify({
      success: true,
      processed: catalysts.length,
      message: 'Mock earnings data processed'
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    }
  )
}