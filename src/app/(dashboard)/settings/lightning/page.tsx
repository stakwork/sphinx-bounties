"use client";

import { useState } from "react";
import { useAuth } from "@/hooks";
import { useGetUser } from "@/hooks/queries/use-user-queries";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertCircle,
  Zap,
  Wallet,
  Copy,
  Check,
  QrCode,
  ExternalLink,
  RefreshCw,
  Settings,
  DollarSign,
  TrendingUp,
  ShieldCheck,
} from "lucide-react";
import { CurrencyDisplay } from "@/components/common";

export default function LightningSettingsPage() {
  const { user: authUser } = useAuth();
  const pubkey = authUser?.pubkey || "";

  const { data: userData, isLoading } = useGetUser(pubkey, !!pubkey);
  const user = userData;

  // Connection state
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "disconnected" | "connecting" | "connected"
  >("disconnected");

  // Wallet settings
  const [showBalance, setShowBalance] = useState(true);
  const [autoAcceptPayments, setAutoAcceptPayments] = useState(false);
  const [defaultInvoiceAmount, setDefaultInvoiceAmount] = useState("10000");
  const [invoiceExpiry, setInvoiceExpiry] = useState("3600");
  const [enableNotifications, setEnableNotifications] = useState(true);
  const [maxPaymentAmount, setMaxPaymentAmount] = useState("100000");

  // Mock wallet data (in real app, this would come from Lightning node)
  const walletBalance = 250000; // sats
  const channelCount = 5;
  const channelCapacity = 1000000; // sats
  const nodeAlias = "sphinx-bounties-node";

  // Copy helpers
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleConnect = async () => {
    setConnectionStatus("connecting");
    // Simulate connection
    setTimeout(() => {
      setConnectionStatus("connected");
      setIsConnected(true);
    }, 1500);
  };

  const handleDisconnect = () => {
    setConnectionStatus("disconnected");
    setIsConnected(false);
  };

  const handleSaveSettings = () => {
    // In real app, save settings to backend
    // Toast notification will be shown
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
        <h3 className="text-lg font-semibold mb-2">Unable to Load Settings</h3>
        <p className="text-neutral-600">Please try refreshing the page</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <Zap className="h-6 w-6 text-yellow-500" />
          Lightning Wallet
        </h2>
        <p className="text-sm text-muted-foreground">
          Configure your Lightning Network wallet and settings
        </p>
      </div>

      {/* Connection Status */}
      <Card className={isConnected ? "border-green-200 bg-green-50" : "border-neutral-200"}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Wallet Connection
            </span>
            <Badge
              variant={isConnected ? "default" : "secondary"}
              className={isConnected ? "bg-green-600" : ""}
            >
              {connectionStatus === "connecting" ? (
                <span className="flex items-center gap-1">
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  Connecting...
                </span>
              ) : isConnected ? (
                <span className="flex items-center gap-1">
                  <Check className="h-3 w-3" />
                  Connected
                </span>
              ) : (
                "Disconnected"
              )}
            </Badge>
          </CardTitle>
          <CardDescription>
            {isConnected
              ? "Your Lightning wallet is connected and ready to receive payments"
              : "Connect your Lightning wallet to receive bounty payments instantly"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isConnected ? (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handleConnect}
                  disabled={connectionStatus === "connecting"}
                  className="gap-2"
                  size="lg"
                >
                  <Zap className="h-4 w-4" />
                  {connectionStatus === "connecting" ? "Connecting..." : "Connect Wallet"}
                </Button>
                <Button variant="outline" size="lg" className="gap-2">
                  <QrCode className="h-4 w-4" />
                  Scan QR Code
                </Button>
              </div>
              <p className="text-xs text-neutral-600">
                Connect via LND, Core Lightning, or any Lightning wallet that supports LNURL
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-white rounded-lg border border-neutral-200">
                  <Wallet className="h-5 w-5 text-primary-600 mx-auto mb-1" />
                  <p className="text-xs text-neutral-600 mb-1">Balance</p>
                  <CurrencyDisplay amount={walletBalance} size="sm" className="font-semibold" />
                </div>
                <div className="text-center p-3 bg-white rounded-lg border border-neutral-200">
                  <TrendingUp className="h-5 w-5 text-green-600 mx-auto mb-1" />
                  <p className="text-xs text-neutral-600 mb-1">Channels</p>
                  <p className="text-lg font-semibold">{channelCount}</p>
                </div>
                <div className="text-center p-3 bg-white rounded-lg border border-neutral-200">
                  <DollarSign className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                  <p className="text-xs text-neutral-600 mb-1">Capacity</p>
                  <CurrencyDisplay amount={channelCapacity} size="sm" className="font-semibold" />
                </div>
                <div className="text-center p-3 bg-white rounded-lg border border-neutral-200">
                  <ShieldCheck className="h-5 w-5 text-purple-600 mx-auto mb-1" />
                  <p className="text-xs text-neutral-600 mb-1">Status</p>
                  <p className="text-lg font-semibold text-green-600">Active</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleDisconnect} className="gap-2">
                  Disconnect
                </Button>
                <Button variant="outline" size="sm" className="gap-2">
                  <RefreshCw className="h-3 w-3" />
                  Refresh
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Wallet Details */}
      {isConnected && (
        <Tabs defaultValue="details" className="space-y-4">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Node Information</CardTitle>
                <CardDescription>Your Lightning Network node details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Node Alias</Label>
                  <div className="flex items-center gap-2">
                    <Input value={nodeAlias} readOnly />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy(nodeAlias, "alias")}
                    >
                      {copiedField === "alias" ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Node Public Key</Label>
                  <div className="flex items-center gap-2">
                    <Input value={user.pubkey} readOnly className="font-mono text-xs" />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy(user.pubkey, "pubkey")}
                    >
                      {copiedField === "pubkey" ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Contact Key</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={user.contactKey || "Not set"}
                      readOnly
                      className="font-mono text-xs"
                    />
                    {user.contactKey && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopy(user.contactKey!, "contact")}
                      >
                        {copiedField === "contact" ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">View on Lightning Explorer</p>
                    <p className="text-xs text-neutral-600">
                      Explore your node on public Lightning explorers
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="gap-2">
                    <ExternalLink className="h-4 w-4" />
                    Open
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Payment Settings
                </CardTitle>
                <CardDescription>Configure how you receive and manage payments</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Show Balance</Label>
                    <p className="text-xs text-neutral-600">
                      Display your wallet balance on the dashboard
                    </p>
                  </div>
                  <Switch checked={showBalance} onCheckedChange={setShowBalance} />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Auto-Accept Payments</Label>
                    <p className="text-xs text-neutral-600">
                      Automatically accept incoming payments without confirmation
                    </p>
                  </div>
                  <Switch checked={autoAcceptPayments} onCheckedChange={setAutoAcceptPayments} />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Payment Notifications</Label>
                    <p className="text-xs text-neutral-600">
                      Get notified when you receive payments
                    </p>
                  </div>
                  <Switch checked={enableNotifications} onCheckedChange={setEnableNotifications} />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="defaultInvoice">Default Invoice Amount (sats)</Label>
                  <Input
                    id="defaultInvoice"
                    type="number"
                    value={defaultInvoiceAmount}
                    onChange={(e) => setDefaultInvoiceAmount(e.target.value)}
                    min="1"
                    max="1000000"
                  />
                  <p className="text-xs text-neutral-600">
                    Default amount when creating new invoices
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="invoiceExpiry">Invoice Expiry (seconds)</Label>
                  <Input
                    id="invoiceExpiry"
                    type="number"
                    value={invoiceExpiry}
                    onChange={(e) => setInvoiceExpiry(e.target.value)}
                    min="60"
                    max="86400"
                  />
                  <p className="text-xs text-neutral-600">
                    How long invoices remain valid (default: 3600 = 1 hour)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxPayment">Maximum Payment Amount (sats)</Label>
                  <Input
                    id="maxPayment"
                    type="number"
                    value={maxPaymentAmount}
                    onChange={(e) => setMaxPaymentAmount(e.target.value)}
                    min="1000"
                  />
                  <p className="text-xs text-neutral-600">
                    Maximum amount for a single payment (security limit)
                  </p>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSaveSettings} className="gap-2">
                    <Check className="h-4 w-4" />
                    Save Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Advanced Tab */}
          <TabsContent value="advanced" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Advanced Options</CardTitle>
                <CardDescription>Advanced Lightning Network configuration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="routeHint">Route Hint</Label>
                  <Input
                    id="routeHint"
                    value={user.routeHint || ""}
                    readOnly
                    placeholder="No route hint configured"
                  />
                  <p className="text-xs text-neutral-600">
                    Routing hints help ensure successful payments. Configure in Profile Settings.
                  </p>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Backup Wallet</p>
                      <p className="text-xs text-neutral-600">Export your wallet backup file</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Export
                    </Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Channel Management</p>
                      <p className="text-xs text-neutral-600">
                        Open, close, and manage Lightning channels
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Manage
                    </Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Transaction History</p>
                      <p className="text-xs text-neutral-600">View all Lightning transactions</p>
                    </div>
                    <Button variant="outline" size="sm">
                      View History
                    </Button>
                  </div>
                </div>

                <Separator />

                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-800 mb-1">Danger Zone</p>
                      <p className="text-xs text-red-700 mb-3">
                        These actions are permanent and cannot be undone
                      </p>
                      <Button variant="destructive" size="sm">
                        Disconnect & Remove Wallet
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Zap className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900 mb-1">About Lightning Payments</p>
              <p className="text-xs text-blue-800">
                Lightning Network enables instant, low-fee Bitcoin payments. When you complete a
                bounty, you&apos;ll receive payment directly to your Lightning wallet within
                seconds. Make sure your wallet is connected and has sufficient inbound liquidity to
                receive payments.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
