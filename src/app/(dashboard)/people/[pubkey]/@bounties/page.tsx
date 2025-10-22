export default function BountiesTab({ params: _params }: { params: Promise<{ pubkey: string }> }) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Created Bounties</h2>
      <p className="text-muted-foreground">Bounties created by this user</p>
    </div>
  );
}
