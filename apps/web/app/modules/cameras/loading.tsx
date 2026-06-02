import { Skeleton } from '@lsu/ui/skeleton';

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Skeleton height="2rem" width="8rem" rounded="md" />
        <Skeleton height="0.875rem" width="16rem" rounded="md" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-white/10 p-4 space-y-3">
            <Skeleton height="1.25rem" width="30%" />
            <div className="grid grid-cols-5 gap-3">
              {Array.from({ length: 5 }).map((_, j) => (
                <Skeleton key={j} height="2.5rem" rounded="md" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
