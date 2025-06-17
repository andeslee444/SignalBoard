import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface FDAEvent {
  safetyreportid: string
  serious: string
  receivedate: string
  patient?: {
    drug?: Array<{
      medicinalproduct?: string
      drugindication?: string
    }>
  }
  companynumb?: string
}

interface FDAResponse {
  results: FDAEvent[]
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Starting FDA scraper...')
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Fetch recent FDA adverse events
    const today = new Date()
    const thirtyDaysAgo = new Date(today)
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    // FDA data might be delayed, so also check 90 days back as fallback
    const ninetyDaysAgo = new Date(today)
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
    
    const endDateStr = today.toISOString().split('T')[0].replace(/-/g, '')
    const startDateStr = thirtyDaysAgo.toISOString().split('T')[0].replace(/-/g, '')
    const fallbackDateStr = ninetyDaysAgo.toISOString().split('T')[0].replace(/-/g, '')
    
    // Get FDA API key from secure storage
    const { data: apiKeyData } = await supabase
      .from('api_keys')
      .select('api_key')
      .eq('service_name', 'fda')
      .single()
    
    const fdaApiKey = apiKeyData?.api_key || ''
    
    // Try with 30-day range first
    let fdaUrl = `https://api.fda.gov/drug/event.json?search=receivedate:[${startDateStr}+TO+${endDateStr}]+AND+serious:1&limit=100${fdaApiKey ? `&api_key=${fdaApiKey}` : ''}`
    
    console.log(`Fetching FDA data from last 30 days...`)
    
    let response = await fetch(fdaUrl)
    
    // If no data found, try 90-day fallback
    if (response.status === 404) {
      console.log('No recent data found, trying 90-day range...')
      fdaUrl = `https://api.fda.gov/drug/event.json?search=receivedate:[${fallbackDateStr}+TO+${endDateStr}]+AND+serious:1&limit=100${fdaApiKey ? `&api_key=${fdaApiKey}` : ''}`
      response = await fetch(fdaUrl)
    }
    
    // If still no data, get the most recent events regardless of date
    if (response.status === 404) {
      console.log('No data in date range, fetching most recent events...')
      fdaUrl = `https://api.fda.gov/drug/event.json?search=serious:1&sort=receivedate:desc&limit=100${fdaApiKey ? `&api_key=${fdaApiKey}` : ''}`
      response = await fetch(fdaUrl)
    }
    
    if (!response.ok) {
      throw new Error(`FDA API error: ${response.status}`)
    }
    
    const data: FDAResponse = await response.json()
    
    console.log(`Found ${data.results?.length || 0} FDA events`)
    
    // Log date range of events
    if (data.results && data.results.length > 0) {
      const dates = data.results.map(e => e.receivedate).sort()
      console.log(`Date range: ${dates[0]} to ${dates[dates.length - 1]}`)
    }
    
    // Process and filter for significant events
    const catalysts = []
    const processedTickers = new Set()
    
    for (const event of data.results || []) {
      // Extract drug names and create ticker mapping
      const drugs = event.patient?.drug || []
      
      for (const drug of drugs) {
        if (!drug.medicinalproduct) continue
        
        const drugName = drug.medicinalproduct.toUpperCase()
        
        // Look up drug in mapping table
        const { data: drugMapping, error: mappingError } = await supabase
          .from('drug_mappings')
          .select('primary_ticker, related_tickers, drug_class, manufacturer')
          .or(`drug_name.ilike.%${drugName}%,brand_names.cs.{${drugName}}`)
          .limit(1)
          .single()
        
        if (mappingError || !drugMapping) {
          console.log(`No mapping found for drug: ${drugName}`)
          continue
        }
        
        const ticker = drugMapping.primary_ticker
        
        if (processedTickers.has(`${ticker}-${drugName}`)) continue
        
        processedTickers.add(`${ticker}-${drugName}`)
        
        // Calculate impact score based on drug class and event severity
        let impactScore = 0.3 // Base score
        if (drugMapping.drug_class?.includes('inhibitor') || drugMapping.drug_class?.includes('cancer')) {
          impactScore = 0.5 // Higher impact for oncology drugs
        }
        if (event.serious === '1') {
          impactScore = Math.min(0.8, impactScore + 0.2)
        }
        
        // Parse FDA date format (YYYYMMDD) to ISO
        const parseDate = (dateStr: string) => {
          const year = dateStr.substring(0, 4)
          const month = dateStr.substring(4, 6)
          const day = dateStr.substring(6, 8)
          return new Date(`${year}-${month}-${day}`).toISOString()
        }
        
        // Create catalyst entry
        const catalyst = {
          type: 'fda',
          ticker: ticker,
          title: `FDA Adverse Event Report: ${drug.medicinalproduct}`,
          description: `Serious adverse event reported for ${drug.medicinalproduct} (${drugMapping.drug_class || 'Drug class unknown'}). Indication: ${drug.drugindication || 'Not specified'}. Manufactured by ${drugMapping.manufacturer}.`,
          event_date: parseDate(event.receivedate),
          impact_score: impactScore,
          confidence_score: 0.7,
          metadata: {
            fda_report_id: event.safetyreportid,
            drug_name: drug.medicinalproduct,
            drug_class: drugMapping.drug_class,
            indication: drug.drugindication,
            serious: event.serious === '1',
            related_tickers: drugMapping.related_tickers || []
          }
        }
        
        catalysts.push(catalyst)
        
        // Also create catalysts for significantly related tickers
        if (drugMapping.related_tickers && impactScore >= 0.5) {
          for (const relatedTicker of drugMapping.related_tickers.slice(0, 2)) { // Max 2 related
            if (processedTickers.has(`${relatedTicker}-${drugName}`)) continue
            
            processedTickers.add(`${relatedTicker}-${drugName}`)
            
            catalysts.push({
              ...catalyst,
              ticker: relatedTicker,
              title: `Related FDA Event: ${drug.medicinalproduct}`,
              impact_score: impactScore * 0.6, // Lower impact for related companies
              metadata: {
                ...catalyst.metadata,
                relationship: 'competitor/partner'
              }
            })
          }
        }
      }
    }
    
    console.log(`Processed ${catalysts.length} catalysts`)
    
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
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        processed: data.results?.length || 0,
        catalysts: catalysts.length,
        message: `FDA scraper completed successfully`
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