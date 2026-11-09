import { apiGet } from "./client";

export { ApiError, isAbortError, isUnavailableError } from "./client";

// Same order as in the station settings.
export const PRODUCTS = [
  "suburban",
  "subway",
  "tram",
  "bus",
  "ferry",
  "express",
  "regional",
];

const clampInt = (value, min, max, fallback) => {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
};

export async function searchStations(query, { language, signal } = {}) {
  const data = await apiGet(
    "/stations",
    [
      ["q", query],
      ["lang", language],
    ],
    { signal },
  );
  return data?.stations ?? [];
}

// `station` is an entry of the station settings.
export async function getDepartures(
  station,
  { language, standardRemarks, signal } = {},
) {
  const enabled = PRODUCTS.filter((name) => station[name] !== false);
  if (enabled.length === 0) return [];

  const data = await apiGet(
    "/departures",
    [
      ["stop", station.id],
      ["products", enabled.length === PRODUCTS.length ? null : enabled.join(",")],
      ["offset", clampInt(station.when, 0, 1439, 0) || null],
      ["results", clampInt(station.results, 1, 50, 4)],
      ["direction", station.destination?.id],
      ["remarks", standardRemarks ? "all" : "disruptions"],
      ["lang", language],
    ],
    { signal },
  );
  return data?.departures ?? [];
}

export async function isAlive({ signal } = {}) {
  try {
    const data = await apiGet("/health", [], { signal });
    return data?.ok === true;
  } catch {
    return false;
  }
}

// How long a departure stays on the board as "now" after its time has
// passed. The loaded time can be outdated (a delay that grew since the last
// fetch) and the clock of the device can be off, so the row is not removed
// right away. The board updates every 10 seconds, so the row is gone at
// most 60 seconds after its time.
const DEPARTED_GRACE_MS = 50000;

// Converts the departures of several stations into the row format of
// DepartureTable. `when` is the number of minutes until departure at `now`,
// null for cancelled departures ("Fällt aus"). The board calls this again
// with a newer `now` to keep the countdown running between two fetches.
// A departure that left more than DEPARTED_GRACE_MS ago gets no row.
export function toColumnData(departuresPerStation, now = new Date()) {
  const msUntil = (time) =>
    time ? new Date(time).getTime() - now.getTime() : null;

  const rows = [];
  departuresPerStation.forEach((departures, i) => {
    departures.forEach((departure, j) => {
      const left = msUntil(departure.when ?? departure.plannedWhen);
      if (left !== null && left < -DEPARTED_GRACE_MS) return;
      const untilDeparture = departure.cancelled
        ? null
        : msUntil(departure.when);
      const stop = departure.stop ?? {};
      rows.push({
        // The position in the response, so a row keeps its key when the
        // departures before it have left.
        key: `${i}_${stop.id}_${j}`,
        lineName: departure.line,
        direction: departure.direction,
        departureName: stop.name,
        when: untilDeparture === null ? null : Math.floor(untilDeparture / 60000),
        remarks: departure.remarks ?? [],
        stopId: stop.id,
      });
    });
  });
  return rows;
}
