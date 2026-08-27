"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { bulkApproveReviewsAction } from "./actions";

export function BulkApproveButton({ productId, rating }: { productId?: number; rating?: number }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function handleClick() {
    startTransition(async () => {
      const result = await bulkApproveReviewsAction({ productId, rating });
      setMessage(result.ok ? result.message : result.error);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Button type="button" variant="outline" size="sm" disabled={pending} onClick={handleClick}>
        Bulk approve pending (current filter)
      </Button>
      {message && <span role="status" className="text-sm text-ink-2">{message}</span>}
    </div>
  );
}
