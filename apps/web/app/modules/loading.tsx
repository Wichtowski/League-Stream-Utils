import { Skeleton } from "@lsu/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Skeleton height="2rem" width="10rem" rounded="md" />
        <Skeleton height="0.875rem" width="16rem" rounded="md" />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-white/10 p-5 space-y-2">
            <Skeleton height="0.875rem" width="40%" />
            <Skeleton height="0.75rem" width="70%" />
          </div>
        ))}
      </div>
    </div>
  );
}
