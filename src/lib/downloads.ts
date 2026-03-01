import { API_BASE_URL } from "@/lib/endpoints";
import { extractApiErrorMessage } from "@/lib/apiErrors";

function readCsrfToken() {
  if (typeof document === "undefined") {
    return null;
  }
  const found = document.cookie
    .split("; ")
    .find((part) => part.startsWith("csrftoken="))
    ?.split("=")[1];
  return found ? decodeURIComponent(found) : null;
}

export async function downloadFile({
  path,
  filename,
  headers,
}: {
  path: string;
  filename: string;
  headers?: HeadersInit;
}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    cache: "no-store",
    headers: {
      ...(readCsrfToken() ? { "X-CSRFToken": readCsrfToken() as string } : {}),
      ...(headers ?? {}),
    },
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(extractApiErrorMessage(payload, `Download failed (HTTP ${response.status})`));
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
