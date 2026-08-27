import { Section, Text } from "@react-email/components";
import { formatINR } from "@/lib/money";
import { EmailLayout, emailStyles } from "./components/Layout";
import type { Order } from "@/types/order";

export interface PaymentReceivedEmailProps {
  order: Order;
}

export default function PaymentReceivedEmail({ order }: PaymentReceivedEmailProps) {
  return (
    <EmailLayout previewText={`Payment received for order ${order.orderNumber}`}>
      <Text style={emailStyles.h1}>Payment received</Text>
      <Text style={emailStyles.body}>
        We&apos;ve received your payment of <strong>{formatINR(order.totalPaise)}</strong> for order{" "}
        <strong>{order.orderNumber}</strong>. Your order is now being prepared.
      </Text>
      <Section>
        <Text style={emailStyles.label}>Payment reference</Text>
        <Text style={emailStyles.itemMeta}>{order.razorpayPaymentId ?? "—"}</Text>
      </Section>
    </EmailLayout>
  );
}
