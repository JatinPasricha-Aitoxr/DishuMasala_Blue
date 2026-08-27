import { describe, expect, it } from "vitest";
import {
  ALL_ORDER_STATUSES,
  canTransitionOrderStatus,
  legalNextStatuses,
  validateStatusTransition,
} from "@/lib/commerce/order-status";

/**
 * Direct proof of PROMPTS.md Phase 7's acceptance criterion: "An illegal status transition is
 * rejected server-side... calling the server action/state-machine function directly, not just
 * noting the UI doesn't offer that button." This is that direct call — the exact function
 * app/admin/orders/actions.ts#transitionOrderStatusAction and the DB layer
 * (lib/db/mutations/admin-orders.ts#transitionOrderStatusDb) both delegate to.
 */
describe("lib/commerce/order-status.ts — the server-side state machine", () => {
  it("rejects the canonical illegal jump: pending straight to delivered", () => {
    const result = validateStatusTransition("pending", "delivered");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/cannot move an order from "pending" directly to "delivered"/i);
    }
  });

  it("canTransitionOrderStatus agrees: pending -> delivered is illegal", () => {
    expect(canTransitionOrderStatus("pending", "delivered")).toBe(false);
  });

  it("accepts the legal happy path end to end: pending -> confirmed -> packed -> shipped -> delivered", () => {
    const chain: Array<[import("@/types/order").OrderStatus, import("@/types/order").OrderStatus]> = [
      ["pending", "confirmed"],
      ["confirmed", "packed"],
      ["packed", "shipped"],
      ["shipped", "delivered"],
    ];
    for (const [from, to] of chain) {
      expect(validateStatusTransition(from, to)).toEqual({ ok: true });
    }
  });

  it("allows cancelling from pending, confirmed or packed, but not from shipped", () => {
    expect(canTransitionOrderStatus("pending", "cancelled")).toBe(true);
    expect(canTransitionOrderStatus("confirmed", "cancelled")).toBe(true);
    expect(canTransitionOrderStatus("packed", "cancelled")).toBe(true);
    expect(canTransitionOrderStatus("shipped", "cancelled")).toBe(false);
  });

  it("allows refunding from delivered or cancelled only", () => {
    expect(canTransitionOrderStatus("delivered", "refunded")).toBe(true);
    expect(canTransitionOrderStatus("cancelled", "refunded")).toBe(true);
    expect(canTransitionOrderStatus("pending", "refunded")).toBe(false);
  });

  it("refunded is terminal — no legal next state", () => {
    expect(legalNextStatuses("refunded")).toEqual([]);
  });

  it("rejects a same-status no-op transition with a clear error, not a silent success", () => {
    const result = validateStatusTransition("confirmed", "confirmed");
    expect(result).toEqual({ ok: false, error: 'Order is already "confirmed".' });
  });

  it("every status in ALL_ORDER_STATUSES has a defined (possibly empty) transition list", () => {
    for (const status of ALL_ORDER_STATUSES) {
      expect(Array.isArray(legalNextStatuses(status))).toBe(true);
    }
  });

  it("rejects every jump directly to delivered except from shipped", () => {
    for (const from of ALL_ORDER_STATUSES) {
      if (from === "shipped" || from === "delivered") continue;
      expect(canTransitionOrderStatus(from, "delivered")).toBe(false);
    }
  });
});
