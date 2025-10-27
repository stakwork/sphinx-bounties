"use client";

import { useState } from "react";
import { useAuth } from "@/hooks";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bell,
  Mail,
  Smartphone,
  Target,
  Wallet,
  CheckCircle2,
  Users,
  MessageSquare,
  AlertCircle,
  Save,
  Volume2,
  VolumeX,
} from "lucide-react";

export default function NotificationSettingsPage() {
  const { user } = useAuth();

  // Global notification settings
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Email digest settings
  const [emailDigestEnabled, setEmailDigestEnabled] = useState(true);
  const [emailDigestFrequency, setEmailDigestFrequency] = useState("daily");

  // Bounty notifications
  const [bountyAssigned, setBountyAssigned] = useState(true);
  const [bountyCompleted, setBountyCompleted] = useState(true);
  const [bountyStatusChanged, setBountyStatusChanged] = useState(true);
  const [bountyCommented, setBountyCommented] = useState(true);
  const [bountyProofSubmitted, setBountyProofSubmitted] = useState(true);
  const [bountyProofReviewed, setBountyProofReviewed] = useState(true);

  // Payment notifications
  const [paymentReceived, setPaymentReceived] = useState(true);
  const [paymentSent, setPaymentSent] = useState(false);
  const [paymentPending, setPaymentPending] = useState(true);
  const [paymentFailed, setPaymentFailed] = useState(true);

  // Workspace notifications
  const [workspaceInvite, setWorkspaceInvite] = useState(true);
  const [workspaceMemberAdded, setWorkspaceMemberAdded] = useState(false);
  const [workspaceMemberRemoved, setWorkspaceMemberRemoved] = useState(false);
  const [workspaceRoleChanged, setWorkspaceRoleChanged] = useState(true);
  const [workspaceBudgetChanged, setWorkspaceBudgetChanged] = useState(false);

  // Activity notifications
  const [mentionedInComment, setMentionedInComment] = useState(true);
  const [followedUserActivity, setFollowedUserActivity] = useState(false);

  const [isSaving, setIsSaving] = useState(false);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
  };

  const handleDisableAll = () => {
    setEmailEnabled(false);
    setPushEnabled(false);
    setSoundEnabled(false);
  };

  const handleEnableAll = () => {
    setEmailEnabled(true);
    setPushEnabled(true);
    setSoundEnabled(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <Bell className="h-6 w-6" />
          Notification Settings
        </h2>
        <p className="text-sm text-muted-foreground">
          Manage how and when you receive notifications about your bounties and activity
        </p>
      </div>

      {/* Quick Actions */}
      <Card className="bg-neutral-50 border-neutral-200">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">Quick Actions</p>
              <p className="text-xs text-neutral-600">
                Enable or disable all notifications at once
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleEnableAll}>
                Enable All
              </Button>
              <Button variant="outline" size="sm" onClick={handleDisableAll}>
                Disable All
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Global Notification Channels */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Channels</CardTitle>
          <CardDescription>Choose how you want to receive notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Mail className="h-5 w-5 text-blue-600" />
              </div>
              <div className="space-y-1">
                <Label className="text-base">Email Notifications</Label>
                <p className="text-xs text-neutral-600">
                  Receive notifications via email at {user?.username || "your email"}
                </p>
              </div>
            </div>
            <Switch checked={emailEnabled} onCheckedChange={setEmailEnabled} />
          </div>

          {emailEnabled && (
            <div className="ml-14 pl-3 border-l-2 border-neutral-200 space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Email Digest</Label>
                  <p className="text-xs text-neutral-600">Get a summary of your notifications</p>
                </div>
                <Switch checked={emailDigestEnabled} onCheckedChange={setEmailDigestEnabled} />
              </div>

              {emailDigestEnabled && (
                <div className="space-y-2">
                  <Label htmlFor="digest-frequency">Digest Frequency</Label>
                  <Select value={emailDigestFrequency} onValueChange={setEmailDigestFrequency}>
                    <SelectTrigger id="digest-frequency" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="realtime">Real-time (as they happen)</SelectItem>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="daily">Daily (8:00 AM)</SelectItem>
                      <SelectItem value="weekly">Weekly (Monday 8:00 AM)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Smartphone className="h-5 w-5 text-green-600" />
              </div>
              <div className="space-y-1">
                <Label className="text-base">Push Notifications</Label>
                <p className="text-xs text-neutral-600">
                  Receive push notifications in your browser
                </p>
              </div>
            </div>
            <Switch checked={pushEnabled} onCheckedChange={setPushEnabled} />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                {soundEnabled ? (
                  <Volume2 className="h-5 w-5 text-purple-600" />
                ) : (
                  <VolumeX className="h-5 w-5 text-purple-600" />
                )}
              </div>
              <div className="space-y-1">
                <Label className="text-base">Sound Alerts</Label>
                <p className="text-xs text-neutral-600">
                  Play a sound when you receive notifications
                </p>
              </div>
            </div>
            <Switch checked={soundEnabled} onCheckedChange={setSoundEnabled} />
          </div>
        </CardContent>
      </Card>

      {/* Bounty Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Bounty Notifications
          </CardTitle>
          <CardDescription>Get notified about bounty activities and updates</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Bounty Assigned to You</Label>
              <p className="text-xs text-neutral-600">When a bounty is assigned to you</p>
            </div>
            <Switch checked={bountyAssigned} onCheckedChange={setBountyAssigned} />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Bounty Completed</Label>
              <p className="text-xs text-neutral-600">When you or someone completes a bounty</p>
            </div>
            <Switch checked={bountyCompleted} onCheckedChange={setBountyCompleted} />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Bounty Status Changed</Label>
              <p className="text-xs text-neutral-600">When a bounty&apos;s status is updated</p>
            </div>
            <Switch checked={bountyStatusChanged} onCheckedChange={setBountyStatusChanged} />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>New Comment on Your Bounty</Label>
              <p className="text-xs text-neutral-600">When someone comments on your bounty</p>
            </div>
            <Switch checked={bountyCommented} onCheckedChange={setBountyCommented} />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Proof Submitted</Label>
              <p className="text-xs text-neutral-600">When proof is submitted for your bounty</p>
            </div>
            <Switch checked={bountyProofSubmitted} onCheckedChange={setBountyProofSubmitted} />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Proof Reviewed</Label>
              <p className="text-xs text-neutral-600">When your submitted proof is reviewed</p>
            </div>
            <Switch checked={bountyProofReviewed} onCheckedChange={setBountyProofReviewed} />
          </div>
        </CardContent>
      </Card>

      {/* Payment Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Payment Notifications
          </CardTitle>
          <CardDescription>Stay updated on all payment activities</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="flex items-center gap-2">
                Payment Received
                <Badge variant="secondary" className="text-xs">
                  Recommended
                </Badge>
              </Label>
              <p className="text-xs text-neutral-600">
                When you receive a payment for completed work
              </p>
            </div>
            <Switch checked={paymentReceived} onCheckedChange={setPaymentReceived} />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Payment Sent</Label>
              <p className="text-xs text-neutral-600">When you send a payment to someone</p>
            </div>
            <Switch checked={paymentSent} onCheckedChange={setPaymentSent} />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Payment Pending</Label>
              <p className="text-xs text-neutral-600">When a payment is pending confirmation</p>
            </div>
            <Switch checked={paymentPending} onCheckedChange={setPaymentPending} />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="flex items-center gap-2">
                Payment Failed
                <Badge variant="secondary" className="text-xs">
                  Recommended
                </Badge>
              </Label>
              <p className="text-xs text-neutral-600">When a payment fails or is rejected</p>
            </div>
            <Switch checked={paymentFailed} onCheckedChange={setPaymentFailed} />
          </div>
        </CardContent>
      </Card>

      {/* Workspace Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Workspace Notifications
          </CardTitle>
          <CardDescription>Notifications about workspace activities</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Workspace Invitation</Label>
              <p className="text-xs text-neutral-600">
                When you&apos;re invited to join a workspace
              </p>
            </div>
            <Switch checked={workspaceInvite} onCheckedChange={setWorkspaceInvite} />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Member Added</Label>
              <p className="text-xs text-neutral-600">When a new member joins your workspace</p>
            </div>
            <Switch checked={workspaceMemberAdded} onCheckedChange={setWorkspaceMemberAdded} />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Member Removed</Label>
              <p className="text-xs text-neutral-600">
                When a member is removed from your workspace
              </p>
            </div>
            <Switch checked={workspaceMemberRemoved} onCheckedChange={setWorkspaceMemberRemoved} />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Role Changed</Label>
              <p className="text-xs text-neutral-600">When your workspace role is changed</p>
            </div>
            <Switch checked={workspaceRoleChanged} onCheckedChange={setWorkspaceRoleChanged} />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Budget Changed</Label>
              <p className="text-xs text-neutral-600">
                When workspace budget is added or withdrawn
              </p>
            </div>
            <Switch checked={workspaceBudgetChanged} onCheckedChange={setWorkspaceBudgetChanged} />
          </div>
        </CardContent>
      </Card>

      {/* Activity Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Activity & Mentions
          </CardTitle>
          <CardDescription>Notifications about social interactions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Mentioned in Comment</Label>
              <p className="text-xs text-neutral-600">When someone mentions you in a comment</p>
            </div>
            <Switch checked={mentionedInComment} onCheckedChange={setMentionedInComment} />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Followed User Activity</Label>
              <p className="text-xs text-neutral-600">
                Activity from users you follow (coming soon)
              </p>
            </div>
            <Switch
              checked={followedUserActivity}
              onCheckedChange={setFollowedUserActivity}
              disabled
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex items-center justify-between p-4 bg-neutral-50 border border-neutral-200 rounded-lg">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <div>
            <p className="text-sm font-medium">Ready to Save</p>
            <p className="text-xs text-neutral-600">
              Your notification preferences will be updated
            </p>
          </div>
        </div>
        <Button onClick={handleSaveSettings} disabled={isSaving} size="lg" className="gap-2">
          <Save className="h-4 w-4" />
          {isSaving ? "Saving..." : "Save Preferences"}
        </Button>
      </div>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900 mb-1">About Notifications</p>
              <p className="text-xs text-blue-800">
                You can manage your notification preferences at any time. Critical notifications
                (like payment failures or security alerts) cannot be disabled to ensure you stay
                informed about important events. Email notifications are sent to the email
                associated with your Nostr identity.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
