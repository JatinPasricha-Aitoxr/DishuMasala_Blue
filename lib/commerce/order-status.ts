/**
 * The order-status state machine (CLAUDE.md §9 / PROMPTS.md Phase 7 item 4: "the legal
 * transitions enforced server-side — no jumping from pending to delivered"). Pure and
 * unit-tested, exactly like lib/commerce/pricing.ts — no drizzle or "server-only" import, so it
 * can be tested with no database in the loop and imported by both the mutation layer and its
 * tests without pulling in Postgres.
 *
 * This is the ONE place legality is decided. `app/admin/orders/actions.ts` calls
 * `validateStatusTransition` before writing anything, and the mutation layer
 * (lib/db/mutations/admin-orders.ts) additionally guards its UPDATE with `WHERE status = <from>`
 * so a race between two staff members can never silently skip a state — whichever request wins
 * the compare-and-set applies; the other sees a stale-state error and must re-check.
 */
import type { OrderStatus } from "@/types/order";

export type { OrderStatus };

/**
 * Legal next states per CLAUDE.md §9's example chain (pending → confirmed → packed → shipped →
 * delivered) plus the cancelled/refunded branches PROMPTS.md calls out "from the appropriate
 * states":
 * - `cancelled` is reachable from any state before the order has shipped (pending, confirmed,
 *   packed) — once a courier has it, cancelling in this system means recording a refund instead.
 * - `refunded` is reachable from `delivered` (a return) or `cancelled` (a cancelled order that had
 *   already been paid). It is terminal.
 * - `delivered` is terminal other than a subsequent refund.
 */
const TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["packed", "cancelled"],
  packed: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: ["refunded"],
  cancelled: ["refunded"],
  refunded: [],
};

export const ALL_ORDER_STATUSES = [
  "pending",
  "confirmed",
  "packed",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
] as const satisfies readonly OrderStatus[];

/** The legal next states from a given status — what the UI should offer as buttons. Never the
 * only enforcement (see the module doc comment): the server independently re-checks every call. */
export function legalNextStatuses(from: OrderStatus): readonly OrderStatus[] {
  return TRANSITIONS[from] ?? [];
}

export function canTransitionOrderStatus(from: OrderStatus, to: OrderStatus): boolean {
  return legalNextStatuses(from).includes(to);
}

export type StatusTransitionValidation = { ok: true } | { ok: false; error: string };

/** The single server-side gate every status-change call path (including a direct, non-UI call)
 * must pass through — rejects an illegal jump (e.g. pending straight to delivered) with a clear
 * error rather than a silent no-op. */
export function validateStatusTransition(from: OrderStatus, to: OrderStatus): StatusTransitionValidation {
  if (from === to) {
    return { ok: false, error: `Order is already "${to}".` };
  }
  if (!canTransitionOrderStatus(from, to)) {
    return {
      ok: false,
      error: `Cannot move an order from "${from}" directly to "${to}". Legal next state${legalNextStatuses(from).length === 1 ? "" : "s"}: ${legalNextStatuses(from).join(", ") || "none — this is a terminal state"}.`,
    };
  }
  return { ok: true };
}
