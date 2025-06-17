'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Catalyst {
  id: string
  type: string
  ticker: string
  title: string
  description: string | null
  event_date: string
  impact_score: number | null
  confidence_score: number | null
  created_at: string
}

export default function Home() {
  const [catalysts, setCatalysts] = useState<Catalyst[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchCatalysts()
    
    // Set up real-time subscription
    const channel = supabase
      .channel('catalyst-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'catalysts' },
        (payload) => {
          console.log('Real-time update:', payload)
          if (payload.eventType === 'INSERT') {
            setCatalysts(prev => [payload.new as Catalyst, ...prev])
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchCatalysts = async () => {
    try {
      const { data, error } = await supabase
        .from('catalysts')
        .select('*')
        .order('event_date', { ascending: true })
        .limit(20)

      if (error) throw error

      setCatalysts(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch catalysts')
    } finally {
      setLoading(false)
    }
  }

  const triggerScraper = async (type: 'fda' | 'earnings' | 'polygon-earnings' | 'sec') => {
    try {
      const functionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/scrape-${type}`
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        },
      })

      const result = await response.json()
      console.log(`${type} scraper result:`, result)
      
      if (result.success) {
        alert(`${type.toUpperCase()} scraper completed! Processed ${result.catalysts} catalysts.`)
      } else {
        alert(`Error: ${result.error}`)
      }
    } catch (err) {
      console.error('Scraper error:', err)
      alert('Failed to trigger scraper')
    }
  }

  return (
    <main className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-cyan-400">SignalBoard - Catalyst Pipeline Test</h1>
        
        {/* Scraper Controls */}
        <div className="mb-8 p-6 bg-gray-800 rounded-lg">
          <h2 className="text-2xl font-semibold mb-4">Data Pipeline Controls</h2>
          <div className="flex gap-4">
            <button
              onClick={() => triggerScraper('fda')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
            >
              Run FDA Scraper
            </button>
            <button
              onClick={() => triggerScraper('earnings')}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded transition-colors"
            >
              Run Earnings Scraper
            </button>
            <button
              onClick={() => triggerScraper('polygon-earnings')}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded transition-colors"
            >
              Run Polygon Scraper
            </button>
            <button
              onClick={() => triggerScraper('sec')}
              className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded transition-colors"
            >
              Run SEC Scraper
            </button>
          </div>
        </div>

        {/* Portfolio Integration */}
        <div className="mb-8 p-6 bg-gray-800 rounded-lg">
          <h2 className="text-2xl font-semibold mb-4">Portfolio Integration</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-700 rounded-lg border border-gray-600">
              <h3 className="font-semibold mb-2">CSV Upload</h3>
              <p className="text-sm text-gray-400 mb-3">Import your portfolio holdings</p>
              <button className="w-full px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded transition-colors text-sm">
                Upload CSV
              </button>
            </div>
            
            <div className="p-4 bg-gray-700 rounded-lg border border-gray-600 opacity-75">
              <h3 className="font-semibold mb-2">Interactive Brokers</h3>
              <p className="text-sm text-gray-400 mb-3">Full API access to portfolios</p>
              <button className="w-full px-4 py-2 bg-gray-600 rounded text-sm cursor-not-allowed">
                Coming Soon
              </button>
              <p className="text-xs text-cyan-400 mt-2">Join waitlist →</p>
            </div>
            
            <div className="p-4 bg-gray-700 rounded-lg border border-gray-600 opacity-75">
              <h3 className="font-semibold mb-2">Alpaca</h3>
              <p className="text-sm text-gray-400 mb-3">Commission-free trading API</p>
              <button className="w-full px-4 py-2 bg-gray-600 rounded text-sm cursor-not-allowed">
                Coming Soon
              </button>
            </div>
          </div>
        </div>

        {/* Catalysts Display */}
        <div className="p-6 bg-gray-800 rounded-lg">
          <h2 className="text-2xl font-semibold mb-4">Recent Catalysts</h2>
          
          {loading && <p className="text-gray-400">Loading catalysts...</p>}
          {error && <p className="text-red-400">Error: {error}</p>}
          
          {!loading && !error && (
            <div className="space-y-4">
              {catalysts.length === 0 ? (
                <p className="text-gray-400">No catalysts found. Run a scraper to populate data.</p>
              ) : (
                catalysts.map((catalyst) => (
                  <div key={catalyst.id} className="p-4 bg-gray-700 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="inline-block px-2 py-1 bg-cyan-600 text-xs rounded mr-2">
                          {catalyst.type.toUpperCase()}
                        </span>
                        <span className="text-lg font-semibold">{catalyst.ticker}</span>
                      </div>
                      <span className="text-sm text-gray-400">
                        {new Date(catalyst.event_date).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="font-medium mb-1">{catalyst.title}</h3>
                    {catalyst.description && (
                      <p className="text-sm text-gray-300">{catalyst.description}</p>
                    )}
                    <div className="flex gap-4 mt-2 text-sm">
                      {catalyst.impact_score && (
                        <span className="text-yellow-400">
                          Impact: {(catalyst.impact_score * 100).toFixed(0)}%
                        </span>
                      )}
                      {catalyst.confidence_score && (
                        <span className="text-green-400">
                          Confidence: {(catalyst.confidence_score * 100).toFixed(0)}%
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
