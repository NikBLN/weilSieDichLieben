import { API_BASE_URL } from "./config";

export class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

// Status, bei denen die API als nicht verfügbar gilt: Netzwerkfehler (0),
// Rate-Limit und Störung der Datenquelle.
export const isUnavailableError = (err) =>
  err instanceof ApiError && [0, 429, 503].includes(err.status);

export const isAbortError = (err) => err?.name === "AbortError";

// GET auf die API. `params` ist eine Liste von [Name, Wert]-Paaren, damit die
// Reihenfolge in der URL immer gleich ist. Die API cacht nach der
// vollständigen URL, gleiche Anfragen sollen also gleich aussehen.
export async function apiGet(path, params = [], { signal } = {}) {
  const url = new URL(`${API_BASE_URL}${path}`);
  for (const [name, value] of params) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.append(name, String(value));
    }
  }

  let response;
  try {
    response = await fetch(url.toString(), {
      signal,
      headers: { Accept: "application/json" },
    });
  } catch (err) {
    if (isAbortError(err)) throw err;
    throw new ApiError(0, "network_error", err?.message || "Network error");
  }

  let body = null;
  try {
    body = await response.json();
  } catch {
    // Keine JSON-Antwort, z. B. eine Fehlerseite.
  }

  if (!response.ok) {
    throw new ApiError(
      response.status,
      body?.error?.code || "http_error",
      body?.error?.message || `HTTP ${response.status}`,
    );
  }
  return body;
}
