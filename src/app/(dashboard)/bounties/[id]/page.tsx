export default function BountyDetailPage({ params: _params }: { params: Promise<{ id: string }> }) {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Bounty Details</h1>
      <p className="text-muted-foreground">Full bounty page view</p>
    </div>
  );
}
