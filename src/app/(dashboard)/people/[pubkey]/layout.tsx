import type { ReactNode } from "react";

export default function ProfileLayout({
  children,
  about: _about,
  bounties: _bounties,
  assigned: _assigned,
  workspaces: _workspaces,
}: {
  children: ReactNode;
  about: ReactNode;
  bounties: ReactNode;
  assigned: ReactNode;
  workspaces: ReactNode;
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">User Profile</h1>
      </div>
      <div className="border-b">
        <nav className="flex gap-4">
          <button className="border-b-2 border-primary-500 px-4 py-2">About</button>
          <button className="px-4 py-2">Bounties</button>
          <button className="px-4 py-2">Assigned</button>
          <button className="px-4 py-2">Workspaces</button>
        </nav>
      </div>
      <div>{children}</div>
    </div>
  );
}
