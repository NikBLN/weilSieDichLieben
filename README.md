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
- [Header notice](#header-notice)
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
The API behind weilsiedichlieben.de is private and only answers requests from
weilsiedichlieben.de, so a local copy gets no data from it. For working on the
app, start the mock API with sample data in one terminal and the app in a
second one:

```bash
npm run mock-api   # sample data on http://localhost:8787/v1
npm start          # app on http://localhost:3000
```

The mock API ([`scripts/mock-api.js`](./scripts/mock-api.js)) returns made-up
departures, including a disruption, a cancelled trip and hints, so every part
of the board can be designed and tested. It is not real timetable data.
On start it prints a link that opens the board with two sample stations
already set up. The station search only knows the six sample stations
(e.g. Alexanderplatz, Hauptbahnhof, Mehringdamm); for any other text it
suggests all of them.

To run your own copy with real departures, connect it to the public
[transport.rest](https://transport.rest) API. What to change is described in
[`docs/transport-rest.md`](./docs/transport-rest.md).

In development the app talks to `http://localhost:8787/v1` (see
`.env.development`). To use a different address, create
`.env.development.local` with `REACT_APP_API_BASE_URL=...`.

### Building
For a production build run:
```bash
npm run build
```
The output will be placed in the `build/` directory. The repository contains a GitHub Actions workflow that deploys this folder via FTP whenever changes are pushed to the `main` branch.

To try changes first, push them to the `testing` branch (`git push origin HEAD:testing`); they are deployed to `testing.weilsiedichlieben.de`. Once the workflow is on `main`, any branch can also be deployed there via "Run workflow" in the Actions tab.

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
| `GET /stations` | `q`, `lang` | `{ stations: [{ id, name, lat, lon, products }] }`, `products` lists the means of transport that stop there (e.g. `["subway", "bus"]`) |
| `GET /departures` | `stop`, `products`, `offset`, `results`, `direction`, `remarks` (`all` or `disruptions`), `lang` | `{ departures: [{ tripId, line, product, direction, stop, plannedWhen, when, cancelled, platform, remarks }] }` |

Errors come as `{ error: { code, message } }`. Station IDs are 9 digits
(e.g. `900100003`); older 12-digit IDs are accepted as well.

## Header notice
A short notice can be shown in the header, e.g. to announce changes. The app
reads it from `/notice.json` on the web server on every page load and again
every 30 minutes (for screens that are never reloaded). Missing, inactive or
broken files simply show no notice.

The file is maintained by hand via FTP and is **not** part of the repository
(`public/notice.json` is in `.gitignore`). The FTP
deploy only deletes or overwrites files it uploaded itself, so a deploy leaves
the notice alone. `testing.weilsiedichlieben.de` reads its own file from the
`testing/` folder.

```json
{
  "version": 1,
  "active": true,
  "from": "2026-10-18",
  "until": "2026-11-30",
  "hideAfter": 60,
  "badge": { "de": "NEU", "en": "NEW" },
  "title": { "de": "Abfahrtsdaten jetzt direkt vom {image}", "en": "Departure data now directly from {image}" },
  "text": { "de": "Danke an den VBB!", "en": "Thanks to VBB!" },
  "image": "/VBB.png",
  "imageAlt": "VBB"
}
```

| Field | Required | Meaning |
|---|---|---|
| `version` | yes | Number. Raise it to show the notice again to everyone who closed it |
| `title` | yes | Main line |
| `active` | no | `false` hides the notice, default `true` |
| `from`, `until` | no | Time window. A date (`2026-10-18`) means the whole day, a date with time (`2026-10-18T08:00:00+02:00`) the exact moment |
| `hideAfter` | no | Seconds after which the notice disappears for this visit; a shrinking bar at the bottom shows the time left |
| `badge` | no | Small highlighted label in front of the title |
| `text` | no | Smaller second line |
| `image` | no | Image path on the web server, e.g. `/VBB.png`. Upload the image via FTP or add it to [`public/`](./public) to deploy it with the app. `{image}` in the title places it, otherwise it follows the title |
| `imageAlt` | no | Image description for screen readers |

Texts are either one string for all languages or `{ "de": ..., "en": ... }`;
a missing translation falls back to German. The file may contain `//` and
`/* */` comments; the example in `docs/notice/` documents every field that way.

Closing the notice with ✕ stores its `version` in the `noticeVersion` cookie
(only with cookie consent; without it the notice comes back on the next
visit). It stays closed until `notice.json` has a different `version`, so
change the version whenever everyone should see the notice again. A notice
hidden by `hideAfter` is not stored and shows again on the next visit.

[`docs/notice/notice.json`](./docs/notice/notice.json) contains an example.
`npm start` serves it as `/notice.json` (see
[`src/setupProxy.js`](./src/setupProxy.js)), so edit it there and reload the
page to try a notice locally.

## Cookie Usage
This project stores a few cookies in your browser to save your personal settings. They are only used to improve your experience and are never shared with third parties. The cookies currently in use are:

- `bvgDepatureSelectedStations` – list of configured stations
- `fontSize` – custom font size for the departure board
- `remarksVisibility` and `standardRemarksVisibility` – whether to display scrolling remarks
- `autoHide` – remember if header/footer should auto‑hide
- `language` – chosen interface language
- `noticeVersion` – version of the last closed header notice
- `hideDepartureCol` - remember if the departure column should be hidden

All cookies expire after about one year and are not used for tracking or advertising purposes.

## Contributing
Contributions are welcome! Please open an issue to discuss your ideas or submit a pull request. By contributing you agree to abide by the [Code of Conduct](./CODE_OF_CONDUCT.md).

## License
This project is licensed under the [MIT License](./LICENSE). See the license file for details.

