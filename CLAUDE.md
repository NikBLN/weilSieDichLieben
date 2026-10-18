# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Start development server:**
```bash
npm run mock-api   # sample data on http://localhost:8787/v1 (or the real API locally)
npm start
```
Opens at http://localhost:3000 with hot reload. The mock API in `scripts/mock-api.js` must keep returning the same format as the real API (see README "API"). `docs/transport-rest.md` explains how to run a private copy with transport.rest.

**Run tests:**
```bash
npm test -- --watchAll=false
```
Uses Jest with React Testing Library. For single test file:
```bash
npm test ComponentName.test.js
```

**Build for production:**
```bash
npm run build
```
Creates optimized production build in `build/` directory.

## Application Architecture

This is a React 18 application that creates a customizable BVG (Berlin public transport) departure board. The app fetches live departure data from its own API at `api.weilsiedichlieben.de/v1` and displays it in a format suitable for tablets/monitors.

### Core Architecture Patterns

**State Management:**
- All critical state lives in `App.js` (stations, settings, UI visibility)
- Cookie-based persistence for user preferences (with GDPR consent)
- URL parameters for shareable configurations
- Real-time updates via 60-second intervals

**Component Hierarchy:**
```
App (main state manager)
├── Settings (configuration panel)
│   ├── SettingsModal (station editing)
│   └── StationFinder (station search/add)
├── DepartureDisplay (main view)
│   └── DepartureTable (departure list with RadarMap popover)
├── DonationDisplay, CookieBanner, LegalModals
```

**Data Flow:**
- Unidirectional: props down, callbacks up
- Station configurations flow from App → Settings → StationFinder
- Real-time departure data flows from API → DepartureDisplay → DepartureTable
- `src/api/toColumnData` converts API departures into the row format of `DepartureTable`

### Key APIs and Endpoints

**weilsiedichlieben API** (`https://api.weilsiedichlieben.de/v1`):
- All calls go through `src/api/` (`searchStations`, `getDepartures`, `getVehicles`, `isAlive`). Components never call `fetch` for timetable data.
- Base URL from `REACT_APP_API_BASE_URL`: `.env.development` points to a local API on `http://localhost:8787/v1`, `.env.production` to the deployed one.
- Endpoints: `/health`, `/stations?q&lang`, `/departures?stop&products&offset&results&direction&remarks&lang`, `/vehicles?lat&lon&radius&trips`.
- Always build query parameters in the fixed order used in `src/api/index.js`; the API caches by full URL.
- Errors are `{ error: { code, message } }`. `isUnavailableError` (network, 429, 503) drives the "API not available" hint in `App`.
- Station IDs are 9 digits (`900100003`). A cancelled departure becomes `when: null` in the table rows.
- The API itself lives in a separate repository. Only document what a browser can see here: address, endpoints, fields. No details about how the API works internally.

### Station Configuration Schema

Each station object contains:
```javascript
{
  id: "stationId",
  value: "Station Name",
  suburban: true,    // S-Bahn
  subway: true,      // U-Bahn
  tram: true,        // Tram
  bus: true,         // Bus
  ferry: true,       // Ferry
  express: true,     // Express
  regional: true,    // Regional
  when: 0,           // minutes delay filter
  results: 4,        // number of departures
  destination: { id, name } // optional direction filter
}
```

### Internationalization

Uses `dictionary.js` with `getTranslation(language, "key")` function. Supports German (de) and English (en).

### Testing Approach

- Component tests using React Testing Library
- Mocks for external dependencies (react-leaflet, matchMedia)
- Components mock `../api` instead of `fetch`; `src/api/index.test.js` covers URLs and the row conversion
- CRA resets mocks before each test, so set mock implementations in `beforeEach`
- Test files follow `ComponentName.test.js` naming
- Focus on user interactions and rendering behavior

### Cookie and Privacy Handling

The app implements GDPR-compliant cookie consent:
- Cookie banner appears on first visit
- Settings persistence only with user consent
- Manual cookie reset option in settings
- All cookies expire after one year

### Real-time Features

- Departure countdowns update every minute
- Vehicle radar shows live positions within 2km radius
- Auto-hide UI for kiosk mode (mouse movement detection)
- Pulse animation on header logo every 5 seconds