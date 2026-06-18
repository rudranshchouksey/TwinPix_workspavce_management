"use client";

import React, { useState } from "react";
import Papa from "papaparse";
import { Button } from "@/components/ui/button";
import { Upload, CheckCircle, AlertCircle, FileText, ArrowRight } from "lucide-react";
import { importInfluencersAction } from "@/actions/influencers";
import { EmptyState } from "@/components/ui/empty-state";

export function ImportWizard() {
  const [file, setFile] = useState<File | null>(null);
  const [data, setData] = useState<any[]>([]);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<{ imported: number; failed: number } | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFile(file);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setData(results.data);
        setStep(2);
      },
    });
  };

  const handleImport = async () => {
    setIsImporting(true);
    try {
      const res = await importInfluencersAction(data);
      setResult(res);
      setStep(3);
    } catch (error) {
      console.error("Import failed", error);
      alert("Failed to import leads. Check console for details.");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="bg-[var(--color-surface-950)] border border-[rgba(0,0,0,0.08)] rounded-xl overflow-hidden">
      {/* Wizard Header */}
      <div className="flex border-b border-[rgba(0,0,0,0.08)]">
        {[
          { num: 1, title: "Upload CSV" },
          { num: 2, title: "Preview Data" },
          { num: 3, title: "Result" },
        ].map((s) => (
          <div
            key={s.num}
            className={`flex-1 p-4 text-center border-r border-[rgba(0,0,0,0.08)] last:border-0 ${
              step === s.num
                ? "bg-[rgba(0,0,0,0.05)] text-[var(--color-text-primary)] font-semibold"
                : step > s.num
                ? "text-[var(--color-brand-400)]"
                : "text-[var(--color-text-muted)]"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                  step === s.num
                    ? "bg-[var(--color-brand-500)] text-white"
                    : step > s.num
                    ? "bg-[var(--color-brand-500)]/20 text-[var(--color-brand-400)]"
                    : "bg-[rgba(0,0,0,0.1)] text-[var(--color-text-muted)]"
                }`}
              >
                {step > s.num ? <CheckCircle className="w-3 h-3" /> : s.num}
              </span>
              {s.title}
            </div>
          </div>
        ))}
      </div>

      {/* Wizard Content */}
      <div className="p-8">
        {step === 1 && (
          <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-[rgba(0,0,0,0.1)] rounded-xl bg-[rgba(0,0,0,0.02)]">
            <Upload className="w-12 h-12 text-[var(--color-text-muted)] mb-4" />
            <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-2">Upload your CSV file</h3>
            <p className="text-[var(--color-text-secondary)] text-sm mb-6 max-w-md text-center">
              Ensure your CSV has the following headers: Influencer Name, Instagram Handle, Platform, Posts, Followers, etc.
            </p>
            <label className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-[var(--color-brand-500)] hover:bg-[var(--color-brand-600)] text-white h-10 py-2 px-4">
              Select File
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-[var(--color-text-primary)]">Preview Data</h3>
                <p className="text-[var(--color-text-secondary)] text-sm">Found {data.length} records to import.</p>
              </div>
              <Button onClick={handleImport} disabled={isImporting} className="bg-[var(--color-brand-500)] hover:bg-[var(--color-brand-600)] text-white">
                {isImporting ? "Importing..." : "Start Import"} <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>

            <div className="border border-[rgba(0,0,0,0.08)] rounded-lg overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-[rgba(0,0,0,0.02)] border-b border-[rgba(0,0,0,0.08)]">
                  <tr>
                    {Object.keys(data[0] || {}).slice(0, 5).map((header) => (
                      <th key={header} className="px-4 py-3 font-medium text-[var(--color-text-secondary)]">
                        {header}
                      </th>
                    ))}
                    {Object.keys(data[0] || {}).length > 5 && (
                      <th className="px-4 py-3 font-medium text-[var(--color-text-secondary)]">...</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {data.slice(0, 5).map((row, i) => (
                    <tr key={i} className="border-b border-[rgba(0,0,0,0.04)] text-[var(--color-text-primary)]">
                      {Object.values(row).slice(0, 5).map((val: any, j) => (
                        <td key={j} className="px-4 py-3 truncate max-w-[150px]">{val}</td>
                      ))}
                      {Object.keys(row).length > 5 && (
                        <td className="px-4 py-3 text-[var(--color-text-muted)]">...</td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {data.length > 5 && (
              <p className="text-center text-sm text-[var(--color-text-muted)]">
                Showing first 5 of {data.length} rows
              </p>
            )}
          </div>
        )}

        {step === 3 && result && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="w-8 h-8 text-emerald-500" />
            </div>
            <h3 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">Import Complete</h3>
            <p className="text-[var(--color-text-secondary)] mb-8 text-center max-w-md">
              Your leads have been successfully imported into the CRM. They are now available in the Influencers table and pipeline.
            </p>
            
            <div className="flex gap-8 mb-8">
              <div className="text-center">
                <p className="text-3xl font-bold text-emerald-400">{result.imported}</p>
                <p className="text-sm text-[var(--color-text-muted)] mt-1">Imported</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-red-400">{result.failed}</p>
                <p className="text-sm text-[var(--color-text-muted)] mt-1">Failed/Skipped</p>
              </div>
            </div>

            <Button onClick={() => window.location.href = '/influencers'} className="bg-[var(--color-surface-800)] text-white hover:bg-[var(--color-surface-700)]">
              Go to Influencers
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
