export default function ProfilePage({ params: _params }: { params: Promise<{ pubkey: string }> }) {
  return (
    <div className="space-y-4">
      <p className="text-muted-foreground">Profile default view (redirects to @about)</p>
    </div>
  );
}
