import { act, render, screen, waitFor } from "@testing-library/react";
import App from "./App";
import { isAlive } from "./api";

jest.mock("./Components/DepartureDisplay", () => () => (
  <div data-testid="mock-departure-display">Departure display</div>
));

jest.mock("./Components/Settings", () => () => (
  <div data-testid="mock-settings">Settings</div>
));

jest.mock("./Components/DonationDisplay", () => () => (
  <div>Donation display</div>
));

jest.mock("./Components/LegalModals", () => () => <div>Legal modals</div>);
jest.mock("./Components/CookieBanner", () => () => null);
jest.mock("./api", () => ({ isAlive: jest.fn() }));

// JSDOM does not compute layout, so the test provides fixed heights.
const createRect = (height) => ({
  width: 0,
  height,
  top: 0,
  left: 0,
  right: 0,
  bottom: height,
  x: 0,
  y: 0,
  toJSON: () => ({}),
});

describe("App auto-hide layout", () => {
  let getBoundingClientRectMock;

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

  beforeEach(() => {
    isAlive.mockResolvedValue(true);
    jest.useFakeTimers();

    getBoundingClientRectMock = jest
      .spyOn(HTMLElement.prototype, "getBoundingClientRect")
      .mockImplementation(function mockRect() {
        const testId = this.getAttribute?.("data-testid");

        // Stable shell heights for the layout assertions.
        if (testId === "app-header") {
          return createRect(64);
        }

        if (testId === "app-footer") {
          return createRect(72);
        }

        return createRect(0);
      });

    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 768,
    });

    Object.defineProperty(document, "cookie", {
      configurable: true,
      writable: true,
      value:
        // Start with one saved station and auto-hide enabled.
        'cookieConsent=true;autoHide=true;fontSize=16;remarksVisibility=true;standardRemarksVisibility=true;hideDepartureCol=false;language="en";bvgDepatureSelectedStations=[{"instanceId":1,"id":"900017101","value":"Test Station","when":0,"results":5,"suburban":true,"subway":true,"tram":true,"bus":true,"ferry":true,"express":true,"regional":true,"destination":null}]',
    });

    global.fetch = jest.fn((url) => {
      if (
        typeof url === "string" &&
        url.includes("notification-version.json")
      ) {
        return Promise.resolve({
          json: () => Promise.resolve({ version: 0 }),
        });
      }

      return Promise.resolve({
        status: 200,
        json: () => Promise.resolve({}),
      });
    });
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
    getBoundingClientRectMock.mockRestore();
    jest.resetAllMocks();
  });

  test("removes reserved header and footer space after auto-hide", async () => {
    render(<App />);

    const content = await screen.findByTestId("app-content");
    await screen.findByTestId("departure-scroll-container");

    // Space is reserved while the bars are visible.
    await waitFor(() => {
      expect(content.style.paddingTop).toBe("64px");
    });
    await waitFor(() => {
      expect(content.style.paddingBottom).toBe("72px");
    });

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    // Auto-hide should release that space again.
    await waitFor(() => {
      expect(content.style.paddingTop).toBe("0px");
    });
    await waitFor(() => {
      expect(content.style.paddingBottom).toBe("0px");
    });
  });
});
