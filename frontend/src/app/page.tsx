'use client';

import { useState, useMemo } from 'react';
import { Timeline } from '@/components/Timeline/Timeline';
import { CatalystDetailPanel } from '@/components/Timeline/CatalystDetailPanel';
import { TimelineFilters, FilterState } from '@/components/Timeline/TimelineFilters';
import { AuthButton } from '@/components/auth/AuthButton';
import { useCatalysts } from '@/hooks/useCatalysts';
import { Catalyst } from '@/types/catalyst';

export default function HomePage() {
  const { catalysts, loading, error } = useCatalysts();
  const [selectedCatalyst, setSelectedCatalyst] = useState<Catalyst | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterState>({
    types: [],
    tickers: [],
    impactRange: [0, 100],
  });
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({
    start: null,
    end: null,
  });

  // Filter catalysts based on search, filters, and date range
  const filteredCatalysts = useMemo(() => {
    if (!catalysts) return [];

    return catalysts.filter(catalyst => {
      // Search filter (fuzzy search on title, ticker, description)
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          catalyst.title?.toLowerCase().includes(query) ||
          catalyst.ticker?.toLowerCase().includes(query) ||
          catalyst.description?.toLowerCase().includes(query);
        
        if (!matchesSearch) return false;
      }

      // Type filter
      if (filters.types.length > 0 && !filters.types.includes(catalyst.type)) {
        return false;
      }

      // Ticker filter
      if (filters.tickers.length > 0 && !filters.tickers.includes(catalyst.ticker)) {
        return false;
      }

      // Impact score filter
      const impactScore = (catalyst.impact_score ?? 0) * 100;
      if (impactScore < filters.impactRange[0] || impactScore > filters.impactRange[1]) {
        return false;
      }

      // Date range filter
      const eventDate = new Date(catalyst.event_date);
      if (dateRange.start && eventDate < dateRange.start) return false;
      if (dateRange.end && eventDate > dateRange.end) return false;

      return true;
    });
  }, [catalysts, searchQuery, filters, dateRange]);

  // Get unique catalyst types and tickers for filter options
  const uniqueTypes = useMemo(() => {
    const types = new Set(catalysts?.map(c => c.type) || []);
    return Array.from(types).sort();
  }, [catalysts]);

  const uniqueTickers = useMemo(() => {
    const tickers = new Set(catalysts?.map(c => c.ticker) || []);
    return Array.from(tickers).sort();
  }, [catalysts]);

  const handleCatalystSelect = (catalyst: Catalyst) => {
    setSelectedCatalyst(catalyst);
  };

  const handleCloseDetail = () => {
    setSelectedCatalyst(null);
  };

  const handleExport = () => {
    // Export filtered catalysts as JSON
    const dataStr = JSON.stringify(filteredCatalysts, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `signalboard-catalysts-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <main className="min-h-screen p-4 md:p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            SignalBoard
          </h1>
          <p className="text-lg opacity-70">
            Event-driven trading intelligence • Predict market catalysts
          </p>
        </div>
        <div className="mt-2">
          <AuthButton />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="glass rounded-lg p-8">
              <div className="animate-pulse">
                <div className="h-4 bg-white/20 rounded w-48 mb-4"></div>
                <div className="h-4 bg-white/20 rounded w-32"></div>
              </div>
              <p className="mt-4 text-sm opacity-70">Loading catalysts...</p>
            </div>
          </div>
        ) : error ? (
          <div className="glass rounded-lg p-8 text-center">
            <p className="text-red-400 mb-2">Error loading catalysts</p>
            <p className="text-sm opacity-70">{error}</p>
          </div>
        ) : catalysts.length === 0 ? (
          <div className="glass rounded-lg p-8 text-center">
            <p className="text-lg mb-2">No upcoming catalysts</p>
            <p className="text-sm opacity-70">
              Catalysts will appear here as they are discovered
            </p>
          </div>
        ) : (
          <>
            {/* Filters */}
            <TimelineFilters
              onFilterChange={setFilters}
              onSearch={setSearchQuery}
              onDateRangeChange={setDateRange}
              onExport={handleExport}
              catalystTypes={uniqueTypes}
              tickers={uniqueTickers}
              dateRange={dateRange}
            />
            
            {/* Timeline */}
            {filteredCatalysts.length === 0 ? (
              <div className="glass rounded-lg p-8 text-center">
                <p className="text-lg mb-2">No catalysts match your filters</p>
                <p className="text-sm opacity-70">
                  Try adjusting your search criteria or clearing filters
                </p>
              </div>
            ) : (
              <Timeline
                catalysts={filteredCatalysts}
                onCatalystSelect={handleCatalystSelect}
                selectedCatalystId={selectedCatalyst?.id}
              />
            )}
          </>
        )}
      </div>

      {/* Detail Panel */}
      <CatalystDetailPanel
        catalyst={selectedCatalyst}
        onClose={handleCloseDetail}
      />

      {/* Footer */}
      <footer className="max-w-7xl mx-auto mt-16 pt-8 border-t border-white/10">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs opacity-50">
          <p>© 2025 SignalBoard • For educational purposes only</p>
          <p>SEC data sourced from EDGAR • Not investment advice</p>
        </div>
      </footer>
    </main>
  );
}