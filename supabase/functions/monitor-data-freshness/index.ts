import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DataFreshness {
  source: string
  lastUpdate: string | null
  recordCount: number
  oldestRecord: string | null
  newestRecord: string | null
  isStale: boolean
  staleDays?: number
  warning?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const results: DataFreshness[] = []

    // Check FDA data freshness
    const { data: fdaData } = await supabase
      .from('catalysts')
      .select('event_date, created_at')
      .eq('type', 'fda')
      .order('event_date', { ascending: false })
      .limit(1)

    const { count: fdaCount } = await supabase
      .from('catalysts')
      .select('*', { count: 'exact', head: true })
      .eq('type', 'fda')

    if (fdaData && fdaData.length > 0) {
      const newestEventDate = new Date(fdaData[0].event_date)
      const daysSinceLastEvent = Math.floor((Date.now() - newestEventDate.getTime()) / (1000 * 60 * 60 * 24))
      
      results.push({
        source: 'FDA',
        lastUpdate: fdaData[0].created_at,
        recordCount: fdaCount || 0,
        oldestRecord: null, // Would need another query
        newestRecord: fdaData[0].event_date,
        isStale: daysSinceLastEvent > 90,
        staleDays: daysSinceLastEvent,
        warning: daysSinceLastEvent > 90 
          ? `FDA data is ${daysSinceLastEvent} days old. This is expected as FDA data can be 2-3 months delayed.`
          : undefined
      })
    }

    // Check SEC data freshness
    const { data: secData } = await supabase
      .from('catalysts')
      .select('event_date, created_at')
      .eq('type', 'sec')
      .order('event_date', { ascending: false })
      .limit(1)

    const { count: secCount } = await supabase
      .from('catalysts')
      .select('*', { count: 'exact', head: true })
      .eq('type', 'sec')

    if (secData && secData.length > 0) {
      const newestEventDate = new Date(secData[0].event_date)
      const daysSinceLastEvent = Math.floor((Date.now() - newestEventDate.getTime()) / (1000 * 60 * 60 * 24))
      
      results.push({
        source: 'SEC',
        lastUpdate: secData[0].created_at,
        recordCount: secCount || 0,
        oldestRecord: null,
        newestRecord: secData[0].event_date,
        isStale: daysSinceLastEvent > 1, // SEC should be near real-time
        staleDays: daysSinceLastEvent,
        warning: daysSinceLastEvent > 1 
          ? `SEC data appears stale. Last filing was ${daysSinceLastEvent} days ago.`
          : undefined
      })
    }

    // Check Earnings data freshness
    const { data: earningsData } = await supabase
      .from('catalysts')
      .select('event_date, created_at')
      .eq('type', 'earnings')
      .order('created_at', { ascending: false })
      .limit(1)

    const { count: earningsCount } = await supabase
      .from('catalysts')
      .select('*', { count: 'exact', head: true })
      .eq('type', 'earnings')

    if (earningsData && earningsData.length > 0) {
      const lastUpdate = new Date(earningsData[0].created_at)
      const hoursSinceUpdate = Math.floor((Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60))
      
      results.push({
        source: 'Earnings',
        lastUpdate: earningsData[0].created_at,
        recordCount: earningsCount || 0,
        oldestRecord: null,
        newestRecord: earningsData[0].event_date,
        isStale: hoursSinceUpdate > 24, // Should update daily
        staleDays: Math.floor(hoursSinceUpdate / 24),
        warning: hoursSinceUpdate > 24 
          ? `Earnings data hasn't been updated in ${hoursSinceUpdate} hours.`
          : undefined
      })
    }

    // Check for API key expiration warnings
    const { data: apiKeys } = await supabase
      .from('api_keys')
      .select('service_name, expires_at')
      .not('expires_at', 'is', null)

    const expiringKeys = apiKeys?.filter(key => {
      if (!key.expires_at) return false
      const daysUntilExpiry = Math.floor((new Date(key.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      return daysUntilExpiry < 30
    })

    // Overall health status
    const hasStaleData = results.some(r => r.isStale)
    const hasExpiringKeys = expiringKeys && expiringKeys.length > 0

    return new Response(
      JSON.stringify({
        success: true,
        timestamp: new Date().toISOString(),
        dataFreshness: results,
        expiringApiKeys: expiringKeys,
        overallHealth: {
          status: hasStaleData || hasExpiringKeys ? 'warning' : 'healthy',
          messages: [
            ...results.filter(r => r.warning).map(r => r.warning),
            ...expiringKeys?.map(k => `API key for ${k.service_name} expires soon`) || []
          ]
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Monitor error:', error)
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