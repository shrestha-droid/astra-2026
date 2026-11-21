# SatGuard India

**Satellites protect India in a disaster. We protect the satellites.**

Built for **ASTRA 2026** (Advanced Space Technology & Research Arena, VIT Bhopal × Club ANTERiX).

SatGuard India is a disaster-readiness check for India's satellites. Pick a hazard (cyclone, flood, landslide, earthquake) and
it answers one question: *if this happened in the next 24 hours, which Indian satellites can help, and are they safe from
space debris when we need them?*

## What it does

1. **Disaster (domain 03).** Choose a hazard zone. The report is anchored to a start time you control.
2. **Helpers (domains 02, 04).** Finds imaging passes (radar for cloudy storms, optical for clear skies), weather satellites
   (INSAT-3D family), NavIC positioning and relay satellites for areas without mobile networks.
3. **Safety check (domain 06).** Every helper is screened against fresh debris data for 72 hours. Close approaches get a tier
   (High under 1 km, Elevated 1-5 km, Watch 5-10 km) and an illustrative collision chance. A satellite is dropped only if a pass
   under 1 km is predicted near its window. A "what if we nudge it?" slider shows how a small along-track shift widens the gap.
4. **Rescue link (domain 04).** At the disaster site: NavIC position-fix quality (PDOP from the satellites' geometry) and the
   azimuth/elevation to point a dish at the best relay satellite.
5. **Indian satellite data.** The latest INSAT-3DS thermal image, pulled live from ISRO's MOSDAC portal (`/api/insat`), with a
   saved snapshot as an offline fallback.

Orbit data is bundled, so the demo works **offline**; the INSAT image and `npm run data:refresh` need internet.

## Numbers (snapshot in `public/data`)

- 49 Indian satellites (17 imaging, 19 comms, 3 weather, 7 NavIC, 3 science) vs 2,654 debris objects with fresh orbit elements
- 130,046 satellite-debris pairs screened over 72 hours; 102 close approaches under 10 km (1 High, 20 Elevated, 81 Watch)
- Closest approach is found by continuous search (not coarse time sampling); the closest right now is 0.48 km

## Data quality rules

- Orbit elements come from CelesTrak and must be **no more than 14 days old**; older records are rejected (a stale orbit
  propagated forward gives errors of hundreds of km). If CelesTrak is unreachable the script falls back to a third-party mirror,
  but that mirror's debris records are mostly months or years old, so almost all of them are rejected and the app warns loudly.
- Failed or retired satellites are excluded (list with reasons in `scripts/fetch-orbit-data.mjs`); NavIC satellites must be in a
  geosynchronous-type orbit.

## Honest limits

Public two-line orbit data is accurate to roughly a kilometre, so this is an **early-warning screen**, not a final collision
call. The collision chance shown is illustrative (it assumes a 1.5 km position error and a 15 m combined object size).
The readiness score is a transparent index, not a probability. Which satellites are working comes from public catalogues plus a
short list of known failures; it is not an official status. The rescue-link tool is a planning aid and does not send messages.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000  (landing page)  and  /mission  (mission control)
npm run build && npm start
```

Refresh the orbit data and the close-call screening (needs internet):

```bash
npm run data:refresh      # = data:fetch (orbit elements) + data:screen (72 h screening) + data:insat (latest INSAT-3DS image)
```

## How it works

| Piece | Where |
|---|---|
| Orbit elements fetch (Indian fleet + debris), freshness filter | `scripts/fetch-orbit-data.mjs` |
| 72 h satellite-vs-debris screening, continuous closest-approach search | `scripts/precompute-conjunctions.mjs` |
| Latest INSAT-3DS image from MOSDAC (offline snapshot) | `scripts/fetch-insat.mjs`, `src/app/api/insat` |
| NavIC fix quality (PDOP) and dish pointing | `src/lib/link.ts` |
| Orbit maths, time and coordinate helpers | `src/lib/orbits.ts` |
| Readiness engine (passes, coverage, risk, score, brief, what-if) | `src/lib/readiness.ts` |
| Hazard scenarios | `src/lib/scenarios.ts` |
| 3D globe (Earth, satellites, debris, beams, orbit line) | `src/components/Globe.tsx` |
| Mission control UI | `src/components/MissionControl.tsx` |
| Landing page | `src/app/page.tsx` |

**Method.** SGP4 propagation (`satellite.js`) of every object every 30 s; local minima of each satellite-debris distance under
260 km are refined by a continuous (ternary) search for the true closest approach; events within 10 km are kept. Readiness
(0-100) = imaging 40 (time to first suitable pass) + weather 20 + emergency comms 20 + NavIC 20, excluding only satellites with a
pass under 1 km predicted near their window (1-5 km is a caution: still usable, ranked lower).

## Stack and design

Next.js (App Router) · TypeScript · Tailwind v4 · React Three Fiber / three.js · satellite.js.
UI components from [React Bits](https://reactbits.dev) and [GodUI](https://godui.design). Layout language follows an editorial
"field guide" style (light Lexend type, continuous vertical guides, frosted glass, atmospheric depth) with a deep-space palette
and an orange accent. Reference layout and shader notes are in `design-skills/`.

## Data sources

- Orbit elements: NORAD data via CelesTrak (https://celestrak.org), freshness-filtered
- Weather imagery: ISRO MOSDAC (https://mosdac.gov.in), INSAT-3DS imager
- Earth textures: three.js example textures (NASA imagery)
- Next: more MOSDAC and Bhuvan layers (rainfall, cyclone tracks, flood maps) and Bhoonidhi radar imagery

See `docs/PROJECT_BRIEF.md` for the event rules, judging rubric, options considered and the plan.
