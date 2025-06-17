import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Simple text embedding using TF-IDF approach (for MVP)
// In production, use OpenAI embeddings or similar
function generateEmbedding(text: string): number[] {
  // Normalize text
  const normalized = text.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 2)
  
  // Create a simple 384-dimensional embedding
  const embedding = new Array(384).fill(0)
  
  // Use word hashing to distribute features
  for (const word of normalized) {
    let hash = 0
    for (let i = 0; i < word.length; i++) {
      hash = ((hash << 5) - hash) + word.charCodeAt(i)
      hash = hash & hash // Convert to 32-bit integer
    }
    
    // Map to multiple dimensions for better representation
    for (let i = 0; i < 3; i++) {
      const index = Math.abs((hash + i * 1000) % 384)
      embedding[index] += 1
    }
  }
  
  // Normalize the embedding
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0))
  if (magnitude > 0) {
    for (let i = 0; i < embedding.length; i++) {
      embedding[i] = embedding[i] / magnitude
    }
  }
  
  return embedding
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

    // Check for OpenAI API key
    const { data: apiKeyData } = await supabase
      .from('api_keys')
      .select('api_key')
      .eq('service_name', 'openai')
      .single()
    
    const useOpenAI = !!apiKeyData?.api_key
    const openAIKey = apiKeyData?.api_key || ''

    // Get catalysts without embeddings
    const { data: catalysts, error: fetchError } = await supabase
      .from('catalysts')
      .select('id, type, ticker, title, description')
      .is('embedding', null)
      .limit(useOpenAI ? 50 : 100) // Smaller batch for OpenAI due to rate limits

    if (fetchError) {
      throw fetchError
    }

    console.log(`Found ${catalysts?.length || 0} catalysts without embeddings`)

    let processedCount = 0

    for (const catalyst of catalysts || []) {
      // Create text representation for embedding
      const textParts = [
        catalyst.type,
        catalyst.ticker,
        catalyst.title,
        catalyst.description || ''
      ]
      
      const processedText = textParts.join(' ')
      
      let embedding: number[]
      
      if (useOpenAI) {
        try {
          embedding = await generateOpenAIEmbedding(processedText, openAIKey)
          console.log(`Generated OpenAI embedding for catalyst ${catalyst.id}`)
        } catch (err) {
          console.error(`OpenAI error, falling back to basic embedding:`, err)
          embedding = generateEmbedding(processedText)
        }
      } else {
        embedding = generateEmbedding(processedText)
      }
      
      // Update catalyst with embedding
      const { error: updateError } = await supabase
        .from('catalysts')
        .update({
          embedding: `[${embedding.join(',')}]`,
          processed_text: processedText
        })
        .eq('id', catalyst.id)

      if (updateError) {
        console.error(`Error updating catalyst ${catalyst.id}:`, updateError)
      } else {
        processedCount++
      }
    }

    console.log(`Generated embeddings for ${processedCount} catalysts`)

    return new Response(
      JSON.stringify({
        success: true,
        processed: processedCount,
        message: 'Embeddings generated successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Embedding generation error:', error)
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

// For production: OpenAI embeddings implementation
export async function generateOpenAIEmbedding(text: string, apiKey: string): Promise<number[]> {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input: text,
      model: 'text-embedding-3-small', // Updated model with better performance
      dimensions: 384 // Match our vector size
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`OpenAI API error: ${response.status} - ${error}`)
  }

  const data = await response.json()
  return data.data[0].embedding
}