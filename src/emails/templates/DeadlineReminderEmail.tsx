import * as React from "react";
import { Button, Section, Text } from "@react-email/components";
import { EmailLayout } from "./EmailLayout";

interface DeadlineReminderEmailProps {
  itemName: string;
  dueDate: string;
  link?: string;
}

export const DeadlineReminderEmail: React.FC<DeadlineReminderEmailProps> = ({
  itemName = "Task/Campaign",
  dueDate = "Today",
  link = "https://twinpix.studio",
}) => {
  return (
    <EmailLayout previewText={`Deadline approaching for ${itemName}`}>
      <Section style={content}>
        <Text style={heading}>Deadline Approaching</Text>
        <Text style={paragraph}>
          Hi there,
        </Text>
        <Text style={paragraph}>
          This is a reminder that the deadline for <strong>{itemName}</strong> is approaching.
        </Text>
        <Section style={box}>
          <Text style={dueText}>Due: {dueDate}</Text>
        </Section>
        <Section style={buttonContainer}>
          <Button style={button} href={link}>
            View Details
          </Button>
        </Section>
      </Section>
    </EmailLayout>
  );
};

export default DeadlineReminderEmail;

const content = { padding: "24px" };
const heading = { fontSize: "20px", fontWeight: "bold", color: "#1e293b" };
const paragraph = { fontSize: "16px", lineHeight: "24px", color: "#475569" };
const box = { backgroundColor: "#fef2f2", border: "1px solid #fca5a5", borderRadius: "8px", padding: "16px", marginTop: "16px", marginBottom: "16px" };
const dueText = { margin: "0", fontSize: "16px", fontWeight: "bold", color: "#ef4444" };
const buttonContainer = { marginTop: "24px", textAlign: "center" as const };
const button = { backgroundColor: "#6366f1", borderRadius: "8px", color: "#fff", fontSize: "14px", fontWeight: "bold", textDecoration: "none", display: "inline-block", padding: "12px 24px" };
