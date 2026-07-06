import * as React from "react";
import { Button, Section, Text } from "@react-email/components";
import { EmailLayout } from "./EmailLayout";

interface MeetingReminderEmailProps {
  meetingTitle: string;
  meetingTime: string;
  link?: string;
}

export const MeetingReminderEmail: React.FC<MeetingReminderEmailProps> = ({
  meetingTitle = "Upcoming Meeting",
  meetingTime = "Soon",
  link = "https://twinpix.studio/calendar",
}) => {
  return (
    <EmailLayout previewText={`Reminder: ${meetingTitle} is starting soon`}>
      <Section style={content}>
        <Text style={heading}>Meeting Reminder</Text>
        <Text style={paragraph}>
          Hi there,
        </Text>
        <Text style={paragraph}>
          This is a reminder that you have an upcoming meeting:
        </Text>
        <Section style={box}>
          <Text style={taskText}><strong>{meetingTitle}</strong></Text>
          <Text style={dueText}>{meetingTime}</Text>
        </Section>
        <Section style={buttonContainer}>
          <Button style={button} href={link}>
            View Calendar
          </Button>
        </Section>
      </Section>
    </EmailLayout>
  );
};

export default MeetingReminderEmail;

const content = { padding: "24px" };
const heading = { fontSize: "20px", fontWeight: "bold", color: "#1e293b" };
const paragraph = { fontSize: "16px", lineHeight: "24px", color: "#475569" };
const box = { backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "16px", marginTop: "16px", marginBottom: "16px" };
const taskText = { margin: "0 0 8px 0", fontSize: "16px", color: "#0f172a" };
const dueText = { margin: "0", fontSize: "14px", color: "#6366f1" };
const buttonContainer = { marginTop: "24px", textAlign: "center" as const };
const button = { backgroundColor: "#6366f1", borderRadius: "8px", color: "#fff", fontSize: "14px", fontWeight: "bold", textDecoration: "none", display: "inline-block", padding: "12px 24px" };
