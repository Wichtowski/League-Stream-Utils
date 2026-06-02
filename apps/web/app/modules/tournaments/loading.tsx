import { Skeleton } from '@lsu/ui/skeleton';

export default function Loading() {
  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton height="2rem" width="10rem" rounded="md" />
          <Skeleton height="0.875rem" width="16rem" rounded="md" />
        </div>
        <Skeleton height="2.25rem" width="10rem" rounded="md" />
      </header>
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} height="3rem" rounded="lg" />
        ))}
      </div>
    </div>
  );
}
