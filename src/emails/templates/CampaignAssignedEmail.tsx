import * as React from "react";
import { Button, Section, Text } from "@react-email/components";
import { EmailLayout } from "./EmailLayout";

interface CampaignAssignedEmailProps {
  campaignName: string;
  role: string;
  link: string;
}

export const CampaignAssignedEmail: React.FC<CampaignAssignedEmailProps> = ({
  campaignName = "New Campaign",
  role = "Member",
  link = "https://twinpix.studio",
}) => {
  return (
    <EmailLayout previewText={`You have been added to campaign: ${campaignName}`}>
      <Section style={content}>
        <Text style={heading}>Added to Campaign</Text>
        <Text style={paragraph}>
          Hi there,
        </Text>
        <Text style={paragraph}>
          You have been assigned to the campaign <strong>{campaignName}</strong> as a <strong>{role}</strong>.
        </Text>
        <Section style={buttonContainer}>
          <Button style={button} href={link}>
            View Campaign
          </Button>
        </Section>
      </Section>
    </EmailLayout>
  );
};

export default CampaignAssignedEmail;

const content = { padding: "24px" };
const heading = { fontSize: "20px", fontWeight: "bold", color: "#1e293b" };
const paragraph = { fontSize: "16px", lineHeight: "24px", color: "#475569" };
const buttonContainer = { marginTop: "24px", textAlign: "center" as const };
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
