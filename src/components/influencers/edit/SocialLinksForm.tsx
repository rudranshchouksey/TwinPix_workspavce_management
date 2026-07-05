"use client";

import { type ExtendedMetadata } from "@/lib/validations/updateInfluencerSchema";
import { Globe, Video, Briefcase, MessageSquare, Users, AtSign, Lock } from "lucide-react";

interface SocialLinksFormProps {
  instagramHandle: string;
  extendedMetadata: ExtendedMetadata;
  onMetadataChange: (metadata: Partial<ExtendedMetadata>) => void;
}

const SOCIAL_PLATFORMS = [
  {
    key: "youtube" as const,
    label: "YouTube",
    icon: Video,
    placeholder: "https://youtube.com/@channel",
    color: "text-red-500",
    bgColor: "bg-red-50",
  },
  {
    key: "linkedin" as const,
    label: "LinkedIn",
    icon: Briefcase,
    placeholder: "https://linkedin.com/in/profile",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  {
    key: "twitter" as const,
    label: "Twitter / X",
    icon: MessageSquare,
    placeholder: "https://twitter.com/handle",
    color: "text-sky-500",
    bgColor: "bg-sky-50",
  },
  {
    key: "facebook" as const,
    label: "Facebook",
    icon: Users,
    placeholder: "https://facebook.com/page",
    color: "text-blue-500",
    bgColor: "bg-blue-50",
  },
];

export function SocialLinksForm({
  instagramHandle,
  extendedMetadata,
  onMetadataChange,
}: SocialLinksFormProps) {
  const socialLinks = extendedMetadata.socialLinks || {};

  const handleLinkChange = (key: string, value: string) => {
    onMetadataChange({
      socialLinks: {
        ...socialLinks,
        [key]: value,
      },
    });
  };

  const inputClass =
    "w-full bg-[var(--color-surface-900)] border border-[var(--color-border)] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)] focus:border-transparent shadow-sm font-medium transition-all";
  const labelClass =
    "block text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-1.5";

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 pb-1">
        <div className="p-1.5 rounded-lg bg-violet-50">
          <Globe className="w-4 h-4 text-violet-600" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
            Social Profiles
          </h3>
          <p className="text-xs text-[var(--color-text-muted)]">
            Connect all social media accounts
          </p>
        </div>
      </div>

      {/* Instagram — Read Only */}
      <div className="flex items-center gap-3 p-3.5 rounded-xl border border-[var(--color-border)] bg-gradient-to-r from-pink-50/50 to-violet-50/50">
        <div className="p-2 rounded-lg bg-gradient-to-br from-pink-500 to-violet-500 shrink-0">
          <AtSign className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
            Instagram
          </p>
          <p className="text-sm font-bold text-[var(--color-text-primary)] truncate">
            @{instagramHandle}
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-violet-600 bg-violet-100 px-2 py-1 rounded-full">
          <Lock className="w-3 h-3" />
          Primary
        </div>
      </div>

      {/* Editable Social Links */}
      <div className="space-y-3">
        {SOCIAL_PLATFORMS.map((platform) => (
          <div key={platform.key}>
            <label className={labelClass}>
              <span className="flex items-center gap-1.5">
                <platform.icon className={`w-3.5 h-3.5 ${platform.color}`} />
                {platform.label}
              </span>
            </label>
            <input
              type="url"
              placeholder={platform.placeholder}
              value={(socialLinks as any)[platform.key] || ""}
              onChange={(e) => handleLinkChange(platform.key, e.target.value)}
              className={inputClass}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
