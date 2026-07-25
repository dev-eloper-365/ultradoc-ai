/** Per-tab session id, sent as the `X-Session-Id` header on every API call so
 * the backend only shows this browser session the documents it uploaded —
 * not every document anyone has ever uploaded to the instance. Lives in
 * `sessionStorage` (not `localStorage`): it should not survive closing the
 * tab, matching what "this session" means to a user. */
const SESSION_STORAGE_KEY = "ultradoc_session_id";

export function getSessionId(): string | undefined {
  if (typeof window === "undefined") return undefined;

  const existing = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (existing) return existing;

  const id = crypto.randomUUID();
  window.sessionStorage.setItem(SESSION_STORAGE_KEY, id);
  return id;
}
