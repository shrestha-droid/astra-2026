# ASTRA 2026 - Project Brief (for the team and for any reviewer)

> One self-contained file with everything decided and everything considered, so anyone can review the project cold.
> Last updated: 21 Nov 2026 (evening, before the Ideation round; after an external review of the live site).
> **Status: v1 built. Direction = a blend of domains 06 + 03 + 04 (+ 02 as sensor matching). Working name: SatGuard India.**

---

## 1. The event

- **Name:** ASTRA - Advanced Space Technology & Research Arena
- **Organiser:** Club ANTERiX, VIT Bhopal University
- **When / where:** 21-22 Nov 2026, Academic Block-2 (AB2), Auditorium 1 & 2. Overnight hackathon, space theme.
- **Theme:** use space science, Indian space missions and satellite technology to solve meaningful problems on Earth and beyond.
- Teams **define their own problem** (no fixed statements): choose one domain or combine several, identify a real problem
  connected to space, write a statement (problem, context, users affected), build a working solution.
- **External APIs and datasets are permitted.** Indian data portals listed by the organisers: Bhoonidhi (bhoonidhi.nrsc.gov.in),
  Bhuvan (bhuvan.nrsc.gov.in), MOSDAC (mosdac.gov.in), VEDAS (vedas.sac.gov.in).
- **Evaluation priority (slide partly cut off in our photo):** "Projects meaningfully using Indian satellite missions and th..."
  (presumably "...and their data"). Our fleet-centred design targets this directly.

### Timeline
| Time | Event |
|---|---|
| 21 Nov 2:00-3:00 PM | Entry and check-in (closes strictly at 3:00 PM) |
| 3:15 PM | Event starts; lamp lighting 3:30; lectures; domains released (~4:30-5:00 PM) |
| 7:30 PM | Dinner break |
| **8:30 PM** | **Gate closes. Nobody leaves until morning. Bring chargers, extension board, meds, snacks.** |
| 9:30-11:30 PM | **Ideation round** (desk-to-desk) - needs the Initial Ideation PPT (6-8 slides) |
| 22 Nov **6:00 AM** | Submission form opens |
| **7:30 AM** | **Form closes. Venue cleared. No late submissions.** |
| 9:00 AM | Top 20 announced; evaluation of submitted projects starts |
| 9:30 AM | Top 20 must be back at the venue |
| 10:00 AM | Final pitches (Final PPT + working demo) |

### Mandatory deliverables (all four, by 7:30 AM)
1. Initial Ideation PPT - 6-8 slides (first concept)
2. Final PPT - 6-8 slides (same deck is used for the live pitch)
3. **Public** GitHub repository link
4. 3-minute demo video of the working project

### Rules that matter
- Original work built during the hackathon. Copying another team = disqualification.
- AI tools, libraries and online docs are allowed, but every member must understand the work and explain every part to judges.
- Only registered members compete; phones on silent; stay in your workspace; Wi-Fi for genuine development only.
- Bring your own extension board. Warm clothes recommended.

---

## 2. How we are judged (100 points)

| Marks | Criterion | What judges look at |
|---|---|---|
| 25 | Technical Implementation | Architecture, code quality, integrations, technical execution |
| 20 | Working Prototype & Demonstration | Functionality, completeness, stability, live demo |
| 15 | Presentation & Demo | Communication, technical understanding, defence of the project |
| 10 | Innovation & Creativity | Originality, creative problem-solving |
| 10 | Problem Relevance & Solution Effectiveness | Understanding of the problem; effectiveness of the solution |
| 10 | UI/UX & User Experience | Usability, accessibility, interface quality |
| 10 | Scalability & Feasibility | Practicality, deployment feasibility, growth potential |

- "Idea Pitching" is included inside two of the 10-mark criteria (not added on top of 100; which two is not stated).
- **Round 1 - Idea Pitching:** every team, desk-to-desk, **20 marks** of the final score.
- **Round 2 - Evaluation & Shortlisting:** submitted projects judged from **22 Nov 9:00 AM**. This decides the Top 20.
- **Round 3 - Final Presentations:** shortlisted teams only. Presentation + working demonstration.

### Strategy from the rubric
- 45/100 is "does it work and is it well built" -> **stability beats flash**; the demo must not depend on venue internet.
- 25/100 is look + pitch (UI/UX + Presentation) -> design polish and storytelling are cheap points.
- The Top 20 is chosen from **submitted deliverables** -> repo quality, README and the 3-minute video are the gate.
- Weak spots to pre-empt: *Problem Relevance* (why this matters) and *Scalability* (could it really be used).

