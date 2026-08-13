import React from 'react';
import { clsx } from 'clsx';

export interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
}

export const Skeleton: React.FC<SkeletonProps> = ({ className, variant = 'rectangular' }) => {
  return (
    <div
      className={clsx(
        'animate-pulse bg-slate-200/80',
        variant === 'circular' && 'rounded-full',
        variant === 'text' && 'h-4 rounded-xs w-3/4',
        variant === 'rectangular' && 'rounded-lg',
        className
      )}
    />
  );
};
