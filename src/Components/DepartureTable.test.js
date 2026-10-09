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

const originalInnerWidth = window.innerWidth;

beforeEach(() => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: 768,
  });
  global.fetch = jest.fn(() =>
    Promise.resolve({ json: () => Promise.resolve({}) })
  );
});

afterEach(() => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: originalInnerWidth,
  });
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

  test('clicking direction header toggles alphabetical sort by direction', () => {
    render(<DepartureTable {...baseProps} dataSource={[...dataSource]} />);

    // initial order is sorted by time ascending -> Dir1 first (when: 3)
    const rowsBefore = screen.getAllByText(/Dir\d/);
    expect(rowsBefore[0].textContent).toContain('Dir1');

    // click direction header to sort ascending -> Dir1 first
    fireEvent.click(screen.getByText(/Direction/i));
    const rowsAsc = screen.getAllByText(/Dir\d/);
    expect(rowsAsc[0].textContent).toContain('Dir1');

    // click again to sort descending -> Dir2 first
    fireEvent.click(screen.getByText(/Direction/i));
    const rowsDesc = screen.getAllByText(/Dir\d/);
    expect(rowsDesc[0].textContent).toContain('Dir2');
  });

  test('shortens the when header when hideDepartureCol is enabled', () => {
    render(
      <DepartureTable
        {...baseProps}
        hideDepartureCol={true}
        dataSource={[...dataSource]}
      />
    );

    expect(screen.getByText('Departure')).toBeTruthy();
    expect(screen.queryByText('Departure in')).toBeNull();
  });

  test('station names become clickable when tripId provided', () => {
    render(<DepartureTable {...baseProps} dataSource={[...dataSource]} />);
    const clickable = screen.getByText('Station B');
    expect(clickable.style.cursor).toBe('pointer');
  });

  test('hideDepartureCol uses the wider destination and when columns on desktop', () => {
    render(
      <DepartureTable
        {...baseProps}
        hideDepartureCol
        dataSource={[...dataSource]}
      />
    );

    expect(screen.queryByText(/Departure from/i)).toBeNull();

    const destinationHeaderColumn = screen.getByText(/Direction/i, { selector: '.ant-col' });
    const whenHeaderText = screen.getByText(/^Departure$/i);
    const whenHeaderColumn = whenHeaderText.closest('.ant-col');
    const whenDataColumn = screen.getByText('3 min', { selector: '.ant-col' });

    expect(destinationHeaderColumn.className).toContain('ant-col-16');
    expect(whenHeaderColumn.className).toContain('ant-col-4');
    expect(whenHeaderColumn.style.position).toBe('relative');
    expect(whenHeaderText.style.position).toBe('absolute');
    expect(whenHeaderText.style.right).toBe('0px');
    expect(whenDataColumn.className).toContain('ant-col-4');
    expect(whenDataColumn.style.textAlign).toBe('right');
  });

  test('default sorting does not mutate the provided dataSource array', () => {
    const unsortedDataSource = [
      {
        key: '2',
        lineName: 'B',
        direction: 'Dir2',
        departureName: 'Station A',
        when: 5,
        tripId: 'trip2',
        stopId: 'stop2'
      },
      {
        key: '1',
        lineName: 'A',
        direction: 'Dir1',
        departureName: 'Station B',
        when: 3,
        tripId: 'trip1',
        stopId: 'stop1'
      },
    ];

    render(<DepartureTable {...baseProps} dataSource={unsortedDataSource} />);

    const renderedRows = screen.getAllByText(/Station/);
    expect(renderedRows[0].textContent).toContain('Station B');
    expect(unsortedDataSource.map((item) => item.departureName)).toEqual([
      'Station A',
      'Station B',
    ]);
  });

  describe('mobile rendering', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
    });

    test('renders a per departure group header by default', () => {
      render(<DepartureTable {...baseProps} dataSource={[...dataSource]} />);

      expect(screen.getByText(/Departure:\s*Station A/i)).toBeTruthy();
      expect(screen.getByText(/Departure:\s*Station B/i)).toBeTruthy();
    });

    test('hideDepartureCol removes the departure group headers on mobile', () => {
      render(
        <DepartureTable
          {...baseProps}
          hideDepartureCol
          dataSource={[...dataSource]}
        />
      );

      expect(screen.queryByText(/Departure:\s*Station/i)).toBeNull();
      expect(screen.getByText('3 min')).toBeTruthy();
      expect(screen.getByText('5 min')).toBeTruthy();
    });
  });
});

describe('status row', () => {
  const sizes = {};
  beforeAll(() => {
    global.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
    // jsdom has no layout; stand in for the widths the row compares.
    Object.defineProperty(HTMLElement.prototype, 'scrollWidth', {
      configurable: true,
      get() { return this.dataset.statusText !== undefined ? sizes.text : 0; },
    });
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
      configurable: true,
      get() { return this.getAttribute('role') === 'status' ? sizes.row : 0; },
    });
  });
  afterAll(() => {
    delete global.ResizeObserver;
    delete HTMLElement.prototype.scrollWidth;
    delete HTMLElement.prototype.clientWidth;
  });

  const renderStatus = () =>
    render(
      <DepartureTable
        fontSize={16}
        dataSource={[]}
        remarksVisibility={false}
        language="en"
        statusMessage="The BVG API is not reachable."
      />
    );

  test('is centered when the message fits', () => {
    sizes.text = 200;
    sizes.row = 400;
    const { container } = renderStatus();
    const row = container.querySelector('[role="status"]');
    expect(row.style.textAlign).toBe('center');
    expect(row.querySelector('.rfm-marquee')).toBeNull();
  });

  test('scrolls when the message is wider than the row', () => {
    sizes.text = 600;
    sizes.row = 400;
    const { container } = renderStatus();
    expect(container.querySelector('[role="status"] .rfm-marquee')).not.toBeNull();
  });
});
