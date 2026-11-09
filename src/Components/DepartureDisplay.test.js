beforeAll(() => {
  if (!window.matchMedia) {
    window.matchMedia = () => ({
      matches: false,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    });
  }
  if (!global.ResizeObserver) {
    global.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }
});
import { act, render, screen, waitFor } from "@testing-library/react";
import DepartureDisplay from "./DepartureDisplay";
import { ApiError, getDepartures } from "../api";

jest.mock("../api", () => {
  const actual = jest.requireActual("../api");
  return { ...actual, getDepartures: jest.fn() };
});

const baseStation = {
  instanceId: 1,
  id: "900100003",
  value: "Station",
  when: 0,
  results: 1,
  suburban: true,
  subway: true,
  tram: true,
  bus: true,
  ferry: true,
  express: true,
  regional: true,
};

const departure = (overrides = {}) => ({
  tripId: "1|3030|0|86|27092026",
  line: "S7",
  product: "suburban",
  direction: "S Ahrensfelde Bhf (Berlin)",
  stop: { id: "900100003", name: "Alexanderplatz", lat: 52.52, lon: 13.41 },
  plannedWhen: new Date(Date.now() + 5 * 60000).toISOString(),
  when: new Date(Date.now() + 5 * 60000 + 30000).toISOString(),
  cancelled: false,
  platform: "3",
  remarks: [],
  ...overrides,
});

const renderDisplay = (props = {}) =>
  render(
    <DepartureDisplay
      selectedStations={[baseStation]}
      fontSize={16}
      remarksVisibility={false}
      standardRemarksVisibility={false}
      language="en"
      {...props}
    />,
  );

beforeEach(() => {
  getDepartures.mockResolvedValue([]);
});

afterEach(() => {
  jest.resetAllMocks();
});

test("does not fetch when no stations", async () => {
  renderDisplay({ selectedStations: [] });
  await waitFor(() => expect(getDepartures).not.toHaveBeenCalled());
});

test("fetches departures with language and remark setting", async () => {
  renderDisplay({ standardRemarksVisibility: true });
  await waitFor(() => expect(getDepartures).toHaveBeenCalled());
  expect(getDepartures).toHaveBeenCalledWith(
    baseStation,
    expect.objectContaining({ language: "en", standardRemarks: true }),
  );
});

test("shows departures and marks cancelled ones", async () => {
  getDepartures.mockResolvedValue([
    departure(),
    departure({ tripId: "2", direction: "Erkner", cancelled: true }),
  ]);
  renderDisplay();
  expect(await screen.findByText("S Ahrensfelde Bhf (Berlin)")).toBeTruthy();
  expect(screen.getByText("5 min")).toBeTruthy();
  expect(screen.getByText("Cancelled")).toBeTruthy();
});

test("reports an unavailable API on 503", async () => {
  const onApiAvailabilityChange = jest.fn();
  getDepartures.mockRejectedValue(new ApiError(503, "upstream_timeout", "x"));
  jest.spyOn(console, "error").mockImplementation(() => {});
  renderDisplay({ onApiAvailabilityChange });
  await waitFor(() => expect(onApiAvailabilityChange).toHaveBeenCalledWith(false));
});

test("reports an available API after a successful fetch", async () => {
  const onApiAvailabilityChange = jest.fn();
  renderDisplay({ onApiAvailabilityChange });
  await waitFor(() => expect(onApiAvailabilityChange).toHaveBeenCalledWith(true));
});

test("shows the other stations when one station fails", async () => {
  const otherStation = { ...baseStation, instanceId: 2, id: "900017101" };
  getDepartures.mockImplementation((station) =>
    station.id === otherStation.id
      ? Promise.reject(new ApiError(400, "invalid_parameter", "x"))
      : Promise.resolve([departure()]),
  );
  const onApiAvailabilityChange = jest.fn();
  jest.spyOn(console, "error").mockImplementation(() => {});
  renderDisplay({
    selectedStations: [baseStation, otherStation],
    onApiAvailabilityChange,
  });
  expect(await screen.findByText("S Ahrensfelde Bhf (Berlin)")).toBeTruthy();
  // An invalid parameter is not an outage of the API.
  expect(onApiAvailabilityChange).toHaveBeenCalledWith(true);
});

