export default function AboutTab({ params: _params }: { params: Promise<{ pubkey: string }> }) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">About</h2>
      <p className="text-muted-foreground">User bio, skills, and information</p>
    </div>
  );
}
