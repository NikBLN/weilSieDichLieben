import { render, screen, fireEvent } from '@testing-library/react';
import SettingsModal from './SettingsModal';

test('calls setSettingsModalVisible on close', () => {
  const setVisible = jest.fn();
  render(
    <SettingsModal
      settingsModalVisible={true}
      setSettingsModalVisible={setVisible}
      selectedStations={[]}
      onStationSelect={() => {}}
      language="en"
    />
  );
  fireEvent.click(screen.getByText('Close'));
  expect(setVisible).toHaveBeenCalledWith(false);
});
