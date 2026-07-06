import * as React from "react";
import { Button, Section, Text } from "@react-email/components";
import { EmailLayout } from "./EmailLayout";

interface TaskAssignedEmailProps {
  taskTitle: string;
  assignerName: string;
  dueDate?: string;
  link: string;
}

export const TaskAssignedEmail: React.FC<TaskAssignedEmailProps> = ({
  taskTitle = "New Task",
  assignerName = "Someone",
  dueDate,
  link = "https://twinpix.studio",
}) => {
  return (
    <EmailLayout previewText={`You have been assigned a new task: ${taskTitle}`}>
      <Section style={content}>
        <Text style={heading}>New Task Assigned</Text>
        <Text style={paragraph}>
          Hi there,
        </Text>
        <Text style={paragraph}>
          <strong>{assignerName}</strong> has assigned a new task to you:
        </Text>
        <Section style={box}>
          <Text style={taskText}><strong>{taskTitle}</strong></Text>
          {dueDate && <Text style={dueText}>Due: {dueDate}</Text>}
        </Section>
        <Section style={buttonContainer}>
          <Button style={button} href={link}>
            View Task
          </Button>
        </Section>
      </Section>
    </EmailLayout>
  );
};

export default TaskAssignedEmail;

const content = {
  padding: "24px",
};

const heading = {
  fontSize: "20px",
  fontWeight: "bold",
  color: "#1e293b",
};

const paragraph = {
  fontSize: "16px",
  lineHeight: "24px",
  color: "#475569",
};

const box = {
  backgroundColor: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: "8px",
  padding: "16px",
  marginTop: "16px",
  marginBottom: "16px",
};

const taskText = {
  margin: "0 0 8px 0",
  fontSize: "16px",
  color: "#0f172a",
};

const dueText = {
  margin: "0",
  fontSize: "14px",
  color: "#ef4444",
};

const buttonContainer = {
  marginTop: "24px",
  textAlign: "center" as const,
};

const button = {
  backgroundColor: "#6366f1",
  borderRadius: "8px",
  color: "#fff",
  fontSize: "14px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 24px",
};
