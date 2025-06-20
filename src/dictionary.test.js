import { getTranslation } from './dictionary';

describe('getTranslation', () => {
  test('returns german translation when key exists', () => {
    expect(getTranslation('de', 'line')).toBe('Linie');
  });

  test('returns english translation when key exists', () => {
    expect(getTranslation('en', 'departureName')).toBe('Departure from');
  });

  test('falls back to key when translation missing', () => {
    expect(getTranslation('de', 'non-existent')).toBe('non-existent');
  });
});
