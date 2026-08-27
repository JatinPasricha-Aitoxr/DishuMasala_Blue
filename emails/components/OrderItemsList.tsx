import { Hr, Section, Text } from "@react-email/components";
import { formatINR } from "@/lib/money";
import { emailStyles } from "./Layout";
import type { Order } from "@/types/order";

/**
 * Renders the order's item snapshot exactly as stored on `order_items` (CLAUDE.md §4: never a
 * live join back to the current product/price) plus the same subtotal/discount/shipping/total
 * breakdown that lib/commerce/pricing.ts computed at checkout — this is display-only, no
 * arithmetic happens here.
 */
export function OrderItemsList({ order }: { order: Order }) {
  return (
    <>
      <Section>
        {order.items.map((item) => (
          <div key={item.id}>
            <Text style={emailStyles.itemRow}>
              {item.productName} — {item.optionValue} × {item.qty}
            </Text>
            <Text style={emailStyles.itemMeta}>
              SKU {item.sku} · {formatINR(item.unitPricePaise)} each · {formatINR(item.lineTotalPaise)}
            </Text>
          </div>
        ))}
      </Section>
      <Hr style={emailStyles.hairline} />
      <Section>
        <Text style={emailStyles.totalRow}>Subtotal: {formatINR(order.subtotalPaise)}</Text>
        {order.discountPaise > 0 && (
          <Text style={emailStyles.totalRow}>
            Discount{order.couponCode ? ` (${order.couponCode})` : ""}: -{formatINR(order.discountPaise)}
          </Text>
        )}
        <Text style={emailStyles.totalRow}>
          Shipping: {order.shippingPaise > 0 ? formatINR(order.shippingPaise) : "Free"}
        </Text>
        <Text style={emailStyles.grandTotal}>Total: {formatINR(order.totalPaise)}</Text>
        <Text style={{ ...emailStyles.itemMeta, marginTop: "8px" }}>
          Inclusive of all taxes (GST). {order.paymentMethod === "cod" ? "Payable on delivery." : ""}
        </Text>
      </Section>
    </>
  );
}
