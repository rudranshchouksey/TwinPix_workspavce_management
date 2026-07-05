"use client";

import { useState, useCallback } from "react";
import { UseFormReturn } from "react-hook-form";
import { STATUS_CONFIG, type ExtendedMetadata } from "@/lib/validations/updateInfluencerSchema";
import { Check, X, Plus, Tag, GitBranch } from "lucide-react";
import type { UpdateInfluencerInput } from "@/lib/validations/updateInfluencerSchema";

interface PipelineStatusFormProps {
  form: UseFormReturn<UpdateInfluencerInput, any, any>;
  extendedMetadata: ExtendedMetadata;
  onMetadataChange: (metadata: Partial<ExtendedMetadata>) => void;
}

export function PipelineStatusForm({
  form,
  extendedMetadata,
  onMetadataChange,
}: PipelineStatusFormProps) {
  const { setValue, watch } = form;
  const currentStatus = watch("status");
  const [newTag, setNewTag] = useState("");

  const tags = extendedMetadata.tags || [];

  const handleAddTag = useCallback(() => {
    const trimmed = newTag.trim();
    if (!trimmed) return;
    if (tags.includes(trimmed)) {
      setNewTag("");
      return;
    }
    onMetadataChange({ tags: [...tags, trimmed] });
    setNewTag("");
  }, [newTag, tags, onMetadataChange]);

  const handleRemoveTag = useCallback(
    (tag: string) => {
      onMetadataChange({ tags: tags.filter((t) => t !== tag) });
    },
    [tags, onMetadataChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleAddTag();
      }
    },
    [handleAddTag]
  );

  const inputClass =
    "w-full bg-[var(--color-surface-900)] border border-[var(--color-border)] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)] focus:border-transparent shadow-sm font-medium transition-all";
  const labelClass =
    "block text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-1.5";

  return (
    <div className="space-y-6">
      {/* Pipeline Status */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 rounded-lg bg-sky-50">
            <GitBranch className="w-4 h-4 text-sky-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
              Pipeline Status
            </h3>
            <p className="text-xs text-[var(--color-text-muted)]">
              Track this influencer through your workflow
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {STATUS_CONFIG.map((status) => {
            const isActive = currentStatus === status.value;
            return (
              <button
                key={status.value}
                type="button"
                onClick={() =>
                  setValue("status", status.value as any, { shouldDirty: true })
                }
                className={`
                  relative flex items-center gap-2.5 px-3.5 py-3 rounded-xl border-2 transition-all text-left
                  ${
                    isActive
                      ? `${status.color} border-current shadow-sm`
                      : "border-[var(--color-border)] bg-white hover:border-[var(--color-border)] hover:bg-[var(--color-surface-900)]"
                  }
                `}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: status.dot }}
                />
                <span
                  className={`text-xs font-bold ${
                    isActive
                      ? ""
                      : "text-[var(--color-text-secondary)]"
                  }`}
                >
                  {status.label}
                </span>
                {isActive && (
                  <Check className="w-3.5 h-3.5 ml-auto opacity-70" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="h-px bg-[var(--color-border)]" />

      {/* Tags */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 rounded-lg bg-amber-50">
            <Tag className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
              Tags
            </h3>
            <p className="text-xs text-[var(--color-text-muted)]">
              Organize with custom labels
            </p>
          </div>
        </div>

        {/* Tag Input */}
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a tag and press Enter..."
            className={`${inputClass} flex-1`}
          />
          <button
            type="button"
            onClick={handleAddTag}
            disabled={!newTag.trim()}
            className="px-3 py-2 rounded-xl bg-[var(--color-brand-500)] text-white text-sm font-bold hover:bg-[var(--color-brand-600)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Tag Cloud */}
        {tags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--color-brand-50)] text-[var(--color-brand-700)] text-[11px] font-bold border border-[var(--color-brand-100)] group"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-0.5 p-0.5 rounded-full hover:bg-[var(--color-brand-200)] transition-colors"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-[var(--color-text-disabled)] italic py-2">
            No tags added yet.
          </p>
        )}
      </div>
    </div>
  );
}
