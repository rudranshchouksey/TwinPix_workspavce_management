"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  User,
  DollarSign,
  GitBranch,
  Globe,
  BarChart3,
  Save,
  X,
  Keyboard,
  AlertTriangle,
} from "lucide-react";
import {
  updateInfluencerSchema,
  parseExtendedMetadata,
  serializeExtendedMetadata,
  type UpdateInfluencerInput,
  type ExtendedMetadata,
} from "@/lib/validations/updateInfluencerSchema";
import { updateInfluencerAction } from "@/actions/influencers";
import { getInfluencerByIdAction } from "@/actions/influencers";

import { InfluencerBasicForm } from "./InfluencerBasicForm";
import { BusinessRatesForm } from "./BusinessRatesForm";
import { PipelineStatusForm } from "./PipelineStatusForm";
import { SocialLinksForm } from "./SocialLinksForm";
import { ReadOnlyMetricsPanel } from "./ReadOnlyMetricsPanel";

interface EditInfluencerModalProps {
  influencerId: string;
  isOpen: boolean;
  onClose: () => void;
}

const TABS = [
  { id: "basic", label: "Basic Info", icon: User },
  { id: "business", label: "Rates", icon: DollarSign },
  { id: "pipeline", label: "Pipeline", icon: GitBranch },
  { id: "social", label: "Social", icon: Globe },
  { id: "metrics", label: "Metrics", icon: BarChart3 },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function EditInfluencerModal({
  influencerId,
  isOpen,
  onClose,
}: EditInfluencerModalProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("basic");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [influencer, setInfluencer] = useState<any>(null);
  const [extendedMetadata, setExtendedMetadata] = useState<ExtendedMetadata>({
    tags: [],
    socialLinks: {},
    notesHistory: [],
  });
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
  const [originalData, setOriginalData] = useState<any>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const form = useForm<UpdateInfluencerInput, any, any>({
    resolver: zodResolver(updateInfluencerSchema) as any,
    defaultValues: {
      influencerName: "",
      instagramHandle: "",
      category: "",
      profileDescription: "",
      email: "",
      phoneNumber: "",
      location: "",
      profileLink: "",
      notes: "",
      assignedManagerId: "",
      reelRate: undefined,
      storyRate: undefined,
      status: "NEW_LEAD",
      profileImage: "",
    },
  });

  // Load influencer data when modal opens
  useEffect(() => {
    if (!isOpen || !influencerId) return;

    setIsLoading(true);
    setActiveTab("basic");

    getInfluencerByIdAction(influencerId)
      .then((data) => {
        if (!data) {
          toast.error("Influencer not found");
          onClose();
          return;
        }

        // Serialize dates
        const serialized = JSON.parse(JSON.stringify(data));
        setInfluencer(serialized);

        // Parse extended metadata from negotiationTerms
        const metadata = parseExtendedMetadata(serialized.negotiationTerms);
        setExtendedMetadata(metadata);

        // Prepare form values
        const formValues: UpdateInfluencerInput = {
          influencerName: serialized.influencerName || "",
          instagramHandle: serialized.instagramHandle || "",
          category: serialized.category || "",
          profileDescription: serialized.profileDescription || "",
          email: serialized.email || "",
          phoneNumber: serialized.phoneNumber || "",
          location: serialized.location || "",
          profileLink: serialized.profileLink || "",
          notes: serialized.notes || "",
          assignedManagerId: serialized.assignedManagerId || "",
          reelRate: serialized.reelRate ?? undefined,
          storyRate: serialized.storyRate ?? undefined,
          status: serialized.status || "NEW_LEAD",
          profileImage: serialized.profileImage || "",
        };

        form.reset(formValues);
        setOriginalData(formValues);
      })
      .catch((err) => {
        toast.error("Failed to load influencer data");
        console.error(err);
        onClose();
      })
      .finally(() => setIsLoading(false));
  }, [isOpen, influencerId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle extended metadata changes
  const handleMetadataChange = useCallback(
    (updates: Partial<ExtendedMetadata>) => {
      setExtendedMetadata((prev) => ({ ...prev, ...updates }));
    },
    []
  );

  // Check if form has changes
  const hasChanges = useCallback(() => {
    return form.formState.isDirty || JSON.stringify(extendedMetadata) !== JSON.stringify(parseExtendedMetadata(influencer?.negotiationTerms));
  }, [form.formState.isDirty, extendedMetadata, influencer]);

  // Handle close with unsaved changes warning
  const handleClose = useCallback(() => {
    if (hasChanges()) {
      setShowUnsavedWarning(true);
    } else {
      onClose();
    }
  }, [hasChanges, onClose]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handler = (e: KeyboardEvent) => {
      // Ctrl+S to save
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        formRef.current?.requestSubmit();
      }
      // ESC to close (with warning)
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, handleClose]);

  // Save handler
  const onSubmit = async (data: UpdateInfluencerInput) => {
    setIsSaving(true);

    // Optimistic UI: store current influencer state for rollback
    const previousInfluencer = { ...influencer };

    try {
      // Merge extended metadata into negotiationTerms
      const mergedNegotiationTerms = serializeExtendedMetadata(extendedMetadata);

      // Build the Prisma update payload (only Prisma-native fields)
      const updatePayload: Record<string, any> = {
        influencerName: data.influencerName || null,
        instagramHandle: data.instagramHandle,
        category: data.category,
        profileDescription: data.profileDescription || null,
        email: data.email || null,
        phoneNumber: data.phoneNumber || null,
        location: data.location || null,
        profileLink: data.profileLink || null,
        notes: data.notes || null,
        assignedManagerId: data.assignedManagerId || null,
        reelRate: data.reelRate ?? null,
        storyRate: data.storyRate ?? null,
        status: data.status,
        profileImage: data.profileImage || null,
        negotiationTerms: mergedNegotiationTerms,
      };

      // Optimistic: update local state immediately
      setInfluencer((prev: any) => ({ ...prev, ...updatePayload }));

      await updateInfluencerAction(influencer.id, updatePayload);

      toast.success("Influencer updated successfully.", {
        description: `Changes saved for ${data.influencerName || `@${data.instagramHandle}`}`,
      });

      router.refresh();
      onClose();
    } catch (error: any) {
      // Rollback optimistic update
      setInfluencer(previousInfluencer);
      toast.error(error.message || "Failed to update influencer", {
        description: "Your changes were not saved. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent
          showCloseButton={false}
          className="sm:max-w-[820px] max-h-[90vh] bg-white border-[var(--color-border)] text-[var(--color-text-primary)] shadow-executive-xl rounded-2xl p-0 flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="shrink-0 px-6 pt-5 pb-0">
            <div className="flex items-center justify-between mb-1">
              <DialogHeader className="flex-1">
                <DialogTitle className="text-xl font-extrabold tracking-tight">
                  Edit Influencer
                </DialogTitle>
                <DialogDescription className="text-sm text-[var(--color-text-muted)] font-medium">
                  {isLoading
                    ? "Loading..."
                    : influencer
                    ? `@${influencer.instagramHandle}`
                    : ""}
                </DialogDescription>
              </DialogHeader>

              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-medium text-[var(--color-text-disabled)] bg-[var(--color-surface-900)] px-2 py-1 rounded-lg border border-[var(--color-border)]">
                  <Keyboard className="w-3 h-3" />
                  Ctrl+S save · ESC close
                </div>
                <button
                  onClick={handleClose}
                  className="p-1.5 rounded-lg hover:bg-[var(--color-surface-800)] transition-colors"
                >
                  <X className="w-4 h-4 text-[var(--color-text-muted)]" />
                </button>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-0.5 mt-3 -mb-px border-b border-[var(--color-border)] overflow-x-auto scrollbar-hide">
              {TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      relative flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold transition-all rounded-t-lg shrink-0
                      ${
                        isActive
                          ? "text-[var(--color-brand-600)] bg-white"
                          : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-900)]"
                      }
                    `}
                  >
                    <tab.icon className="w-3.5 h-3.5" />
                    {tab.label}
                    {isActive && (
                      <motion.div
                        layoutId="activeEditTab"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-brand-500)] rounded-full"
                        transition={{ type: "spring", stiffness: 500, damping: 35 }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center p-12">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 text-[var(--color-brand-500)] animate-spin" />
                <p className="text-sm font-medium text-[var(--color-text-muted)]">
                  Loading influencer data...
                </p>
              </div>
            </div>
          ) : influencer ? (
            <form
              ref={formRef}
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex flex-col flex-1 min-h-0"
            >
              {/* Scrollable Tab Content */}
              <div className="flex-1 overflow-y-auto px-6 py-5 min-h-0">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.15 }}
                  >
                    {activeTab === "basic" && (
                      <InfluencerBasicForm form={form} influencer={influencer} />
                    )}
                    {activeTab === "business" && (
                      <BusinessRatesForm
                        form={form}
                        extendedMetadata={extendedMetadata}
                        onMetadataChange={handleMetadataChange}
                      />
                    )}
                    {activeTab === "pipeline" && (
                      <PipelineStatusForm
                        form={form}
                        extendedMetadata={extendedMetadata}
                        onMetadataChange={handleMetadataChange}
                      />
                    )}
                    {activeTab === "social" && (
                      <SocialLinksForm
                        instagramHandle={influencer.instagramHandle}
                        extendedMetadata={extendedMetadata}
                        onMetadataChange={handleMetadataChange}
                      />
                    )}
                    {activeTab === "metrics" && (
                      <ReadOnlyMetricsPanel influencer={influencer} />
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Sticky Footer */}
              <div className="shrink-0 px-6 py-4 bg-gradient-to-t from-white via-white to-white/80 border-t border-[var(--color-border)] flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {form.formState.isDirty && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100"
                    >
                      Unsaved changes
                    </motion.span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    disabled={isSaving}
                    className="rounded-xl font-bold px-5"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSaving}
                    className="rounded-xl font-bold px-5 bg-[var(--color-brand-500)] hover:bg-[var(--color-brand-600)] text-white shadow-sm"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Unsaved Changes Warning */}
      <Dialog
        open={showUnsavedWarning}
        onOpenChange={setShowUnsavedWarning}
      >
        <DialogContent className="sm:max-w-[400px] bg-white rounded-2xl shadow-executive-xl">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              <div className="p-2 rounded-xl bg-amber-50">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <DialogTitle className="text-lg font-bold">
                Unsaved Changes
              </DialogTitle>
            </div>
            <DialogDescription className="text-sm text-[var(--color-text-muted)]">
              You have unsaved changes that will be lost. Are you sure you want
              to close?
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-end gap-2 mt-4">
            <Button
              variant="outline"
              className="rounded-xl font-bold"
              onClick={() => setShowUnsavedWarning(false)}
            >
              Keep Editing
            </Button>
            <Button
              variant="destructive"
              className="rounded-xl font-bold"
              onClick={() => {
                setShowUnsavedWarning(false);
                form.reset();
                onClose();
              }}
            >
              Discard Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
