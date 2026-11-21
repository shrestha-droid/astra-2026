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
3. **Safety check (domain 06).** Every helper is screened against all tracked debris for 72 hours. Flagged satellites get a
   suggested swap, and a "what if we nudge it?" slider shows how a small along-track shift widens the miss distance.

Everything runs in the browser from a bundled orbit snapshot, so the demo works **offline**.

## Numbers (snapshot in `public/data`)

- 53 Indian satellites (NavIC, weather, communication, imaging, science) vs 4,171 tracked debris objects
- 221,063 satellite-debris pairs screened over 72 hours; 118 close approaches under 10 km found
- Close approaches refined to ~1 second around the time of closest approach

## Honest limits

Public two-line orbit data is accurate to roughly a kilometre, so this is an **early-warning screen**, not a final collision
call. The score is a transparent readiness index, not a probability. Operational status of each satellite is not verified
from public data.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000  (landing page)  and  /mission  (mission control)
npm run build && npm start
```

Refresh the orbit data and the close-call screening (needs internet):

```bash
npm run data:refresh      # = data:fetch (orbit elements) + data:screen (72 h conjunction screening)
```

## How it works

| Piece | Where |
|---|---|
| Orbit elements fetch (Indian fleet + all debris) | `scripts/fetch-orbit-data.mjs` |
| 72 h satellite-vs-debris screening, refined to ~1 s | `scripts/precompute-conjunctions.mjs` |
| Orbit maths, time and coordinate helpers | `src/lib/orbits.ts` |
| Readiness engine (passes, coverage, risk, score, brief, what-if) | `src/lib/readiness.ts` |
| Hazard scenarios | `src/lib/scenarios.ts` |
| 3D globe (Earth, satellites, debris, beams, orbit line) | `src/components/Globe.tsx` |
| Mission control UI | `src/components/MissionControl.tsx` |
| Landing page | `src/app/page.tsx` |

**Method.** SGP4 propagation (`satellite.js`) of every object every 30 s; local minima of each satellite-debris distance under
260 km are refined to 1 s; events within 10 km are kept. Readiness (0-100) = imaging 40 (time to first clear, suitable pass)
+ weather 20 + emergency comms 20 + NavIC 20, counting only satellites with no flagged close approach near their pass.

## Stack and design

Next.js (App Router) · TypeScript · Tailwind v4 · React Three Fiber / three.js · satellite.js.
UI components from [React Bits](https://reactbits.dev) and [GodUI](https://godui.design). Layout language follows an editorial
"field guide" style (light Lexend type, continuous vertical guides, frosted glass, atmospheric depth) with a deep-space palette
and an orange accent. Reference layout and shader notes are in `design-skills/`.

## Data sources

- Orbit elements: public NORAD two-line elements via https://tle.ivanstanojevic.me
- Earth textures: three.js example textures (NASA imagery)
- Next: ISRO portals (Bhuvan, MOSDAC, VEDAS, Bhoonidhi) for live imagery and cyclone layers

See `docs/PROJECT_BRIEF.md` for the event rules, judging rubric, options considered and the plan.
