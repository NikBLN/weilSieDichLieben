# Running your own copy with transport.rest

The API behind weilsiedichlieben.de (`api.weilsiedichlieben.de`) is private
and only answers requests from weilsiedichlieben.de. If you want to run this
project for yourself with real departures, you can connect it to the public
[transport.rest](https://transport.rest) API instead, which this project used
until 2026.

Please follow transport.rest's usage guidelines, it is a free service run by
volunteers. Thanks to [Jannis](https://github.com/derhuerst) for providing it.

## Where to change things

All data access lives in [`src/api/index.js`](../src/api/index.js). The
components only use four functions and expect the formats below. Rewrite
these functions to call transport.rest and convert its responses; nothing
else needs to change.

| Function | Returns |
|---|---|
| `searchStations(query, { language, signal })` | `[{ id, name, lat, lon }]` |
| `getDepartures(station, { language, standardRemarks, signal })` | `[{ tripId, line, product, direction, stop: { id, name, lat, lon }, plannedWhen, when, cancelled, platform, remarks: [{ type, summary?, text }] }]` |
| `getVehicles({ latitude, longitude, trips, signal })` | `[{ tripId, line, product, direction, lat, lon }]` |
| `isAlive({ signal })` | `true` or `false` |

Set `REACT_APP_API_BASE_URL` in `.env.development.local` and
`.env.production.local` to `https://v6.bvg.transport.rest` (or your own
transport.rest instance) so `apiGet` in [`src/api/client.js`](../src/api/client.js)
points there.

The last version that talked to transport.rest directly is still in the git
history, before the switch to the own API:

```bash
git show 32b7670:src/Components/StationFinder.js
git show 32b7670:src/Components/DepartureDisplay.js
git show 32b7670:src/Components/RadarMap.js
```

## Mapping

Station IDs are the same 9-digit IDs (e.g. `900100003`), so saved
configurations keep working.

**`searchStations`** → `GET /locations?query={query}&poi=false&addresses=false&results=8`

| This app | transport.rest |
|---|---|
| `id`, `name` | `id`, `name` |
| `lat`, `lon` | `location.latitude`, `location.longitude` |

**`getDepartures`** → `GET /stops/{station.id}/departures?when=…&results=…&language=…&remarks=true`
plus one boolean per product (`suburban=true&subway=false&…`, taken from the
station settings).

| This app | transport.rest |
|---|---|
| `tripId` | `tripId` |
| `line` | `line.name` |
| `product` | `line.product` |
| `direction` | `direction` |
| `stop` | `stop.id`, `stop.name`, `stop.location.latitude`, `stop.location.longitude` |
| `plannedWhen` | `plannedWhen` |
| `when` | `when`, or `plannedWhen` if `when` is `null` (cancelled) |
| `cancelled` | `cancelled === true` |
| `platform` | `platform` |
| `remarks` | `remarks`: type `warning` → `disruption`, `status` → `status`, `hint` → `hint` |

- `when` for the request: now plus `station.when` minutes.
- Remarks: with `standardRemarks` off, drop the remarks of type `hint`.
- Direction filter (`station.destination`): the old version used
  `GET /journeys?from={id}&to={destination.id}` and took the first leg of each
  journey, see `convertJourneyResultToDepartureData` in the old
  `DepartureDisplay.js`.

**`getVehicles`** → `GET /radar?north=…&south=…&west=…&east=…&results=100`
with a box of about 2 km around the station.

| This app | transport.rest |
|---|---|
| `tripId` | `tripId` |
| `line`, `product` | `line.name`, `line.product` |
| `direction` | `direction` |
| `lat`, `lon` | `location.latitude`, `location.longitude` |

Keep only the movements whose `tripId` is in `trips`.

**`isAlive`** → any request that returns 200, e.g.
`GET /stops/900100003/departures?results=1`.

## Just working on the design?

You don't need any of this. Run the mock API with sample data, see
[Running Locally](../README.md#running-locally).
