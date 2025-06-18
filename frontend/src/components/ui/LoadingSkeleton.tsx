'use client';

import { motion } from 'framer-motion';

export function LoadingSkeleton() {
  return (
    <div className="glass rounded-lg p-8">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-white/20 rounded w-3/4"></div>
          <div className="h-4 bg-white/20 rounded w-1/2"></div>
          <div className="h-4 bg-white/20 rounded w-2/3"></div>
        </div>
      </motion.div>
      <p className="mt-6 text-sm opacity-70 text-center">Loading catalysts...</p>
    </div>
  );
}