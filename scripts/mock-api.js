#!/usr/bin/env node
// Local mock of the weilsiedichlieben API with made-up sample data, so the
// website can be developed without access to the real API.
//
//   npm run mock-api   # http://localhost:8787/v1, matches .env.development
//   npm start          # in a second terminal
//
// Responses follow the public API format described in README.md. The data is
// invented: times are generated relative to now, lines and vehicles are
// examples.

const http = require("http");

const PORT = Number(process.env.PORT) || 8787;

const STATIONS = [
  { id: "900100003", name: "S+U Alexanderplatz Bhf (Berlin)", lat: 52.521508, lon: 13.411267 },
  { id: "900003201", name: "S+U Berlin Hauptbahnhof", lat: 52.525592, lon: 13.369545 },
  { id: "900017101", name: "U Mehringdamm (Berlin)", lat: 52.49357, lon: 13.388138 },
  { id: "900120003", name: "S Ostkreuz Bhf (Berlin)", lat: 52.503013, lon: 13.469031 },
  { id: "900023201", name: "S+U Zoologischer Garten Bhf (Berlin)", lat: 52.506921, lon: 13.332707 },
  { id: "900007102", name: "S+U Gesundbrunnen Bhf (Berlin)", lat: 52.548637, lon: 13.388372 },
];

const LINES = [
  { line: "S7", product: "suburban", direction: "S Ahrensfelde Bhf (Berlin)" },
  { line: "U2", product: "subway", direction: "Ruhleben" },
  { line: "M10", product: "tram", direction: "S+U Hauptbahnhof" },
  { line: "S5", product: "suburban", direction: "S Westkreuz (Berlin)" },
  { line: "200", product: "bus", direction: "S+U Zoologischer Garten" },
  { line: "U8", product: "subway", direction: "Wittenau" },
  { line: "RE1", product: "regional", direction: "Frankfurt (Oder), Bahnhof" },
  { line: "F10", product: "ferry", direction: "Kladow" },
];

const HINTS = [{ type: "hint", text: "Fahrradmitnahme möglich" }];
const DISRUPTION = {
  type: "disruption",
  summary: "Bauarbeiten",
  text: "Beispielhafte Störungsmeldung: Ersatzverkehr zwischen zwei Stationen.",
};

const json = (res, status, body) => {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(body));
};

const error = (res, status, code, message) =>
  json(res, status, { error: { code, message } });

const stationById = (id) =>
  STATIONS.find((s) => s.id === id || `900000${s.id.slice(3)}` === id) || {
    id,
    name: "Beispielhaltestelle",
    lat: 52.52,
    lon: 13.405,
  };

// ISO 8601 with offset, as the real API returns it.
const iso = (date) => {
  const offset = -date.getTimezoneOffset();
  const sign = offset >= 0 ? "+" : "-";
  const pad = (n) => String(Math.floor(Math.abs(n))).padStart(2, "0");
  const local = new Date(date.getTime() + offset * 60000).toISOString().slice(0, 19);
  return `${local}${sign}${pad(offset / 60)}:${pad(offset % 60)}`;
};

function departures(params) {
  const stop = stationById(params.get("stop") || "");
  const results = Math.min(50, Math.max(1, Number(params.get("results")) || 10));
  const offset = Number(params.get("offset")) || 0;
  const products = params.get("products")?.split(",");
  const withHints = params.get("remarks") === "all";
  const lines = LINES.filter((l) => !products || products.includes(l.product));
  if (!lines.length) return [];

  const start = Date.now() + offset * 60000;
  return Array.from({ length: results }, (_, i) => {
    const l = lines[i % lines.length];
    const planned = new Date(start + (i + 1) * 3 * 60000);
    const delay = i % 4 === 1 ? 2 : 0;
    const remarks = [
      ...(i === 2 ? [DISRUPTION] : []),
      ...(i === 3 ? [{ type: "status", text: `${l.line}: Fällt aus` }] : []),
      ...(withHints && l.product === "suburban" ? HINTS : []),
    ];
    return {
      tripId: `mock|${l.line}|${i}`,
      line: l.line,
      product: l.product,
      direction: l.direction,
      stop,
      plannedWhen: iso(planned),
      when: iso(new Date(planned.getTime() + delay * 60000)),
      cancelled: i === 3,
      platform: l.product === "bus" ? null : String((i % 4) + 1),
      remarks,
    };
  });
}

function vehicles(params) {
  const lat = Number(params.get("lat")) || 52.52;
  const lon = Number(params.get("lon")) || 13.405;
  const trips = params.get("trips")?.split(",") ?? LINES.map((l, i) => `mock|${l.line}|${i}`);
  return trips.slice(0, 10).map((tripId, i) => {
    const l = LINES.find((x) => tripId.includes(`|${x.line}|`)) || LINES[i % LINES.length];
    const angle = (i / 10) * 2 * Math.PI;
    return {
      tripId,
      line: l.line,
      product: l.product,
      direction: l.direction,
      lat: lat + 0.006 * Math.sin(angle),
      lon: lon + 0.009 * Math.cos(angle),
    };
  });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  if (req.method === "OPTIONS") return json(res, 204, {});
  if (req.method !== "GET") return error(res, 405, "method_not_allowed", "Method not allowed");

  const p = url.searchParams;
  switch (url.pathname.replace(/\/+$/, "")) {
    case "/v1/health":
      return json(res, 200, { ok: true });
    case "/v1/stations": {
      const q = (p.get("q") || "").trim().toLowerCase();
      if (q.length < 2) return error(res, 400, "invalid_parameter", "q must have at least 2 characters");
      // Without a match, suggest all sample stations so the search always
      // offers something to pick.
      const matches = STATIONS.filter((s) => s.name.toLowerCase().includes(q));
      return json(res, 200, { stations: matches.length ? matches : STATIONS });
    }
    case "/v1/departures":
      if (!p.get("stop")) return error(res, 400, "invalid_parameter", "Missing parameter: stop");
      return json(res, 200, { departures: departures(p) });
    case "/v1/vehicles":
      return json(res, 200, { vehicles: vehicles(p) });
    default:
      return error(res, 404, "not_found", "Not found");
  }
});

// Share link that opens the board with two sample stations already set up.
const demoLink = () => {
  const params = new URLSearchParams({ fontSize: "22" });
  for (const s of STATIONS.slice(0, 2)) {
    params.append("id", s.id);
    params.append("value", s.name);
    for (const p of ["bus", "express", "ferry", "regional", "suburban", "subway", "tram"]) {
      params.append(p, "true");
    }
    params.append("when", "0");
    params.append("results", "4");
  }
  return `http://localhost:3000/?${params}`;
};

server.listen(PORT, () => {
  console.log(`Mock API with sample data on http://localhost:${PORT}/v1`);
  console.log("");
  console.log("Start the app with `npm start`, then open this link to see a board");
  console.log("with two sample stations:");
  console.log(demoLink());
  console.log("");
  console.log("The station search offers the sample stations only:");
  console.log(STATIONS.map((s) => `  ${s.name}`).join("\n"));
});
