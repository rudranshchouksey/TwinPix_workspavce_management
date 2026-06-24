"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Sparkles,
  Loader2,
  Copy,
  RotateCcw,
  Target,
  Users,
  ListChecks,
  DollarSign,
  CalendarRange,
  Wand2,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { generateCampaignBriefAction } from "@/actions/campaign-brief";
import type { CampaignBriefResponse } from "@/services/ai/campaign-brief.service";

interface CampaignBriefModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaignId?: string;
  campaignName?: string;
  clients?: any[];
  onCreateFromBrief?: (input: { name: string; budget: number; deliverables: string; notes: string; clientId?: string }) => void;
}

export function CampaignBriefModal({
  isOpen,
  onClose,
  campaignId,
  campaignName,
  clients = [],
  onCreateFromBrief,
}: CampaignBriefModalProps) {
  const isExistingMode = !!campaignId;
  const [brief, setBrief] = useState<CampaignBriefResponse | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const [name, setName] = useState("");
  const [clientId, setClientId] = useState("");
  const [objective, setObjective] = useState("");
  const [targetCategory, setTargetCategory] = useState("");
  const [budget, setBudget] = useState("");

  useEffect(() => {
    if (isOpen && isExistingMode) {
      handleGenerate();
    }
    if (!isOpen) {
      setBrief(null);
      if (!isExistingMode) {
        setName("");
        setClientId("");
        setObjective("");
        setTargetCategory("");
        setBudget("");
      }
    }
  }, [isOpen]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const result = await generateCampaignBriefAction(
        isExistingMode
          ? { campaignId }
          : {
              campaignName: name || undefined,
              clientId: clientId || undefined,
              objective: objective || undefined,
              targetCategory: targetCategory || undefined,
              budget: budget ? Number(budget) : undefined,
            }
      );
      if (result.success) {
        setBrief(result.brief);
      } else {
        toast.error(result.error);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to generate brief");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!brief) return;
    const text = `OBJECTIVE\n${brief.objective}\n\nTARGET AUDIENCE\n${brief.targetAudience}\n\nRECOMMENDED INFLUENCER PROFILE\n${brief.recommendedInfluencerProfile}\n\nSUGGESTED DELIVERABLES\n${brief.suggestedDeliverables.map((d) => `- ${d}`).join("\n")}\n\nSUGGESTED BUDGET\n$${brief.suggestedBudgetRange.min.toLocaleString()} - $${brief.suggestedBudgetRange.max.toLocaleString()}\n\nTIMELINE\n${brief.recommendedTimelineWeeks} weeks\n\nSUMMARY\n${brief.summary}`;
    navigator.clipboard.writeText(text);
    toast.success("Brief copied to clipboard");
  };

  const handleCreateFromBrief = () => {
    if (!brief) return;
    onCreateFromBrief?.({
      name: name || `${targetCategory || "New"} Campaign`,
      budget: brief.suggestedBudgetRange.min,
      deliverables: brief.suggestedDeliverables.join("\n"),
      notes: `${brief.summary}\n\nObjective: ${brief.objective}\nTarget audience: ${brief.targetAudience}\nRecommended creator profile: ${brief.recommendedInfluencerProfile}`,
      clientId: clientId || undefined,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[560px] p-0 overflow-hidden gap-0">
        <DialogHeader className="p-6 pb-4 border-b border-[rgba(0,0,0,0.08)] bg-gradient-to-b from-[var(--color-brand-50)]/60 to-transparent">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-[var(--color-text-primary)]">
            <Sparkles className="h-5 w-5 text-[var(--color-brand-500)]" />
            AI Campaign Brief
          </DialogTitle>
          <DialogDescription>
            {isExistingMode
              ? `Strategic brief for "${campaignName}", generated from current campaign data.`
              : "Describe the concept and let Twin AI draft a full campaign brief."}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="p-6 space-y-5">
            {!isExistingMode && !brief && (
              <div className="space-y-4">
                <Input placeholder="Campaign name (optional)" value={name} onChange={(e) => setName(e.target.value)} />
                <Select value={clientId} onValueChange={(v) => setClientId(v || "")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Client (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.companyName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Textarea
                  placeholder="Objective (e.g. Drive awareness for our new skincare line among Gen Z women)"
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  className="min-h-[70px] resize-none"
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    placeholder="Target creator category"
                    value={targetCategory}
                    onChange={(e) => setTargetCategory(e.target.value)}
                  />
                  <Input
                    type="number"
                    placeholder="Indicative budget ($)"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                  />
                </div>
                <Button onClick={handleGenerate} disabled={isGenerating} className="w-full">
                  {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                  Generate Brief
                </Button>
              </div>
            )}

            {isGenerating && !brief && (
              <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                <Loader2 className="h-6 w-6 animate-spin text-[var(--color-brand-500)]" />
                <p className="text-sm text-[var(--color-text-secondary)]">Drafting your campaign brief…</p>
              </div>
            )}

            {brief && (
              <div className="space-y-4">
                <BriefSection icon={Target} label="Objective" content={brief.objective} />
                <BriefSection icon={Users} label="Target Audience" content={brief.targetAudience} />
                <BriefSection icon={Sparkles} label="Recommended Influencer Profile" content={brief.recommendedInfluencerProfile} />
                <BriefSection
                  icon={ListChecks}
                  label="Suggested Deliverables"
                  content={
                    <ul className="space-y-1">
                      {brief.suggestedDeliverables.map((d, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-[var(--color-text-secondary)]">
                          <span className="mt-1.5 h-1 w-1 rounded-full bg-[var(--color-brand-500)] shrink-0" />
                          {d}
                        </li>
                      ))}
                    </ul>
                  }
                />
                <div className="grid grid-cols-2 gap-3">
                  <BriefSection
                    icon={DollarSign}
                    label="Suggested Budget"
                    content={`$${brief.suggestedBudgetRange.min.toLocaleString()} - $${brief.suggestedBudgetRange.max.toLocaleString()}`}
                  />
                  <BriefSection icon={CalendarRange} label="Timeline" content={`${brief.recommendedTimelineWeeks} weeks`} />
                </div>
                <div className="rounded-lg bg-[var(--color-brand-50)] border border-[var(--color-brand-100)] p-4">
                  <p className="text-sm text-[var(--color-text-primary)] leading-relaxed">{brief.summary}</p>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {brief && (
          <div className="p-4 border-t border-[rgba(0,0,0,0.08)] flex items-center justify-end gap-2 bg-[var(--color-surface-900)]">
            <Button variant="ghost" size="sm" onClick={handleGenerate} disabled={isGenerating}>
              <RotateCcw className="mr-2 h-3.5 w-3.5" />
              Regenerate
            </Button>
            <Button variant="outline" size="sm" onClick={handleCopy}>
              <Copy className="mr-2 h-3.5 w-3.5" />
              Copy
            </Button>
            {!isExistingMode && onCreateFromBrief && (
              <Button size="sm" onClick={handleCreateFromBrief}>
                Create Campaign from Brief
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function BriefSection({ icon: Icon, label, content }: { icon: any; label: string; content: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon className="h-3.5 w-3.5 text-[var(--color-brand-500)]" />
        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">{label}</span>
      </div>
      {typeof content === "string" ? (
        <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{content}</p>
      ) : (
        content
      )}
    </div>
  );
}
