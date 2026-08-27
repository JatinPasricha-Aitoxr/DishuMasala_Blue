"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { useToast } from "@/components/ui/Toast";
import { formatINR } from "@/lib/money";
import type { Paise } from "@/lib/money";
import type { OrderStatus } from "@/types/order";
import {
  transitionOrderStatusAction,
  dispatchOrderAction,
  retryShiprocketPushAction,
  resendConfirmationEmailAction,
  recordRefundAction,
  cancelOrderAction,
  addStaffNoteAction,
  type AdminActionResult,
} from "../actions";

interface OrderActionsProps {
  orderId: number;
  orderNumber: string;
  currentStatus: OrderStatus;
  nextStatuses: readonly OrderStatus[];
  hasShiprocketOrderId: boolean;
  totalPaise: Paise;
  alreadyRefundedPaise: Paise | null;
}

/**
 * Every order action (PROMPTS.md Phase 7 item 4/5) as real buttons wired to the server actions in
 * ../actions.ts. The UI only ever *offers* legal next statuses (`nextStatuses`, computed
 * server-side by the same state machine the action re-checks) — it is not itself the enforcement;
 * tests/unit/admin-order-status.test.ts proves the server rejects an illegal jump independently of
 * what this component renders.
 */
export function OrderActions({
  orderId,
  orderNumber,
  currentStatus,
  nextStatuses,
  hasShiprocketOrderId,
  totalPaise,
  alreadyRefundedPaise,
}: OrderActionsProps) {
  const router = useRouter();
  const { show } = useToast();
  const [pending, startTransition] = useTransition();
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  function run(label: string, action: () => Promise<AdminActionResult>) {
    setPendingAction(label);
    startTransition(async () => {
      const result = await action();
      setPendingAction(null);
      show({ title: result.ok ? "Done" : "Failed", description: result.ok ? result.message : result.error, tone: result.ok ? "ok" : "crit" });
      if (result.ok) router.refresh();
    });
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      {nextStatuses
        .filter((s) => s !== "cancelled" && s !== "refunded")
        .map((next) => (
          <Button
            key={next}
            size="sm"
            variant="solid-ink"
            loading={pending && pendingAction === `status-${next}`}
            onClick={() => run(`status-${next}`, () => transitionOrderStatusAction({ orderId, to: next }))}
          >
            Mark {next}
          </Button>
        ))}

      {(currentStatus === "confirmed" || currentStatus === "packed") &&
        (hasShiprocketOrderId ? (
          <Button size="sm" variant="outline" loading={pending && pendingAction === "retry"} onClick={() => run("retry", () => retryShiprocketPushAction({ orderId }))}>
            Retry Shiprocket push
          </Button>
        ) : (
          <Button size="sm" variant="outline" loading={pending && pendingAction === "dispatch"} onClick={() => run("dispatch", () => dispatchOrderAction({ orderId }))}>
            Dispatch to Shiprocket
          </Button>
        ))}

      <Button size="sm" variant="outline" loading={pending && pendingAction === "resend"} onClick={() => run("resend", () => resendConfirmationEmailAction({ orderId }))}>
        Resend confirmation email
      </Button>

      <RefundDialog orderId={orderId} totalPaise={totalPaise} alreadyRefundedPaise={alreadyRefundedPaise} onDone={() => router.refresh()} />

      <StaffNoteDialog orderId={orderId} onDone={() => router.refresh()} />

      {nextStatuses.includes("cancelled") && <CancelDialog orderId={orderId} orderNumber={orderNumber} onDone={() => router.refresh()} />}
    </div>
  );
}

