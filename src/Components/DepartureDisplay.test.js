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
import { render, screen, waitFor } from '@testing-library/react';
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
      ok: true,
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

const renderDisplay = (stations) =>
  render(
    <DepartureDisplay
      selectedStations={stations}
      fontSize={16}
      remarksVisibility={false}
      standardRemarksVisibility={false}
      language="en"
    />
  );

test('says when no stations are selected', () => {
  renderDisplay([]);
  expect(screen.getByRole('status').textContent).toContain('No stations selected.');
});

test('says when there are no departures', async () => {
  renderDisplay([baseStation]);
  expect(await screen.findByText('No departures for the selected stations and filters.')).toBeTruthy();
});

test('says when the API is unreachable', async () => {
  global.fetch = jest.fn(() => Promise.reject(new TypeError('Failed to fetch')));
  renderDisplay([baseStation]);
  expect(await screen.findByText('The BVG API is not reachable.')).toBeTruthy();
});

test('says when the API answers with an error', async () => {
  global.fetch = jest.fn(() => Promise.resolve({ ok: false, status: 503, statusText: 'Service Unavailable' }));
  renderDisplay([baseStation]);
  expect(await screen.findByText('The BVG API responded with an error.')).toBeTruthy();
});

test('shows the stations that loaded and reports the ones that failed', async () => {
  global.fetch = jest.fn((url) =>
    url.includes('/stops/2/')
      ? Promise.resolve({ ok: false, status: 429, statusText: 'Too Many Requests' })
      : Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            departures: [{
              stop: { id: '1', name: 'Alexanderplatz', location: {} },
              line: { name: 'U2' },
              direction: 'Pankow',
              when: new Date(Date.now() + 5 * 60000).toISOString(),
            }],
          }),
        })
  );
  renderDisplay([baseStation, { ...baseStation, instanceId: 2, id: '2' }]);
  expect(await screen.findByText('Pankow')).toBeTruthy();
  expect(screen.getByRole('status').textContent).toContain('1/2 stations could not be loaded: Too many requests');
});
