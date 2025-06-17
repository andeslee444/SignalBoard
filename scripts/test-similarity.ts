#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = 'https://yjaxznsrysvazxqtvcvm.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqYXh6bnNyeXN2YXp4cXR2Y3ZtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDExOTUwMiwiZXhwIjoyMDY1Njk1NTAyfQ.SB-nms8I824vrnhIRb5a9BnBwnalcdf_VHJUFFyIuDo'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testSimilaritySearch() {
  console.log('🔍 Testing similarity search...\n')
  
  // Get a catalyst to use as reference
  const { data: referenceCatalyst } = await supabase
    .from('catalysts')
    .select('id, ticker, title, type')
    .eq('type', 'fda')
    .limit(1)
    .single()
  
  if (!referenceCatalyst) {
    console.log('No FDA catalyst found for testing')
    return
  }
  
  console.log('📌 Reference catalyst:')
  console.log(`- ${referenceCatalyst.ticker}: ${referenceCatalyst.title}`)
  console.log(`- Type: ${referenceCatalyst.type}`)
  console.log(`- ID: ${referenceCatalyst.id}`)
  
  // Find similar catalysts using the stored function
  const { data: similarCatalysts, error } = await supabase.rpc('find_similar_catalysts', {
    catalyst_id: referenceCatalyst.id,
    match_count: 5
  })
  
  if (error) {
    console.error('Error finding similar catalysts:', error)
    return
  }
  
  console.log('\n🎯 Similar catalysts:')
  similarCatalysts?.forEach((catalyst: any, i: number) => {
    console.log(`\n${i + 1}. ${catalyst.ticker}: ${catalyst.title}`)
    console.log(`   Similarity: ${(catalyst.similarity * 100).toFixed(1)}%`)
  })
  
  // Test cross-type similarity
  console.log('\n\n📊 Testing cross-type similarity...')
  
  const { data: allTypes } = await supabase
    .from('catalysts')
    .select('type, COUNT(*)')
    .neq('id', referenceCatalyst.id)
    .limit(10)
  
  const { data: crossTypeSimilar } = await supabase.rpc('find_similar_catalysts', {
    catalyst_id: referenceCatalyst.id,
    match_count: 10
  })
  
  // Get types for similar catalysts
  if (crossTypeSimilar && crossTypeSimilar.length > 0) {
    const typePromises = crossTypeSimilar.map(async (curr: any) => {
      const { data } = await supabase
        .from('catalysts')
        .select('type')
        .eq('id', curr.id)
        .single()
      return data?.type
    })
    
    const types = await Promise.all(typePromises)
    const typeDistribution = types.reduce((acc: any, type: string) => {
      if (type) {
        acc[type] = (acc[type] || 0) + 1
      }
      return acc
    }, {})
    
    console.log('Type distribution in similar results:', typeDistribution)
  }
}

testSimilaritySearch().catch(console.error)