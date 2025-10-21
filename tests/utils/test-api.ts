/**
 * API utilities for integration tests
 */

import type { NextRequest } from "next/server";

/**
 * Create a NextRequest from URL and init for route handler testing
 * This helper is needed because standard Request doesn't work with Next.js route handlers
 */
export const createNextRequest = (url: string, init?: RequestInit): NextRequest => {
  return new Request(url, init) as unknown as NextRequest;
};

/**
 * Create an authenticated API request with x-user-pubkey header
 */
export const createAuthedRequest = (
  url: string,
  pubkey: string,
  init?: RequestInit
): NextRequest => {
  const headers = new Headers(init?.headers);
  headers.set("x-user-pubkey", pubkey);
  headers.set("Content-Type", "application/json");

  return createNextRequest(url, {
    ...init,
    headers,
  });
};

/**
 * Create a POST request with JSON body
 */
export const createPostRequest = (url: string, body: unknown, pubkey?: string): NextRequest => {
  return createAuthedRequest(url, pubkey || "", {
    method: "POST",
    body: JSON.stringify(body),
  });
};

/**
 * Create a GET request with query parameters
 */
export const createGetRequest = (
  url: string,
  params: Record<string, string | number | boolean> = {},
  pubkey?: string
): NextRequest => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    searchParams.set(key, String(value));
  });

  const fullUrl = searchParams.toString() ? `${url}?${searchParams.toString()}` : url;

  return createAuthedRequest(fullUrl, pubkey || "", {
    method: "GET",
  });
};

/**
 * Parse JSON response from Next.js Response object
 */
export const parseResponse = async <T = unknown>(response: Response): Promise<T> => {
  return response.json() as Promise<T>;
};

/**
 * Assert successful API response (2xx status)
 */
export const assertSuccess = (response: Response, expectedStatus = 200) => {
  if (response.status !== expectedStatus) {
    throw new Error(`Expected status ${expectedStatus}, got ${response.status}`);
  }
};

/**
 * Assert error API response (4xx/5xx status)
 */
export const assertError = (response: Response, expectedStatus: number) => {
  if (response.status !== expectedStatus) {
    throw new Error(`Expected error status ${expectedStatus}, got ${response.status}`);
  }
};
