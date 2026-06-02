'use client';

import { useState, type ReactNode } from 'react';

interface Column<T> {
  key: string;
  header: string;
  render: (item: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  emptyMessage = 'No data',
}: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-border-subtle bg-surface-raised p-12 text-center text-sm text-text-muted">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border-subtle">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border-subtle bg-surface-raised">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted ${col.className ?? ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border-subtle">
          {data.map((item) => (
            <tr
              key={keyExtractor(item)}
              onClick={() => onRowClick?.(item)}
              className={`bg-surface transition-colors hover:bg-surface-raised ${onRowClick ? 'cursor-pointer' : ''}`}
            >
              {columns.map((col) => (
                <td key={col.key} className={`px-4 py-3 ${col.className ?? ''}`}>
                  {col.render(item)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
