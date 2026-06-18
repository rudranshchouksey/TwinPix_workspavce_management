"use client"

import React, { useEffect, useState } from "react"
import { FileCard } from "./file-card"
import { FileUploader } from "./file-uploader"
import { getFilesAction } from "@/app/actions/file-actions"
import { Loader2 } from "lucide-react"

interface FileListProps {
  entityType: "CAMPAIGN" | "INFLUENCER" | "TASK"
  entityId: string
  title?: string
}

export function FileList({ entityType, entityId, title = "Files" }: FileListProps) {
  const [files, setFiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchFiles = async () => {
    setLoading(true)
    const result = await getFilesAction(entityType, entityId)
    if (result.success && result.files) {
      setFiles(result.files)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchFiles()
  }, [entityType, entityId])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>

      <FileUploader 
        entityType={entityType} 
        entityId={entityId} 
        onUploadSuccess={fetchFiles} 
      />

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : files.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">
          {files.map((file) => (
            <FileCard 
              key={file.id} 
              file={file} 
              onDeleteSuccess={fetchFiles} 
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground border rounded-xl border-dashed bg-muted/20">
          No files uploaded yet.
        </div>
      )}
    </div>
  )
}
