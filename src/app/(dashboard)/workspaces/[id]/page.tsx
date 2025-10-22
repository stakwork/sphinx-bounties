export default function WorkspaceDetailPage({
  params: _params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Workspace Overview</h1>
      <p className="text-muted-foreground">Workspace dashboard and stats</p>
    </div>
  );
}
