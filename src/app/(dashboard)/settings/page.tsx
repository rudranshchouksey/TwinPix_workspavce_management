"use client";

import React, { useState, useEffect } from "react";
import { Settings, Save, Loader2, Key, Shield, Bell } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";
import { PremiumCard } from "@/components/ui/premium-card";
import { useSession } from "next-auth/react";
import { updateProfileSettingsAction } from "@/actions/users";

export default function SettingsPage() {
  const { data: session, update } = useSession();
  
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (session?.user?.name) {
      setName(session.user.name);
    }
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    
    try {
      await updateProfileSettingsAction({ name, password });
      toast.success("Settings saved successfully!");
      setPassword(""); // Clear password field after save
      
      // Update next-auth session data
      await update({ name });
    } catch (error: any) {
      toast.error(error.message || "Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  if (!session) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--color-brand-500)]" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <PageHeader
        title="Settings"
        description="Manage your account preferences and configurations"
      />

      <PremiumCard className="p-8 shadow-executive-lg border-0">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-[rgba(0,0,0,0.08)]">
          <div className="p-3 bg-[rgba(0,0,0,0.03)] rounded-xl">
            <Settings className="w-6 h-6 text-[var(--color-brand-400)]" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[var(--color-text-primary)]">General Settings</h2>
            <p className="text-sm text-[var(--color-text-muted)]">Update your profile information</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
                Display Name
              </label>
              <input
                type="text"
                placeholder="Your Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-[rgba(0,0,0,0.03)] border border-[rgba(0,0,0,0.1)] rounded-lg px-4 py-2.5 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                placeholder="your.email@example.com"
                value={session.user?.email || ""}
                disabled
                className="w-full bg-[rgba(0,0,0,0.01)] border border-[rgba(0,0,0,0.05)] rounded-lg px-4 py-2.5 text-sm text-[var(--color-text-muted)] cursor-not-allowed opacity-70"
              />
              <p className="text-xs text-[var(--color-text-disabled)] mt-2">Email address cannot be changed.</p>
            </div>
          </div>

          <div className="pt-6 border-t border-[rgba(0,0,0,0.08)] flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-[rgba(0,0,0,0.03)] rounded-lg">
                <Bell className="w-5 h-5 text-[var(--color-brand-400)]" />
              </div>
              <div>
                <h3 className="text-md font-semibold text-[var(--color-text-primary)]">Notification Preferences</h3>
                <p className="text-sm text-[var(--color-text-muted)]">Manage how you receive alerts (Email, WhatsApp, In-App, Push)</p>
              </div>
            </div>
            <Link 
              href="/settings/notifications" 
              className="px-4 py-2 bg-[rgba(0,0,0,0.05)] hover:bg-[rgba(0,0,0,0.1)] text-[var(--color-text-primary)] rounded-lg font-medium transition-colors text-sm"
            >
              Configure Notifications
            </Link>
          </div>

          <div className="pt-6 border-t border-[rgba(0,0,0,0.08)]">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-2 bg-[rgba(0,0,0,0.03)] rounded-lg">
                <Key className="w-5 h-5 text-[var(--color-brand-400)]" />
              </div>
              <div>
                <h3 className="text-md font-semibold text-[var(--color-text-primary)]">Security</h3>
                <p className="text-sm text-[var(--color-text-muted)]">Update your password</p>
              </div>
            </div>

            <div className="max-w-md">
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
                New Password
              </label>
              <input
                type="password"
                placeholder="Leave blank to keep current password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[rgba(0,0,0,0.03)] border border-[rgba(0,0,0,0.1)] rounded-lg px-4 py-2.5 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)]"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-[rgba(0,0,0,0.08)] flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 bg-[var(--color-brand-500)] hover:bg-[var(--color-brand-600)] text-white px-6 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </PremiumCard>
    </div>
  );
}
