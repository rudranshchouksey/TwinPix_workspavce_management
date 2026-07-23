import * as React from "react";
import { Button, Section, Text, Hr } from "@react-email/components";
import { EmailLayout } from "./EmailLayout";

interface AIDailySummaryEmailProps {
  date: string;
  summaryText: string;
  highlights: string[];
  link?: string;
}

export const AIDailySummaryEmail: React.FC<AIDailySummaryEmailProps> = ({
  date = new Date().toLocaleDateString(),
  summaryText = "Here is your daily digest of activities.",
  highlights = [],
  link = "https://twinpix.studio",
}) => {
  return (
    <EmailLayout previewText={`AI Daily Summary for ${date}`}>
      <Section style={content}>
        <Text style={heading}>AI Daily Summary</Text>
        <Text style={paragraph}>
          Here&apos;s your automated brief for <strong>{date}</strong>.
        </Text>
        <Section style={box}>
          <Text style={summary}>{summaryText}</Text>
          {highlights.length > 0 && (
            <>
              <Hr style={hr} />
              <Text style={highlightsTitle}><strong>Highlights:</strong></Text>
              <ul>
                {highlights.map((h, i) => (
                  <li key={i} style={listItem}>{h}</li>
                ))}
              </ul>
            </>
          )}
        </Section>
        <Section style={buttonContainer}>
          <Button style={button} href={link}>
            Go to Dashboard
          </Button>
        </Section>
      </Section>
    </EmailLayout>
  );
};

export default AIDailySummaryEmail;

const content = { padding: "24px" };
const heading = { fontSize: "20px", fontWeight: "bold", color: "#1e293b" };
const paragraph = { fontSize: "16px", lineHeight: "24px", color: "#475569" };
const box = { backgroundColor: "#fdf4ff", border: "1px solid #f0abfc", borderRadius: "8px", padding: "16px", marginTop: "16px", marginBottom: "16px" };
const summary = { margin: "0", fontSize: "15px", lineHeight: "24px", color: "#4a044e" };
const hr = { borderColor: "#f5d0fe", margin: "16px 0" };
const highlightsTitle = { margin: "0 0 8px 0", fontSize: "14px", color: "#701a75" };
const listItem = { fontSize: "14px", color: "#4a044e", marginBottom: "4px" };
const buttonContainer = { marginTop: "24px", textAlign: "center" as const };
const button = { backgroundColor: "#c026d3", borderRadius: "8px", color: "#fff", fontSize: "14px", fontWeight: "bold", textDecoration: "none", display: "inline-block", padding: "12px 24px" };
