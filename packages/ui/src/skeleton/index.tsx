'use client';

import type { CSSProperties, HTMLAttributes } from 'react';

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  height?: string | number;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
}

const roundedMap = {
  none: '0',
  sm: '0.25rem',
  md: '0.5rem',
  lg: '1rem',
  full: '9999px',
} as const;

export function Skeleton({
  width,
  height = '1rem',
  rounded = 'md',
  className = '',
  style,
  ...rest
}: SkeletonProps) {
  const base: CSSProperties = {
    width: width ?? '100%',
    height,
    borderRadius: roundedMap[rounded],
    ...style,
  };

  return <div className={`animate-pulse bg-white/5 ${className}`} style={base} {...rest} />;
}

interface TableSkeletonProps {
  rows?: number;
  cols?: number;
  className?: string;
}

export function TableSkeleton({ rows = 5, cols = 4, className = '' }: TableSkeletonProps) {
  return (
    <div className={`w-full space-y-2 ${className}`}>
      <div className="flex gap-4">
        {Array.from({ length: cols }).map((_, c) => (
          <Skeleton key={c} height="2rem" rounded="sm" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} height="2.5rem" rounded="sm" />
          ))}
        </div>
      ))}
    </div>
  );
}

interface CardSkeletonProps {
  className?: string;
}

export function CardSkeleton({ className = '' }: CardSkeletonProps) {
  return (
    <div className={`rounded-lg border border-white/10 p-4 space-y-3 ${className}`}>
      <Skeleton height="1.25rem" width="60%" />
      <Skeleton height="0.875rem" width="80%" />
      <Skeleton height="0.875rem" width="40%" />
    </div>
  );
}

interface FormSkeletonProps {
  fields?: number;
  className?: string;
}

export function FormSkeleton({ fields = 4, className = '' }: FormSkeletonProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-1">
          <Skeleton height="0.875rem" width="30%" />
          <Skeleton height="2.5rem" />
        </div>
      ))}
      <Skeleton height="2.5rem" width="8rem" rounded="md" />
    </div>
  );
}

interface PageSkeletonProps {
  className?: string;
}

export function PageSkeleton({ className = '' }: PageSkeletonProps) {
  return (
    <div className={`space-y-6 ${className}`}>
      <div className="space-y-2">
        <Skeleton height="2rem" width="40%" />
        <Skeleton height="1rem" width="60%" />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  );
}

interface ListSkeletonProps {
  items?: number;
  className?: string;
}

export function ListSkeleton({ items = 5, className = '' }: ListSkeletonProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton width="2.5rem" height="2.5rem" rounded="full" />
          <div className="flex-1 space-y-1">
            <Skeleton height="1rem" width="50%" />
            <Skeleton height="0.75rem" width="30%" />
          </div>
        </div>
      ))}
    </div>
  );
}

const avatarSizes = { sm: '2rem', md: '2.5rem', lg: '3.5rem' } as const;

interface AvatarSkeletonProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function AvatarSkeleton({ size = 'md', className = '' }: AvatarSkeletonProps) {
  const s = avatarSizes[size];
  return <Skeleton width={s} height={s} rounded="full" className={className} />;
}

interface TextSkeletonProps {
  lines?: number;
  className?: string;
}

export function TextSkeleton({ lines = 3, className = '' }: TextSkeletonProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} height="0.875rem" width={i === lines - 1 ? '60%' : '100%'} />
      ))}
    </div>
  );
}

interface BadgeSkeletonProps {
  className?: string;
}

export function BadgeSkeleton({ className = '' }: BadgeSkeletonProps) {
  return <Skeleton width="3.5rem" height="1.25rem" rounded="full" className={className} />;
}
