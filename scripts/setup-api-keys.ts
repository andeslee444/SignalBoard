#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as readline from 'readline'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL || 'https://yjaxznsrysvazxqtvcvm.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!supabaseServiceKey) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable')
  console.error('Please add it to your .env file')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve)
  })
}

async function setupAPIKeys() {
  console.log('SignalBoard API Key Setup')
  console.log('========================\n')
  
  console.log('This script will securely store your API keys in Supabase.')
  console.log('Keys are encrypted at rest and only accessible via service role.\n')
  
  const apiKeys = [
    {
      service_name: 'polygon',
      display_name: 'Polygon.io',
      rate_limit: 5,
      rate_window: 'minute',
      required: true
    },
    {
      service_name: 'fda',
      display_name: 'FDA OpenFDA API',
      rate_limit: 1000,
      rate_window: 'day',
      required: true
    },
    {
      service_name: 'sec_api',
      display_name: 'SEC-API.io',
      rate_limit: 100,
      rate_window: 'minute',
      required: true
    },
    {
      service_name: 'alpha_vantage',
      display_name: 'Alpha Vantage',
      rate_limit: 5,
      rate_window: 'minute',
      required: false
    },
    {
      service_name: 'openai',
      display_name: 'OpenAI (for embeddings)',
      rate_limit: 60,
      rate_window: 'minute',
      required: false
    }
  ]
  
  for (const keyConfig of apiKeys) {
    console.log(`\n${keyConfig.display_name}:`)
    
    // Check if key already exists
    const { data: existing } = await supabase
      .from('api_keys')
      .select('service_name')
      .eq('service_name', keyConfig.service_name)
      .single()
    
    if (existing) {
      const update = await question(`Key already exists. Update? (y/N): `)
      if (update.toLowerCase() !== 'y') {
        continue
      }
    }
    
    const apiKey = await question(`Enter API key${keyConfig.required ? ' (required)' : ' (optional, press enter to skip)'}: `)
    
    if (!apiKey && keyConfig.required) {
      console.error(`${keyConfig.display_name} API key is required!`)
      continue
    }
    
    if (!apiKey) {
      console.log('Skipping...')
      continue
    }
    
    // Store in database
    const { error } = await supabase
      .from('api_keys')
      .upsert({
        service_name: keyConfig.service_name,
        api_key: apiKey,
        rate_limit: keyConfig.rate_limit,
        rate_window: keyConfig.rate_window
      })
    
    if (error) {
      console.error(`Error storing ${keyConfig.display_name} key:`, error.message)
    } else {
      console.log(`✓ ${keyConfig.display_name} key stored successfully`)
    }
  }
  
  console.log('\n✅ API key setup complete!')
  console.log('\nNext steps:')
  console.log('1. Deploy Edge Functions: supabase functions deploy')
  console.log('2. Test scrapers from the frontend UI')
  console.log('3. Monitor logs: supabase functions logs')
  
  rl.close()
}

// Add command to verify keys
async function verifyKeys() {
  console.log('\nVerifying stored API keys...\n')
  
  const { data: keys, error } = await supabase
    .from('api_keys')
    .select('service_name, created_at, rate_limit, rate_window')
  
  if (error) {
    console.error('Error fetching keys:', error.message)
    return
  }
  
  if (!keys || keys.length === 0) {
    console.log('No API keys found. Run setup first.')
    return
  }
  
  console.log('Stored API keys:')
  keys.forEach(key => {
    console.log(`- ${key.service_name}: ${key.rate_limit} requests per ${key.rate_window}`)
  })
}

// Main execution
async function main() {
  const command = process.argv[2]
  
  switch (command) {
    case 'verify':
      await verifyKeys()
      rl.close()
      break
    
    case 'setup':
    default:
      await setupAPIKeys()
      break
  }
}

main().catch(console.error)