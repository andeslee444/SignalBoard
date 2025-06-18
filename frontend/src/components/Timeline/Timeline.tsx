'use client';

import { useRef, useState, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { motion, AnimatePresence } from 'framer-motion';
import { CatalystNode } from './CatalystNode';
import { CatalystNode as CatalystType } from '@/types/catalyst';

interface TimelineProps {
  catalysts: CatalystType[];
  onCatalystSelect?: (catalyst: CatalystType) => void;
  selectedCatalystId?: string;
}

export function Timeline({ catalysts, onCatalystSelect, selectedCatalystId }: TimelineProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Sort catalysts by date
  const sortedCatalysts = [...catalysts].sort(
    (a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
  );

  // Virtual list for performance
  const virtualizer = useVirtualizer({
    horizontal: !isMobile,
    count: sortedCatalysts.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => isMobile ? 120 : 250,
    gap: 16,
  });

  const items = virtualizer.getVirtualItems();

  return (
    <div className="timeline-container w-full h-full">
      {/* Timeline Header */}
      <div className="glass rounded-lg p-4 mb-4">
        <h2 className="text-xl font-semibold mb-2">Catalyst Timeline</h2>
        <p className="text-sm opacity-70">
          {catalysts.length} upcoming events • Scroll to explore
        </p>
      </div>

      {/* Desktop Timeline (Horizontal) */}
      {!isMobile ? (
        <TransformWrapper
          initialScale={1}
          minScale={0.5}
          maxScale={2}
          wheel={{ step: 0.1 }}
          panning={{ disabled: false }}
          doubleClick={{ disabled: true }}
        >
          <TransformComponent>
            <div 
              ref={scrollContainerRef}
              className="timeline-scroll-container overflow-x-auto overflow-y-hidden"
              style={{
                width: '100%',
                height: '300px',
              }}
            >
              <div
                style={{
                  width: `${virtualizer.getTotalSize()}px`,
                  height: '100%',
                  position: 'relative',
                }}
              >
                {/* Timeline Line */}
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/20 -translate-y-1/2" />
                
                {/* Catalyst Nodes */}
                <AnimatePresence mode="popLayout">
                  {items.map((virtualItem) => {
                    const catalyst = sortedCatalysts[virtualItem.index];
                    return (
                      <div
                        key={virtualItem.key}
                        style={{
                          position: 'absolute',
                          top: '50%',
                          left: 0,
                          width: `${virtualItem.size}px`,
                          transform: `translateX(${virtualItem.start}px) translateY(-50%)`,
                        }}
                      >
                        <CatalystNode
                          catalyst={catalyst}
                          isSelected={catalyst.id === selectedCatalystId}
                          onClick={onCatalystSelect}
                        />
                      </div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          </TransformComponent>
        </TransformWrapper>
      ) : (
        /* Mobile Timeline (Vertical) */
        <div 
          ref={scrollContainerRef}
          className="timeline-scroll-container-mobile overflow-y-auto"
          style={{
            height: 'calc(100vh - 200px)',
            width: '100%',
          }}
        >
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {/* Timeline Line (Vertical) */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-white/20" />
            
            {/* Catalyst Cards */}
            <AnimatePresence mode="popLayout">
              {items.map((virtualItem) => {
                const catalyst = sortedCatalysts[virtualItem.index];
                return (
                  <div
                    key={virtualItem.key}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: '32px',
                      right: '16px',
                      height: `${virtualItem.size}px`,
                      transform: `translateY(${virtualItem.start}px)`,
                    }}
                  >
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="h-full flex items-center"
                    >
                      <CatalystNode
                        catalyst={catalyst}
                        isSelected={catalyst.id === selectedCatalystId}
                        onClick={onCatalystSelect}
                      />
                    </motion.div>
                  </div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Keyboard Navigation Instructions */}
      <div className="mt-4 text-xs opacity-50 text-center">
        {!isMobile ? (
          <>Use scroll or drag to navigate • Ctrl+Scroll to zoom</>
        ) : (
          <>Swipe up/down to explore events</>
        )}
      </div>
    </div>
  );
}