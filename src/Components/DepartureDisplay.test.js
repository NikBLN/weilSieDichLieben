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
import { render, screen, waitFor } from "@testing-library/react";
import DepartureDisplay from "./DepartureDisplay";
import { ApiError, getDepartures } from "../api";

jest.mock("react-leaflet", () => ({
  MapContainer: ({ children }) => <div>{children}</div>,
  TileLayer: () => <div></div>,
  Marker: ({ children }) => <div>{children}</div>,
  Tooltip: ({ children }) => <div>{children}</div>,
}));

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
