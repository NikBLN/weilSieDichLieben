// Base URL of the weilsiedichlieben API, set via REACT_APP_API_BASE_URL in
// .env.development (local API) and .env.production.
export const API_BASE_URL = (
  process.env.REACT_APP_API_BASE_URL || "https://api.weilsiedichlieben.de/v1"
).replace(/\/+$/, "");
