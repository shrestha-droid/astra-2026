# ASTRA 2026 — Project Brief (for human + AI review)

> Purpose: one self-contained file with everything decided and everything considered, so any AI or teammate can
> review the project cold. Last updated: 21 Nov 2026 (afternoon, before the Ideation round).
> **Status: direction not yet locked by the team. Recommended: Option 06 (orbital debris / conjunction tracker).**

---

## 1. The event

- **Name:** ASTRA — Advanced Space Technology & Research Arena
- **Organiser:** Club ANTERiX, VIT Bhopal University
- **When / where:** 21–22 Nov 2026, Academic Block-2 (AB2), Auditorium 1 & 2. Overnight hackathon, space theme.
- **Theme:** Use space science, Indian space missions and satellite technology to solve meaningful problems on Earth and beyond.

### Timeline
| Time | Event |
|---|---|
| 21 Nov 2:00–3:00 PM | Entry and check-in (closes strictly at 3:00 PM) |
| 3:15 PM | Event starts; lamp lighting 3:30; lectures; problem domains released by 5:00 PM |
| 7:30 PM | Dinner break |
| **8:30 PM** | **Gate closes. Nobody leaves until morning. Bring chargers, extension board, meds, snacks.** |
| 9:30–11:30 PM | **Ideation round** (desk-to-desk) — needs the Initial Ideation PPT (6–8 slides) |
| 22 Nov **6:00 AM** | Submission form opens |
| **7:30 AM** | **Form closes. Venue cleared. No late submissions.** |
| 9:00 AM | Top 20 announced; judging of submitted projects starts |
| 9:30 AM | Top 20 must be back at the venue |
| 10:00 AM | Final pitches (Final PPT + working demo) |

### Mandatory deliverables (all four, by 7:30 AM)
1. Initial Ideation PPT — 6–8 slides (first concept)
2. Final PPT — 6–8 slides (same deck is used for the live pitch)
3. **Public** GitHub repository link
4. 3-minute demo video of the working project

### Rules that matter
- Work must be original and built during the hackathon. Copying another team = disqualification.
- **AI tools, libraries and online docs are allowed**, but every team member must understand the work and explain every part to judges.
- Only registered members compete; phones on silent; stay in your workspace; Wi-Fi for genuine development only.
- Teams bring their own extension board. Warm clothes recommended (cold night).

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

Notes from the slides:
- "Idea Pitching" is **included inside two of the 10-mark criteria**, not added on top of 100 (which two is not stated).
- **Round 1 – Idea Pitching:** every team, desk-to-desk, **20 marks** of the final score.
- **Round 2 – Evaluation & Shortlisting:** submitted projects judged against the framework, from **22 Nov 9:00 AM**.
- **Round 3 – Final Presentations:** shortlisted (Top 20) teams only. Presentation + working demonstration.

### What this means strategically
- 45/100 is "does it work and is it well built" (Technical + Prototype) → **stability beats flash**; demo must not depend on venue internet.
- 25/100 is look + pitch (UI/UX + Presentation) → design polish and storytelling are cheap points.
- The **Top 20 is chosen from submitted deliverables** (repo, PPT, video) → quality of the repo, README and video is the gate.
- Likely weak spots to pre-empt: *Problem Relevance* (why this matters) and *Scalability* (could it really be used).

---

## 3. The six core domains (problem directions)

Teams may pick one or combine several, and are encouraged to define their own problem statement. Examples are illustrative.

| # | Domain | Scope | Example statement |
|---|---|---|---|
| 01 | Indian Space Missions & Space Data | Chandrayaan, Mangalyaan, Aditya-L1, AstroSat, XPoSat, ISRO, ISSDC datasets | Tool analysing public Chandrayaan data to visualise lunar surface and find regions of interest |
| 02 | Earth Observation & Satellite Applications | Remote sensing for agriculture, environment, water, urban planning, climate | Satellite-image system to detect declining vegetation / crop stress |
| 03 | Space-Based Disaster Management | Floods, cyclones, forest fires, landslides, droughts | Flood-mapping tool with impact overview for emergency teams |
| 04 | Satellite Communication, Navigation & Connectivity | NavIC, rural connectivity, emergency comms with no network | Location-sharing / coordination prototype for rescue where mobile networks are down |
| 05 | Moon, Mars & Deep-Space Exploration | Planetary science, terrain analysis, navigation, mission planning | Simulated lunar rover navigation avoiding hazardous slopes |
| 06 | Sustainable Space & Space Environment | Debris monitoring, satellite safety, orbital sustainability | Dashboard visualising orbital debris and highlighting close approaches |

---

## 4. Options compared (all considered)

Assumption: the whole team uses Claude, so raw coding time is much smaller than normal. The limits that remain are **data access, venue network, accounts/API keys, compute, demo reliability and the ~14 hours available.**

| Dir. | Build difficulty (1 easiest – 6 hardest) | Visual wow | Crowding (other teams) | Main risk | Fit to rubric |
|---|---|---|---|---|---|
| 06 Orbital debris | 1 | Very high (3D Earth + orbits) | Low | Seen as "less urgent"; needs a real decision feature, not just a globe | Strong on Prototype, UI/UX, Innovation; needs framing for Relevance |
| 05 Lunar rover nav | 4 | High | Low–medium | Terrain data + pathfinding logic | Good on Innovation/Tech; moderate risk |
| 04 Sat comms | 5 | Medium | Low | Hard to demo convincingly without hardware | Weak demo score risk |
| 01 Indian missions data | 3 | Medium–high | Medium | Unfamiliar science file formats eat hours | Strong India angle, uncertain data pipeline |
| 03 Disaster / floods | 2 | Medium (maps) | High | Satellite imagery download, accounts, network, size | Highest impact story; highest failure risk |
| 02 Earth observation / crops | 1 hardest | Medium | High | Image processing / ML + large data | Impact story but heavy and crowded |

