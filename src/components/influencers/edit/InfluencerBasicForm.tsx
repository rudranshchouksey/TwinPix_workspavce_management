"use client";

import { useEffect, useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CATEGORY_PRESETS } from "@/lib/validations/updateInfluencerSchema";
import { ProfileImageUploader } from "./ProfileImageUploader";
import { getAllUsersBasicAction } from "@/actions/users";
import type { UpdateInfluencerInput } from "@/lib/validations/updateInfluencerSchema";

interface InfluencerBasicFormProps {
  form: UseFormReturn<UpdateInfluencerInput, any, any>;
  influencer: any;
}

export function InfluencerBasicForm({ form, influencer }: InfluencerBasicFormProps) {
  const [managers, setManagers] = useState<any[]>([]);
  const [showCustomCategory, setShowCustomCategory] = useState(false);

  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = form;

  const currentCategory = watch("category");

  useEffect(() => {
    getAllUsersBasicAction().then(setManagers).catch(console.error);
  }, []);

  useEffect(() => {
    if (currentCategory && !CATEGORY_PRESETS.includes(currentCategory)) {
      setShowCustomCategory(true);
    }
  }, [currentCategory]);

  const handleImageUploaded = (url: string) => {
    setValue("profileImage", url, { shouldDirty: true });
  };

  const inputClass =
    "w-full bg-[var(--color-surface-900)] border border-[var(--color-border)] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)] focus:border-transparent shadow-sm font-medium transition-all";
  const labelClass =
    "block text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-1.5";
  const errorClass = "text-[11px] font-medium text-red-500 mt-1";

  return (
    <div className="space-y-6">
      {/* Profile Image Upload */}
      <ProfileImageUploader
        influencerId={influencer.id}
        currentImage={influencer.profileImage}
        instagramHandle={influencer.instagramHandle}
        onImageUploaded={handleImageUploaded}
      />

      <div className="h-px bg-[var(--color-border)]" />

      {/* Name & Handle */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Full Name</label>
          <input
            {...register("influencerName")}
            placeholder="e.g. Jane Doe"
            className={inputClass}
          />
          {errors.influencerName && (
            <p className={errorClass}>{errors.influencerName.message}</p>
          )}
        </div>
        <div>
          <label className={labelClass}>
            Instagram Username <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[var(--color-text-muted)] font-medium">
              @
            </span>
            <input
              {...register("instagramHandle")}
              placeholder="username"
              className={`${inputClass} pl-8`}
            />
          </div>
          {errors.instagramHandle && (
            <p className={errorClass}>{errors.instagramHandle.message}</p>
          )}
        </div>
      </div>

      {/* Category */}
      <div>
        <label className={labelClass}>
          Category <span className="text-red-400">*</span>
        </label>
        {showCustomCategory ? (
          <div className="flex gap-2">
            <input
              {...register("category")}
              placeholder="Custom category"
              className={`${inputClass} flex-1`}
            />
            <button
              type="button"
              onClick={() => {
                setShowCustomCategory(false);
                setValue("category", "");
              }}
              className="px-3 py-2 text-xs font-semibold text-[var(--color-brand-600)] hover:bg-[var(--color-surface-800)] rounded-xl transition-colors"
            >
              Presets
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1.5">
              {CATEGORY_PRESETS.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setValue("category", cat, { shouldDirty: true })}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all ${
                    currentCategory === cat
                      ? "bg-[var(--color-brand-500)] text-white border-[var(--color-brand-500)] shadow-sm"
                      : "bg-[var(--color-surface-900)] text-[var(--color-text-secondary)] border-[var(--color-border)] hover:border-[var(--color-brand-300)]"
                  }`}
                >
                  {cat}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setShowCustomCategory(true)}
                className="px-2.5 py-1 rounded-full text-[11px] font-bold border border-dashed border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-brand-300)] transition-colors"
              >
                + Custom
              </button>
            </div>
          </div>
        )}
        {errors.category && (
          <p className={errorClass}>{errors.category.message}</p>
        )}
      </div>

      {/* Bio */}
      <div>
        <label className={labelClass}>Bio</label>
        <textarea
          {...register("profileDescription")}
          placeholder="Influencer bio or description..."
          rows={3}
          className={`${inputClass} min-h-[80px] resize-none`}
        />
      </div>

      <div className="h-px bg-[var(--color-border)]" />

      {/* Contact Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Email</label>
          <input
            {...register("email")}
            type="email"
            placeholder="contact@example.com"
            className={inputClass}
          />
          {errors.email && (
            <p className={errorClass}>{errors.email.message}</p>
          )}
        </div>
        <div>
          <label className={labelClass}>Phone Number</label>
          <input
            {...register("phoneNumber")}
            type="tel"
            placeholder="+91 98765 43210"
            className={inputClass}
          />
          {errors.phoneNumber && (
            <p className={errorClass}>{errors.phoneNumber.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Location</label>
          <input
            {...register("location")}
            placeholder="e.g. Mumbai, India"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Website</label>
          <input
            {...register("profileLink")}
            type="url"
            placeholder="https://..."
            className={inputClass}
          />
          {errors.profileLink && (
            <p className={errorClass}>{errors.profileLink.message}</p>
          )}
        </div>
      </div>

      {/* Assigned Manager */}
      <div>
        <label className={labelClass}>Assigned Manager</label>
        <select
          {...register("assignedManagerId")}
          className={inputClass}
        >
          <option value="">No manager assigned</option>
          {managers.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name || m.email} ({m.role})
            </option>
          ))}
        </select>
      </div>

      {/* Notes */}
      <div>
        <label className={labelClass}>Internal Notes</label>
        <textarea
          {...register("notes")}
          placeholder="Internal notes about this influencer..."
          rows={3}
          className={`${inputClass} min-h-[80px] resize-none`}
        />
        <p className="text-[10px] text-[var(--color-text-disabled)] mt-1">
          Previous versions of notes are preserved automatically.
        </p>
      </div>
    </div>
  );
}