---

## 3. The six core domains

| # | Domain | Scope |
|---|---|---|
| 01 | Indian Space Missions & Space Data | Chandrayaan, Mangalyaan, Aditya-L1, AstroSat, XPoSat, ISRO, ISSDC datasets |
| 02 | Earth Observation & Satellite Applications | Remote sensing for agriculture, environment, water, urban planning, climate |
| 03 | Space-Based Disaster Management | Floods, cyclones, forest fires, landslides, droughts |
| 04 | Satellite Communication, Navigation & Connectivity | NavIC, rural connectivity, emergency comms with no network |
| 05 | Moon, Mars & Deep-Space Exploration | Planetary science, terrain analysis, navigation, mission planning |
| 06 | Sustainable Space & Space Environment | Debris monitoring, satellite safety, orbital sustainability |

Difficulty to build overnight (hardest -> easiest): 02, 03, 01, 05, 04, 06. Heavy image-based directions (02, 03) are risky
because of data downloads, accounts and venue network; 06 runs on small public orbit data and works offline.

---

## 4. Options considered

| Option | Idea | Pros | Cons |
|---|---|---|---|
| **A (chosen)** 06+03+04 (+02 light) | "Protect the protectors": which satellites can help in a disaster, and are they safe from debris? | Original; offline-safe; strong story; covers 3-4 domains in one chain | Integration must be real; 04 is the thinnest link; must justify relevance/scalability |
| B 03+02+04 | Flood detection from imagery -> rescue chain | Biggest impact story | Needs big image downloads, accounts, stable network; crowded topic |
| C 01+05 | Lunar terrain -> safe landing/rover route | Very visual, India angle | Terrain data access via ISRO portal uncertain; algorithm-heavy |
| 06 alone | Debris dashboard | Easiest, great visuals | Common; looks like "just a dashboard" without a decision feature |

**Niche:** *a disaster-readiness check for India's satellites.* Most teams will build flood maps, crop maps, a debris
dashboard or a rover planner. We answer a different question: can the satellites do their job when people need them most?
**Pitch line:** "Satellites protect India in a disaster. We protect the satellites."

---

## 5. Problem statement (as written for the event)

- **Problem:** when a cyclone or flood hits, responders lean on a handful of satellites for imagery, weather, positioning and
  messages. There is no simple answer to "will those satellites be overhead, and safe, when we need them?"
- **Context:** low Earth orbit is crowded with debris from collisions such as Fengyun-1C and Cosmos 2251. In our 72-hour
  screening of India's active satellites against fresh debris data we found 102 close approaches under 10 km.
- **Who is affected:** disaster managers deciding where to look, satellite operators deciding what to protect, and rescue
  teams in areas where mobile networks are down.

---

## 6. What v1 does (built)

**Flow:** pick a hazard -> readiness report for the next 24 h -> helper satellites -> close-call screening -> what-if nudge.

- **Landing page (`/`):** hero, problem statement, live numbers, how it works, honest limits.
- **Mission control (`/mission`):** 3D Earth with the Indian fleet (colour by role), the debris cloud, a pulsing hazard marker,
  beams to imaging satellites in view, selected-orbit line, time controls (play/pause, speed, scrubber), layer toggles.
- **Scenarios (what-if, not live events):** Odisha cyclone, Assam floods, Wayanad landslides, Uttarakhand glacial lake outburst,
  Saurashtra cyclone, Andaman earthquake.
- **Readiness score (0-100):** imaging 40 (how soon a suitable, clear pass; radar preferred for cyclone/flood) + weather 20 +
  emergency comms 20 + NavIC 20 (4 satellites needed for a fix). Only satellites with no flagged close approach count.
- **Plain-English brief:** best imaging pass, backup, flagged satellites with suggested swaps, NavIC and comms status.
- **Helpers tab:** imaging, weather, comms and NavIC satellites with next pass / time in view and a risk tick.
- **Close calls tab:** events for helper satellites, tiered High < 1 km, Elevated 1-5 km, Watch 5-10 km, each with an
  illustrative collision chance; click to jump to the closest approach; "What if we nudge it?" slider shows the new miss distance.
- **Rescue link tab:** NavIC fix quality (PDOP) and dish pointing (azimuth/elevation) to the best relay satellites.
- **Brief tab** also shows the latest INSAT-3DS thermal image from ISRO MOSDAC.

### Key numbers (bundled snapshot, fresh CelesTrak data)
49 Indian satellites (17 imaging, 19 comms, 3 weather, 7 NavIC, 3 science), 2,654 debris objects (median element age 0.7 days),
130,046 pairs screened, 102 close approaches under 10 km in 72 h (1 High, 20 Elevated, 81 Watch; closest 0.48 km).

