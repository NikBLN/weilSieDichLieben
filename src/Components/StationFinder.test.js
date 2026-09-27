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
});
import { act, fireEvent, render, screen } from "@testing-library/react";
import StationFinder from "./StationFinder";
import { searchStations } from "../api";

jest.mock("../api", () => {
  const actual = jest.requireActual("../api");
  return { ...actual, searchStations: jest.fn() };
});

const renderFinder = () =>
  render(
    <StationFinder
      selectedStations={[]}
      onSelect={() => {}}
      allowClear={false}
      language="en"
    />,
  );

const type = (text) =>
  fireEvent.change(screen.getByRole("combobox"), { target: { value: text } });

beforeEach(() => {
  jest.useFakeTimers();
  searchStations.mockResolvedValue([
    { id: "900100003", name: "S+U Alexanderplatz Bhf (Berlin)", lat: 52.5, lon: 13.4 },
  ]);
});

afterEach(() => {
  jest.useRealTimers();
  jest.resetAllMocks();
});

test("renders translated placeholder", () => {
  renderFinder();
  expect(screen.getByText("Search station")).toBeTruthy();
});

test("searches only from 2 characters and after the debounce", async () => {
  renderFinder();
  type("A");
  act(() => jest.advanceTimersByTime(500));
  expect(searchStations).not.toHaveBeenCalled();

  type("Al");
  type("Ale");
  act(() => jest.advanceTimersByTime(299));
  expect(searchStations).not.toHaveBeenCalled();

  await act(async () => {
    jest.advanceTimersByTime(1);
  });
  expect(searchStations).toHaveBeenCalledTimes(1);
  expect(searchStations).toHaveBeenCalledWith(
    "Ale",
    expect.objectContaining({ language: "en" }),
  );
});

test("aborts the previous search when typing on", async () => {
  renderFinder();
  type("Alex");
  await act(async () => {
    jest.advanceTimersByTime(300);
  });
  const { signal } = searchStations.mock.calls[0][1];
  type("Alexa");
  expect(signal.aborted).toBe(true);
});
