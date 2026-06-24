"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import {
  NotebookPen,
  Handshake,
  Wallet,
  Paperclip,
  Activity as ActivityIcon,
  Save,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FileList } from "@/components/files/file-list";
import { RateCardEditor } from "./rate-card-editor";
import { updateInfluencerNotesAction, updateInfluencerNegotiationTermsAction } from "@/actions/influencers";

function TextEditorPanel({
  influencerId,
  initialValue,
  placeholder,
  onSave,
}: {
  influencerId: string;
  initialValue: string | null;
  placeholder: string;
  onSave: (influencerId: string, value: string) => Promise<unknown>;
}) {
  const [value, setValue] = useState(initialValue || "");
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const hasChanges = value !== (initialValue || "");

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(influencerId, value);
      setSaved(true);
      toast.success("Saved successfully");
      setTimeout(() => setSaved(false), 2500);
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-amber-50/50 flex flex-col relative overflow-hidden min-h-[220px]">
      <div className="h-10 border-b border-amber-200/60 bg-amber-100/50 flex items-center px-4 justify-end shrink-0">
        {hasChanges && !saved && (
          <span className="text-[10px] font-bold text-amber-600 flex items-center">
            <AlertCircle className="w-3 h-3 mr-1" /> Unsaved
          </span>
        )}
        {saved && (
          <span className="flex items-center text-emerald-600 text-xs font-bold">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Saved
          </span>
        )}
      </div>
      <textarea
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setSaved(false);
        }}
        placeholder={placeholder}
        className="flex-1 w-full p-5 bg-transparent resize-none outline-none text-[var(--color-text-primary)] leading-relaxed font-medium placeholder:text-amber-900/30"
      />
      <div className="p-3 border-t border-amber-200/60 bg-white shrink-0">
        <Button onClick={handleSave} disabled={isSaving || !hasChanges} className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-sm disabled:opacity-50">
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
}

export function CreatorCollaborationSection({
  influencer,
  activity,
}: {
  influencer: any;
  activity: any[];
}) {
  return (
    <div className="col-span-12 flex flex-col gap-6">
      <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Internal Collaboration</h2>

      <div className="rounded-3xl border border-[var(--color-border)] bg-white p-6 shadow-sm">
        <Tabs defaultValue="notes" className="w-full">
          <TabsList className="bg-stone-100/80 p-1 flex-wrap h-auto">
            <TabsTrigger value="notes" className="text-xs font-semibold data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-4 py-1.5 flex items-center gap-2">
              <NotebookPen className="w-3.5 h-3.5" /> Notes
            </TabsTrigger>
            <TabsTrigger value="negotiation" className="text-xs font-semibold data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-4 py-1.5 flex items-center gap-2">
              <Handshake className="w-3.5 h-3.5" /> Negotiation Terms
            </TabsTrigger>
            <TabsTrigger value="rates" className="text-xs font-semibold data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-4 py-1.5 flex items-center gap-2">
              <Wallet className="w-3.5 h-3.5" /> Rate Card
            </TabsTrigger>
            <TabsTrigger value="files" className="text-xs font-semibold data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-4 py-1.5 flex items-center gap-2">
              <Paperclip className="w-3.5 h-3.5" /> Attachments
            </TabsTrigger>
            <TabsTrigger value="activity" className="text-xs font-semibold data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-4 py-1.5 flex items-center gap-2">
              <ActivityIcon className="w-3.5 h-3.5" /> Activity Timeline
            </TabsTrigger>
          </TabsList>

          <TabsContent value="notes" className="mt-5 outline-none">
            <TextEditorPanel
              influencerId={influencer.id}
              initialValue={influencer.notes}
              placeholder="Jot down notes, preferences, and brief details here..."
              onSave={updateInfluencerNotesAction}
            />
          </TabsContent>

          <TabsContent value="negotiation" className="mt-5 outline-none">
            <TextEditorPanel
              influencerId={influencer.id}
              initialValue={influencer.negotiationTerms}
              placeholder="Track negotiation terms, agreed rates, exclusivity clauses, payment terms..."
              onSave={updateInfluencerNegotiationTermsAction}
            />
          </TabsContent>

          <TabsContent value="rates" className="mt-5 outline-none max-w-sm">
            <RateCardEditor influencer={influencer} />
          </TabsContent>

          <TabsContent value="files" className="mt-5 outline-none">
            <FileList entityType="INFLUENCER" entityId={influencer.id} title="" />
          </TabsContent>

          <TabsContent value="activity" className="mt-5 outline-none">
            {activity.length === 0 ? (
              <p className="text-sm text-[var(--color-text-disabled)] py-8 text-center">No activity recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {activity.map((a: any) => (
                  <div key={a.id} className="flex items-start gap-3 p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-900)]">
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-brand-500)] mt-2 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--color-text-secondary)]">{a.details}</p>
                      <p className="text-[11px] text-[var(--color-text-disabled)] mt-0.5">
                        {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
