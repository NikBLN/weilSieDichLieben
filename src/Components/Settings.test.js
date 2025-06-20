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
import { render, screen, fireEvent } from '@testing-library/react';
import Settings from './Settings';

test('shows modal when add station button clicked', () => {
  render(
    <Settings
      selectedStations={[]}
      removeStation={() => {}}
      onStationEdit={() => {}}
      onStationSelect={() => {}}
      onLanguageChange={() => {}}
      onRemarksVisibilityChange={() => {}}
      onStandardRemarksVisibilityChange={() => {}}
      onAutoHideChange={() => {}}
      settingsClass=""
      remarksVisibility={false}
      standardRemarksVisibility={false}
      language="en"
      autoHideEnabled={false}
    />
  );

  fireEvent.click(screen.getByText('Add station'));
  expect(screen.getByText('Please provide the name of a station:')).toBeTruthy();
});