test("says when no stations are selected", () => {
  renderDisplay({ selectedStations: [] });
  expect(screen.getByRole("status").textContent).toContain(
    "No stations selected.",
  );
});

test("says when there are no departures", async () => {
  renderDisplay();
  expect(
    await screen.findByText(
      "No departures for the selected stations and filters.",
    ),
  ).toBeTruthy();
});

test("says when the API is unreachable", async () => {
  getDepartures.mockRejectedValue(
    new ApiError(0, "network_error", "Failed to fetch"),
  );
  jest.spyOn(console, "error").mockImplementation(() => {});
  renderDisplay();
  expect(await screen.findByText("The BVG API is not reachable.")).toBeTruthy();
});

test("says when the API answers with an error", async () => {
  getDepartures.mockRejectedValue(new ApiError(503, "upstream_timeout", "x"));
  jest.spyOn(console, "error").mockImplementation(() => {});
  renderDisplay();
  expect(
    await screen.findByText("The BVG API responded with an error."),
  ).toBeTruthy();
});

test("shows the stations that loaded and reports the ones that failed", async () => {
  const otherStation = { ...baseStation, instanceId: 2, id: "900017101" };
  getDepartures.mockImplementation((station) =>
    station.id === otherStation.id
      ? Promise.reject(new ApiError(429, "rate_limited", "x"))
      : Promise.resolve([departure()]),
  );
  jest.spyOn(console, "error").mockImplementation(() => {});
  renderDisplay({ selectedStations: [baseStation, otherStation] });
  expect(await screen.findByText("S Ahrensfelde Bhf (Berlin)")).toBeTruthy();
  expect(screen.getByRole("status").textContent).toContain(
    "1/2 stations could not be loaded: Too many requests",
  );
});

