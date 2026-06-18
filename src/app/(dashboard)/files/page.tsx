"use client";

import React, { useEffect, useState } from "react";
import { getAllFilesAction } from "@/app/actions/file-actions";
import { FileUploader } from "@/components/files/file-uploader";
import { FileCard } from "@/components/files/file-card";
import { SectionHeader } from "@/components/dashboard/section-header";
import { Loader2, FolderOpen } from "lucide-react";

export default function FilesPage() {
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFiles = async () => {
    setLoading(true);
    const result = await getAllFilesAction();
    if (result.success && result.files) {
      setFiles(result.files);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  return (
    <div className="space-y-8">
      <SectionHeader
        label="Global File Manager"
        description="View and manage all files across your workspace"
      />

      <div className="mx-auto max-w-2xl">
        <FileUploader
          entityType="USER"
          onUploadSuccess={fetchFiles}
        />
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">All Files</h3>
        
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--color-brand-400)]" />
          </div>
        ) : files.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {files.map((file) => (
              <FileCard
                key={file.id}
                file={file}
                onDeleteSuccess={fetchFiles}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[rgba(0,0,0,0.1)] bg-[rgba(0,0,0,0.02)] py-16 text-center">
            <div className="mb-4 rounded-full bg-[rgba(0,0,0,0.05)] p-4">
              <FolderOpen className="h-8 w-8 text-[var(--color-text-muted)]" />
            </div>
            <h3 className="text-lg font-medium text-[var(--color-text-primary)]">No files found</h3>
            <p className="mt-1 max-w-sm text-sm text-[var(--color-text-muted)]">
              Upload a file above, or add files to specific tasks and campaigns to see them here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
