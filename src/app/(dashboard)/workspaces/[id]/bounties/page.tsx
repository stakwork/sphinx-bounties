export default function WorkspaceBountiesPage({
  params: _params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Workspace Bounties</h1>
      <p className="text-muted-foreground">All bounties for this workspace</p>
    </div>
  );
}
