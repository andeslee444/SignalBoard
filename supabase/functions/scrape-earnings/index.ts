import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AlphaVantageEarnings {
  symbol: string
  name: string
  reportDate: string
  fiscalDateEnding: string
  estimate?: string
  currency?: string
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Starting earnings scraper...')
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // For MVP, we'll use mock data since Alpha Vantage requires API key
    // In production, replace with actual API call
    const mockEarnings: AlphaVantageEarnings[] = [
      {
        symbol: 'AAPL',
        name: 'Apple Inc.',
        reportDate: '2024-02-01',
        fiscalDateEnding: '2023-12-31',
        estimate: '2.10',
        currency: 'USD'
      },
      {
        symbol: 'MSFT',
        name: 'Microsoft Corporation',
        reportDate: '2024-01-30',
        fiscalDateEnding: '2023-12-31',
        estimate: '2.78',
        currency: 'USD'
      },
      {
        symbol: 'GOOGL',
        name: 'Alphabet Inc.',
        reportDate: '2024-02-06',
        fiscalDateEnding: '2023-12-31',
        estimate: '1.59',
        currency: 'USD'
      },
      {
        symbol: 'AMZN',
        name: 'Amazon.com Inc.',
        reportDate: '2024-02-08',
        fiscalDateEnding: '2023-12-31',
        estimate: '0.83',
        currency: 'USD'
      },
      {
        symbol: 'NVDA',
        name: 'NVIDIA Corporation',
        reportDate: '2024-02-21',
        fiscalDateEnding: '2024-01-31',
        estimate: '4.56',
        currency: 'USD'
      }
    ]

    // Filter for upcoming earnings (next 30 days)
    const today = new Date()
    const thirtyDaysFromNow = new Date(today)
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
    
    const upcomingEarnings = mockEarnings.filter(earnings => {
      const reportDate = new Date(earnings.reportDate)
      return reportDate >= today && reportDate <= thirtyDaysFromNow
    })
    
    console.log(`Found ${upcomingEarnings.length} upcoming earnings`)
    
    // Process earnings into catalysts
    const catalysts = upcomingEarnings.map(earnings => {
      // Calculate impact score based on company (in production, use market cap, volatility, etc.)
      let impactScore = 0.5 // Default
      if (['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA'].includes(earnings.symbol)) {
        impactScore = 0.9 // High impact for major tech companies
      }
      
      return {
        type: 'earnings',
        ticker: earnings.symbol,
        title: `${earnings.name} Q4 Earnings Report`,
        description: `Earnings report for fiscal period ending ${earnings.fiscalDateEnding}. Consensus EPS estimate: $${earnings.estimate}`,
        event_date: new Date(earnings.reportDate).toISOString(),
        impact_score: impactScore,
        confidence_score: 0.85, // High confidence for scheduled earnings
        metadata: {
          company_name: earnings.name,
          fiscal_date_ending: earnings.fiscalDateEnding,
          eps_estimate: earnings.estimate,
          currency: earnings.currency,
          report_time: 'after_close' // Most tech companies report after market close
        }
      }
    })
    
    console.log(`Processed ${catalysts.length} earnings catalysts`)
    
    // Insert catalysts into database
    if (catalysts.length > 0) {
      const { data: insertedData, error } = await supabase
        .from('catalysts')
        .upsert(catalysts, {
          onConflict: 'ticker,event_date',
          ignoreDuplicates: true
        })
        .select()
      
      if (error) {
        console.error('Database error:', error)
        throw error
      }
      
      console.log(`Inserted ${insertedData?.length || 0} new catalysts`)
      
      // Trigger real-time updates for new catalysts
      if (insertedData && insertedData.length > 0) {
        const channel = supabase.channel('catalyst-updates')
        for (const catalyst of insertedData) {
          await channel.send({
            type: 'broadcast',
            event: 'new_catalyst',
            payload: catalyst
          })
        }
      }
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        processed: upcomingEarnings.length,
        catalysts: catalysts.length,
        message: `Earnings scraper completed successfully`
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