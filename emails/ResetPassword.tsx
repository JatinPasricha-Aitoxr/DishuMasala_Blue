import { Section, Text, Button } from "@react-email/components";
import { EmailLayout, emailStyles } from "./components/Layout";

export interface ResetPasswordEmailProps {
  resetUrl: string;
  name: string;
}

export default function ResetPasswordEmail({ resetUrl, name }: ResetPasswordEmailProps) {
  return (
    <EmailLayout previewText="Reset your password">
      <Text style={emailStyles.h1}>Reset your password</Text>
      <Text style={emailStyles.body}>
        Hi {name}, we received a request to reset the password on your Dishu Food and Beverages account. If this was
        you, choose a new password below.
      </Text>
      <Section style={emailStyles.buttonWrap}>
        <Button href={resetUrl} style={emailStyles.button}>
          Reset password
        </Button>
      </Section>
      <Text style={emailStyles.itemMeta}>
        This link expires in 30 minutes and can only be used once. If you didn&apos;t request this, you can safely
        ignore this email — your password won&apos;t change.
      </Text>
    </EmailLayout>
  );
}
