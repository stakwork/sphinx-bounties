export default function WorkspaceBountyDetailPage({
  params: _params,
}: {
  params: Promise<{ id: string; bountyId: string }>;
}) {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Workspace Bounty Detail</h1>
      <p className="text-muted-foreground">Detailed view of workspace bounty</p>
    </div>
  );
}
