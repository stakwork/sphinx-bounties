/**
 * BOUNTIES FEED PAGE
 * Route: /bounties
 *
 * Child pages to implement:
 * - [id]/page.tsx                Full bounty detail page
 * - @modal/[id]/page.tsx         Parallel route for modal overlay
 * - (.)bounty/[id]/page.tsx      Intercepting route for soft navigation
 * - daily/page.tsx               Featured daily bounty
 *
 * Components: BountyCard, BountyFilters, BountySearch, BountyGrid
 * API: GET /api/bounties
 * Models: Bounty, User, Workspace
 */

export default function BountiesPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Bounties</h1>
        <p className="text-muted-foreground">Discover and complete bounties to earn sats</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Filters sidebar */}
        <aside className="lg:col-span-1">
          <div className="rounded-lg border p-4">
            <h3 className="font-semibold mb-4">Filters</h3>
            {/* TODO: Add filters (status, languages, amount range) */}
            <p className="text-sm text-muted-foreground">Filters coming soon</p>
          </div>
        </aside>

        {/* Bounties grid */}
        <main className="lg:col-span-3">
          <div className="rounded-lg border p-6 text-center">
            <p className="text-muted-foreground">No bounties yet</p>
          </div>
        </main>
      </div>
    </div>
  );
}
