import { describe, expect, it } from "vitest";
import { discountPct, formatINR, paise, type Paise, sumPaise, toPaise } from "../money";

describe("toPaise", () => {
  it("converts whole rupees to paise", () => {
    expect(toPaise(324)).toBe(32400);
    expect(toPaise("324")).toBe(32400);
  });

  it("rounds to the nearest paisa instead of drifting on float multiplication", () => {
    // 324.10 * 100 is 32409.999999999996 in raw IEEE-754 float math.
    expect(toPaise(324.1)).toBe(32410);
    expect(toPaise("19.99")).toBe(1999);
  });

  it("throws on a non-finite input", () => {
    expect(() => toPaise("not-a-number")).toThrow();
    expect(() => toPaise(Number.NaN)).toThrow();
  });
});

describe("paise", () => {
  it("accepts an already-integer paise value", () => {
    expect(paise(32400)).toBe(32400);
  });

  it("rejects a non-integer value at runtime — the branding guard", () => {
    // If someone passes a rupee amount with decimals (e.g. 324.50 rupees) straight into a
    // paise-typed slot instead of converting it first, this throws instead of silently
    // truncating money.
    expect(() => paise(324.5)).toThrow();
  });
});

describe("sumPaise", () => {
  it("sums a list of paise amounts", () => {
    const values = [toPaise(100), toPaise(50), toPaise(0.5)];
    expect(sumPaise(values)).toBe(15050);
  });

  it("returns 0 for an empty list", () => {
    expect(sumPaise([])).toBe(0);
  });
});

describe("formatINR", () => {
  it("formats with Indian digit grouping and no decimals for a whole rupee amount", () => {
    expect(formatINR(toPaise(100000))).toBe("₹1,00,000");
  });

  it("formats a small whole amount", () => {
    expect(formatINR(toPaise(324))).toBe("₹324");
  });

  it("keeps two decimal places for a fractional rupee amount", () => {
    expect(formatINR(toPaise(324.5))).toBe("₹324.50");
  });
});

describe("discountPct", () => {
  it("computes a rounded percentage saved", () => {
    expect(discountPct(toPaise(349), toPaise(324))).toBe(7);
    expect(discountPct(toPaise(299), toPaise(269))).toBe(10);
  });

  it("returns 0 when price equals or exceeds MRP — never a negative or invented discount", () => {
    expect(discountPct(toPaise(100), toPaise(100))).toBe(0);
    expect(discountPct(toPaise(100), toPaise(120))).toBe(0);
  });
});

describe("Paise branding — compile-time guard", () => {
  it("is exercised by a @ts-expect-error at the type level (see below); this test just keeps the import used", () => {
    const amount: Paise = toPaise(1);
    expect(amount).toBe(100);
  });

  it("does not allow a raw rupee number to satisfy the Paise type without going through toPaise/paise", () => {
    // @ts-expect-error — a bare number literal is not a Paise; it must be constructed via
    // toPaise() or paise() so a rupee value can never be silently used as a paise value.
    const notPaise: Paise = 100;
    // Reference it so eslint/tsc don't additionally complain about an unused variable —
    // the point of this test is the line above failing to compile without the directive.
    expect(typeof notPaise).toBe("number");
  });
});
