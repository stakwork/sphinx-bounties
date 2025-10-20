/**
 * ADMIN DASHBOARD PAGE
 * Route: /admin
 *
 * Child pages to implement:
 * - bounties/page.tsx             All bounties management
 * - workspaces/page.tsx           All workspaces management
 * - users/page.tsx                User management
 * - transactions/page.tsx         Financial monitoring
 * - analytics/page.tsx            Platform analytics
 * - settings/page.tsx             Platform settings
 *
 * Components: AdminStats, AdminTable, AdminSidebar (@sidebar parallel route)
 * API: All endpoints with elevated permissions
 * Auth: Super admin only
 */

export const dynamic = "force-dynamic";

export default function AdminPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">Platform management and analytics</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {/* TODO: Add stat cards */}
        {["Total Bounties", "Total Workspaces", "Total Users", "Sats Distributed"].map((stat) => (
          <div key={stat} className="rounded-lg border p-6">
            <h3 className="text-sm font-medium text-muted-foreground">{stat}</h3>
            <p className="text-2xl font-bold mt-2">-</p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border p-6 text-center">
        <p className="text-muted-foreground">Admin features coming soon</p>
      </div>
    </div>
  );
}
