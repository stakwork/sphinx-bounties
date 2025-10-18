/**
 * LEADERBOARD PAGE
 * Route: /leaderboard
 * 
 * Features:
 * - Top bounty hunters by earnings
 * - Top workspace creators by bounties posted
 * - Most active users
 * - Recent completions
 * 
 * Components: LeaderboardTable, LeaderboardFilters, UserRankCard
 * API: GET /api/bounties/leaderboard, GET /api/users with stats
 * Models: User, Bounty, Transaction
 */

export default function LeaderboardPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Leaderboard</h1>
        <p className="text-muted-foreground">
          Top bounty hunters and workspace creators
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3 mb-8">
        {/* TODO: Add top 3 cards with podium styling */}
        {[1, 2, 3].map((rank) => (
          <div key={rank} className="rounded-lg border p-6 text-center">
            <div className="text-4xl font-bold text-muted-foreground mb-2">#{rank}</div>
            <p className="text-sm text-muted-foreground">Coming soon</p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">All Rankings</h2>
        </div>
        <div className="p-6 text-center">
          <p className="text-muted-foreground">Leaderboard data coming soon</p>
        </div>
      </div>
    </div>
  );
}
