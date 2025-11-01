"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { AvatarWithFallback } from "@/components/common";
import { Upload, Loader2, X, Check } from "lucide-react";
import { toast } from "sonner";

interface ImageUploadProps {
  currentImageUrl?: string;
  fallbackText: string;
  onImageUploaded: (url: string) => void;
  onImageRemoved: () => void;
  disabled?: boolean;
}

export function ImageUpload({
  currentImageUrl,
  fallbackText,
  onImageUploaded,
  onImageRemoved,
  disabled,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("File must be JPEG, PNG, GIF, or WebP");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append("file", file);

      setUploadProgress(30);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      setUploadProgress(70);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Upload failed");
      }

      const result = await response.json();
      setUploadProgress(100);

      onImageUploaded(result.data.url);
      toast.success("Image uploaded successfully");

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to upload image");
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <div className="relative group">
          <AvatarWithFallback
            src={currentImageUrl || undefined}
            alt={fallbackText}
            fallbackText={fallbackText}
            size="xl"
            className="ring-2 ring-neutral-200 dark:ring-neutral-800 transition-all group-hover:ring-primary-400"
          />
          {isUploading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-900/80 backdrop-blur-sm rounded-full">
              <Loader2 className="h-6 w-6 text-white animate-spin mb-1" />
              <span className="text-xs text-white font-medium">{uploadProgress}%</span>
            </div>
          )}
          {!isUploading && currentImageUrl && (
            <div className="absolute -top-1 -right-1 bg-primary-500 rounded-full p-1">
              <Check className="h-3 w-3 text-white" />
            </div>
          )}
        </div>

        <div className="flex-1 space-y-2">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || isUploading}
              className="gap-2"
            >
              <Upload className="h-3.5 w-3.5" />
              {isUploading ? "Uploading..." : "Upload Image"}
            </Button>
            {currentImageUrl && !isUploading && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onImageRemoved}
                disabled={disabled}
                className="gap-2"
              >
                <X className="h-3.5 w-3.5" />
                Remove
              </Button>
            )}
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            JPG, PNG, GIF or WebP. Max 5MB.
          </p>
          {isUploading && (
            <div className="w-full bg-neutral-200 dark:bg-neutral-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-primary-500 h-full transition-all duration-300 ease-out"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || isUploading}
      />
    </div>
  );
}
