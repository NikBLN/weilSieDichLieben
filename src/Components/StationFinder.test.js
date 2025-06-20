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
import { render, screen } from '@testing-library/react';
import StationFinder from './StationFinder';

test('renders translated placeholder', () => {
  render(
    <StationFinder selectedStations={[]} onSelect={() => {}} allowClear={false} language="en" />
  );
  expect(screen.getByText('Search station')).toBeTruthy();
});
