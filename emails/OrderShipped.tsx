import { Link, Section, Text } from "@react-email/components";
import { EmailLayout, emailStyles } from "./components/Layout";
import type { Order } from "@/types/order";

export interface OrderShippedEmailProps {
  order: Order;
}

export default function OrderShippedEmail({ order }: OrderShippedEmailProps) {
  return (
    <EmailLayout previewText={`Order ${order.orderNumber} has shipped`}>
      <Text style={emailStyles.h1}>Your order is on its way</Text>
      <Text style={emailStyles.body}>
        Order <strong>{order.orderNumber}</strong> has shipped
        {order.courier ? ` via ${order.courier}` : ""}.
      </Text>
      {order.awb && (
        <Section>
          <Text style={emailStyles.label}>Tracking (AWB)</Text>
          <Text style={emailStyles.itemMeta}>{order.awb}</Text>
        </Section>
      )}
      {order.trackingUrl && (
        <Section style={emailStyles.buttonWrap}>
          <Link href={order.trackingUrl} style={emailStyles.button}>
            Track your order
          </Link>
        </Section>
      )}
    </EmailLayout>
  );
}
