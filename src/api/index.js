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

// Converts the departures of several stations into the row format of
// DepartureTable. `when` is the number of minutes until departure, null for
// cancelled departures ("Fällt aus").
export function toColumnData(departuresPerStation, now = new Date()) {
  const rows = [];
  departuresPerStation.forEach((departures, i) => {
    departures.forEach((departure, j) => {
      const whenDate = departure.when ? new Date(departure.when) : null;
      const minutes =
        departure.cancelled || !whenDate
          ? null
          : Math.floor((whenDate.getTime() - now.getTime()) / 60000);
      const stop = departure.stop ?? {};
      rows.push({
        key: `${i}_${stop.id}_${j}`,
        lineName: departure.line,
        direction: departure.direction,
        departureName: stop.name,
        when: minutes,
        remarks: departure.remarks ?? [],
        stopId: stop.id,
      });
    });
  });
  return rows;
}
