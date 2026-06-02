'use client';

import Link from 'next/link';
import { createContext, useContext, type ReactNode } from 'react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

const BreadcrumbContext = createContext<{
  items: BreadcrumbItem[];
  set: (items: BreadcrumbItem[]) => void;
}>({ items: [], set: () => {} });

export function useBreadcrumbs() {
  return useContext(BreadcrumbContext);
}

export { BreadcrumbContext };

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  if (items.length === 0) return null;

  return (
    <nav className="mb-4 flex items-center gap-1.5 text-sm text-text-muted">
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" className="opacity-40">
                <path d="M4 2l4 4-4 4" />
              </svg>
            )}
            {isLast || !item.href ? (
              <span className={isLast ? 'text-gray-200 font-medium' : ''}>{item.label}</span>
            ) : (
              <Link
                href={item.href}
                className="transition-colors hover:text-gray-200"
              >
                {item.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
