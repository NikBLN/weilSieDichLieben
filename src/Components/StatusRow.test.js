import { render } from '@testing-library/react';
import StatusRow from './StatusRow';

describe('StatusRow', () => {
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
    render(<StatusRow>The BVG API is not reachable.</StatusRow>);

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
