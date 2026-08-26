import "server-only";

import { sql } from "drizzle-orm";
import { db } from "./index";
import { formatOrderNumber } from "../order-number";

export { formatOrderNumber };

/** Pulls the next value from order_number_seq and formats it as DM-YYYY-NNNNN. */
export async function nextOrderNumber(): Promise<string> {
  const result = await db.execute<{ next: string }>(sql`select nextval('order_number_seq') as next`);
  const row = result.rows[0];
  if (!row) {
    throw new Error("nextOrderNumber: order_number_seq did not return a value");
  }
  return formatOrderNumber(Number(row.next));
}
