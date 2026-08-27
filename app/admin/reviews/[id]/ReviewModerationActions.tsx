"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { approveReviewAction, rejectReviewAction } from "../actions";

/**
 * Approve or reject only — deliberately no text field that edits the review's own title/body
 * (PROMPTS.md Phase 8: "Staff may never author or edit the text of a customer review"). The reject
 * reason below is an internal note for the audit log, not a change to the review itself.
 */
export function ReviewModerationActions({ reviewId }: { reviewId: number }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [showReject, setShowReject] = useState(false);

  function handleApprove() {
    setError(null);
    startTransition(async () => {
      const result = await approveReviewAction({ id: reviewId });
      if (!result.ok) setError(result.error);
      else router.refresh();
    });
  }

  function handleReject() {
    setError(null);
    startTransition(async () => {
      const result = await rejectReviewAction({ id: reviewId, reason });
      if (!result.ok) setError(result.error);
      else router.refresh();
    });
  }

  return (
    <div className="rounded-lg border border-line bg-surface p-5">
      {error && <p role="alert" className="mb-3 text-sm text-crit">{error}</p>}
      <div className="flex gap-3">
        <Button type="button" variant="gradient" disabled={pending} onClick={handleApprove}>Approve</Button>
        <Button type="button" variant="outline" disabled={pending} onClick={() => setShowReject((s) => !s)}>Reject</Button>
      </div>
      {showReject && (
        <div className="mt-4">
          <label htmlFor="reason" className="mb-1 block text-sm font-medium text-ink">Reason (internal — recorded in the audit log, not shown to the reviewer)</label>
          <Textarea id="reason" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
          <Button type="button" variant="solid-ink" size="sm" className="mt-2" disabled={pending || reason.trim().length < 3} onClick={handleReject}>
            Confirm reject
          </Button>
        </div>
      )}
    </div>
  );
}
