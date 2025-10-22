export default function AssignedTab({ params: _params }: { params: Promise<{ pubkey: string }> }) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Assigned Bounties</h2>
      <p className="text-muted-foreground">Bounties assigned to this user</p>
    </div>
  );
}