function RefundDialog({ orderId, totalPaise, alreadyRefundedPaise, onDone }: { orderId: number; totalPaise: Paise; alreadyRefundedPaise: Paise | null; onDone: () => void }) {
  const { show } = useToast();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState((totalPaise / 100).toFixed(2));
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();

  function submit() {
    startTransition(async () => {
      const result = await recordRefundAction({ orderId, amountRupees: Number(amount), note });
      show({ title: result.ok ? "Refund recorded" : "Refund failed", description: result.ok ? result.message : result.error, tone: result.ok ? "ok" : "crit" });
      if (result.ok) {
        setOpen(false);
        onDone();
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        Record refund
      </Button>
      <DialogContent>
        <DialogTitle>Record a refund</DialogTitle>
        <DialogDescription>Order total {formatINR(totalPaise)}.{alreadyRefundedPaise != null ? ` Already refunded ${formatINR(alreadyRefundedPaise)}.` : ""}</DialogDescription>
        <div className="mt-4 space-y-3">
          <div>
            <label htmlFor="refund-amount" className="mb-1 block text-sm font-medium text-ink">
              Amount (₹)
            </label>
            <Input id="refund-amount" type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div>
            <label htmlFor="refund-note" className="mb-1 block text-sm font-medium text-ink">
              Note
            </label>
            <Textarea id="refund-note" value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Reason for the refund" />
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <DialogClose asChild>
            <Button variant="ghost" size="sm">
              Cancel
            </Button>
          </DialogClose>
          <Button size="sm" loading={pending} disabled={note.trim().length < 3} onClick={submit}>
            Record refund
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function StaffNoteDialog({ orderId, onDone }: { orderId: number; onDone: () => void }) {
  const { show } = useToast();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();

  function submit() {
    startTransition(async () => {
      const result = await addStaffNoteAction({ orderId, note });
      show({ title: result.ok ? "Note added" : "Failed", description: result.ok ? result.message : result.error, tone: result.ok ? "ok" : "crit" });
      if (result.ok) {
        setNote("");
        setOpen(false);
        onDone();
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button size="sm" variant="ghost" onClick={() => setOpen(true)}>
        Add note
      </Button>
      <DialogContent>
        <DialogTitle>Add a staff note</DialogTitle>
        <DialogDescription>Visible only to staff, appended to this order&apos;s note history.</DialogDescription>
        <Textarea className="mt-4" value={note} onChange={(e) => setNote(e.target.value)} rows={4} autoFocus />
        <div className="mt-5 flex justify-end gap-2">
          <DialogClose asChild>
            <Button variant="ghost" size="sm">
              Cancel
            </Button>
          </DialogClose>
          <Button size="sm" loading={pending} disabled={note.trim().length === 0} onClick={submit}>
            Add note
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CancelDialog({ orderId, orderNumber, onDone }: { orderId: number; orderNumber: string; onDone: () => void }) {
  const { show } = useToast();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [pending, startTransition] = useTransition();

  const canSubmit = reason.trim().length >= 3 && confirmText === orderNumber;

  function submit() {
    startTransition(async () => {
      const result = await cancelOrderAction({ orderId, reason, confirmOrderNumber: confirmText });
      show({ title: result.ok ? "Order cancelled" : "Cancel failed", description: result.ok ? result.message : result.error, tone: result.ok ? "ok" : "crit" });
      if (result.ok) {
        setOpen(false);
        onDone();
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button size="sm" variant="outline" className="border-crit text-crit hover:bg-crit/10" onClick={() => setOpen(true)}>
        Cancel order
      </Button>
      <DialogContent>
        <DialogTitle>Cancel {orderNumber}?</DialogTitle>
        <DialogDescription>This restores stock for every line item. This cannot be undone from here.</DialogDescription>
        <div className="mt-4 space-y-3">
          <div>
            <label htmlFor="cancel-reason" className="mb-1 block text-sm font-medium text-ink">
              Reason
            </label>
            <Textarea id="cancel-reason" value={reason} onChange={(e) => setReason(e.target.value)} rows={3} />
          </div>
          <div>
            <label htmlFor="cancel-confirm" className="mb-1 block text-sm font-medium text-ink">
              Type <span className="font-semibold">{orderNumber}</span> to confirm
            </label>
            <Input id="cancel-confirm" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} />
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <DialogClose asChild>
            <Button variant="ghost" size="sm">
              Never mind
            </Button>
          </DialogClose>
          <Button size="sm" variant="solid-crit" loading={pending} disabled={!canSubmit} onClick={submit}>
            Cancel order
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
