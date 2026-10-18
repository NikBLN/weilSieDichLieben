import { API_BASE_URL } from "./config";

export class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

// Statuses that mark the API as unavailable: network error (0), rate limit
// and timetable service outage.
export const isUnavailableError = (err) =>
  err instanceof ApiError && [0, 429, 503].includes(err.status);

export const isAbortError = (err) => err?.name === "AbortError";

// GET request to the API. `params` is a list of [name, value] pairs so the
// order in the URL is always the same. The API caches by full URL, so equal
// requests should look equal.
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
    // Not a JSON response, e.g. an error page.
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
