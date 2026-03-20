type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function toFriendlyFieldLabel(key: string): string {
  const directMap: Record<string, string> = {
    email: "Email address",
    password: "Password",
    current_password: "Current password",
    new_password: "New password",
    confirm_password: "Confirm password",
    token: "Voting token",
    non_field_errors: "Details",
  };

  if (directMap[key]) {
    return directMap[key];
  }

  return key
    .replaceAll("_", " ")
    .replaceAll(".", " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^\w/, (char) => char.toUpperCase());
}

function flattenDetails(details: unknown, parentKey?: string): string[] {
  if (Array.isArray(details)) {
    return details.flatMap((item) => flattenDetails(item, parentKey));
  }

  if (isRecord(details)) {
    return Object.entries(details).flatMap(([key, value]) => {
      const label = key === "non_field_errors" ? parentKey : parentKey ? `${parentKey}.${key}` : key;
      return flattenDetails(value, label);
    });
  }

  if (details === null || details === undefined || details === "") {
    return [];
  }

  if (parentKey) {
    return [`${toFriendlyFieldLabel(parentKey)}: ${String(details)}`];
  }
  return [String(details)];
}

function mapStatusFallback(status?: number): string {
  if (status === 400) {
    return "Please check the information you entered and try again.";
  }
  if (status === 401) {
    return "Please sign in to continue.";
  }
  if (status === 403) {
    return "You do not have permission to perform this action.";
  }
  if (status === 404) {
    return "The requested page or record was not found.";
  }
  if (status === 408 || status === 429) {
    return "The request could not be completed right now. Please try again shortly.";
  }
  if (status && status >= 500) {
    return "The server is temporarily unavailable. Please try again in a moment.";
  }
  return "We could not complete your request. Please try again.";
}

function flattenText(value: unknown): string {
  if (Array.isArray(value)) {
    return value.map((item) => flattenText(item)).join(" ");
  }
  if (isRecord(value)) {
    return Object.values(value)
      .map((item) => flattenText(item))
      .join(" ");
  }
  if (value === null || value === undefined) {
    return "";
  }
  return String(value);
}

export function isAuthFailurePayload(payload: unknown, status?: number): boolean {
  if (status !== 401 && status !== 403) {
    return false;
  }

  const text = flattenText(payload).toLowerCase();
  if (status === 401) {
    return true;
  }

  return (
    text.includes("not authenticated") ||
    text.includes("authentication credentials were not provided") ||
    text.includes("invalid session") ||
    text.includes("session expired")
  );
}

function mapTechnicalMessage(message: string): string | null {
  const value = message.toLowerCase();

  if (value.includes("csrf")) {
    return "Your session token expired. Please refresh the page and try again.";
  }
  if (value.includes("not authenticated") || value.includes("authentication credentials were not provided")) {
    return "Please sign in to continue.";
  }
  if (value === "forbidden" || value.includes("permission")) {
    return "You do not have permission to perform this action.";
  }
  if (value.includes("failed to fetch") || value.includes("networkerror") || value.includes("network error")) {
    return "Unable to connect to the server. Please check your internet connection and try again.";
  }

  return null;
}

export function extractApiErrorMessage(payload: unknown, fallback?: string, status?: number): string {
  const statusFallback = fallback ?? mapStatusFallback(status);
  const root = isRecord(payload) ? payload : null;

  const explicitMessage = root?.message;
  if (typeof explicitMessage === "string" && explicitMessage.trim()) {
    return mapTechnicalMessage(explicitMessage) ?? explicitMessage;
  }

  const detail = root?.detail;
  if (typeof detail === "string" && detail.trim()) {
    return mapTechnicalMessage(detail) ?? detail;
  }

  const details = root?.details ?? payload;
  const lines = flattenDetails(details);
  if (lines.length) {
    return lines.join(" | ");
  }

  return statusFallback;
}

