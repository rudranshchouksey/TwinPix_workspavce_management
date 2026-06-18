"use client"

import React, { useState, useRef, useCallback } from "react"
import { UploadCloud } from "lucide-react"
import { uploadFileAction } from "@/app/actions/file-actions"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface FileUploaderProps {
  entityType: "CAMPAIGN" | "INFLUENCER" | "TASK" | "USER"
  entityId?: string
  onUploadSuccess?: () => void
  maxSizeMB?: number
}

export function FileUploader({ 
  entityType, 
  entityId, 
  onUploadSuccess,
  maxSizeMB = 50 
}: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const processFile = async (file: File) => {
    // Validate size
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`File is too large. Maximum size is ${maxSizeMB}MB.`)
      return
    }

    setIsUploading(true)
    setProgress(0)

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress(p => Math.min(p + Math.random() * 15, 90))
    }, 200)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("entityType", entityType)
      if (entityId) formData.append("entityId", entityId)

      const result = await uploadFileAction(formData)

      clearInterval(progressInterval)
      setProgress(100)

      if (result.success) {
        toast.success("File uploaded successfully")
        onUploadSuccess?.()
      } else {
        toast.error(result.error || "Failed to upload file")
      }
    } catch (error) {
      clearInterval(progressInterval)
      toast.error("An unexpected error occurred")
    } finally {
      setTimeout(() => {
        setIsUploading(false)
        setProgress(0)
      }, 500)
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0]
      processFile(file)
    }
  }, [entityType, entityId, maxSizeMB, onUploadSuccess])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0])
      // Reset input
      e.target.value = ""
    }
  }

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl transition-all cursor-pointer overflow-hidden",
        isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/20 hover:border-primary/50",
        isUploading ? "pointer-events-none opacity-80" : ""
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => !isUploading && fileInputRef.current?.click()}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />
      
      {!isUploading ? (
        <>
          <div className="p-4 bg-primary/10 rounded-full mb-4">
            <UploadCloud className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-medium mb-1">Click or drag file to this area to upload</h3>
          <p className="text-sm text-muted-foreground text-center max-w-sm">
            Attach files to this {entityType.toLowerCase()}. Images, PDFs, videos, and ZIP archives are supported.
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Max size: {maxSizeMB}MB
          </p>
        </>
      ) : (
        <div className="w-full flex flex-col items-center justify-center py-6">
          <UploadCloud className="w-8 h-8 text-primary animate-bounce mb-4" />
          <h3 className="text-lg font-medium mb-4">Uploading...</h3>
          <Progress value={progress} className="w-full h-2" />
        </div>
      )}
    </div>
  )
}
