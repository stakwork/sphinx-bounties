"use client";

import { useState } from "react";
import { ImageUpload } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { fetchFavicon, isValidUrl } from "@/lib/utils/favicon";
import { Loader2, RefreshCw, X } from "lucide-react";
import { toast } from "sonner";

interface AvatarEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentAvatarUrl?: string;
  workspaceName: string;
  websiteUrl?: string;
  onSave: (avatarUrl: string) => Promise<void>;
}

export function AvatarEditModal({
  open,
  onOpenChange,
  currentAvatarUrl,
  workspaceName,
  websiteUrl,
  onSave,
}: AvatarEditModalProps) {
  const [avatarUrl, setAvatarUrl] = useState(currentAvatarUrl || "");
  const [manualUrl, setManualUrl] = useState("");
  const [isFetchingFavicon, setIsFetchingFavicon] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleFetchFavicon = async () => {
    if (!websiteUrl || !isValidUrl(websiteUrl)) {
      toast.error("No valid website URL configured for this workspace");
      return;
    }

    setIsFetchingFavicon(true);
    const favicon = await fetchFavicon(websiteUrl);
    if (favicon) {
      setAvatarUrl(favicon);
      setManualUrl("");
      toast.success("Favicon fetched successfully");
    } else {
      toast.error("Could not fetch favicon from website");
    }
    setIsFetchingFavicon(false);
  };

  const handleManualUrlChange = (url: string) => {
    setManualUrl(url);
    setAvatarUrl(url);
  };

  const handleClearAvatar = () => {
    setAvatarUrl("");
    setManualUrl("");
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(avatarUrl);
      toast.success("Workspace avatar updated successfully");
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to update avatar");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-white/95 backdrop-blur-xl border-neutral-200/50">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 bg-clip-text text-transparent">
            Edit Workspace Avatar
          </DialogTitle>
          <DialogDescription className="text-neutral-600">
            Upload a custom image or fetch the favicon from your website
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Upload Section */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Upload Image</Label>
            <ImageUpload
              currentImageUrl={avatarUrl || undefined}
              onImageUploaded={(url) => {
                setAvatarUrl(url);
                setManualUrl("");
              }}
              onImageRemoved={() => {
                setAvatarUrl("");
                setManualUrl("");
              }}
              disabled={isSaving}
              fallbackText={workspaceName}
            />
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-4 text-neutral-500 font-medium">Or use URL</span>
            </div>
          </div>

          {/* URL Options */}
          <div className="space-y-4">
            {/* Fetch from Website */}
            {websiteUrl && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Fetch from Website</Label>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleFetchFavicon}
                  disabled={isFetchingFavicon || isSaving}
                  className="w-full gap-2 bg-gradient-to-r from-white to-neutral-50 hover:from-neutral-50 hover:to-white border-neutral-300 transition-all"
                >
                  {isFetchingFavicon ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Fetching favicon...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4" />
                      Fetch from {new URL(websiteUrl).hostname}
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Manual URL Input */}
            <div className="space-y-2">
              <Label htmlFor="manual-url" className="text-sm font-medium">
                Or paste URL directly
              </Label>
              <div className="flex gap-2">
                <Input
                  id="manual-url"
                  type="url"
                  placeholder="https://example.com/avatar.png"
                  value={manualUrl}
                  onChange={(e) => handleManualUrlChange(e.target.value)}
                  disabled={isSaving}
                  className="flex-1 bg-white/50 backdrop-blur-sm border-neutral-300"
                />
                {avatarUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleClearAvatar}
                    disabled={isSaving}
                    className="shrink-0 text-neutral-500 hover:text-red-600"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <p className="text-xs text-neutral-500">Provide a direct link to an image file</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="gap-2 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 shadow-lg shadow-primary-500/25"
          >
            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