(Difficulty ordering given in chat, hardest → easiest: 02, 03, 01, 05, 04, 06.)

### Recommendation: **06, built as a full decision tool**
Not a pretty globe — a tool that answers "what should an operator do?":
1. Real, current orbit data (CelesTrak TLE/OMM) propagated in-browser (e.g. `satellite.js`) → live 3D Earth with satellites and debris.
2. **Close-approach (conjunction) detection** with a danger/risk score per event.
3. **Recommended action** (e.g. small manoeuvre) with a "what-if" simulator showing the result.
4. **India focus:** highlight Indian assets (NavIC, Cartosat, INSAT/GSAT, weather/comm satellites) and what is at stake if one is lost.
5. Plain-English explanation of each alert (AI assistant optional).
6. **Offline-safe:** bundle a saved dataset so the demo works without venue internet.

Pros: reliable demo, low crowding, great video, matches the UI/UX points, quick to extend with AI.
Cons: must justify relevance and scalability in the pitch; risk of looking like "just visuals" if the decision feature is thin.

### Runner-up: 03 (flood mapping)
Pros: strongest real-world impact narrative; water detection from satellite bands is a known recipe, easy with AI help.
Cons: the blocker is data (account, big downloads, stable network, ideally pre-downloaded before the 8:30 PM gate); crowded topic. Only pick if the team can pre-fetch data now.

### Also viable: combine 06 + 04/01 for a "mission control for India" story — only if time remains. Do not widen scope before the core demo works.

---

## 5. Open decisions (need the team)
- [ ] **Which direction?** (default: 06)
- [ ] Team size and who owns: 3D/frontend · data & orbit maths · pitch/slides/video
- [ ] Draft the Initial Ideation PPT (6–8 slides) for the 9:30 PM round?
- [ ] Deploy to Vercel for a live link? (offline fallback still required)

---

## 6. Proposed plan (once direction is locked)

| Phase | Output |
|---|---|
| Before 9:30 PM | Ideation PPT (6–8 slides); repo skeleton and data pipeline running |
| 9:30–11:30 PM | Ideation round pitches |
| Overnight | Core: live orbits → conjunction detection → risk score → recommended action → India view |
| ~3–5 AM | Freeze features; polish UI; write README + architecture diagram |
| 5:00–6:00 AM | Record 3-minute demo video; finish Final PPT (6–8 slides) |
| **6:00–7:30 AM** | **Submit: Ideation PPT, Final PPT, public repo, 3-min video** |
| 9:00 AM+ | Be ready: working demo, can explain every part |

Suggested Ideation/Final deck outline (6–8 slides): Problem → Why it matters (India angle) → Solution → Live demo screenshot → How it works (architecture, data, maths) → Impact & scalability → Roadmap / team.

---

## 7. Aesthetic and tech (already built)

**Look:** cinematic, atmospheric, editorial — inspired by the *Sylva* Three.js forest site (light geometric type, continuous
vertical guide lines, frosted-glass cards, fog/haze depth, live WebGL scene). Palette: deep-space navy `#04060b`,
ANTERiX orange `#ff8a3d`, cool blue accent `#7aa7ff`. Font: Lexend (200–500).

**Stack:** Next.js (App Router) · TypeScript · Tailwind v4 · React Three Fiber / three.js · Framer Motion · Lenis.
Orbit maths planned: `satellite.js`.

**Repo:** https://github.com/shrestha-droid/astra-2026 (public)
- `src/components/SpaceScene.tsx` — starfield + fbm nebula shader + pointer parallax
- `src/app/page.tsx` — hero + chapter cards (placeholders)
- `src/app/globals.css` — design tokens, guides, glass styles
- `.claude/skills/` — design skills copied from MengTo/Skills (sylva-field-guide-layout, build-threejs-scroll-worlds, shaders-cursor-ripples, etc.)
- `HACKATHON.md` — rules/timeline/checklist · `README.md` — skeleton

---

## 8. Environment notes (constraints discovered)
- Work happens in a cloud session; repo creation from the session is blocked, so the repo was created manually on GitHub then attached.
- `gh repo create` (GraphQL) is blocked in-session; use the git CLI and REST repo-scoped endpoints.
- No folder on the user's own computer is shared with the session (terminal access is in the cloud container only).
- Venue Wi-Fi may be unreliable → **everything demo-critical must work offline.**
- Connectors available: Vercel, Supabase, Render, Gmail, Google Calendar/Drive/Docs/Sheets/Slides, Shopify. Many others need sign-in; GitHub/Asana/BigQuery connectors failed to connect.

---

## 9. Prompt to give another AI for a second opinion

> I'm in a 100-point overnight hackathon (ASTRA 2026, space theme, ~14 hours). Judging: Technical 25, Working prototype 20,
> Presentation 15, Innovation 10, Problem relevance 10, UI/UX 10, Scalability 10. Deliverables: ideation PPT, final PPT,
> public repo, 3-min video. Six domains: Indian missions data, Earth observation, disaster management, satellite
> comms/NavIC, Moon/Mars exploration, sustainable space/debris. My team uses AI heavily. I'm leaning toward an orbital-debris
> close-approach tracker with a recommended-manoeuvre simulator and an India-assets focus, rendered in 3D (Three.js).
> Review the rubric fit, find the weakest scoring areas, suggest what to add or cut, and challenge whether another domain
> would win more points.
