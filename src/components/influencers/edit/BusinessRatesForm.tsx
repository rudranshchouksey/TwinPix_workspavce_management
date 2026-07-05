"use client";

import { UseFormReturn } from "react-hook-form";
import {
  PAYMENT_METHODS,
  CURRENCIES,
  type ExtendedMetadata,
} from "@/lib/validations/updateInfluencerSchema";
import { DollarSign, CreditCard, Banknote } from "lucide-react";
import type { UpdateInfluencerInput } from "@/lib/validations/updateInfluencerSchema";

interface BusinessRatesFormProps {
  form: UseFormReturn<UpdateInfluencerInput, any, any>;
  extendedMetadata: ExtendedMetadata;
  onMetadataChange: (metadata: Partial<ExtendedMetadata>) => void;
}

export function BusinessRatesForm({
  form,
  extendedMetadata,
  onMetadataChange,
}: BusinessRatesFormProps) {
  const {
    register,
    formState: { errors },
  } = form;

  const inputClass =
    "w-full bg-[var(--color-surface-900)] border border-[var(--color-border)] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)] focus:border-transparent shadow-sm font-medium transition-all";
  const labelClass =
    "block text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-1.5";
  const errorClass = "text-[11px] font-medium text-red-500 mt-1";

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center gap-2 pb-2">
        <div className="p-1.5 rounded-lg bg-emerald-50">
          <DollarSign className="w-4 h-4 text-emerald-600" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
            Creator Rates
          </h3>
          <p className="text-xs text-[var(--color-text-muted)]">
            Set pricing for different content types
          </p>
        </div>
      </div>

      {/* Rate Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Reel Rate</label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[var(--color-text-muted)] font-medium">
              {extendedMetadata.currency === "INR" ? "₹" : extendedMetadata.currency === "EUR" ? "€" : extendedMetadata.currency === "GBP" ? "£" : "$"}
            </span>
            <input
              {...register("reelRate", { valueAsNumber: true })}
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              className={`${inputClass} pl-8`}
            />
          </div>
          {errors.reelRate && (
            <p className={errorClass}>{errors.reelRate.message}</p>
          )}
        </div>
        <div>
          <label className={labelClass}>Story Rate</label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[var(--color-text-muted)] font-medium">
              {extendedMetadata.currency === "INR" ? "₹" : extendedMetadata.currency === "EUR" ? "€" : extendedMetadata.currency === "GBP" ? "£" : "$"}
            </span>
            <input
              {...register("storyRate", { valueAsNumber: true })}
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              className={`${inputClass} pl-8`}
            />
          </div>
          {errors.storyRate && (
            <p className={errorClass}>{errors.storyRate.message}</p>
          )}
        </div>
        <div>
          <label className={labelClass}>Post Rate</label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[var(--color-text-muted)] font-medium">
              {extendedMetadata.currency === "INR" ? "₹" : extendedMetadata.currency === "EUR" ? "€" : extendedMetadata.currency === "GBP" ? "£" : "$"}
            </span>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={extendedMetadata.postRate ?? ""}
              onChange={(e) =>
                onMetadataChange({
                  postRate: e.target.value ? parseFloat(e.target.value) : null,
                })
              }
              className={`${inputClass} pl-8`}
            />
          </div>
        </div>
        <div>
          <label className={labelClass}>Package Rate</label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[var(--color-text-muted)] font-medium">
              {extendedMetadata.currency === "INR" ? "₹" : extendedMetadata.currency === "EUR" ? "€" : extendedMetadata.currency === "GBP" ? "£" : "$"}
            </span>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={extendedMetadata.packageRate ?? ""}
              onChange={(e) =>
                onMetadataChange({
                  packageRate: e.target.value ? parseFloat(e.target.value) : null,
                })
              }
              className={`${inputClass} pl-8`}
            />
          </div>
        </div>
      </div>

      <div className="h-px bg-[var(--color-border)]" />

      {/* Payment & Currency */}
      <div className="flex items-center gap-2 pb-2">
        <div className="p-1.5 rounded-lg bg-violet-50">
          <CreditCard className="w-4 h-4 text-violet-600" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
            Payment Preferences
          </h3>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Preferred Payment Method</label>
          <select
            value={extendedMetadata.paymentMethod || ""}
            onChange={(e) =>
              onMetadataChange({ paymentMethod: e.target.value || null })
            }
            className={inputClass}
          >
            <option value="">Select method...</option>
            {PAYMENT_METHODS.map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Currency</label>
          <select
            value={extendedMetadata.currency || "INR"}
            onChange={(e) => onMetadataChange({ currency: e.target.value })}
            className={inputClass}
          >
            {CURRENCIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
