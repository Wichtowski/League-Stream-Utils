import type { ReactNode } from 'react';
import { LinkButton } from './button';

interface EmptyStateProps {
  message: string;
  icon?: ReactNode;
  actionLabel?: string;
  actionHref?: string;
}

export function EmptyState({ message, icon, actionLabel, actionHref }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-border-subtle bg-surface-raised px-6 py-16 text-center">
      {icon && <div className="mb-3 text-text-muted">{icon}</div>}
      <p className="text-sm text-text-muted">{message}</p>
      {actionLabel && actionHref && (
        <LinkButton href={actionHref} size="sm" className="mt-4">
          {actionLabel}
        </LinkButton>
      )}
    </div>
  );
}
