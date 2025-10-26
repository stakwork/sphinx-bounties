import { BountyDetail } from "@/components/bounties/BountyDetail";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function BountyPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <div className="space-y-6">
      <Link href="/bounties">
        <Button variant="ghost" size="sm" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Bounties
        </Button>
      </Link>

      <BountyDetail bountyId={id} />
    </div>
  );
}
