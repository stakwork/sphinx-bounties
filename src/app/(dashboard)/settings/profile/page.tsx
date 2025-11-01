"use client";

import { useState } from "react";
import { useAuth } from "@/hooks";
import {
  useGetUser,
  useUpdateProfile,
  useUpdateSocialLinks,
} from "@/hooks/queries/use-user-queries";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { AvatarWithFallback } from "@/components/common";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  Save,
  User,
  Globe,
  Github,
  Twitter,
  Zap,
  CheckCircle2,
  X,
} from "lucide-react";
import { updateProfileSchema } from "@/validations/user.schema";
import { z } from "zod";

export default function ProfileSettingsPage() {
  const { user: authUser } = useAuth();
  const pubkey = authUser?.pubkey || "";

  const { data: userData, isLoading } = useGetUser(pubkey, !!pubkey);
  const updateProfile = useUpdateProfile();
  const updateSocialLinks = useUpdateSocialLinks();

  const user = userData?.user;

  // Profile form state
  const [username, setUsername] = useState("");
  const [alias, setAlias] = useState("");
  const [description, setDescription] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [contactKey, setContactKey] = useState("");
  const [routeHint, setRouteHint] = useState("");

  // Social links form state
  const [githubUsername, setGithubUsername] = useState("");
  const [twitterUsername, setTwitterUsername] = useState("");

  // Form errors
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
  const [socialErrors, setSocialErrors] = useState<Record<string, string>>({});

  // Initialize form values when user data loads
  useState(() => {
    if (user) {
      setUsername(user.username || "");
      setAlias(user.alias || "");
      setDescription(user.description || "");
      setAvatarUrl(user.avatarUrl || "");
      setContactKey(user.contactKey || "");
      setRouteHint(user.routeHint || "");
      setGithubUsername(user.githubUsername || "");
      setTwitterUsername(user.twitterUsername || "");
    }
  });

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileErrors({});

    try {
      // Validate with schema
      const validatedData = updateProfileSchema.parse({
        username: username || undefined,
        alias: alias || null,
        description: description || null,
        avatarUrl: avatarUrl || null,
        contactKey: contactKey || null,
        routeHint: routeHint || null,
      });

      // Filter out null values for API call
      const data: {
        username?: string;
        alias?: string;
        description?: string;
        avatarUrl?: string;
        contactKey?: string;
        routeHint?: string;
      } = {};

      if (validatedData.username) data.username = validatedData.username;
      if (validatedData.alias) data.alias = validatedData.alias;
      if (validatedData.description) data.description = validatedData.description;
      if (validatedData.avatarUrl) data.avatarUrl = validatedData.avatarUrl;
      if (validatedData.contactKey) data.contactKey = validatedData.contactKey;
      if (validatedData.routeHint) data.routeHint = validatedData.routeHint;

      await updateProfile.mutateAsync({ pubkey, data });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.issues.forEach((err) => {
          if (err.path[0]) {
            errors[err.path[0].toString()] = err.message;
          }
        });
        setProfileErrors(errors);
      }
    }
  };

  const handleSocialLinksSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSocialErrors({});

    try {
      const validatedData = updateProfileSchema
        .pick({
          githubUsername: true,
          twitterUsername: true,
        })
        .parse({
          githubUsername: githubUsername || null,
          twitterUsername: twitterUsername || null,
        });

      const formData = new FormData();
      if (validatedData.githubUsername)
        formData.append("githubUsername", validatedData.githubUsername);
      if (validatedData.twitterUsername)
        formData.append("twitterUsername", validatedData.twitterUsername);

      await updateSocialLinks.mutateAsync({ pubkey, formData });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.issues.forEach((err) => {
          if (err.path[0]) {
            errors[err.path[0].toString()] = err.message;
          }
        });
        setSocialErrors(errors);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-96 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Unable to Load Profile</h3>
        <p className="text-neutral-600">Please try refreshing the page</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold">Profile Settings</h2>
        <p className="text-sm text-muted-foreground">
          Update your profile information and social links
        </p>
      </div>

      {/* Profile Picture Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <AvatarWithFallback
              src={avatarUrl || user.avatarUrl}
              alt={alias || user.alias || username || user.username}
              size="xl"
            />
            <div className="flex-1">
              <h3 className="text-2xl font-bold">
                {alias || user.alias || username || user.username}
              </h3>
              {(alias || user.alias) && username && (
                <p className="text-sm text-neutral-600">@{username || user.username}</p>
              )}
              {(description || user.description) && (
                <p className="text-sm text-neutral-700 mt-2">{description || user.description}</p>
              )}
              <div className="flex items-center gap-2 mt-3">
                <Badge variant="secondary">
                  <Zap className="h-3 w-3 mr-1" />
                  {user.pubkey.slice(0, 8)}...
                </Badge>
                {user.githubVerified && (
                  <Badge variant="secondary" className="gap-1">
                    <Github className="h-3 w-3" />
                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                  </Badge>
                )}
                {user.twitterVerified && (
                  <Badge variant="secondary" className="gap-1">
                    <Twitter className="h-3 w-3" />
                    <CheckCircle2 className="h-3 w-3 text-blue-600" />
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Basic Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>Your public profile information visible to others</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username">
                  Username <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="johndoe"
                  required
                />
                {profileErrors.username && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <X className="h-3 w-3" />
                    {profileErrors.username}
                  </p>
                )}
                <p className="text-xs text-neutral-500">
                  3-20 characters, letters, numbers, and underscores only
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="alias">Display Name</Label>
                <Input
                  id="alias"
                  type="text"
                  value={alias}
                  onChange={(e) => setAlias(e.target.value)}
                  placeholder="John Doe"
                />
                {profileErrors.alias && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <X className="h-3 w-3" />
                    {profileErrors.alias}
                  </p>
                )}
                <p className="text-xs text-neutral-500">Your full name or preferred display name</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="avatarUrl">Avatar URL</Label>
              <Input
                id="avatarUrl"
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://example.com/avatar.jpg"
              />
              {profileErrors.avatarUrl && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <X className="h-3 w-3" />
                  {profileErrors.avatarUrl}
                </p>
              )}
              <p className="text-xs text-neutral-500">
                Link to your profile picture (JPG, PNG, or WebP)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Bio</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell us about yourself..."
                rows={4}
                maxLength={500}
              />
              {profileErrors.description && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <X className="h-3 w-3" />
                  {profileErrors.description}
                </p>
              )}
              <p className="text-xs text-neutral-500">{description.length}/500 characters</p>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="contactKey">Lightning Contact Key</Label>
              <Input
                id="contactKey"
                type="text"
                value={contactKey}
                onChange={(e) => setContactKey(e.target.value)}
                placeholder="npub1..."
                maxLength={66}
              />
              {profileErrors.contactKey && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <X className="h-3 w-3" />
                  {profileErrors.contactKey}
                </p>
              )}
              <p className="text-xs text-neutral-500">
                Your Lightning Network contact key for receiving payments
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="routeHint">Lightning Route Hint</Label>
              <Textarea
                id="routeHint"
                value={routeHint}
                onChange={(e) => setRouteHint(e.target.value)}
                placeholder="Optional routing hint for Lightning payments"
                rows={3}
                maxLength={1000}
              />
              {profileErrors.routeHint && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <X className="h-3 w-3" />
                  {profileErrors.routeHint}
                </p>
              )}
              <p className="text-xs text-neutral-500">
                Advanced: Helps ensure successful Lightning payments
              </p>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={updateProfile.isPending} className="gap-2">
                <Save className="h-4 w-4" />
                {updateProfile.isPending ? "Saving..." : "Save Profile"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Social Links */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Social Links
          </CardTitle>
          <CardDescription>Connect your social media accounts for verification</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSocialLinksSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="githubUsername" className="flex items-center gap-2">
                <Github className="h-4 w-4" />
                GitHub Username
                {user.githubVerified && (
                  <Badge variant="secondary" className="gap-1">
                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                    Verified
                  </Badge>
                )}
              </Label>
              <Input
                id="githubUsername"
                type="text"
                value={githubUsername}
                onChange={(e) => setGithubUsername(e.target.value)}
                placeholder="octocat"
              />
              {socialErrors.githubUsername && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <X className="h-3 w-3" />
                  {socialErrors.githubUsername}
                </p>
              )}
              <p className="text-xs text-neutral-500">Your GitHub username (without @)</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="twitterUsername" className="flex items-center gap-2">
                <Twitter className="h-4 w-4" />
                Twitter Username
                {user.twitterVerified && (
                  <Badge variant="secondary" className="gap-1">
                    <CheckCircle2 className="h-3 w-3 text-blue-600" />
                    Verified
                  </Badge>
                )}
              </Label>
              <Input
                id="twitterUsername"
                type="text"
                value={twitterUsername}
                onChange={(e) => setTwitterUsername(e.target.value)}
                placeholder="jack"
              />
              {socialErrors.twitterUsername && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <X className="h-3 w-3" />
                  {socialErrors.twitterUsername}
                </p>
              )}
              <p className="text-xs text-neutral-500">Your Twitter/X username (without @)</p>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={updateSocialLinks.isPending} className="gap-2">
                <Save className="h-4 w-4" />
                {updateSocialLinks.isPending ? "Saving..." : "Update Social Links"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Public Key Info */}
      <Card className="bg-neutral-50 border-neutral-200">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-neutral-700">Your Public Key</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-neutral-200">
              <code className="text-xs font-mono text-neutral-700 break-all">{user.pubkey}</code>
            </div>
            <p className="text-xs text-neutral-600">
              This is your unique Nostr public key. It cannot be changed.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
