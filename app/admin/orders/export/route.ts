import { NextResponse, type NextRequest } from "next/server";
import { requireStaffOrAdmin } from "@/lib/auth/session";
import { getAdminOrdersForExport, parseAdminOrderFilters } from "@/lib/db/queries/admin-orders";
import { formatINR } from "@/lib/money";

/**
 * CSV export "of the current filtered view" (PROMPTS.md Phase 7 item 2) — reuses the exact same
 * filter parsing as the orders list, ignores `page`/pagination, and is capped
 * (ADMIN_ORDERS_EXPORT_CAP) rather than dumping the whole table unconditionally. Role-gated the
 * same as every other admin surface: a route handler is just as reachable directly as a server
 * action, so it re-checks independently too.
 */
function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export async function GET(request: NextRequest) {
  const session = await requireStaffOrAdmin();
  if (!session.ok) return NextResponse.json({ error: session.error }, { status: session.error === "unauthenticated" ? 401 : 403 });

  const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries());
  const filters = parseAdminOrderFilters(searchParams);
  const rows = await getAdminOrdersForExport(filters);

  const header = ["Order number", "Email", "Phone", "Status", "Payment method", "Payment status", "Total", "Placed at", "Shiprocket order id", "AWB"];
  const lines = [header.join(",")];
  for (const r of rows) {
    lines.push(
      [
        r.orderNumber,
        r.email,
        r.phone,
        r.status,
        r.paymentMethod,
        r.paymentStatus,
        formatINR(r.totalPaise),
        r.placedAt.toISOString(),
        r.shiprocketOrderId ?? "",
        r.awb ?? "",
      ]
        .map((v) => csvEscape(String(v)))
        .join(","),
    );
  }

  return new NextResponse(lines.join("\n"), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="dishu-orders-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
