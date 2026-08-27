import { Skeleton } from "@/components/ui/Skeleton";

/** The real loading state DataTable's spec calls for (PROMPTS.md Phase 7 item 2) — Next.js
 * renders this automatically while app/admin/orders/page.tsx's async data fetch is in flight
 * (initial load or a full navigation), via the framework's own Suspense boundary per route
 * segment. */
export default function AdminOrdersLoading() {
  return (
    <div>
      <Skeleton className="h-8 w-32" />
      <div className="mt-5 flex flex-wrap gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-40" />
        ))}
      </div>
      <div className="mt-5 rounded-lg border border-line bg-surface">
        <div className="border-b border-line px-4 py-3">
          <Skeleton className="h-4 w-24" />
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b border-line px-4 py-3 last:border-b-0">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}
