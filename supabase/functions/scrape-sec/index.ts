import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SECFiling {
  id: string
  accessionNo: string
  cik: string
  ticker: string
  companyName: string
  companyNameLong: string
  formType: string
  description: string
  filedAt: string
  linkToTxt: string
  linkToHtml: string
  linkToXbrl: string
  linkToFilingDetails: string
  entities: Array<{
    companyName: string
    cik: string
    irsNo: string
    stateOfIncorporation: string
    fiscalYearEnd: string
    sic: string
    type: string
    act: string
    fileNo: string
    filmNo: string
  }>
  documentFormatFiles: Array<{
    sequence: string
    description: string
    documentUrl: string
    type: string
    size: string
  }>
  dataFiles: Array<{
    sequence: string
    description: string
    documentUrl: string
    type: string
    size: string
  }>
  seriesAndClassesContractsData: any[]
  effectivenessDate: string
  viewerUrl: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Starting SEC scraper...')
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get SEC API key
    const { data: apiKeyData, error: keyError } = await supabase
      .from('api_keys')
      .select('api_key')
      .eq('service_name', 'sec_api')
      .single()

    if (keyError || !apiKeyData?.api_key) {
      throw new Error('SEC-API.io key not found')
    }

    const secApiKey = apiKeyData.api_key
    
    // Get recent filings - focusing on important forms
    const importantForms = ['8-K', '10-K', '10-Q', 'S-1', 'S-3', 'S-8', 'DEF 14A']
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    const fromDate = yesterday.toISOString().split('T')[0]
    const toDate = today.toISOString().split('T')[0]
    
    console.log(`Fetching SEC filings from ${fromDate} to ${toDate}`)
    
    const catalysts = []
    
    // Query for each form type
    for (const formType of importantForms) {
      try {
        const query = {
          query: {
            query_string: {
              query: `formType:"${formType}" AND filedAt:[${fromDate} TO ${toDate}]`
            }
          },
          from: '0',
          size: '50',
          sort: [{ filedAt: { order: 'desc' } }]
        }
        
        const response = await fetch('https://api.sec-api.io', {
          method: 'POST',
          headers: {
            'Authorization': secApiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(query)
        })
        
        if (!response.ok) {
          console.error(`SEC API error for ${formType}: ${response.status}`)
          continue
        }
        
        const data = await response.json()
        const filings: SECFiling[] = data.filings || []
        
        console.log(`Found ${filings.length} ${formType} filings`)
        
        for (const filing of filings) {
          // Skip if no ticker
          if (!filing.ticker || filing.ticker === 'n/a') continue
          
          // Calculate impact score based on form type
          let impactScore = 0.3
          let title = ''
          let description = ''
          
          switch (formType) {
            case '8-K':
              // Current reports - can be very important
              impactScore = 0.6
              title = `${filing.ticker} Files Form 8-K`
              description = `Current report filing. ${filing.description || 'Material event or corporate change.'}`
              break
              
            case '10-K':
              // Annual report - high impact
              impactScore = 0.8
              title = `${filing.ticker} Annual Report (10-K)`
              description = `Annual report filing containing comprehensive overview of the company's business.`
              break
              
            case '10-Q':
              // Quarterly report - medium-high impact
              impactScore = 0.7
              title = `${filing.ticker} Quarterly Report (10-Q)`
              description = `Quarterly report with unaudited financial statements.`
              break
              
            case 'S-1':
              // IPO registration - very high impact
              impactScore = 0.95
              title = `${filing.ticker} IPO Registration (S-1)`
              description = `Initial public offering registration statement.`
              break
              
            case 'DEF 14A':
              // Proxy statement - medium impact
              impactScore = 0.5
              title = `${filing.ticker} Proxy Statement`
              description = `Definitive proxy statement for shareholder meeting.`
              break
              
            default:
              impactScore = 0.4
              title = `${filing.ticker} Files Form ${formType}`
              description = filing.description || `SEC filing of form ${formType}.`
          }
          
          // Parse 8-K for specific events
          if (formType === '8-K' && filing.documentFormatFiles) {
            // Look for key 8-K items that increase impact
            const highImpactItems = [
              'Item 1.01', // Entry into Material Agreement
              'Item 1.02', // Termination of Material Agreement
              'Item 2.01', // Completion of Acquisition
              'Item 2.04', // Triggering Events for Writedown
              'Item 2.05', // Departure of Directors or Officers
              'Item 2.06', // Material Impairments
              'Item 5.02', // Departure/Appointment of Officers
              'Item 7.01', // Regulation FD Disclosure
              'Item 8.01'  // Other Events
            ]
            
            for (const item of highImpactItems) {
              if (filing.description?.includes(item)) {
                impactScore = Math.min(0.8, impactScore + 0.2)
                break
              }
            }
          }
          
          const catalyst = {
            type: 'sec',
            ticker: filing.ticker,
            title: title,
            description: description,
            event_date: new Date(filing.filedAt).toISOString(),
            impact_score: impactScore,
            confidence_score: 0.9, // SEC filings are definitive
            metadata: {
              form_type: formType,
              accession_no: filing.accessionNo,
              cik: filing.cik,
              company_name: filing.companyName,
              filing_url: filing.linkToFilingDetails,
              sec_viewer_url: filing.viewerUrl,
              filed_at: filing.filedAt
            }
          }
          
          catalysts.push(catalyst)
        }
        
        // Small delay between form types to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 100))
        
      } catch (err) {
        console.error(`Error processing ${formType}:`, err)
      }
    }
    
    console.log(`Processed ${catalysts.length} SEC catalysts`)
    
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
        processed: catalysts.length,
        message: `SEC scraper completed successfully`
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