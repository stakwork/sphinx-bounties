export default function WorkspacesTab({
  params: _params,
}: {
  params: Promise<{ pubkey: string }>;
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Workspaces</h2>
      <p className="text-muted-foreground">Workspaces this user is a member of</p>
    </div>
  );
}
