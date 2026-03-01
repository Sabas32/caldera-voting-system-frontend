type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
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
    return [`${parentKey}: ${String(details)}`];
  }
  return [String(details)];
}

export function extractApiErrorMessage(payload: unknown, fallback = "Request failed"): string {
  const root = isRecord(payload) ? payload : null;

  const explicitMessage = root?.message;
  if (typeof explicitMessage === "string" && explicitMessage.trim()) {
    return explicitMessage;
  }

  const detail = root?.detail;
  if (typeof detail === "string" && detail.trim()) {
    return detail;
  }

  const details = root?.details ?? payload;
  const lines = flattenDetails(details);
  if (lines.length) {
    return lines.join(" | ");
  }

  return fallback;
}

