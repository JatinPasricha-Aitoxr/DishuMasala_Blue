import { Link, Section, Text } from "@react-email/components";
import { EmailLayout, emailStyles } from "./components/Layout";
import { OrderItemsList } from "./components/OrderItemsList";
import type { Order } from "@/types/order";

export interface OrderConfirmationEmailProps {
  order: Order;
  /** The signed, guest-accessible link built by lib/order-token.ts. */
  confirmationUrl: string;
}

export default function OrderConfirmationEmail({ order, confirmationUrl }: OrderConfirmationEmailProps) {
  return (
    <EmailLayout previewText={`Order ${order.orderNumber} confirmed — thank you for your order`}>
      <Text style={emailStyles.h1}>Thank you — your order is confirmed</Text>
      <Text style={emailStyles.body}>
        Order <strong>{order.orderNumber}</strong> has been placed
        {order.paymentMethod === "cod" ? " for Cash on Delivery" : ""}. Here&apos;s what you ordered:
      </Text>
      <OrderItemsList order={order} />
      <Section style={emailStyles.buttonWrap}>
        <Link href={confirmationUrl} style={emailStyles.button}>
          View your order
        </Link>
      </Section>
      <Text style={emailStyles.body}>
        We&apos;ll email you again once your order ships, with your tracking link.
      </Text>
    </EmailLayout>
  );
}
