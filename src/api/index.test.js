import {
  ApiError,
  getDepartures,
  getVehicles,
  isAlive,
  isUnavailableError,
  searchStations,
  toColumnData,
} from "./index";

const station = {
  id: "900100003",
  value: "S+U Alexanderplatz Bhf (Berlin)",
  when: 0,
  results: 4,
  suburban: true,
  subway: true,
  tram: true,
  bus: true,
  ferry: true,
  express: true,
  regional: true,
  destination: null,
};

const jsonResponse = (body, status = 200) =>
  Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  });

const requestedUrl = () => new URL(global.fetch.mock.calls[0][0]);

beforeEach(() => {
  global.fetch = jest.fn(() => jsonResponse({ departures: [] }));
});

afterEach(() => {
  jest.resetAllMocks();
});

describe("getDepartures", () => {
  test("sends parameters in a fixed order and omits defaults", async () => {
    await getDepartures(station, { language: "de", standardRemarks: false });
    const url = requestedUrl();
    expect(url.origin + url.pathname).toBe(
      "https://api.weilsiedichlieben.de/v1/departures",
    );
    expect(url.search).toBe(
      "?stop=900100003&results=4&remarks=disruptions&lang=de",
    );
  });

  test("passes products, offset, direction and remarks", async () => {
    await getDepartures(
      {
        ...station,
        when: 5,
        results: 8,
        bus: false,
        ferry: false,
        destination: { id: "900120003", name: "Ostkreuz" },
      },
      { language: "en", standardRemarks: true },
    );
    expect(requestedUrl().search).toBe(
      "?stop=900100003&products=suburban%2Csubway%2Ctram%2Cexpress%2Cregional" +
        "&offset=5&results=8&direction=900120003&remarks=all&lang=en",
    );
  });

  test("clamps offset and results to the allowed range", async () => {
    await getDepartures({ ...station, when: -3, results: 500 });
    const params = requestedUrl().searchParams;
    expect(params.has("offset")).toBe(false);
    expect(params.get("results")).toBe("50");
  });

  test("skips the request when no product is enabled", async () => {
    const none = Object.fromEntries(
      ["suburban", "subway", "tram", "bus", "ferry", "express", "regional"].map(
        (p) => [p, false],
      ),
    );
    await expect(getDepartures({ ...station, ...none })).resolves.toEqual([]);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test("throws ApiError with status and code", async () => {
    global.fetch = jest.fn(() =>
      jsonResponse({ error: { code: "upstream_timeout", message: "x" } }, 503),
    );
    const err = await getDepartures(station).catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(503);
    expect(err.code).toBe("upstream_timeout");
    expect(isUnavailableError(err)).toBe(true);
  });

  test("treats network failures as unavailable", async () => {
    global.fetch = jest.fn(() => Promise.reject(new TypeError("Failed to fetch")));
    const err = await getDepartures(station).catch((e) => e);
    expect(err.status).toBe(0);
    expect(isUnavailableError(err)).toBe(true);
  });

  test("does not treat invalid parameters as unavailable", async () => {
    global.fetch = jest.fn(() =>
      jsonResponse({ error: { code: "unknown_stop", message: "x" } }, 400),
    );
    const err = await getDepartures(station).catch((e) => e);
    expect(isUnavailableError(err)).toBe(false);
  });
});

describe("searchStations", () => {
  test("returns the stations of the response", async () => {
    const stations = [{ id: "900100003", name: "Alex", lat: 52.5, lon: 13.4 }];
    global.fetch = jest.fn(() => jsonResponse({ stations }));
    await expect(searchStations("Alex", { language: "en" })).resolves.toEqual(
      stations,
    );
    expect(requestedUrl().search).toBe("?q=Alex&lang=en");
  });
});

describe("getVehicles", () => {
  test("rounds coordinates and sorts trip ids", async () => {
    global.fetch = jest.fn(() => jsonResponse({ vehicles: [] }));
    await getVehicles({
      latitude: 52.521508,
      longitude: 13.411267,
      trips: ["1|3030|0|86|27092026", "1|1198|0|86|27092026", "1|3030|0|86|27092026"],
    });
    const params = requestedUrl().searchParams;
    expect(params.get("lat")).toBe("52.522");
    expect(params.get("lon")).toBe("13.411");
    expect(params.get("radius")).toBe("2000");
    expect(params.get("trips")).toBe("1|1198|0|86|27092026,1|3030|0|86|27092026");
  });
});

describe("isAlive", () => {
  test("is true only for ok responses", async () => {
    global.fetch = jest.fn(() => jsonResponse({ ok: true }));
    await expect(isAlive()).resolves.toBe(true);
    global.fetch = jest.fn(() => jsonResponse({ ok: false }, 503));
    await expect(isAlive()).resolves.toBe(false);
    global.fetch = jest.fn(() => Promise.reject(new TypeError("offline")));
    await expect(isAlive()).resolves.toBe(false);
  });
});

describe("toColumnData", () => {
  const now = new Date("2026-09-27T14:00:30+02:00");
  const departure = {
    tripId: "1|3030|0|86|27092026",
    line: "S7",
    product: "suburban",
    direction: "S Ahrensfelde Bhf (Berlin)",
    stop: {
      id: "900100003",
      name: "S+U Alexanderplatz Bhf (Berlin)",
      lat: 52.521508,
      lon: 13.411267,
    },
    plannedWhen: "2026-09-27T14:05:00+02:00",
    when: "2026-09-27T14:07:00+02:00",
    cancelled: false,
    platform: "3",
    remarks: [{ type: "hint", text: "Fahrradmitnahme möglich" }],
  };

  test("maps a departure to a table row", () => {
    expect(toColumnData([[departure]], now)).toEqual([
      {
        key: "0_900100003_0",
        lineName: "S7",
        direction: "S Ahrensfelde Bhf (Berlin)",
        departureName: "S+U Alexanderplatz Bhf (Berlin)",
        when: 6,
        remarks: [{ type: "hint", text: "Fahrradmitnahme möglich" }],
        tripId: "1|3030|0|86|27092026",
        stopId: "900100003",
        stopLocation: {
          id: "900100003",
          latitude: 52.521508,
          longitude: 13.411267,
        },
      },
    ]);
  });

  test("uses null for cancelled departures", () => {
    const [row] = toColumnData([[{ ...departure, cancelled: true }]], now);
    expect(row.when).toBeNull();
  });

  test("keeps rows of several stations apart", () => {
    const other = { ...departure, stop: { ...departure.stop, id: "900120003" } };
    const rows = toColumnData([[departure, departure], [other]], now);
    expect(rows.map((r) => r.key)).toEqual([
      "0_900100003_0",
      "0_900100003_1",
      "1_900120003_0",
    ]);
  });

  test("has no location without coordinates", () => {
    const [row] = toColumnData(
      [[{ ...departure, stop: { id: "1", name: "x" } }]],
      now,
    );
    expect(row.stopLocation).toBeNull();
  });
});
