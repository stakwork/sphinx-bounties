export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  let url = input;
  if (typeof input === "string" && input.startsWith("/")) {
    url = "http://localhost:3000" + input;
  }
  return fetch(url, init);
}
