"use client";

import React, { useState, useEffect } from "react";
import { Settings, Save, Loader2, Key, Shield, Bell } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";
import { PremiumCard } from "@/components/ui/premium-card";
import { useSession } from "next-auth/react";
import { updateProfileSettingsAction } from "@/actions/users";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera } from "lucide-react";
import { uploadUserImageAction } from "@/actions/upload-user-image";

export default function SettingsPage() {
  const { data: session, update } = useSession();
  
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user?.name) {
      setName(session.user.name);
    }
    if (session?.user?.image) {
      setImagePreview(session.user.image);
    }
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    
    try {
      let imageUrl = session?.user?.image;
      if (imageFile) {
        const formData = new FormData();
        formData.append("file", imageFile);
        const result = await uploadUserImageAction(formData);
        imageUrl = result.url;
      }

      await updateProfileSettingsAction({ name, password, image: imageUrl || undefined });
      toast.success("Settings saved successfully!");
      setPassword(""); // Clear password field after save
      setImageFile(null); // Clear file after save
      
      // Update next-auth session data
      await update({ name, image: imageUrl });
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
          <div className="flex flex-col mb-6">
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-3">
              Profile Image
            </label>
            <div className="flex items-center gap-6">
              <div className="relative group cursor-pointer">
                <Avatar className="h-20 w-20 border border-[rgba(0,0,0,0.1)]">
                  <AvatarImage src={imagePreview || ""} alt="Profile" className="object-cover" />
                  <AvatarFallback className="bg-[rgba(0,0,0,0.05)] text-xl">
                    {name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                
                <div 
                  className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => document.getElementById("settings-avatar-upload")?.click()}
                >
                  <Camera className="w-5 h-5 text-white" />
                </div>
                
                <input
                  id="settings-avatar-upload"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setImageFile(file);
                      setImagePreview(URL.createObjectURL(file));
                    }
                  }}
                />
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => document.getElementById("settings-avatar-upload")?.click()}
                  className="px-4 py-2 bg-[rgba(0,0,0,0.05)] hover:bg-[rgba(0,0,0,0.1)] text-[var(--color-text-primary)] rounded-lg font-medium transition-colors text-sm"
                >
                  Change Image
                </button>
                <p className="text-xs text-[var(--color-text-muted)] mt-2">
                  JPG, PNG, WebP or GIF. Max 5MB.
                </p>
              </div>
            </div>
          </div>

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
