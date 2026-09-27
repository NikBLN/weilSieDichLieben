// Basis-URL der weilsiedichlieben-API. Gesetzt über REACT_APP_API_BASE_URL in
// .env.development (lokaler Worker) und .env.production.
export const API_BASE_URL = (
  process.env.REACT_APP_API_BASE_URL || "https://api.weilsiedichlieben.de/v1"
).replace(/\/+$/, "");
