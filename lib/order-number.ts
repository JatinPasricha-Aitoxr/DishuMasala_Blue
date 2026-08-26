/**
 * Pure formatter for human-readable order numbers (CLAUDE.md §4: "sequential-ish (DM-2026-00042)
 * from a Postgres sequence, never a raw UUID shown to a customer"). Deliberately has no database
 * or server-only dependency so it can be unit-tested directly; the actual nextval() call lives in
 * lib/db/order-number.ts alongside the rest of the server-only DB layer.
 */
export function formatOrderNumber(seq: number, date: Date = new Date()): string {
  if (!Number.isInteger(seq) || seq <= 0) {
    throw new Error(`formatOrderNumber: ${seq} is not a positive integer sequence value`);
  }
  const year = date.getFullYear();
  return `DM-${year}-${String(seq).padStart(5, "0")}`;
}
