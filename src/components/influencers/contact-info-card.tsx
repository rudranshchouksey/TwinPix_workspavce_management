"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Phone, Globe, AtSign, Copy, Check, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface ContactInfoCardProps {
  influencer: any;
}

interface ContactItem {
  icon: typeof Mail;
  label: string;
  value: string;
  href?: string;
  copyValue: string;
  color: string;
  bg: string;
}

export function ContactInfoCard({ influencer }: ContactInfoCardProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    toast.success(`${label} copied to clipboard`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const contactItems: ContactItem[] = [];

  if (influencer.email) {
    contactItems.push({
      icon: Mail,
      label: "Email",
      value: influencer.email,
      href: `mailto:${influencer.email}`,
      copyValue: influencer.email,
      color: "text-rose-600",
      bg: "bg-rose-50",
    });
  }

  if (influencer.phoneNumber) {
    contactItems.push({
      icon: Phone,
      label: "Phone",
      value: influencer.phoneNumber,
      href: `tel:${influencer.phoneNumber}`,
      copyValue: influencer.phoneNumber,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    });
  }

  if (influencer.profileLink) {
    const displayUrl = influencer.profileLink.replace(/^https?:\/\//, "").replace(/\/$/, "");
    contactItems.push({
      icon: Globe,
      label: "Website",
      value: displayUrl.length > 30 ? displayUrl.substring(0, 30) + "…" : displayUrl,
      href: influencer.profileLink.startsWith("http")
        ? influencer.profileLink
        : `https://${influencer.profileLink}`,
      copyValue: influencer.profileLink,
      color: "text-sky-600",
      bg: "bg-sky-50",
    });
  }

  // Always show Instagram
  const instagramUrl = `https://instagram.com/${influencer.instagramHandle}`;
  contactItems.push({
    icon: AtSign,
    label: "Instagram",
    value: `@${influencer.instagramHandle}`,
    href: instagramUrl,
    copyValue: instagramUrl,
    color: "text-violet-600",
    bg: "bg-violet-50",
  });

  if (contactItems.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      className="col-span-12 md:col-span-4 flex flex-col gap-6"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Contact Information</h2>
      </div>

      <div className="rounded-3xl border border-[var(--color-border)] bg-white shadow-sm p-6 flex flex-col gap-3">
        {contactItems.map((item, idx) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.05 * idx }}
            className="group flex items-center gap-4 p-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-900)] hover:bg-[var(--color-surface-800)] hover:shadow-sm transition-all"
          >
            <div className={`p-2.5 rounded-xl ${item.bg} shrink-0`}>
              <item.icon className={`w-5 h-5 ${item.color}`} />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                {item.label}
              </p>
              {item.href ? (
                <a
                  href={item.href}
                  target={item.label === "Email" ? undefined : "_blank"}
                  rel="noreferrer"
                  className="text-sm font-semibold text-[var(--color-text-primary)] hover:text-[var(--color-brand-600)] transition-colors truncate block"
                >
                  {item.value}
                </a>
              ) : (
                <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
                  {item.value}
                </p>
              )}
            </div>

            <div className="flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => copyToClipboard(item.copyValue, item.label)}
                className="p-2 rounded-xl hover:bg-white/80 transition-colors"
                title={`Copy ${item.label}`}
              >
                {copiedField === item.label ? (
                  <Check className="w-4 h-4 text-emerald-500" />
                ) : (
                  <Copy className="w-4 h-4 text-[var(--color-text-muted)]" />
                )}
              </button>
              {item.href && (
                <a
                  href={item.href}
                  target={item.label === "Email" ? undefined : "_blank"}
                  rel="noreferrer"
                  className="p-2 rounded-xl hover:bg-white/80 transition-colors"
                  title={`Open ${item.label}`}
                >
                  <ExternalLink className="w-4 h-4 text-[var(--color-text-muted)]" />
                </a>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