describe("refresh", () => {
  const START = new Date("2026-09-27T14:00:00+02:00").getTime();
  const at = (seconds) => new Date(START + seconds * 1000).toISOString();

  const setHidden = (hidden) => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      get: () => hidden,
    });
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
  };

  // Moves the clock forward and lets running fetches settle.
  const advance = async (seconds) => {
    await act(async () => {
      jest.advanceTimersByTime(seconds * 1000);
    });
  };

  const renderAndLoad = async (props) => {
    const view = renderDisplay(props);
    await advance(0);
    return view;
  };

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(START);
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    delete document.hidden;
  });

  test("fetches on load and then every 120 seconds", async () => {
    await renderAndLoad();
    expect(getDepartures).toHaveBeenCalledTimes(1);

    await advance(119);
    expect(getDepartures).toHaveBeenCalledTimes(1);
    await advance(1);
    expect(getDepartures).toHaveBeenCalledTimes(2);
    await advance(120);
    expect(getDepartures).toHaveBeenCalledTimes(3);
  });

  test("counts down between fetches without a request", async () => {
    getDepartures.mockResolvedValue([departure({ when: at(100) })]);
    await renderAndLoad();
    expect(screen.getByText("1 min")).toBeTruthy();

    // 50 s later less than a minute is left.
    await advance(50);
    expect(screen.queryByText("1 min")).toBeNull();
    expect(screen.getByText("Now")).toBeTruthy();
    expect(getDepartures).toHaveBeenCalledTimes(1);
  });

  test("removes a departure that has left before the next fetch", async () => {
    getDepartures.mockResolvedValue([
      departure({ when: at(45) }),
      departure({ tripId: "2", direction: "Erkner", when: at(600) }),
    ]);
    await renderAndLoad();
    expect(screen.getByText("Now")).toBeTruthy();

    await advance(50);
    expect(screen.queryByText("S Ahrensfelde Bhf (Berlin)")).toBeNull();
    expect(screen.queryByText("Now")).toBeNull();
    expect(screen.getByText("Erkner")).toBeTruthy();
    expect(screen.getByText("9 min")).toBeTruthy();
    expect(getDepartures).toHaveBeenCalledTimes(1);
  });

  test("does not fetch or count down while the tab is hidden", async () => {
    getDepartures.mockResolvedValue([departure({ when: at(100) })]);
    await renderAndLoad();
    setHidden(true);

    await advance(600);
    expect(getDepartures).toHaveBeenCalledTimes(1);
    expect(screen.getByText("1 min")).toBeTruthy();
  });

  test("does not fetch when loaded in a hidden tab, until it is shown", async () => {
    setHidden(true);
    await renderAndLoad();
    await advance(600);
    expect(getDepartures).not.toHaveBeenCalled();

    setHidden(false);
    await advance(0);
    expect(getDepartures).toHaveBeenCalledTimes(1);
  });

  test("fetches at once when the tab returns after more than 30 seconds", async () => {
    getDepartures.mockResolvedValue([departure({ when: at(300) })]);
    await renderAndLoad();
    setHidden(true);
    await advance(31);
    getDepartures.mockResolvedValue([departure({ when: at(631) })]);

    setHidden(false);
    await advance(0);
    expect(getDepartures).toHaveBeenCalledTimes(2);
    expect(screen.getByText("10 min")).toBeTruthy();

    // The 120 s rhythm starts again from this fetch.
    await advance(119);
    expect(getDepartures).toHaveBeenCalledTimes(2);
    await advance(1);
    expect(getDepartures).toHaveBeenCalledTimes(3);
  });

  test("only updates the countdown when the tab returns within 30 seconds", async () => {
    getDepartures.mockResolvedValue([departure({ when: at(80) })]);
    await renderAndLoad();
    expect(screen.getByText("1 min")).toBeTruthy();
    setHidden(true);
    await advance(25);

    setHidden(false);
    await advance(0);
    expect(getDepartures).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Now")).toBeTruthy();

    // The next fetch stays 120 s after the last one.
    await advance(94);
    expect(getDepartures).toHaveBeenCalledTimes(1);
    await advance(1);
    expect(getDepartures).toHaveBeenCalledTimes(2);
  });

  test("switching tabs back and forth does not cause extra requests", async () => {
    await renderAndLoad();
    await advance(40);
    // The first return is older than 30 s and fetches once ...
    setHidden(true);
    setHidden(false);
    await advance(0);
    expect(getDepartures).toHaveBeenCalledTimes(2);

    // ... the following ones do not.
    for (let i = 0; i < 10; i += 1) {
      setHidden(true);
      await advance(1);
      setHidden(false);
      await advance(1);
    }
    expect(getDepartures).toHaveBeenCalledTimes(2);
  });

  test("does not retry a failed fetch on every return", async () => {
    getDepartures.mockRejectedValue(new ApiError(503, "upstream_timeout", "x"));
    jest.spyOn(console, "error").mockImplementation(() => {});
    await renderAndLoad();

    for (let i = 0; i < 5; i += 1) {
      setHidden(true);
      await advance(2);
      setHidden(false);
      await advance(2);
    }
    expect(getDepartures).toHaveBeenCalledTimes(1);
  });

  test("fetches at once when a setting changes", async () => {
    const { rerender } = await renderAndLoad();
    await advance(10);
    rerender(
      <DepartureDisplay
        selectedStations={[baseStation]}
        fontSize={16}
        remarksVisibility={false}
        standardRemarksVisibility={false}
        language="de"
      />,
    );
    await advance(0);
    expect(getDepartures).toHaveBeenCalledTimes(2);
    expect(getDepartures).toHaveBeenLastCalledWith(
      baseStation,
      expect.objectContaining({ language: "de" }),
    );
  });
});
