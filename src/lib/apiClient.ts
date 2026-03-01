import { API_BASE_URL } from "@/lib/endpoints";
import { extractApiErrorMessage } from "@/lib/apiErrors";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly payload?: unknown,
  ) {
    super(message);
  }
}

export async function apiClient<T>(path: string, init?: RequestInit): Promise<T> {
  const method = init?.method?.toUpperCase() ?? "GET";
  const isUnsafe = ["POST", "PUT", "PATCH", "DELETE"].includes(method);
  const csrfToken =
    typeof document !== "undefined"
      ? document.cookie
          .split("; ")
          .find((part) => part.startsWith("csrftoken="))
          ?.split("=")[1]
      : undefined;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(isUnsafe && csrfToken ? { "X-CSRFToken": decodeURIComponent(csrfToken) } : {}),
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(extractApiErrorMessage(payload, `Request failed (HTTP ${response.status})`), response.status, payload);
  }

  return payload as T;
}

