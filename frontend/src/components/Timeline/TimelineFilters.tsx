'use client';

import { useState } from 'react';
import { Search, Filter, Calendar, Download } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { motion, AnimatePresence } from 'framer-motion';

interface TimelineFiltersProps {
  onFilterChange: (filters: FilterState) => void;
  onSearch: (query: string) => void;
  onDateRangeChange: (range: { start: Date | null; end: Date | null }) => void;
  onExport?: () => void;
  catalystTypes: string[];
  tickers: string[];
  dateRange?: { start: Date | null; end: Date | null };
}

export interface FilterState {
  types: string[];
  tickers: string[];
  impactRange: [number, number];
}

export function TimelineFilters({
  onFilterChange,
  onSearch,
  onDateRangeChange,
  onExport,
  catalystTypes,
  tickers,
  dateRange = { start: null, end: null },
}: TimelineFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterState>({
    types: [],
    tickers: [],
    impactRange: [0, 100],
  });

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    onSearch(value);
  };

  const handleTypeToggle = (type: string) => {
    const newTypes = filters.types.includes(type)
      ? filters.types.filter(t => t !== type)
      : [...filters.types, type];
    
    const newFilters = { ...filters, types: newTypes };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleTickerToggle = (ticker: string) => {
    const newTickers = filters.tickers.includes(ticker)
      ? filters.tickers.filter(t => t !== ticker)
      : [...filters.tickers, ticker];
    
    const newFilters = { ...filters, tickers: newTickers };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearAllFilters = () => {
    const newFilters = {
      types: [],
      tickers: [],
      impactRange: [0, 100] as [number, number],
    };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleImpactChange = (threshold: number) => {
    let newRange: [number, number] = [0, 100];
    
    if (threshold === 70) {
      newRange = [70, 100]; // High impact only
    } else if (threshold === 40) {
      newRange = [40, 100]; // Medium and high
    }
    
    const newFilters = { ...filters, impactRange: newRange };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <GlassCard className="mb-4">
      <div className="flex flex-col gap-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
          <input
            type="text"
            placeholder="Search catalysts..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg 
                     focus:outline-none focus:border-white/30 transition-colors"
          />
        </div>

        {/* Quick Filters */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="glass glass-hover rounded-lg px-3 py-1.5 text-sm flex items-center gap-2"
          >
            <Filter size={14} />
            Filters {filters.types.length > 0 || filters.tickers.length > 0 || filters.impactRange[0] > 0 ? `(${filters.types.length + filters.tickers.length + (filters.impactRange[0] > 0 ? 1 : 0)})` : ''}
          </button>

          {/* Clear Filters Button */}
          {(filters.types.length > 0 || filters.tickers.length > 0 || filters.impactRange[0] > 0) && (
            <button
              onClick={clearAllFilters}
              className="glass glass-hover rounded-lg px-3 py-1.5 text-sm text-red-400"
            >
              Clear All
            </button>
          )}

          {/* Impact Quick Filters */}
          <button
            onClick={() => handleImpactChange(70)}
            className={`rounded-lg px-3 py-1.5 text-sm transition-all ${
              filters.impactRange[0] === 70 
                ? 'bg-red-500/20 border border-red-500/50' 
                : 'glass glass-hover'
            }`}
          >
            High Impact (≥70%)
          </button>
          
          <button
            onClick={() => handleImpactChange(40)}
            className={`rounded-lg px-3 py-1.5 text-sm transition-all ${
              filters.impactRange[0] === 40 
                ? 'bg-orange-500/20 border border-orange-500/50' 
                : 'glass glass-hover'
            }`}
          >
            Medium+ (≥40%)
          </button>

          {/* Export Button */}
          {onExport && (
            <button
              onClick={onExport}
              className="glass glass-hover rounded-lg px-3 py-1.5 text-sm flex items-center gap-2 ml-auto"
            >
              <Download size={14} />
              Export
            </button>
          )}
        </div>

        {/* Expanded Filters */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="pt-4 border-t border-white/10 space-y-4">
                {/* Type Filters */}
                <div>
                  <p className="text-sm opacity-70 mb-2">Catalyst Types</p>
                  <div className="flex flex-wrap gap-2">
                    {catalystTypes.map(type => (
                      <button
                        key={type}
                        onClick={() => handleTypeToggle(type)}
                        className={`rounded-lg px-3 py-1 text-sm transition-all ${
                          filters.types.includes(type)
                            ? 'bg-white/20 border border-white/30'
                            : 'glass glass-hover'
                        }`}
                      >
                        {type.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Ticker Filters */}
                <div>
                  <p className="text-sm opacity-70 mb-2">Tickers</p>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                    {tickers.map(ticker => (
                      <button
                        key={ticker}
                        onClick={() => handleTickerToggle(ticker)}
                        className={`rounded-lg px-3 py-1 text-sm transition-all ${
                          filters.tickers.includes(ticker)
                            ? 'bg-purple-500/20 border border-purple-500/50'
                            : 'glass glass-hover'
                        }`}
                      >
                        {ticker}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date Range */}
                <div>
                  <p className="text-sm opacity-70 mb-2">Date Range</p>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      onChange={(e) => {
                        const newStart = e.target.value ? new Date(e.target.value) : null;
                        onDateRangeChange({ 
                          start: newStart,
                          end: dateRange.end 
                        });
                      }}
                      className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg 
                               focus:outline-none focus:border-white/30 text-sm"
                    />
                    <span className="self-center opacity-50">to</span>
                    <input
                      type="date"
                      onChange={(e) => {
                        const newEnd = e.target.value ? new Date(e.target.value) : null;
                        onDateRangeChange({ 
                          start: dateRange.start,
                          end: newEnd 
                        });
                      }}
                      className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg 
                               focus:outline-none focus:border-white/30 text-sm"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </GlassCard>
  );
}