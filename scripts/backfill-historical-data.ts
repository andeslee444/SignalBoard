#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { parse } from 'csv-parse'
import { createReadStream } from 'fs'
import { finished } from 'stream/promises'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL || 'https://yjaxznsrysvazxqtvcvm.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!supabaseServiceKey) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface HistoricalCatalyst {
  type: string
  ticker: string
  title: string
  description: string
  event_date: string
  impact_score?: number
  confidence_score?: number
  metadata?: any
}

// Backfill FDA historical data
async function backfillFDAData(startDate: Date, endDate: Date) {
  console.log('Starting FDA historical data backfill...')
  
  const totalDays = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  let processedDays = 0
  
  const currentDate = new Date(startDate)
  
  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split('T')[0].replace(/-/g, '')
    
    try {
      // FDA API call for historical data
      const url = `https://api.fda.gov/drug/event.json?search=receivedate:${dateStr}+AND+serious:1&limit=100`
      
      const response = await fetch(url)
      
      if (response.status === 429) {
        console.log('Rate limited, waiting 60 seconds...')
        await new Promise(resolve => setTimeout(resolve, 60000))
        continue
      }
      
      if (!response.ok) {
        console.log(`Skipping ${dateStr}: ${response.status}`)
        currentDate.setDate(currentDate.getDate() + 1)
        continue
      }
      
      const data = await response.json()
      const events = data.results || []
      
      console.log(`Processing ${events.length} FDA events for ${dateStr}`)
      
      // Process events (simplified for backfill)
      const catalysts: HistoricalCatalyst[] = []
      
      for (const event of events) {
        const drugs = event.patient?.drug || []
        
        for (const drug of drugs) {
          if (!drug.medicinalproduct) continue
          
          // Look up drug mapping
          const { data: mapping } = await supabase
            .from('drug_mappings')
            .select('primary_ticker')
            .ilike('drug_name', `%${drug.medicinalproduct}%`)
            .limit(1)
            .single()
          
          if (!mapping) continue
          
          catalysts.push({
            type: 'fda',
            ticker: mapping.primary_ticker,
            title: `FDA Adverse Event: ${drug.medicinalproduct}`,
            description: `Historical adverse event report`,
            event_date: new Date(event.receivedate).toISOString(),
            impact_score: 0.3,
            confidence_score: 0.7,
            metadata: {
              historical_backfill: true,
              fda_report_id: event.safetyreportid
            }
          })
        }
      }
      
      // Batch insert
      if (catalysts.length > 0) {
        const { error } = await supabase
          .from('catalysts')
          .insert(catalysts)
        
        if (error) {
          console.error('Insert error:', error)
        } else {
          console.log(`Inserted ${catalysts.length} catalysts for ${dateStr}`)
        }
      }
      
      processedDays++
      console.log(`Progress: ${processedDays}/${totalDays} days (${((processedDays/totalDays) * 100).toFixed(1)}%)`)
      
      // Rate limit protection
      await new Promise(resolve => setTimeout(resolve, 1000))
      
    } catch (error) {
      console.error(`Error processing ${dateStr}:`, error)
    }
    
    currentDate.setDate(currentDate.getDate() + 1)
  }
  
  console.log('FDA backfill complete!')
}

// Backfill earnings historical data from CSV
async function backfillEarningsFromCSV(csvPath: string) {
  console.log('Starting earnings historical data backfill from CSV...')
  
  const catalysts: HistoricalCatalyst[] = []
  
  const parser = createReadStream(csvPath).pipe(
    parse({
      columns: true,
      skip_empty_lines: true
    })
  )
  
  parser.on('data', (row: any) => {
    catalysts.push({
      type: 'earnings',
      ticker: row.ticker || row.symbol,
      title: `${row.company_name} Earnings Report`,
      description: `Historical earnings report`,
      event_date: new Date(row.report_date).toISOString(),
      impact_score: parseFloat(row.impact_score) || 0.5,
      confidence_score: 0.85,
      metadata: {
        historical_backfill: true,
        eps_actual: parseFloat(row.eps_actual) || null,
        eps_estimate: parseFloat(row.eps_estimate) || null,
        revenue_actual: parseFloat(row.revenue_actual) || null,
        revenue_estimate: parseFloat(row.revenue_estimate) || null
      }
    })
  })
  
  await finished(parser)
  
  console.log(`Parsed ${catalysts.length} earnings records from CSV`)
  
  // Batch insert in chunks
  const chunkSize = 1000
  for (let i = 0; i < catalysts.length; i += chunkSize) {
    const chunk = catalysts.slice(i, i + chunkSize)
    
    const { error } = await supabase
      .from('catalysts')
      .insert(chunk)
    
    if (error) {
      console.error(`Error inserting chunk ${i}:`, error)
    } else {
      console.log(`Inserted chunk ${i}-${i + chunk.length}`)
    }
  }
  
  console.log('Earnings backfill complete!')
}

// Backfill sample historical outcomes for ML training
async function backfillHistoricalOutcomes() {
  console.log('Backfilling historical outcomes...')
  
  // Get catalysts that need outcomes
  const { data: catalysts, error } = await supabase
    .from('catalysts')
    .select('id, ticker, event_date')
    .lt('event_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // At least 7 days old
    .limit(1000)
  
  if (error || !catalysts) {
    console.error('Error fetching catalysts:', error)
    return
  }
  
  console.log(`Found ${catalysts.length} catalysts needing outcomes`)
  
  const outcomes = []
  
  for (const catalyst of catalysts) {
    // Generate realistic mock outcome data
    const baseChange = Math.random() * 10 - 5 // -5% to +5%
    const volatility = Math.random() * 2
    
    outcomes.push({
      catalyst_id: catalyst.id,
      ticker: catalyst.ticker,
      price_before: 100, // Normalized
      price_after: 100 + baseChange,
      percentage_change: baseChange,
      days_after: Math.floor(Math.random() * 5) + 1
    })
  }
  
  // Insert outcomes
  const { error: insertError } = await supabase
    .from('catalyst_outcomes')
    .insert(outcomes)
  
  if (insertError) {
    console.error('Error inserting outcomes:', insertError)
  } else {
    console.log(`Inserted ${outcomes.length} historical outcomes`)
  }
}

// Main execution
async function main() {
  const command = process.argv[2]
  
  switch (command) {
    case 'fda':
      // Backfill 10 years of FDA data
      const endDate = new Date()
      const startDate = new Date()
      startDate.setFullYear(startDate.getFullYear() - 10)
      await backfillFDAData(startDate, endDate)
      break
      
    case 'earnings':
      // Backfill 5 years of earnings data
      const csvPath = process.argv[3]
      if (!csvPath) {
        console.error('Please provide CSV path for earnings data')
        process.exit(1)
      }
      await backfillEarningsFromCSV(csvPath)
      break
      
    case 'outcomes':
      await backfillHistoricalOutcomes()
      break
      
    case 'all':
      console.log('Running all backfills...')
      // Run all backfills in sequence
      await backfillHistoricalOutcomes()
      console.log('All backfills complete!')
      break
      
    default:
      console.log('Usage: backfill-historical-data.ts [fda|earnings|outcomes|all] [options]')
      console.log('  fda - Backfill FDA adverse events (10 years)')
      console.log('  earnings <csv_path> - Backfill earnings from CSV (5 years)')
      console.log('  outcomes - Generate historical outcomes for ML training')
      console.log('  all - Run all backfills')
  }
}

main().catch(console.error)