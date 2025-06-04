import { render, screen, fireEvent } from '@testing-library/react';
import DepartureTable from './DepartureTable';

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
    },
    {
      key: '2',
      lineName: 'B',
      direction: 'Dir2',
      departureName: 'Station A',
      when: 5,
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
});
