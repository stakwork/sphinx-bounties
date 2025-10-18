import { NextResponse } from "next/server";

/**
 * USERS API
 *
 * Child routes to implement:
 * - [id]/route.ts                      GET, PATCH user profile
 * - [id]/bounties/created/route.ts     GET bounties created by user
 * - [id]/bounties/assigned/route.ts    GET bounties assigned to user
 * - [id]/stats/route.ts                GET user statistics
 * - [id]/notifications/route.ts        GET user notifications
 * - [id]/notifications/[notifId]/route.ts  PATCH mark notification read
 * - search/route.ts                    GET search users
 *
 * Models: User, Notification, Bounty
 */

export async function GET() {
  try {
    // TODO: Implement list users (limited fields for privacy)
    // TODO: Add search, filters, pagination

    return NextResponse.json({
      data: [],
      meta: { total: 0, page: 1, perPage: 20 },
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}
