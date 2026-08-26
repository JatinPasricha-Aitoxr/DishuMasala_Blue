import { describe, expect, it } from "vitest";
import { formatOrderNumber } from "../order-number";

describe("formatOrderNumber", () => {
  it("formats a sequence value as DM-YYYY-NNNNN, zero-padded to 5 digits", () => {
    expect(formatOrderNumber(42, new Date("2026-03-01T00:00:00Z"))).toBe("DM-2026-00042");
  });

  it("does not truncate a sequence value wider than 5 digits", () => {
    expect(formatOrderNumber(123456, new Date("2026-01-01T00:00:00Z"))).toBe("DM-2026-123456");
  });

  it("rejects a non-positive or non-integer sequence value", () => {
    expect(() => formatOrderNumber(0)).toThrow();
    expect(() => formatOrderNumber(-1)).toThrow();
    expect(() => formatOrderNumber(1.5)).toThrow();
  });
});
