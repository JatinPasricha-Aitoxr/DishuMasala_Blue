import { Text } from "@react-email/components";
import { EmailLayout, emailStyles } from "./components/Layout";
import type { Order } from "@/types/order";

export interface OrderCancelledEmailProps {
  order: Order;
  reason?: string | null;
}

export default function OrderCancelledEmail({ order, reason }: OrderCancelledEmailProps) {
  return (
    <EmailLayout previewText={`Order ${order.orderNumber} cancelled`}>
      <Text style={emailStyles.h1}>Order cancelled</Text>
      <Text style={emailStyles.body}>
        Order <strong>{order.orderNumber}</strong> has been cancelled
        {reason ? ` — ${reason}` : ""}.
        {order.paymentMethod === "razorpay" ? " Any payment already collected will be refunded." : ""}
      </Text>
    </EmailLayout>
  );
}
