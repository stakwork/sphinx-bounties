export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  let url = input;
  if (typeof input === "string" && input.startsWith("/")) {
    url = "http://localhost:3000" + input;
  }
  const host =
    typeof url === "string" ? new URL(url).hostname : url instanceof URL ? url.hostname : "";
  if (host === "localhost" || host === "127.0.0.1") {
    const headers = new Headers(init?.headers || {});
    headers.set(
      "x-user-pubkey",
      "02a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2"
    );
    return fetch(url, { ...init, headers });
  }
  return fetch(url, init);
}
