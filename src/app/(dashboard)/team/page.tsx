import { Metadata } from "next";
import { requireAdmin } from "@/lib/auth-utils";
import { getUsersAction } from "@/actions/users";
import { UserTable } from "@/components/users/user-table";
import { SectionHeader } from "@/components/dashboard/section-header";

export const metadata: Metadata = {
  title: "Team Management",
  description: "Manage TwinPix Studio users, roles, and access.",
};

export default async function TeamPage() {
  // 1. Require ADMIN role or above
  const user = await requireAdmin();

  // 2. Fetch users
  const users = await getUsersAction();

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
            Team Management
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Manage workspace members, assign roles, and control access.
          </p>
        </div>
      </div>

      <section aria-label="Users Table">
        <SectionHeader label="All Users" />
        <UserTable data={users as any} currentUserRole={user.role} />
      </section>
    </div>
  );
}
