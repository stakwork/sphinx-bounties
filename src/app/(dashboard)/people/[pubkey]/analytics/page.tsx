"use client";

import { use } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { UserAnalytics } from "@/components/analytics/UserAnalytics";
import { ArrowLeft } from "lucide-react";

export default function UserAnalyticsPage({
  params: paramsPromise,
}: {
  params: Promise<{ pubkey: string }>;
}) {
  const params = use(paramsPromise);
  const pubkey = params.pubkey;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/people/${pubkey}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">User Analytics</h1>
          <p className="text-sm text-neutral-600 mt-1">Detailed performance metrics and insights</p>
        </div>
      </div>

      <UserAnalytics pubkey={pubkey} />
    </div>
  );
}
