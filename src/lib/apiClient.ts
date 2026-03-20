import { API_BASE_URL, endpoints } from "@/lib/endpoints";
import { extractApiErrorMessage, isAuthFailurePayload } from "@/lib/apiErrors";
import { emitAuthRequired } from "@/lib/authEvents";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly payload?: unknown,
  ) {
    super(message);
  }
}

let csrfTokenCache: string | null = null;
let csrfTokenRequest: Promise<string | null> | null = null;

async function fetchCsrfToken(force = false): Promise<string | null> {
  if (typeof window === "undefined") {
    return null;
  }

  if (!force && csrfTokenCache) {
    return csrfTokenCache;
  }

  if (!csrfTokenRequest) {
    csrfTokenRequest = fetch(`${API_BASE_URL}${endpoints.auth.csrf}`, {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    })
      .then(async (response) => {
        const payload = await response.json().catch(() => null);
        if (!response.ok) {
          return null;
        }
        const token = payload?.data?.csrf_token;
        csrfTokenCache = typeof token === "string" ? token : null;
        return csrfTokenCache;
      })
      .finally(() => {
        csrfTokenRequest = null;
      });
  }

  return csrfTokenRequest;
}

export async function apiClient<T>(path: string, init?: RequestInit): Promise<T> {
  const method = init?.method?.toUpperCase() ?? "GET";
  const isUnsafe = ["POST", "PUT", "PATCH", "DELETE"].includes(method);
  const request = async (csrfToken?: string | null) => {
    try {
      return await fetch(`${API_BASE_URL}${path}`, {
        ...init,
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(isUnsafe && csrfToken ? { "X-CSRFToken": csrfToken } : {}),
          ...(init?.headers ?? {}),
        },
        cache: "no-store",
      });
    } catch {
      throw new ApiError(
        "Unable to connect to the server. Please check your internet connection and try again.",
        0,
      );
    }
  };

  let csrfToken = isUnsafe ? await fetchCsrfToken() : null;
  let response = await request(csrfToken);

  if (isUnsafe && response.status === 403) {
    csrfTokenCache = null;
    csrfToken = await fetchCsrfToken(true);
    if (csrfToken) {
      response = await request(csrfToken);
    }
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message = extractApiErrorMessage(payload, undefined, response.status);
    const authRoute = [endpoints.auth.login, endpoints.auth.logout, endpoints.auth.csrf, endpoints.auth.me].some((item) =>
      path.startsWith(item),
    );
    if (!authRoute && isAuthFailurePayload(payload, response.status)) {
      emitAuthRequired(response.status === 401 ? "unauthorized" : "forbidden_auth");
    }
    throw new ApiError(message, response.status, payload);
  }

  return payload as T;
}

