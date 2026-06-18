import { Metadata } from "next";
import { requireAuth } from "@/lib/auth-utils";
import { ImportWizard } from "@/components/influencers/import/import-wizard";
import { SectionHeader } from "@/components/dashboard/section-header";

export const metadata: Metadata = {
  title: "Import Leads",
  description: "Import influencer leads from CSV.",
};

export default async function ImportLeadsPage() {
  await requireAuth();

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <SectionHeader
        label="Import Leads"
        description="Upload a CSV file to bulk import new influencer leads into your CRM pipeline."
      />
      
      <ImportWizard />
    </div>
  );
}