### Method (simple enough to explain to judges)
1. Orbit elements from CelesTrak for the Indian fleet and the debris clouds (Fengyun-1C, Cosmos 2251, Iridium 33, Cosmos 1408).
   Anything older than 14 days is rejected; failed/retired satellites are excluded; NavIC satellites must be in a
   geosynchronous-type orbit.
2. SGP4 propagation every 30 s for 72 h. For each satellite-debris pair, local minima under 260 km are refined by a
   **continuous search** for the true time of closest approach (not 1 s sampling).
3. Tiers: High under 1 km, Elevated 1-5 km, Watch 5-10 km. Illustrative collision chance from a small-target Gaussian model
   assuming 1.5 km position error and 15 m combined size.
4. Passes over the hazard: elevation >= 45 deg for imagers, >= 10 deg for weather/comms/NavIC.
5. Readiness: a satellite is dropped only if a High (under 1 km) event is predicted within 3 h of its pass (any time for
   geostationary). Elevated is a caution (usable, ranked lower, operator should monitor).
6. What-if: shift the satellite along its orbit by N seconds and re-measure the true closest approach (illustrative phasing, not
   a flight-dynamics plan).
7. Rescue link: NavIC PDOP from satellite azimuth/elevation geometry (standard GNSS formula) and dish pointing angles to relays.
8. INSAT-3DS thermal image pulled from ISRO MOSDAC (`/api/insat`), snapshot fallback.

### External review of the live site (21 Nov evening) and what we did
A reviewer checked the deployed v1. Their data findings were verified against our files and were **correct**:
- **Stale debris:** 4,170 of 4,171 debris records were over 14 days old (median 53 days, 1,036 over a year old), because the
  mirror we used does not refresh debris. All 118 reported close calls depended on those records. **Fixed:** switched to CelesTrak,
  reject anything over 14 days, regenerated everything. Median debris element age is now 0.7 days.
- **Miss distances too high:** 1 s sampling at ~14 km/s overstated 60 of 118 events by more than 0.5 km (SARAL x Fengyun debris
  was reported 3.81 km, true 1.29 km). **Fixed:** continuous minimum search.
- **Failed satellites listed as helpers:** NVS-02 (stranded orbit), GSAT-6A (contact lost 2018), IRNSS-1D (454-day-old record),
  IRNSS-1A (clock failure). **Fixed:** freshness filter, NavIC orbit sanity check, explicit exclusion list with reasons.
- **Readiness logic too blunt:** any close call under 10 km removed a satellite. **Fixed:** tiers (below), only High near a pass
  removes a satellite, Elevated is a caution, collision chance shown as illustrative.
- **Gaps against the criteria:** Domain 4 had no working feature -> added the Rescue link tab (NavIC PDOP, dish pointing).
  Indian data was only a roadmap item -> added a live MOSDAC INSAT-3DS feed. Domain 3 is still a scenario picker (no flood
  map or rainfall layer yet): next best addition.
- **One point we did not fully accept:** the review called the Indian portals "mandatory". The slide we photographed says external
  APIs and datasets are permitted and lists the portals, with an *evaluation priority* for projects that meaningfully use Indian
  satellite missions and data (the line is cut off). That is a priority, not a stated requirement, but it is worth satisfying.

### Honest limits (say these before a judge asks)
- Public elements are accurate to about 1 km -> an **early-warning screen**, not a final collision call; collision chance is
  illustrative.
- Satellite status comes from CelesTrak's active list plus our short exclusion list; it is **not** an official status.
- Scenarios are what-ifs on current orbits, not live disaster feeds (GDACS / NASA EONET are reachable; a good next step).
- No satellite imagery is analysed. Domain 02 is used as sensor matching (radar vs optical for the hazard).
- The rescue-link tool is a planning aid; it does not transmit messages.
- CelesTrak connections from our cloud build environment are intermittent. Refresh with `npm run data:refresh` and check
  `dataAgeDays` in `public/data/conjunctions.json`. The app shows a "stale data" warning if fresh debris elements are missing.

### Domain mapping
| Domain | How it is used |
|---|---|
| 06 Sustainable space | Core engine: debris screening, risk tiers, what-if |
| 03 Disaster management | Hazard scenarios, time-critical imaging passes, readiness report |
| 04 Comms / NavIC | NavIC fix quality (PDOP), relay coverage and dish pointing for rescue teams |
| 02 Earth observation | Sensor matching (radar through cloud vs optical) |
| 01 Indian missions | The whole fleet is Indian (NavIC, Cartosat, RISAT, EOS, INSAT, GSAT, NISAR); live INSAT-3DS image from MOSDAC |

