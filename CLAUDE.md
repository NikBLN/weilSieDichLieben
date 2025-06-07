# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Start development server:**
```bash
npm start
```
Opens at http://localhost:3000 with hot reload.

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

This is a React 18 application that creates a customizable BVG (Berlin public transport) departure board. The app fetches live departure data from the BVG transport.rest API and displays it in a format suitable for tablets/monitors.

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

### Key APIs and Endpoints

**BVG Transport REST API:**
- Station search: `v6.bvg.transport.rest/locations`
- Departures: `v6.bvg.transport.rest/stops/{id}/departures`
- Journeys: `v6.bvg.transport.rest/journeys` (for direction filtering)
- Vehicle radar: `v6.bvg.transport.rest/radar` (live vehicle positions)

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