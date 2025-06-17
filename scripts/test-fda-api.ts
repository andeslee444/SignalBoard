#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = 'https://yjaxznsrysvazxqtvcvm.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqYXh6bnNyeXN2YXp4cXR2Y3ZtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDExOTUwMiwiZXhwIjoyMDY1Njk1NTAyfQ.SB-nms8I824vrnhIRb5a9BnBwnalcdf_VHJUFFyIuDo'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testFDAApi() {
  console.log('🔍 Testing FDA API...\n')
  
  // Get FDA API key
  const { data: apiKeyData } = await supabase
    .from('api_keys')
    .select('api_key')
    .eq('service_name', 'fda')
    .single()
  
  const fdaApiKey = apiKeyData?.api_key || ''
  console.log('✅ FDA API key found:', !!fdaApiKey)
  
  // Test different date ranges
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  
  const lastWeek = new Date(today)
  lastWeek.setDate(lastWeek.getDate() - 7)
  
  const lastMonth = new Date(today)
  lastMonth.setMonth(lastMonth.getMonth() - 1)
  
  const formatDate = (date: Date) => date.toISOString().split('T')[0].replace(/-/g, '')
  
  const testQueries = [
    {
      name: 'Yesterday only (original query)',
      url: `https://api.fda.gov/drug/event.json?search=receivedate:[${formatDate(yesterday)}+TO+${formatDate(yesterday)}]+AND+serious:1&limit=100${fdaApiKey ? `&api_key=${fdaApiKey}` : ''}`
    },
    {
      name: 'Last 7 days',
      url: `https://api.fda.gov/drug/event.json?search=receivedate:[${formatDate(lastWeek)}+TO+${formatDate(today)}]+AND+serious:1&limit=100${fdaApiKey ? `&api_key=${fdaApiKey}` : ''}`
    },
    {
      name: 'Last 30 days',
      url: `https://api.fda.gov/drug/event.json?search=receivedate:[${formatDate(lastMonth)}+TO+${formatDate(today)}]+AND+serious:1&limit=100${fdaApiKey ? `&api_key=${fdaApiKey}` : ''}`
    },
    {
      name: 'Without date filter (test basic API)',
      url: `https://api.fda.gov/drug/event.json?search=serious:1&limit=10${fdaApiKey ? `&api_key=${fdaApiKey}` : ''}`
    },
    {
      name: 'Popular drug - Keytruda',
      url: `https://api.fda.gov/drug/event.json?search=patient.drug.medicinalproduct:"KEYTRUDA"+AND+serious:1&limit=10${fdaApiKey ? `&api_key=${fdaApiKey}` : ''}`
    }
  ]
  
  for (const query of testQueries) {
    console.log(`\n📊 Testing: ${query.name}`)
    console.log(`URL: ${query.url.replace(fdaApiKey, 'API_KEY_HIDDEN')}`)
    
    try {
      const response = await fetch(query.url)
      const responseText = await response.text()
      
      if (!response.ok) {
        console.log(`❌ Error ${response.status}: ${response.statusText}`)
        console.log('Response:', responseText.substring(0, 200))
      } else {
        const data = JSON.parse(responseText)
        console.log(`✅ Success! Found ${data.results?.length || 0} results`)
        
        if (data.results && data.results.length > 0) {
          const firstEvent = data.results[0]
          console.log('Sample event:')
          console.log('- Report ID:', firstEvent.safetyreportid)
          console.log('- Date:', firstEvent.receivedate)
          console.log('- Drugs:', firstEvent.patient?.drug?.map((d: any) => d.medicinalproduct).join(', '))
        }
      }
    } catch (error) {
      console.log('❌ Request failed:', error)
    }
  }
  
  console.log('\n\n📌 Checking drug mappings...')
  const { data: drugMappings } = await supabase
    .from('drug_mappings')
    .select('drug_name, primary_ticker')
    .limit(5)
  
  console.log('Sample drug mappings:', drugMappings)
}

testFDAApi().catch(console.error)