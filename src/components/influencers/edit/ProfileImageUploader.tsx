"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, X, ImageIcon, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Image from "next/image";
import { uploadInfluencerImageAction } from "@/actions/influencers/uploadInfluencerImage";

interface ProfileImageUploaderProps {
  influencerId: string;
  currentImage: string | null;
  instagramHandle: string;
  onImageUploaded: (url: string) => void;
}

export function ProfileImageUploader({
  influencerId,
  currentImage,
  instagramHandle,
  onImageUploaded,
}: ProfileImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      // Validate client-side
      const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Only JPEG, PNG, WebP, and GIF images are allowed");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be smaller than 5MB");
        return;
      }

      // Show preview
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(file);

      // Upload
      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("influencerId", influencerId);

        const result = await uploadInfluencerImageAction(formData);
        onImageUploaded(result.url);
        toast.success("Profile image uploaded successfully");
      } catch (error: any) {
        toast.error(error.message || "Failed to upload image");
        setPreview(null);
      } finally {
        setIsUploading(false);
      }
    },
    [influencerId, onImageUploaded]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const clearPreview = useCallback(() => {
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const displayImage = preview || currentImage;

  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-[var(--color-text-secondary)]">
        Profile Image
      </label>

      <div className="flex items-start gap-4">
        {/* Current / Preview Image */}
        <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-gradient-to-br from-violet-100 to-indigo-200 flex items-center justify-center border-2 border-[var(--color-border)]">
          {displayImage ? (
            <Image
              src={displayImage}
              alt={instagramHandle}
              fill
              unoptimized
              className="object-cover"
            />
          ) : (
            <span className="text-2xl font-bold text-violet-600">
              {instagramHandle.substring(0, 2).toUpperCase()}
            </span>
          )}
          {isUploading && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            </div>
          )}
        </div>

        {/* Upload Area */}
        <div className="flex-1 space-y-2">
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`
              relative cursor-pointer rounded-xl border-2 border-dashed transition-all p-4
              flex flex-col items-center justify-center text-center min-h-[80px]
              ${
                isDragging
                  ? "border-[var(--color-brand-500)] bg-[var(--color-brand-50)]"
                  : "border-[var(--color-border)] bg-[var(--color-surface-900)] hover:border-[var(--color-brand-300)] hover:bg-[var(--color-surface-800)]"
              }
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleInputChange}
              className="hidden"
            />
            <Upload className="w-5 h-5 text-[var(--color-text-muted)] mb-1" />
            <p className="text-xs font-semibold text-[var(--color-text-secondary)]">
              {isDragging ? "Drop image here" : "Click or drag to upload"}
            </p>
            <p className="text-[10px] text-[var(--color-text-disabled)] mt-0.5">
              JPEG, PNG, WebP, GIF · Max 5MB
            </p>
          </div>

          {preview && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearPreview}
              className="h-6 text-xs text-[var(--color-text-muted)]"
            >
              <X className="w-3 h-3 mr-1" /> Clear
            </Button>
          )}
        </div>
      </div>

      <p className="text-[10px] text-[var(--color-text-disabled)]">
        <RefreshCw className="w-3 h-3 inline mr-1" />
        Default: Instagram synced image. Upload a custom one to override.
      </p>
    </div>
  );
}
