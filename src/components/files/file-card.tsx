"use client"

import React, { useState } from "react"
import { File, ImageIcon, Video, FileText, Archive, Download, Trash2, Loader2 } from "lucide-react"
import { deleteFileAction } from "@/app/actions/file-actions"
import { toast } from "sonner"
import { usePathname } from "next/navigation"

interface FileCardProps {
  file: {
    id: string
    fileName: string
    originalName: string
    mimeType: string
    size: number
    url: string
    createdAt: Date
    uploadedBy?: {
      name: string | null
    } | null
  }
  onDeleteSuccess?: () => void
}

export function FileCard({ file, onDeleteSuccess }: FileCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const pathname = usePathname()

  const isImage = file.mimeType.startsWith("image/")
  const isVideo = file.mimeType.startsWith("video/")
  const isPdf = file.mimeType === "application/pdf"
  const isZip = file.mimeType.includes("zip") || file.mimeType.includes("tar")

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this file?")) return

    setIsDeleting(true)
    try {
      const result = await deleteFileAction(file.id, pathname || "")
      if (result.success) {
        toast.success("File deleted successfully")
        onDeleteSuccess?.()
      } else {
        toast.error(result.error || "Failed to delete file")
      }
    } catch (error) {
      toast.error("An unexpected error occurred")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDownload = () => {
    // Open in new tab or force download
    const link = document.createElement("a")
    link.href = file.url
    link.download = file.originalName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="group relative flex flex-col rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden transition-all hover:shadow-md">
      {/* File Preview */}
      <div className="aspect-video w-full bg-muted/50 flex items-center justify-center relative overflow-hidden">
        {isImage ? (
          <img src={file.url} alt={file.originalName} className="object-cover w-full h-full" />
        ) : isVideo ? (
          <video src={file.url} className="object-cover w-full h-full" controls />
        ) : (
          <div className="p-8">
            {isPdf ? (
              <FileText className="w-16 h-16 text-red-500/80" />
            ) : isZip ? (
              <Archive className="w-16 h-16 text-yellow-500/80" />
            ) : (
              <File className="w-16 h-16 text-blue-500/80" />
            )}
          </div>
        )}

        {/* Hover Actions - only show if not a video since video has controls */}
        {!isVideo && (
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
            <button
              onClick={handleDownload}
              className="p-2 bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur-sm transition-all"
              title="Download"
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-2 bg-red-500/80 hover:bg-red-500 rounded-full text-white backdrop-blur-sm transition-all disabled:opacity-50"
              title="Delete"
            >
              {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
            </button>
          </div>
        )}
      </div>

      {/* File Info */}
      <div className="p-4">
        <h4 className="font-medium text-sm truncate" title={file.originalName}>
          {file.originalName}
        </h4>
        <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
          <span>{formatSize(file.size)}</span>
          {file.uploadedBy?.name && (
            <span className="truncate max-w-[100px]">By {file.uploadedBy.name}</span>
          )}
        </div>
        
        {/* If it's a video, hover actions won't show nicely over controls, so add them below */}
        {isVideo && (
          <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t">
            <button
              onClick={handleDownload}
              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-all"
              title="Download"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-1.5 text-red-500/80 hover:text-red-500 hover:bg-red-500/10 rounded-md transition-all disabled:opacity-50"
              title="Delete"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
