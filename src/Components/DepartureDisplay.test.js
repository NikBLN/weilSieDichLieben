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
import { render, waitFor } from '@testing-library/react';
import DepartureDisplay from './DepartureDisplay';
jest.mock('react-leaflet', () => ({
  MapContainer: ({ children }) => <div>{children}</div>,
  TileLayer: () => <div></div>,
  Marker: ({ children }) => <div>{children}</div>,
  Tooltip: ({ children }) => <div>{children}</div>,
}));

const baseStation = {
  instanceId: 1,
  id: '1',
  value: 'Station',
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

beforeEach(() => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      json: () => Promise.resolve({ departures: [] }),
    })
  );
});

afterEach(() => {
  jest.resetAllMocks();
});

test('does not fetch when no stations', async () => {
  render(
    <DepartureDisplay
      selectedStations={[]}
      fontSize={16}
      remarksVisibility={false}
      standardRemarksVisibility={false}
      language="en"
    />
  );
  await waitFor(() => expect(global.fetch).not.toHaveBeenCalled());
});

test('fetches departures when stations provided', async () => {
  render(
    <DepartureDisplay
      selectedStations={[baseStation]}
      fontSize={16}
      remarksVisibility={false}
      standardRemarksVisibility={false}
      language="en"
    />
  );
  await waitFor(() => expect(global.fetch).toHaveBeenCalled());
});
