"use client";

import { useState, useRef } from "react";
import Papa from "papaparse";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Upload, FileSpreadsheet, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { importCampaignsAction } from "@/actions/campaigns";

interface CampaignImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CampaignImportModal({ isOpen, onClose }: CampaignImportModalProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<{ created: number; total: number; errors: { row: number; reason: string }[] } | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setResult(null);
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => setRows(results.data),
    });
  };

  const handleImport = async () => {
    setIsImporting(true);
    try {
      const res = await importCampaignsAction(rows);
      setResult(res);
      if (res.created > 0) {
        toast.success(`Imported ${res.created} of ${res.total} campaigns`);
        router.refresh();
      }
    } catch (err: any) {
      toast.error(err.message || "Import failed");
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    setFileName(null);
    setRows([]);
    setResult(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Import Campaigns</DialogTitle>
          <DialogDescription>
            Upload a CSV with columns: name, clientName, budget, startDate, endDate, status, deliverables, notes.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[var(--color-border)] hover:border-[var(--color-brand-400)] hover:bg-[var(--color-brand-50)]/30 transition-colors p-8 text-center"
          >
            {fileName ? (
              <>
                <FileSpreadsheet className="h-8 w-8 text-[var(--color-brand-500)]" />
                <span className="text-sm font-medium text-[var(--color-text-primary)]">{fileName}</span>
                <span className="text-xs text-[var(--color-text-muted)]">{rows.length} rows detected</span>
              </>
            ) : (
              <>
                <Upload className="h-8 w-8 text-[var(--color-text-muted)]" />
                <span className="text-sm font-medium text-[var(--color-text-primary)]">Click to choose a CSV file</span>
              </>
            )}
          </button>

          {result && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium">
                <CheckCircle2 className="h-4 w-4" />
                {result.created} of {result.total} campaigns created
              </div>
              {result.errors.length > 0 && (
                <div className="max-h-32 overflow-y-auto rounded-lg bg-red-50 border border-red-100 p-2 space-y-1">
                  {result.errors.map((e, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-xs text-red-700">
                      <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
                      Row {e.row}: {e.reason}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={handleClose}>
            {result ? "Close" : "Cancel"}
          </Button>
          {!result && (
            <Button onClick={handleImport} disabled={rows.length === 0 || isImporting}>
              {isImporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Import {rows.length > 0 ? `${rows.length} Campaigns` : ""}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
