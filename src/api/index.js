import { apiGet } from "./client";

export { ApiError, isAbortError, isUnavailableError } from "./client";

// Reihenfolge wie in den Stationseinstellungen.
export const PRODUCTS = [
  "suburban",
  "subway",
  "tram",
  "bus",
  "ferry",
  "express",
  "regional",
];

const RADAR_RADIUS_METERS = 2000;
const MAX_TRIPS = 40;

const clampInt = (value, min, max, fallback) => {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
};

// Auf rund 100 m gerundet, damit gleiche Karten dieselbe URL erzeugen.
const roundCoord = (value) => Math.round(Number(value) * 1000) / 1000;

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

// `station` ist ein Eintrag aus den Stationseinstellungen.
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

export async function getVehicles({ latitude, longitude, trips = [], signal }) {
  const tripIds = [...new Set(trips.filter(Boolean))].sort().slice(0, MAX_TRIPS);
  const data = await apiGet(
    "/vehicles",
    [
      ["lat", roundCoord(latitude)],
      ["lon", roundCoord(longitude)],
      ["radius", RADAR_RADIUS_METERS],
      ["trips", tripIds.length ? tripIds.join(",") : null],
    ],
    { signal },
  );
  return data?.vehicles ?? [];
}

export async function isAlive({ signal } = {}) {
  try {
    const data = await apiGet("/health", [], { signal });
    return data?.ok === true;
  } catch {
    return false;
  }
}

// Wandelt die Abfahrten mehrerer Stationen in das Zeilenformat von
// DepartureTable. `when` ist die Minutenzahl bis zur Abfahrt, bei
// ausgefallenen Fahrten null ("Fällt aus").
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
        tripId: departure.tripId,
        stopId: stop.id,
        stopLocation:
          stop.lat != null && stop.lon != null
            ? { id: stop.id, latitude: stop.lat, longitude: stop.lon }
            : null,
      });
    });
  });
  return rows;
}
