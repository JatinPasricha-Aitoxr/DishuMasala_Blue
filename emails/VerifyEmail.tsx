import { Section, Text, Button } from "@react-email/components";
import { EmailLayout, emailStyles } from "./components/Layout";

export interface VerifyEmailProps {
  verifyUrl: string;
  name: string;
}

export default function VerifyEmail({ verifyUrl, name }: VerifyEmailProps) {
  return (
    <EmailLayout previewText="Verify your email address">
      <Text style={emailStyles.h1}>Verify your email</Text>
      <Text style={emailStyles.body}>
        Hi {name}, thanks for creating an account with Dishu Food and Beverages. Confirm this is your email address
        to finish setting up your account.
      </Text>
      <Section style={emailStyles.buttonWrap}>
        <Button href={verifyUrl} style={emailStyles.button}>
          Verify email
        </Button>
      </Section>
      <Text style={emailStyles.itemMeta}>This link expires in 24 hours. If you didn&apos;t create this account, you can ignore this email.</Text>
    </EmailLayout>
  );
}
