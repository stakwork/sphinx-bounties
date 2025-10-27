"use client";

/**
 * ADMIN PLATFORM SETTINGS PAGE
 * Route: /admin/settings
 *
 * Features:
 * - Platform configuration (name, logo, description)
 * - Feature flags (enable/disable features)
 * - Security settings (admin emails, 2FA, maintenance mode)
 * - Notification settings (webhooks, email, Slack)
 * - Save/reset settings
 * - Settings grouped by section
 * - Only super admins can access
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Save, RefreshCw, Shield, Bell, Settings, Zap } from "lucide-react";

interface PlatformSettings {
  name: string;
  logoUrl: string;
  description: string;
  enableBounties: boolean;
  enableWorkspaces: boolean;
  enableLeaderboard: boolean;
  maintenanceMode: boolean;
  adminEmails: string;
  enable2FA: boolean;
  webhookUrl: string;
  enableSlack: boolean;
  enableEmail: boolean;
}

const DEFAULTS: PlatformSettings = {
  name: "Sphinx Bounties",
  logoUrl: "",
  description: "A platform for open-source bounties and collaboration.",
  enableBounties: true,
  enableWorkspaces: true,
  enableLeaderboard: true,
  maintenanceMode: false,
  adminEmails: "admin@sphinx.chat",
  enable2FA: false,
  webhookUrl: "",
  enableSlack: false,
  enableEmail: true,
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<PlatformSettings>(DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (field: keyof PlatformSettings, value: unknown) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);
    // Simulate API call
    setTimeout(() => {
      setSaving(false);
      setSuccess(true);
    }, 1200);
  };

  const handleReset = () => {
    setSettings(DEFAULTS);
    setSuccess(false);
    setError(null);
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-2">
          <Settings className="h-8 w-8 text-muted-foreground" /> Platform Settings
        </h1>
        <p className="text-muted-foreground">
          Manage platform configuration, features, and security
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert variant="default" className="mb-6">
          <Save className="h-4 w-4 text-green-600" />
          <AlertDescription>Settings saved successfully!</AlertDescription>
        </Alert>
      )}

      {/* Platform Info */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Platform Info</CardTitle>
          <CardDescription>Basic configuration for branding and description</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Platform Name</label>
            <Input
              value={settings.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="Platform name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Logo URL</label>
            <Input
              value={settings.logoUrl}
              onChange={(e) => handleChange("logoUrl", e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <Textarea
              value={settings.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Describe your platform..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Feature Flags */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" /> Feature Flags
          </CardTitle>
          <CardDescription>Enable or disable platform features</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <Switch
              checked={settings.enableBounties}
              onCheckedChange={(v) => handleChange("enableBounties", v)}
              id="bounties"
            />
            <label htmlFor="bounties" className="text-sm">
              Enable Bounties
            </label>
          </div>
          <div className="flex items-center gap-3">
            <Switch
              checked={settings.enableWorkspaces}
              onCheckedChange={(v) => handleChange("enableWorkspaces", v)}
              id="workspaces"
            />
            <label htmlFor="workspaces" className="text-sm">
              Enable Workspaces
            </label>
          </div>
          <div className="flex items-center gap-3">
            <Switch
              checked={settings.enableLeaderboard}
              onCheckedChange={(v) => handleChange("enableLeaderboard", v)}
              id="leaderboard"
            />
            <label htmlFor="leaderboard" className="text-sm">
              Enable Leaderboard
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-500" /> Security
          </CardTitle>
          <CardDescription>Admin access, 2FA, and maintenance mode</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Admin Emails (comma separated)</label>
            <Input
              value={settings.adminEmails}
              onChange={(e) => handleChange("adminEmails", e.target.value)}
              placeholder="admin@example.com"
            />
          </div>
          <div className="flex items-center gap-3">
            <Switch
              checked={settings.enable2FA}
              onCheckedChange={(v) => handleChange("enable2FA", v)}
              id="2fa"
            />
            <label htmlFor="2fa" className="text-sm">
              Enable 2FA for Admins
            </label>
          </div>
          <div className="flex items-center gap-3">
            <Switch
              checked={settings.maintenanceMode}
              onCheckedChange={(v) => handleChange("maintenanceMode", v)}
              id="maintenance"
            />
            <label htmlFor="maintenance" className="text-sm">
              Maintenance Mode
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-green-500" /> Notifications
          </CardTitle>
          <CardDescription>Configure webhooks, Slack, and email notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Webhook URL</label>
            <Input
              value={settings.webhookUrl}
              onChange={(e) => handleChange("webhookUrl", e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div className="flex items-center gap-3">
            <Switch
              checked={settings.enableSlack}
              onCheckedChange={(v) => handleChange("enableSlack", v)}
              id="slack"
            />
            <label htmlFor="slack" className="text-sm">
              Enable Slack Notifications
            </label>
          </div>
          <div className="flex items-center gap-3">
            <Switch
              checked={settings.enableEmail}
              onCheckedChange={(v) => handleChange("enableEmail", v)}
              id="email"
            />
            <label htmlFor="email" className="text-sm">
              Enable Email Notifications
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-4 justify-end">
        <Button variant="outline" onClick={handleReset} disabled={saving}>
          <RefreshCw className="mr-2 h-4 w-4" /> Reset
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  );
}
