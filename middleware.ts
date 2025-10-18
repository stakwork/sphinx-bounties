import { NextResponse } from "next/server";

export function middleware() {
  const response = NextResponse.next();

  const requestId = crypto.randomUUID();
  response.headers.set("x-request-id", requestId);

  return response;
}

// All API routes (for now)
export const config = {
  matcher: ["/api/:path*"],
};
