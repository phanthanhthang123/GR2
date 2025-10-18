import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Simple API helper for client requests to backend
// Uses Vite dev proxy (see vite.config.ts) so base URL can be "/api" in dev
const API_BASE = "/api/v1";

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

export async function apiFetch<TResponse>(
  path: string,
  options: {
    method?: HttpMethod;
    body?: unknown;
    headers?: Record<string, string>;
    credentials?: RequestCredentials;
  } = {}
): Promise<TResponse> {
  const { method = "GET", body, headers = {}, credentials } = options;

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    credentials: credentials ?? "include",
    body: body != null ? JSON.stringify(body) : undefined,
  });

  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? await response.json() : (await response.text());

  if (!response.ok) {
    const errorMessage = (isJson && payload && (payload as any).message) || response.statusText;
    throw new Error(errorMessage || "Request failed");
  }

  return payload as TResponse;
}
