import { Text } from "@react-email/components";
import { EmailLayout, emailStyles } from "./components/Layout";
import type { Order } from "@/types/order";

export interface OrderDeliveredEmailProps {
  order: Order;
}

export default function OrderDeliveredEmail({ order }: OrderDeliveredEmailProps) {
  return (
    <EmailLayout previewText={`Order ${order.orderNumber} delivered`}>
      <Text style={emailStyles.h1}>Delivered</Text>
      <Text style={emailStyles.body}>
        Order <strong>{order.orderNumber}</strong> has been delivered. We hope you enjoy it — thank you for
        ordering from Dishu Food and Beverages.
      </Text>
    </EmailLayout>
  );
}
