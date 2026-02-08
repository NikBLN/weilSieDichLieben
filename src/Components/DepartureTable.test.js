import { render, screen, fireEvent } from '@testing-library/react';
import DepartureTable from './DepartureTable';
jest.mock('react-leaflet', () => ({
  MapContainer: ({ children }) => <div>{children}</div>,
  TileLayer: () => <div></div>,
  Marker: ({ children }) => <div>{children}</div>,
  Tooltip: ({ children }) => <div>{children}</div>,
}));

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

beforeEach(() => {
  global.fetch = jest.fn(() =>
    Promise.resolve({ json: () => Promise.resolve({}) })
  );
});

afterEach(() => {
  jest.resetAllMocks();
});

describe('DepartureTable sorting', () => {
  const baseProps = {
    fontSize: 16,
    remarksVisibility: false,
    language: 'en',
  };

  const dataSource = [
    {
      key: '1',
      lineName: 'A',
      direction: 'Dir1',
      departureName: 'Station B',
      when: 3,
      tripId: 'trip1',
      stopId: 'stop1'
    },
    {
      key: '2',
      lineName: 'B',
      direction: 'Dir2',
      departureName: 'Station A',
      when: 5,
      tripId: 'trip2',
      stopId: 'stop2'
    },
  ];

  test('clicking departure name header toggles alphabetical sort', () => {
    render(<DepartureTable {...baseProps} dataSource={[...dataSource]} />);

    // initial order is sorted by time ascending -> Station B first
    const rowsBefore = screen.getAllByText(/Station/);
    expect(rowsBefore[0].textContent).toContain('Station B');

    // click to sort ascending by name -> Station A first
    fireEvent.click(screen.getByText(/Departure from/i));
    const rowsAsc = screen.getAllByText(/Station/);
    expect(rowsAsc[0].textContent).toContain('Station A');

    // click again to sort descending -> Station B first
    fireEvent.click(screen.getByText(/Departure from/i));
    const rowsDesc = screen.getAllByText(/Station/);
    expect(rowsDesc[0].textContent).toContain('Station B');
  });

  test('clicking destination header toggles alphabetical sort by direction', () => {
    render(<DepartureTable {...baseProps} dataSource={[...dataSource]} />);

    // initial order is sorted by time ascending -> Dir1 first (when: 3)
    const rowsBefore = screen.getAllByText(/Dir/);
    expect(rowsBefore[0].textContent).toContain('Dir1');

    // click destination header to sort ascending -> Dir1 first
    fireEvent.click(screen.getByText(/Destination/i));
    const rowsAsc = screen.getAllByText(/Dir\d/);
    expect(rowsAsc[0].textContent).toContain('Dir1');

    // click again to sort descending -> Dir2 first
    fireEvent.click(screen.getByText(/Destination/i));
    const rowsDesc = screen.getAllByText(/Dir\d/);
    expect(rowsDesc[0].textContent).toContain('Dir2');
  });

  test('station names become clickable when tripId provided', () => {
    render(<DepartureTable {...baseProps} dataSource={[...dataSource]} />);
    const clickable = screen.getByText('Station B');
    expect(clickable.style.cursor).toBe('pointer');
  });
});
