import { Skeleton } from "@/components/ui/Skeleton";

export default function AdminOrderDetailLoading() {
  return (
    <div className="max-w-4xl space-y-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
