import React from "react";
import { PremiumCard } from "@/components/ui/premium-card";
import { File, Download, ExternalLink } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export function ProjectFilesTab({ project }: { project: any }) {
  const fileMap = new Map();
  
  (project.files || []).forEach((f: any) => {
    fileMap.set(f.id, { ...f, source: { type: 'Project', name: project.name, href: `/projects/${project.id}` } });
  });

  (project.campaigns || []).forEach((c: any) => {
    (c.files || []).forEach((f: any) => {
      fileMap.set(f.id, { ...f, source: { type: 'Campaign', name: c.name, href: `/campaigns/${c.id}` } });
    });
  });
  
  (project.tasks || []).forEach((t: any) => {
    (t.files || []).forEach((f: any) => {
      fileMap.set(f.id, { ...f, source: { type: 'Task', name: t.title, href: `/tasks/${t.id}` } });
    });
  });

  const files = Array.from(fileMap.values());
  const sortedFiles = files.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (sortedFiles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[rgba(0,0,0,0.1)] py-16 text-center">
        <div className="mb-4 rounded-full bg-[rgba(0,0,0,0.05)] p-4">
          <File className="h-8 w-8 text-[var(--color-text-muted)]" />
        </div>
        <h3 className="text-lg font-medium text-[var(--color-text-primary)]">No files</h3>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">Upload files to campaigns or tasks to see them here.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {sortedFiles.map((file) => (
        <PremiumCard key={file.id} className="p-4 flex items-start gap-4">
          <div className="p-3 bg-[rgba(0,0,0,0.03)] rounded-lg text-[var(--color-brand-500)]">
            <File className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-[var(--color-text-primary)] truncate" title={file.originalName}>
              {file.originalName}
            </h4>
            <div className="text-xs text-[var(--color-text-muted)] mt-1 truncate">
              {file.source ? (
                <Link href={file.source.href} className="hover:text-[var(--color-brand-500)] hover:underline transition-colors">
                  {file.source.type}: {file.source.name}
                </Link>
              ) : (
                'Unknown Source'
              )}
            </div>
            <div className="flex items-center gap-2 mt-2 text-xs text-[var(--color-text-secondary)]">
              <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
              <span>•</span>
              <span>{format(new Date(file.createdAt), "MMM d, yyyy")}</span>
            </div>
            <div className="mt-3 flex gap-2">
              <Link href={file.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs font-medium text-[var(--color-brand-500)] hover:text-[var(--color-brand-600)]">
                <ExternalLink className="w-3 h-3" /> View
              </Link>
              <Link href={file.url} download className="flex items-center gap-1 text-xs font-medium text-[var(--color-text-primary)] hover:text-black">
                <Download className="w-3 h-3" /> Download
              </Link>
            </div>
          </div>
        </PremiumCard>
      ))}
    </div>
  );
}
