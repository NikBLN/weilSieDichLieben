import { render, screen, waitFor } from '@testing-library/react';
import DonationDisplay from './DonationDisplay';

beforeAll(() => {
  if (!global.ResizeObserver) {
    global.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }
});

beforeEach(() => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      json: () => Promise.resolve({ donations: ['Alice', 'Bob'] }),
    })
  );
});

afterEach(() => {
  jest.resetAllMocks();
});

test('displays fetched donations in marquee', async () => {
  render(<DonationDisplay fontSize={16} language="en" />);
  await waitFor(() => expect(global.fetch).toHaveBeenCalled());
  await waitFor(() => expect(screen.getAllByText(/Alice/).length).toBeGreaterThan(0));
  expect(screen.getAllByText(/Alice/).length).toBeGreaterThan(0);
  expect(screen.getAllByText(/Bob/).length).toBeGreaterThan(0);
});
