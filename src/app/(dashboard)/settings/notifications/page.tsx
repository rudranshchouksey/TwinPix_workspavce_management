"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Loader2, Bell, Smartphone, Mail, MessageCircle, Info, ShieldAlert, Save } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";
import { PremiumCard } from "@/components/ui/premium-card";
import { 
  getUserNotificationPreferencesAction, 
  updateUserNotificationPreferencesAction 
} from "@/actions/users";
import { 
  getNotificationDefaultsAction, 
  updateNotificationDefaultsAction 
} from "@/actions/settings";

const CATEGORIES = [
  { id: "CAMPAIGN", label: "Campaigns", description: "Updates on your assigned campaigns" },
  { id: "TASK", label: "Tasks", description: "New tasks, deadlines, and comments" },
  { id: "MEETING", label: "Meetings", description: "Invites and upcoming meeting reminders" },
  { id: "PAYMENT", label: "Payments", description: "Invoices and payment confirmations" },
  { id: "PROJECT", label: "Projects", description: "Project milestone updates" },
  { id: "AI", label: "AI & Summaries", description: "Daily AI summaries and insights" },
  { id: "SYSTEM", label: "System Alerts", description: "Security and critical system events" },
];

const CHANNELS = [
  { id: "inApp", label: "In-App", icon: Bell },
  { id: "email", label: "Email", icon: Mail },
  { id: "whatsapp", label: "WhatsApp", icon: MessageCircle },
  { id: "push", label: "Push", icon: Smartphone },
];

