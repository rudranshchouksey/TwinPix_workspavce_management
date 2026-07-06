import * as React from "react";
import { Button, Section, Text } from "@react-email/components";
import { EmailLayout } from "./EmailLayout";

interface PaymentReminderEmailProps {
  amount: string;
  dueDate: string;
  clientName: string;
  link?: string;
}

export const PaymentReminderEmail: React.FC<PaymentReminderEmailProps> = ({
  amount = "$0.00",
  dueDate = "Today",
  clientName = "Client",
  link = "https://twinpix.studio/invoices",
}) => {
  return (
    <EmailLayout previewText={`Payment Reminder: ${amount} due`}>
      <Section style={content}>
        <Text style={heading}>Payment Reminder</Text>
        <Text style={paragraph}>
          Hi there,
        </Text>
        <Text style={paragraph}>
          This is a reminder that an invoice payment is approaching its due date.
        </Text>
        <Section style={box}>
          <Text style={clientText}><strong>{clientName}</strong></Text>
          <Text style={amountText}>Amount: {amount}</Text>
          <Text style={dueText}>Due: {dueDate}</Text>
        </Section>
        <Section style={buttonContainer}>
          <Button style={button} href={link}>
            View Invoice
          </Button>
        </Section>
      </Section>
    </EmailLayout>
  );
};

export default PaymentReminderEmail;

const content = { padding: "24px" };
const heading = { fontSize: "20px", fontWeight: "bold", color: "#1e293b" };
const paragraph = { fontSize: "16px", lineHeight: "24px", color: "#475569" };
const box = { backgroundColor: "#f0fdf4", border: "1px solid #86efac", borderRadius: "8px", padding: "16px", marginTop: "16px", marginBottom: "16px" };
const clientText = { margin: "0 0 8px 0", fontSize: "16px", color: "#0f172a" };
const amountText = { margin: "0 0 4px 0", fontSize: "16px", fontWeight: "bold", color: "#16a34a" };
const dueText = { margin: "0", fontSize: "14px", color: "#475569" };
const buttonContainer = { marginTop: "24px", textAlign: "center" as const };
const button = { backgroundColor: "#6366f1", borderRadius: "8px", color: "#fff", fontSize: "14px", fontWeight: "bold", textDecoration: "none", display: "inline-block", padding: "12px 24px" };
