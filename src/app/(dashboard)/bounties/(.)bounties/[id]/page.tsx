export default function BountyModalPage({ params: _params }: { params: Promise<{ id: string }> }) {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Bounty Modal</h1>
      <p className="text-muted-foreground">Intercepted route - modal overlay</p>
    </div>
  );
}
