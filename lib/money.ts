/**
 * The money contract (CLAUDE.md §4).
 *
 * All money is stored and computed as integer paise. Never a float, never a `numeric` column,
 * never rupee arithmetic in JavaScript. `Paise` is a branded type so a raw rupee number cannot be
 * passed where paise is expected — the only ways to obtain one are `toPaise()` (converts a rupee
 * value, rounding to the nearest paisa) and `paise()` (asserts an already-integer value, e.g. one
 * read back from a `*_paise` database column).
 */

declare const __paiseBrand: unique symbol;

/** An integer amount of paise (1 rupee = 100 paise). Never construct this with `as Paise` directly. */
export type Paise = number & { readonly [__paiseBrand]: true };

/** Converts a rupee amount (string or number, as it appears in source data or a form) to paise. */
export function toPaise(rupees: string | number): Paise {
  const n = typeof rupees === "string" ? Number(rupees) : rupees;
  if (!Number.isFinite(n)) {
    throw new Error(`toPaise: "${rupees}" is not a finite rupee amount`);
  }
  // Round rather than truncate — avoids float drift like 324.10 * 100 = 32409.999999999996.
  return Math.round(n * 100) as Paise;
}

/** Asserts a number already denominated in paise (e.g. from a `*_paise` DB column) is a valid Paise. */
export function paise(n: number): Paise {
  if (!Number.isInteger(n)) {
    throw new Error(`paise: ${n} is not an integer number of paise`);
  }
  return n as Paise;
}

/** Sums a list of paise amounts, returning a Paise. */
export function sumPaise(values: readonly Paise[]): Paise {
  return values.reduce<number>((acc, v) => acc + v, 0) as Paise;
}

/**
 * Formats paise for display as Indian Rupees with Indian digit grouping (₹1,00,000), no decimal
 * places when the amount is a whole rupee value, two decimal places otherwise. Display only — do
 * not use the output for further arithmetic.
 */
export function formatINR(amountPaise: Paise): string {
  const rupees = amountPaise / 100;
  const isWhole = Number.isInteger(rupees);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: isWhole ? 0 : 2,
    maximumFractionDigits: isWhole ? 0 : 2,
  }).format(rupees);
}

/**
 * Percentage saved between MRP and sale price, rounded to the nearest whole percent. Returns 0
 * when there is no genuine saving (price at or above MRP) — callers must not render a "Save %"
 * chip in that case (CLAUDE.md §7.3).
 */
export function discountPct(mrpPaise: Paise, pricePaise: Paise): number {
  if (mrpPaise <= 0 || pricePaise >= mrpPaise) return 0;
  return Math.round(((mrpPaise - pricePaise) / mrpPaise) * 100);
}
