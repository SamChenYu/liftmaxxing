# Liftmaxxing

Lift congestion predictor for the Whitechapel station interchange. See PLAN.md for full project context.

## TFL Unified API

Base URL: `https://api.tfl.gov.uk`

Auth: `app_key` query parameter using `UNIFIED_PRIMARY_KEY` from `.env` (500 req/min tier). Works without a key at lower rate limits.

Requests require a `User-Agent` header (Cloudflare blocks empty/missing ones).

### Endpoints

**Arrivals** — `GET /StopPoint/{naptanId}/Arrivals`

Returns a JSON array of predicted arrivals sorted by `timeToStation` (seconds until arrival). Updates roughly every 30 seconds. Only shows upcoming trains — no data on trains that have already departed.

**Station search** — `GET /StopPoint/Search?query={name}&modes={modes}`

### Whitechapel NaPTAN IDs

| NaPTAN ID | Line | Notes |
|-----------|------|-------|
| `910GWCHAPXR` | Elizabeth line | In scope for MVP |
| `910GWCHAPEL` | Overground (Windrush) | In scope for MVP |
| `940GZZLUWPL` | District / H&C (tube) | Out of scope for MVP |
| `HUBZWL` | Hub (all modes) | Returns empty arrivals — use child stop IDs instead |

### Useful response fields

| Field | Type | Description |
|-------|------|-------------|
| `timeToStation` | int | Seconds until arrival. <30s means effectively at platform |
| `vehicleId` | string | Unique train ID — use to track departures (disappears from list when train leaves) |
| `destinationName` | string | Terminus station |
| `lineName` | string | Line name (e.g. "Elizabeth line", "Windrush") |
| `platformName` | string | Platform and direction |
| `currentLocation` | string | Free-text location description |
| `expectedArrival` | string | ISO 8601 UTC timestamp (UK is BST/UTC+1 in summer) |

### Departure detection (Phase 2)

The API has no "last departed" endpoint. To detect train departures (crowd burst events):

1. Poll both Elizabeth line and Overground arrivals every ~30s
2. Track `vehicleId`s seen across polls
3. When a `vehicleId` disappears from the response, that train has departed — timestamp it
4. A departure within the last ~90s indicates likely crowd pressure at the lift

In-memory tracking is sufficient for MVP — no persistent storage needed. History is captured in the manual Google Sheets log.

### Legacy TrackerNet API

`/trackernet/PredictionDetailed/{line}/{station}` — legacy XML feed requiring a separate `TRACKERNET_PRIMARY_KEY`. Unreliable (timeouts, flaky auth). Use the unified API instead.
