"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sparkles,
  Copy,
  BookmarkPlus,
  Mail,
  AtSign,
  MessageCircle,
  History,
  Loader2,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { getClientsAction } from "@/actions/clients";
import { getCampaignsAction } from "@/actions/campaigns";
import {
  generateOutreachAction,
  saveOutreachAsTemplateAction,
  listOutreachMessagesAction,
} from "@/actions/outreach";
import { OUTREACH_TONES, OUTREACH_TONE_LABELS, OutreachTone } from "@/lib/validations/outreach";

interface GenerateOutreachModalProps {
  influencerId: string;
  influencerName?: string;
  isOpen: boolean;
  onClose: () => void;
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-7 px-2 text-xs font-semibold text-[var(--color-brand-600)] hover:bg-[var(--color-brand-50)]"
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        toast.success(`${label} copied to clipboard`);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? <Check className="w-3.5 h-3.5 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
      Copy
    </Button>
  );
}

export function GenerateOutreachModal({
  influencerId,
  influencerName,
  isOpen,
  onClose,
}: GenerateOutreachModalProps) {
  const [clients, setClients] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [clientId, setClientId] = useState<string>("");
  const [campaignId, setCampaignId] = useState<string>("");
  const [tone, setTone] = useState<OutreachTone>("PROFESSIONAL");

  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<any | null>(null);

  const [history, setHistory] = useState<any[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);

  const [savingTemplate, setSavingTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    getClientsAction({ limit: 100 }).then((res) => setClients(res.clients)).catch(() => {});
    listOutreachMessagesAction(influencerId).then(setHistory).catch(() => {});
  }, [isOpen, influencerId]);

  useEffect(() => {
    if (!isOpen) return;
    if (!clientId) {
      setCampaigns([]);
      setCampaignId("");
      return;
    }
    getCampaignsAction({ clientId, limit: 50 })
      .then((res) => setCampaigns(res.campaigns))
      .catch(() => {});
    setCampaignId("");
  }, [clientId, isOpen]);

  const selectedClientName = useMemo(
    () => clients.find((c) => c.id === clientId)?.companyName,
    [clients, clientId]
  );

  const runGenerate = async () => {
    setIsGenerating(true);
    try {
      const res = await generateOutreachAction({
        influencerId,
        clientId: clientId || undefined,
        campaignId: campaignId || undefined,
        tone,
      });
      if (res.success) {
        setResult(res.message);
        setHistory((prev) => [res.message, ...prev]);
        setSavingTemplate(false);
      } else {
        toast.error(res.error || "Failed to generate outreach");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to generate outreach");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveTemplate = async () => {
    if (!result) return;
    const name = templateName.trim() || `${influencerName || "Outreach"} — ${OUTREACH_TONE_LABELS[tone]}`;
    try {
      await saveOutreachAsTemplateAction(result.id, name);
      toast.success(`Saved as template: "${name}"`);
      setSavingTemplate(false);
      setTemplateName("");
    } catch (err: any) {
      toast.error(err.message || "Failed to save template");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl gap-0 p-0 overflow-hidden">
        <DialogHeader className="p-5 pb-4 border-b border-[var(--color-border)] bg-gradient-to-b from-[var(--color-brand-50)] to-transparent">
          <DialogTitle className="text-xl font-bold text-[var(--color-text-primary)] flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[var(--color-brand-600)]" />
            Generate Outreach
          </DialogTitle>
          <DialogDescription className="text-[var(--color-text-secondary)]">
            AI-personalized outreach for {influencerName || "this creator"} across email, Instagram, and WhatsApp.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh]">
          <div className="p-5 space-y-5">
            {/* Selection controls */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-1.5">
                  Client (optional)
                </label>
                <Select value={clientId} onValueChange={(v) => setClientId(v || "")}>
                  <SelectTrigger>
                    <SelectValue placeholder="No specific client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.companyName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-1.5">
                  Campaign (optional)
                </label>
                <Select value={campaignId} onValueChange={(v) => setCampaignId(v || "")} disabled={!clientId}>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={clientId ? "No specific campaign" : `Select a client first`}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {campaigns.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-1.5">
                Outreach Tone
              </label>
              <div className="flex flex-wrap gap-2">
                {OUTREACH_TONES.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTone(t)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                      tone === t
                        ? "bg-[var(--color-brand-600)] text-white border-[var(--color-brand-600)]"
                        : "bg-white text-[var(--color-text-secondary)] border-[var(--color-border)] hover:border-[var(--color-brand-300)]"
                    }`}
                  >
                    {OUTREACH_TONE_LABELS[t]}
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={runGenerate}
              disabled={isGenerating}
              className="w-full bg-[var(--color-brand-600)] hover:bg-[var(--color-brand-700)] text-white font-bold rounded-xl h-11"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              {isGenerating ? "Generating..." : result ? "Regenerate" : "Generate Outreach"}
            </Button>

            {/* Result */}
            <AnimatePresence>
              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4 pt-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
                      Generated Draft{selectedClientName ? ` · ${selectedClientName}` : ""}
                    </span>
                    {savingTemplate ? (
                      <div className="flex items-center gap-1.5">
                        <Input
                          autoFocus
                          placeholder="Template name"
                          value={templateName}
                          onChange={(e) => setTemplateName(e.target.value)}
                          className="h-7 text-xs w-40"
                        />
                        <Button size="sm" className="h-7 text-xs" onClick={handleSaveTemplate}>
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs"
                          onClick={() => setSavingTemplate(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 text-xs font-semibold"
                        onClick={() => setSavingTemplate(true)}
                      >
                        <BookmarkPlus className="w-3.5 h-3.5 mr-1.5" />
                        Save Template
                      </Button>
                    )}
                  </div>

                  {/* Subject + Email */}
                  <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5" />
                        Email
                      </h4>
                      <CopyButton text={`${result.subjectLine}\n\n${result.emailBody}`} label="Email" />
                    </div>
                    <div className="text-sm font-bold text-[var(--color-text-primary)]">
                      {result.subjectLine}
                    </div>
                    <Textarea
                      readOnly
                      value={result.emailBody}
                      className="min-h-[140px] text-sm bg-stone-50 resize-none"
                    />
                  </div>

                  {/* Instagram DM */}
                  <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider flex items-center gap-1.5">
                        <AtSign className="w-3.5 h-3.5" />
                        Instagram DM
                      </h4>
                      <CopyButton text={result.instagramDM} label="Instagram DM" />
                    </div>
                    <p className="text-sm text-[var(--color-text-secondary)] whitespace-pre-wrap font-medium">
                      {result.instagramDM}
                    </p>
                  </div>

                  {/* WhatsApp */}
                  <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider flex items-center gap-1.5">
                        <MessageCircle className="w-3.5 h-3.5" />
                        WhatsApp
                      </h4>
                      <CopyButton text={result.whatsappMessage} label="WhatsApp message" />
                    </div>
                    <p className="text-sm text-[var(--color-text-secondary)] whitespace-pre-wrap font-medium">
                      {result.whatsappMessage}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* History */}
            {history.length > 0 && (
              <div className="pt-2 border-t border-[var(--color-border)]">
                <button
                  onClick={() => setHistoryOpen(!historyOpen)}
                  className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider py-2"
                >
                  <History className="w-3.5 h-3.5" />
                  Recent Drafts ({history.length})
                </button>
                {historyOpen && (
                  <div className="space-y-1.5">
                    {history.map((h) => (
                      <button
                        key={h.id}
                        onClick={() => {
                          setResult(h);
                          setTone(h.tone);
                        }}
                        className="w-full text-left p-2.5 rounded-xl hover:bg-stone-50 border border-[var(--color-border)] flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
                            {h.subjectLine}
                          </div>
                          <div className="text-xs text-[var(--color-text-muted)]">
                            {OUTREACH_TONE_LABELS[h.tone as OutreachTone]}
                            {h.client ? ` · ${h.client.companyName}` : ""}
                            {h.campaign ? ` · ${h.campaign.name}` : ""}
                          </div>
                        </div>
                        {h.isTemplate && (
                          <span className="text-[10px] font-bold text-[var(--color-brand-600)] bg-[var(--color-brand-50)] px-2 py-0.5 rounded-full shrink-0">
                            Template
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