export default function NotificationPreferencesPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "SUPER_ADMIN";
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"personal" | "global">("personal");
  
  // Personal Preferences
  const [inApp, setInApp] = useState<Record<string, boolean>>({});
  const [email, setEmail] = useState<Record<string, boolean>>({});
  const [whatsapp, setWhatsapp] = useState<Record<string, boolean>>({});
  const [push, setPush] = useState<Record<string, boolean>>({});

  // Global Defaults
  const [defaultInApp, setDefaultInApp] = useState<Record<string, boolean>>({});
  const [defaultEmail, setDefaultEmail] = useState<Record<string, boolean>>({});
  const [defaultWhatsapp, setDefaultWhatsapp] = useState<Record<string, boolean>>({});
  const [defaultPush, setDefaultPush] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const userPrefs = await getUserNotificationPreferencesAction();
      if (userPrefs) {
        setInApp((userPrefs.inAppPreferences as any) || {});
        setEmail((userPrefs.emailPreferences as any) || {});
        setWhatsapp((userPrefs.whatsappPreferences as any) || {});
        setPush((userPrefs.pushPreferences as any) || {});
      }

      if (isAdmin) {
        const defaults = await getNotificationDefaultsAction();
        if (defaults) {
          setDefaultInApp(defaults.inApp || {});
          setDefaultEmail(defaults.email || {});
          setDefaultWhatsapp(defaults.whatsapp || {});
          setDefaultPush(defaults.push || {});
        }
      }
    } catch (err) {
      toast.error("Failed to load preferences");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (
    categoryId: string, 
    channelId: string, 
    isGlobal: boolean
  ) => {
    const updateState = (setter: React.Dispatch<React.SetStateAction<Record<string, boolean>>>, state: Record<string, boolean>) => {
      // Toggle logic: if undefined, assume true (default), so switch to false. 
      const current = state[categoryId] !== false; 
      setter({ ...state, [categoryId]: !current });
    };

    if (isGlobal) {
      if (channelId === "inApp") updateState(setDefaultInApp, defaultInApp);
      if (channelId === "email") updateState(setDefaultEmail, defaultEmail);
      if (channelId === "whatsapp") updateState(setDefaultWhatsapp, defaultWhatsapp);
      if (channelId === "push") updateState(setDefaultPush, defaultPush);
    } else {
      if (channelId === "inApp") updateState(setInApp, inApp);
      if (channelId === "email") updateState(setEmail, email);
      if (channelId === "whatsapp") updateState(setWhatsapp, whatsapp);
      if (channelId === "push") updateState(setPush, push);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (activeTab === "personal") {
        await updateUserNotificationPreferencesAction({
          inAppPreferences: inApp,
          emailPreferences: email,
          whatsappPreferences: whatsapp,
          pushPreferences: push,
        });
        toast.success("Personal preferences saved!");
      } else {
        await updateNotificationDefaultsAction({
          inApp: defaultInApp,
          email: defaultEmail,
          whatsapp: defaultWhatsapp,
          push: defaultPush,
        });
        toast.success("Global defaults saved!");
      }
    } catch (err) {
      toast.error("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--color-brand-500)]" />
      </div>
    );
  }

  const isGlobal = activeTab === "global";
  const currentInApp = isGlobal ? defaultInApp : inApp;
  const currentEmail = isGlobal ? defaultEmail : email;
  const currentWhatsapp = isGlobal ? defaultWhatsapp : whatsapp;
  const currentPush = isGlobal ? defaultPush : push;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <PageHeader
        title="Notification Preferences"
        description="Control how and when you receive alerts from TwinPix Studio"
      />

      {isAdmin && (
        <div className="flex border-b border-[rgba(0,0,0,0.08)] mb-6">
          <button
            onClick={() => setActiveTab("personal")}
            className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === "personal"
                ? "border-[var(--color-brand-500)] text-[var(--color-brand-600)]"
                : "border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            }`}
          >
            My Preferences
          </button>
          <button
            onClick={() => setActiveTab("global")}
            className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "global"
                ? "border-[var(--color-brand-500)] text-[var(--color-brand-600)]"
                : "border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            }`}
          >
            <ShieldAlert className="w-4 h-4" /> Global Defaults
          </button>
        </div>
      )}

      <PremiumCard className="p-0 overflow-hidden shadow-executive-lg border-0 bg-white">
        <div className="p-6 border-b border-[rgba(0,0,0,0.08)] bg-[rgba(0,0,0,0.01)]">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-50 text-blue-500 rounded-xl">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
                {isGlobal ? "Global Notification Defaults" : "Notification Channels"}
              </h2>
              <p className="text-sm text-[var(--color-text-muted)] mt-1">
                {isGlobal 
                  ? "Set the default opt-in/opt-out status for new users or unconfigured channels." 
                  : "Choose which types of alerts you want to receive on each channel."}
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[rgba(0,0,0,0.02)] border-b border-[rgba(0,0,0,0.08)]">
                <th className="py-4 px-6 font-semibold text-[var(--color-text-secondary)] text-sm w-1/3">
                  Category
                </th>
                {CHANNELS.map((channel) => (
                  <th key={channel.id} className="py-4 px-6 font-semibold text-[var(--color-text-secondary)] text-sm text-center">
                    <div className="flex flex-col items-center gap-2">
                      <channel.icon className="w-5 h-5 opacity-70" />
                      {channel.label}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(0,0,0,0.05)]">
              {CATEGORIES.map((category) => (
                <tr key={category.id} className="hover:bg-[rgba(0,0,0,0.01)] transition-colors">
                  <td className="py-4 px-6">
                    <div className="font-medium text-[var(--color-text-primary)] mb-1">
                      {category.label}
                    </div>
                    <div className="text-xs text-[var(--color-text-muted)]">
                      {category.description}
                    </div>
                  </td>
                  {CHANNELS.map((channel) => {
                    let stateObj = currentInApp;
                    if (channel.id === "email") stateObj = currentEmail;
                    if (channel.id === "whatsapp") stateObj = currentWhatsapp;
                    if (channel.id === "push") stateObj = currentPush;

                    const isEnabled = stateObj[category.id] !== false; // Default true

                    return (
                      <td key={channel.id} className="py-4 px-6 text-center">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={isEnabled}
                            onChange={() => handleToggle(category.id, channel.id, isGlobal)}
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-brand-500)]"></div>
                        </label>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-6 border-t border-[rgba(0,0,0,0.08)] bg-[rgba(0,0,0,0.01)] flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-[var(--color-brand-500)] hover:bg-[var(--color-brand-600)] text-white px-6 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 shadow-sm"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Saving..." : "Save Preferences"}
          </button>
        </div>
      </PremiumCard>
    </div>
  );
}
