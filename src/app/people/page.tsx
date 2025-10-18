/**
 * PEOPLE DIRECTORY PAGE
 * Route: /people
 *
 * Child pages to implement:
 * - [id]/page.tsx                Profile overview (redirects to @about)
 * - [id]/layout.tsx              Profile shell with tabs
 * - [id]/@about/page.tsx         About tab (parallel route)
 * - [id]/@workspaces/page.tsx    Workspaces tab
 * - [id]/@bounties/page.tsx      Created bounties tab
 * - [id]/@assigned/page.tsx      Assigned bounties tab
 * - [id]/@badges/page.tsx        Badges tab
 *
 * Components: ProfileCard, UserSearch, UserGrid
 * API: GET /api/users
 * Models: User, Bounty, WorkspaceMember
 */

export default function PeoplePage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">People</h1>
        <p className="text-muted-foreground">Discover bounty hunters and workspace owners</p>
      </div>

      <div className="mb-6">
        {/* TODO: Add search bar */}
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Search coming soon</p>
        </div>
      </div>

      <div className="rounded-lg border p-6 text-center">
        <p className="text-muted-foreground">No users to display</p>
      </div>
    </div>
  );
}
