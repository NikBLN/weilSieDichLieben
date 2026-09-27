![weilSieDichLieben Banner](./src/images/BVG.png)

# weilSieDichLieben

_Configure your own personal BVG Public Transport Anzeigetafel and enjoy public transport again!_

---

## Table of Contents
- [About](#about)
- [Demo](#demo)
- [Features](#features)
- [Getting Started](#getting-started)
- [Development](#development)
- [API](#api)
- [Cookie Usage](#cookie-usage)
- [Contributing](#contributing)
- [License](#license)

## About
weilSieDichLieben is a small React application that displays live departure information for Berlin and Brandenburg public transport. It was built so you can run your very own BVG style departure board on a spare tablet, monitor or phone. Configure the stops you care about and the page remembers your settings so the board is ready whenever you open it.

The application fetches its data from its own API at `api.weilsiedichlieben.de` (timetable data: [VBB Verkehrsverbund Berlin-Brandenburg](https://www.vbb.de)) and is optimized to run in a fullscreen web view. It works best on tablets but can be used on any device with a modern browser.

## Demo
Visit [www.weilSieDichLieben.de](https://www.weilSiedichLieben.de) to try the app without installing anything. On iOS/iPadOS you can add the page to your home screen via the "Share" button to run it in fullscreen mode.

## Features
- Configure multiple stations and transport types (bus, subway, tram, ferry, etc.)
- Choose the number of results and a minimum departure time
- Adjustable font size and optional scrolling remarks below departures
- Option to automatically hide the header/footer after a short period of inactivity
- Share your configuration via a generated URL
- Support for German and English

## Getting Started
You can either use the hosted version above or run the project locally.

### Prerequisites
- [Node.js](https://nodejs.org/) (tested with Node 20 and 24)
- npm comes bundled with Node.js

### Installation
```bash
# clone the repository
git clone https://github.com/NikBLN/weilSieDichLieben.git
cd weilSieDichLieben

# install dependencies
npm install
```

### Running Locally
```bash
npm start
```
This will start the development server at `http://localhost:3000` and open the app in your browser.

In development the app talks to the API at `http://localhost:8787/v1`
(see `.env.development`). The API lives in a separate repository; maintainers
start it there with `wrangler dev`. To use a different API address, create
`.env.development.local` with `REACT_APP_API_BASE_URL=...`.

### Building
For a production build run:
```bash
npm run build
```
The output will be placed in the `build/` directory. The repository contains a GitHub Actions workflow that deploys this folder via FTP whenever changes are pushed to the `main` branch.

### Testing
This project uses **Jest** together with **React Testing Library**. To run the
test suite execute:

```bash
npm test -- --watchAll=false
```

## Development
The React source code lives in the [`src`](./src) directory while static assets such as `index.html` reside in [`public`](./public). Feel free to open issues or pull requests if you want to contribute. Please read our [Code of Conduct](./CODE_OF_CONDUCT.md) before participating.

## API
The app only talks to `https://api.weilsiedichlieben.de/v1`. The base URL is
set via `REACT_APP_API_BASE_URL` (`.env.development`, `.env.production`) and
read in [`src/api/config.js`](./src/api/config.js). All requests go through
[`src/api/`](./src/api); components never call `fetch` for timetable data
directly.

| Endpoint | Parameters | Response |
|---|---|---|
| `GET /health` | – | `{ ok }` |
| `GET /stations` | `q`, `lang` | `{ stations: [{ id, name, lat, lon }] }` |
| `GET /departures` | `stop`, `products`, `offset`, `results`, `direction`, `remarks` (`all` or `disruptions`), `lang` | `{ departures: [{ tripId, line, product, direction, stop, plannedWhen, when, cancelled, platform, remarks }] }` |
| `GET /vehicles` | `lat`, `lon`, `radius`, `trips` | `{ vehicles: [{ tripId, line, product, direction, lat, lon }] }` |

Errors come as `{ error: { code, message } }`. Station IDs are 9 digits
(e.g. `900100003`); older 12-digit IDs are accepted as well.

## Cookie Usage
This project stores a few cookies in your browser to save your personal settings. They are only used to improve your experience and are never shared with third parties. The cookies currently in use are:

- `bvgDepatureSelectedStations` – list of configured stations
- `fontSize` – custom font size for the departure board
- `remarksVisibility` and `standardRemarksVisibility` – whether to display scrolling remarks
- `autoHide` – remember if header/footer should auto‑hide
- `language` – chosen interface language
- `notificationVersion` – prevents showing the same update notification twice
- `hideDepartureCol` - remember if the departure column should be hidden

All cookies expire after about one year and are not used for tracking or advertising purposes.

## Contributing
Contributions are welcome! Please open an issue to discuss your ideas or submit a pull request. By contributing you agree to abide by the [Code of Conduct](./CODE_OF_CONDUCT.md).

## License
This project is licensed under the [MIT License](./LICENSE). See the license file for details.

