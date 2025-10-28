export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  if (
    typeof window !== "undefined" &&
    process.env.NODE_ENV === "development" &&
    process.env.NEXT_PUBLIC_MOCK_USER_PUBKEY
  ) {
    const headers = new Headers(init?.headers || {});
    headers.set("x-user-pubkey", process.env.NEXT_PUBLIC_MOCK_USER_PUBKEY);
    return fetch(input, { ...init, headers });
  }
  return fetch(input, init);
}
