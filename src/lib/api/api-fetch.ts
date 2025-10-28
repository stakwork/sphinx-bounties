export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
    const headers = new Headers(init?.headers || {});
    headers.set(
      "x-user-pubkey",
      "02a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2"
    );
    return fetch(input, { ...init, headers });
  }
  return fetch(input, init);
}