---

## 7. Tech, design and data

**Stack:** Next.js (App Router) · TypeScript · Tailwind v4 · React Three Fiber / three.js · satellite.js 6 (v7 does not bundle
with the Next build because of a WASM/Node dependency) · React Bits + GodUI components.

**Look:** cinematic, editorial "field guide" style: Lexend light type, continuous vertical guides, frosted-glass panels,
atmospheric depth; deep-space navy `#03050a`, accent orange `#ff8a3d`, cool blue `#7aa7ff`, teal `#5eead4`. Layout notes in
`design-skills/`.

**Data pipeline (`npm run data:refresh`):** `scripts/fetch-orbit-data.mjs` -> `public/data/orbits.json` (CelesTrak; mirror only as a
loud fallback); `scripts/precompute-conjunctions.mjs` -> `public/data/conjunctions.json`; `scripts/fetch-insat.mjs` ->
`public/data/insat-latest.*` (MOSDAC snapshot). All outputs are committed, so the app works offline. CelesTrak is intermittently
unreachable from our cloud environment; re-run until `dataAgeDays.debrisMedian` is small and `fresh` is true.

**Repo:** https://github.com/shrestha-droid/astra-2026 (public)

---

## 8. Plan from here

| When | What |
|---|---|
| Before 9:30 PM | Ideation PPT (6-8 slides); lock the name; verify the Indian fleet facts |
| 9:30-11:30 PM | Ideation round pitches (rehearse the 60-second pitch and the honest limits) |
| Overnight | Stretch only after the demo is solid: live hazard feed (GDACS / EONET), ISRO portal layer (MOSDAC INSAT-3D / Bhuvan), mobile polish |
| ~3-5 AM | Freeze features; README, architecture diagram, screenshots |
| 5:00-6:00 AM | Record the 3-minute demo video; finish the Final PPT |
| **6:00-7:30 AM** | **Submit: Ideation PPT, Final PPT, public repo, 3-minute video** |
| 9:00 AM+ | Be ready to demo live and explain every part |

**Deck outline (6-8 slides):** Problem -> Why it matters (India angle) -> Solution -> Live demo screenshot -> How it works
(fresh CelesTrak data, SGP4, continuous closest-approach search, readiness index) -> Impact and scalability -> Roadmap -> Team.

**3-minute video outline:** 0:00 hook (the question) -> 0:20 pick a cyclone -> 0:50 readiness + brief -> 1:30 flagged satellite and
swap -> 2:00 what-if slider -> 2:30 limits and next steps -> 2:50 close.

### Likely judge questions
- *Is this real data?* Yes: CelesTrak NORAD elements (median age 0.7 days, anything over 14 days rejected), 72 h screening of 130,046 pairs, plus a live INSAT-3DS image from ISRO MOSDAC.
- *How accurate?* About 1 km for public data; it is a screening tool. Precise operator data would plug into the same engine.
- *Who would use it?* Disaster managers and satellite operators; a next step is live feeds and ISRO portal data.
- *What is original?* Joining disaster response with satellite safety in one readiness check.
- *Why not use imagery?* Out of scope overnight; radar vs optical selection is modelled, imagery layers are next.

### Open decisions
- [ ] Team confirms the direction and the name (currently "SatGuard India"; change in `src/lib/brand.ts`)
- [ ] Verify which Indian satellites are operational (NavIC especially) before quoting them
- [ ] Deploy a public demo link (Vercel) and put it in the README
- [ ] Team size and roles: 3D/frontend, data and maths, pitch/slides/video

---

## 9. Prompt for a second opinion

> I'm in a 100-point overnight hackathon (ASTRA 2026, space theme, ~14 hours). Judging: Technical 25, Working prototype 20,
> Presentation 15, Innovation 10, Problem relevance 10, UI/UX 10, Scalability 10. Deliverables: ideation PPT, final PPT,
> public repo, 3-minute video. We built "SatGuard India": for a chosen disaster scenario it lists which Indian satellites
> (imaging, weather, NavIC, comms) can help in the next 24 h and screens each against 2,654 tracked debris objects (SGP4 on
> CelesTrak elements, 102 close approaches under 10 km in 72 h, with tiers and illustrative collision chance), with a readiness score and a what-if along-track nudge slider.
> Review the rubric fit, find the weakest scoring areas, and suggest what to add or cut. Challenge whether another domain
> blend would win more points.
