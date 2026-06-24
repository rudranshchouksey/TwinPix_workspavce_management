import { Metadata } from "next";
import { requireAdmin } from "@/lib/auth-utils";
import { getUsersAction } from "@/actions/users";
import { UserTable } from "@/components/users/user-table";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = {
  title: "Team Management",
  description: "Manage TwinPix Studio users, roles, and access.",
};

export default async function TeamPage() {
  const user = await requireAdmin();
  const users = await getUsersAction();

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Team Management" 
        description="Manage workspace members, assign roles, and control access." 
      />
      <section aria-label="Users Table">
        <UserTable data={users as any} currentUserRole={user.role} />
      </section>
    </div>
  );
}
