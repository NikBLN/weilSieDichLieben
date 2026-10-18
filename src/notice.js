// The header notice comes from /notice.json on the web server. The file is
// maintained by hand via FTP and is not part of the repository, so the deploy
// never touches it. Format and examples: README "Header notice".

const NOTICE_URL = "/notice.json";
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

// A text is either one string for all languages or { de, en }.
// Missing translations fall back to German.
export const localize = (value, language) => {
  if (typeof value === "string") return value;
  if (value == null || typeof value !== "object") return null;
  const text = value[language] ?? value.de;
  return typeof text === "string" ? text : null;
};

// A date without a time means the whole day in the viewer's time zone:
// "from" starts at 00:00, "until" ends at 23:59:59.
const parseBoundary = (value, endOfDay) => {
  if (value == null) return null;
  if (typeof value !== "string") return NaN;
  if (DATE_ONLY.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    return endOfDay
      ? new Date(year, month - 1, day, 23, 59, 59, 999).getTime()
      : new Date(year, month - 1, day).getTime();
  }
  return Date.parse(value);
};

// Returns the notice if it should be shown at `now`, otherwise null.
// Anything malformed hides the notice instead of breaking the page.
export const getActiveNotice = (notice, now = Date.now()) => {
  if (notice == null || typeof notice !== "object") return null;
  if (notice.active === false) return null;
  if (!Number.isFinite(notice.version)) return null;
  if (!localize(notice.title, "de")) return null;

  const from = parseBoundary(notice.from, false);
  const until = parseBoundary(notice.until, true);
  if (Number.isNaN(from) || Number.isNaN(until)) return null;
  if (
    notice.hideAfter != null &&
    !(typeof notice.hideAfter === "number" && notice.hideAfter > 0)
  ) {
    return null;
  }
  if (from != null && now < from) return null;
  if (until != null && now > until) return null;

  return notice;
};

// notice.json may contain // and /* */ comments to document the fields.
// Removes them, leaving strings such as URLs untouched.
export const stripJsonComments = (text) => {
  let result = "";
  let inString = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (inString) {
      result += char;
      if (char === "\\") {
        result += next ?? "";
        i += 1;
      } else if (char === '"') {
        inString = false;
      }
    } else if (char === '"') {
      inString = true;
      result += char;
    } else if (char === "/" && next === "/") {
      const end = text.indexOf("\n", i);
      i = end === -1 ? text.length : end - 1;
    } else if (char === "/" && next === "*") {
      const end = text.indexOf("*/", i + 2);
      i = end === -1 ? text.length : end + 1;
    } else {
      result += char;
    }
  }

  return result;
};

// Resolves to the raw notice, or null if there is none or it cannot be read.
export const fetchNotice = async () => {
  try {
    const response = await fetch(`${NOTICE_URL}?t=${Date.now()}`);
    if (!response.ok) return null;
    return JSON.parse(stripJsonComments(await response.text()));
  } catch (error) {
    // No file (the server answers with index.html) or invalid JSON.
    return null;
  }
};
