import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // Create a supabase client on the browser with project's credentials
  // Use default values for demo if env vars not set
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yjaxznsrysvazxqtvcvm.supabase.co';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqYXh6bnNyeXN2YXp4cXR2Y3ZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzcxNzM0NjcsImV4cCI6MjA1Mjc0OTQ2N30.pBn2Pq06z0xJnrRYAqRhHDvD8mzRD_tVX1YKB4Y5sG0';
  
  return createBrowserClient(supabaseUrl, supabaseKey);
}