'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  glow?: 'primary' | 'secondary' | 'danger' | 'warning' | 'none';
  hoverable?: boolean;
  onClick?: () => void;
}

export function GlassCard({
  children,
  className = '',
  glow = 'none',
  hoverable = true,
  onClick,
}: GlassCardProps) {
  const glowClass = glow !== 'none' ? `glow-${glow}` : '';
  const hoverClass = hoverable ? 'glass-hover' : '';

  return (
    <motion.div
      className={`glass rounded-lg p-4 ${glowClass} ${hoverClass} ${className}`}
      onClick={onClick}
      whileHover={hoverable ? { scale: 1.02 } : undefined}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 20,
      }}
    >
      {children}
    </motion.div>
  );
}