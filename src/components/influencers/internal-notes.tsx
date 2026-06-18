"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { NotebookPen, Save, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateInfluencerNotesAction } from "@/actions/influencers";
import { toast } from "sonner";

interface InternalNotesProps {
  influencerId: string;
  initialNotes: string | null;
}

export function InternalNotes({ influencerId, initialNotes }: InternalNotesProps) {
  const [notes, setNotes] = useState(initialNotes || "");
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const handleChange = (value: string) => {
    setNotes(value);
    setHasChanges(value !== (initialNotes || ""));
    setSaved(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaved(false);
    
    try {
      await updateInfluencerNotesAction(influencerId, notes);
      setIsSaving(false);
      setSaved(true);
      setHasChanges(false);
      toast.success("Notes saved successfully");
      setTimeout(() => setSaved(false), 3000);
    } catch (error: any) {
      setIsSaving(false);
      toast.error(`Failed to save notes: ${error.message}`);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      className="col-span-12 md:col-span-4 flex flex-col gap-6"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Internal Notes</h2>
      </div>

      <div className="rounded-3xl border border-[var(--color-border)] bg-amber-50/50 shadow-sm flex flex-col relative overflow-hidden flex-1 min-h-[300px]">
        {/* Notebook styling top bar */}
        <div className="h-12 border-b border-amber-200/60 bg-amber-100/50 flex items-center px-6 justify-between shrink-0">
          <div className="flex items-center gap-2 text-amber-800">
            <NotebookPen className="w-4 h-4" />
            <span className="font-bold text-sm tracking-wide uppercase">Creator Brief</span>
          </div>
          
          <div className="flex items-center gap-2">
            {hasChanges && !saved && (
              <span className="text-[10px] font-bold text-amber-600 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                Unsaved
              </span>
            )}
            {saved && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }} 
                animate={{ opacity: 1, scale: 1 }} 
                className="flex items-center text-emerald-600 text-xs font-bold"
              >
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                Saved
              </motion.div>
            )}
          </div>
        </div>

        {/* Notebook styling lines */}
        <div className="absolute inset-x-0 top-12 bottom-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(transparent_0px,transparent_27px,black_28px)] bg-[length:100%_28px]" />

        <textarea
          value={notes}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Jot down notes, negotiation terms, and preferences here..."
          className="flex-1 w-full p-6 bg-transparent resize-none outline-none text-[var(--color-text-primary)] leading-[28px] font-medium placeholder:text-amber-900/30 relative z-10 scrollbar-hide"
        />

        <div className="p-4 border-t border-amber-200/60 bg-white shrink-0">
          <Button 
            onClick={handleSave} 
            disabled={isSaving || !hasChanges}
            className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-sm disabled:opacity-50"
          >
            {isSaving ? (
              "Saving..."
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Notes
              </>
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
