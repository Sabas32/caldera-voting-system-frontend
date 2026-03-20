export const AUTH_REQUIRED_EVENT = "caldera:auth-required";

export function emitAuthRequired(reason: string = "session_expired") {
  if (typeof window === "undefined") {
    return;
  }
  window.dispatchEvent(new CustomEvent(AUTH_REQUIRED_EVENT, { detail: { reason } }));
}
