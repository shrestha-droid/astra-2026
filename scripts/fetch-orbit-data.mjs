// Fetches a fresh orbit snapshot and writes public/data/orbits.json.
//   Run: node scripts/fetch-orbit-data.mjs        (or: npm run data:fetch)
//
// Sources, in order of preference:
//   1. CelesTrak GP data (https://celestrak.org) - current elements, includes the big debris clouds.
//   2. tle.ivanstanojevic.me mirror - fallback only. Its DEBRIS records are often months or years old.
//
// Data quality rules (a stale orbit propagated forward gives errors of hundreds of km, so we refuse it):
//   - Every object must have an element set no older than MAX_AGE_DAYS.
//   - Satellites known not to work (failed, lost contact, stranded) are excluded.
//   - NavIC satellites must sit in a geosynchronous-type orbit.
import { mkdir, writeFile } from "node:fs/promises";

const MAX_AGE_DAYS = 14;
const NOW = Date.now();
const CELESTRAK = "https://celestrak.org/NORAD/elements/gp.php";
const MIRROR = "https://tle.ivanstanojevic.me/api/tle/";

/** Indian fleet: name pattern -> role + what the satellite can do for a disaster response. */
const FLEET = [
  { re: /^(IRNSS|NVS)-/, role: "nav", sensor: "NavIC positioning" },
  { re: /^INSAT-3D(R|S)?$/, role: "weather", sensor: "Weather imager and sounder (cyclone tracking)" },
  { re: /^(GSAT-\d|CMS-\d|INSAT-(3A|3C|4A|4B|4CR))/, role: "comm", sensor: "Communication relay" },
  { re: /^(CARTOSAT-(2|3)|CARTOSAT-2[A-F]|IRS-P5)/, role: "eo", sensor: "High-resolution optical imaging" },
  { re: /^(RESOURCESAT|IRS-P6)/, role: "eo", sensor: "Multispectral optical imaging" },
  { re: /^(RISAT-2B|RISAT-2BR|EOS-04|RISAT-1)/, role: "eo", sensor: "Radar imaging (sees through cloud)" },
  { re: /^NISAR/, role: "eo", sensor: "L+S-band radar (NASA-ISRO), sees through cloud" },
  { re: /^(OCEANSAT-2|EOS-06)/, role: "eo", sensor: "Ocean colour and winds" },
  { re: /^SCATSAT/, role: "eo", sensor: "Scatterometer: ocean winds, cyclone tracking" },
  { re: /^HYSIS/, role: "eo", sensor: "Hyperspectral imaging" },
  { re: /^(EOS-\d)/, role: "eo", sensor: "Earth observation" },
  { re: /^(SARAL|MICROSAT|KALPANA|XPOSAT|ASTROSAT)/, role: "science", sensor: "Science mission" },
];

/** Known not to be usable. Keep reasons here so the claim can be checked and corrected. */
const NOT_OPERATIONAL = [
  { re: /^NVS-02/, why: "stranded in a transfer orbit after the 2025 orbit-raising failure" },
  { re: /^GSAT-6A/, why: "contact lost in 2018" },
  { re: /^IRNSS-1A/, why: "navigation payload failed (atomic clocks)" },
  { re: /^(RISAT-1$|EOS-7$)/, why: "retired / technology demonstrator" },
];

const SEARCHES = [
  "IRNSS", "NVS", "INSAT", "GSAT-", "CMS-", "CARTOSAT", "RESOURCESAT", "RISAT", "OCEANSAT",
  "EOS-", "SCATSAT", "HYSIS", "NISAR", "ASTROSAT", "XPOSAT", "SARAL", "MICROSAT", "KALPANA", "IRS-P",
];
const DEBRIS_GROUPS = ["cosmos-2251-debris", "iridium-33-debris", "fengyun-1c-debris", "cosmos-1408-debris"];

// ---------- TLE helpers
function parseTle(text) {
  const lines = text.split(/\r?\n/).map((l) => l.trimEnd()).filter(Boolean);
  const out = [];
  for (let i = 0; i + 2 < lines.length; ) {
    if (lines[i + 1].startsWith("1 ") && lines[i + 2].startsWith("2 ")) {
      out.push(makeRec(lines[i].replace(/^0 /, "").trim(), lines[i + 1], lines[i + 2]));
      i += 3;
    } else i++;
  }
  return out;
}
function epochMs(l1) {
  const yy = parseInt(l1.slice(18, 20), 10), day = parseFloat(l1.slice(20, 32));
  return Date.UTC(yy < 57 ? 2000 + yy : 1900 + yy, 0, 1) + (day - 1) * 864e5;
}
function makeRec(name, l1, l2) {
  const e = epochMs(l1);
  return { id: parseInt(l1.slice(2, 7), 10), name, epoch: new Date(e).toISOString(), l1, l2, _ms: e };
}
const launchYear = (l1) => { const yy = parseInt(l1.slice(9, 11), 10); return yy < 57 ? 2000 + yy : 1900 + yy; };
const meanMotion = (l2) => parseFloat(l2.slice(52, 63));
const ecc = (l2) => parseFloat("0." + l2.slice(26, 33).trim());
const ageDays = (r) => (NOW - r._ms) / 864e5;
const strip = ({ _ms, ...r }) => r;

async function getText(url, tries = 3) {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(30000) });
      if (r.ok) return await r.text();
    } catch { /* retry */ }
    await new Promise((r) => setTimeout(r, 800 * (i + 1)));
  }
  throw new Error("failed " + url);
}

// ---------- source 1: CelesTrak
async function fromCelesTrak() {
  const active = parseTle(await getText(`${CELESTRAK}?GROUP=active&FORMAT=tle`));
  const debris = [];
  for (const g of DEBRIS_GROUPS) debris.push(...parseTle(await getText(`${CELESTRAK}?GROUP=${g}&FORMAT=tle`)));
  if (active.length < 1000 || debris.length < 100) throw new Error("CelesTrak returned too little data");
  return { candidates: active, debris, source: "CelesTrak GP (celestrak.org)" };
}

// ---------- source 2: mirror (fallback)
async function mirrorPage(search, n) {
  const url = `${MIRROR}?search=${encodeURIComponent(search)}&page=${n}&page-size=100&sort=id&sort-dir=asc`;
  return JSON.parse(await getText(url));
}
async function fromMirror() {
  const candidates = [];
  for (const s of SEARCHES) {
    try {
      const d = await mirrorPage(s, 1);
      for (const m of d.member) candidates.push(makeRec(m.name, m.line1, m.line2));
    } catch { console.warn("mirror: skipped search", s); }
  }
  const debris = [];
  let n = 1, total = Infinity;
  while ((n - 1) * 100 < total && n <= 60) {
    let d;
    try { d = await mirrorPage("DEB", n++); } catch { console.warn("mirror: page", n - 1, "failed, continuing"); continue; }
    total = d.totalItems;
    for (const m of d.member) if (/DEB/.test(m.name)) debris.push(makeRec(m.name, m.line1, m.line2));
  }
  return { candidates, debris, source: "tle.ivanstanojevic.me mirror (fallback; debris records often stale)" };
}

// ---------- main
let src, warnings = [];
try { src = await fromCelesTrak(); console.log("source: CelesTrak"); }
catch (e) {
  console.warn("CelesTrak unavailable (" + e.message + "). Falling back to the mirror.");
  warnings.push("CelesTrak unreachable; used a mirror whose debris records may be stale.");
  src = await fromMirror();
}

// fleet
const fleet = new Map(), dropped = { stale: [], failed: [], old: [], orbit: [] };
for (const r of src.candidates) {
  const f = FLEET.find((x) => x.re.test(r.name));
  if (!f || fleet.has(r.id)) continue;
  const year = launchYear(r.l1);
  const bad = NOT_OPERATIONAL.find((x) => x.re.test(r.name));
  if (bad) { dropped.failed.push(`${r.name}: ${bad.why}`); continue; }
  if (year < 2010) { dropped.old.push(r.name); continue; }
  if (ageDays(r) > MAX_AGE_DAYS) { dropped.stale.push(`${r.name} (${Math.round(ageDays(r))} d old)`); continue; }
  if (f.role === "nav" && !(meanMotion(r.l2) > 0.9 && meanMotion(r.l2) < 1.1 && ecc(r.l2) < 0.1)) {
    dropped.orbit.push(`${r.name}: not in a geosynchronous-type orbit`); continue;
  }
  fleet.set(r.id, { ...strip(r), role: f.role, sensor: f.sensor, launchYear: year });
}

// debris: freshness filter
const debrisAll = new Map();
for (const r of src.debris) debrisAll.set(r.id, r);
const debris = [...debrisAll.values()].filter((r) => ageDays(r) <= MAX_AGE_DAYS).map(strip);
const droppedDebris = debrisAll.size - debris.length;
const med = (a) => (a.length ? a.slice().sort((x, y) => x - y)[Math.floor(a.length / 2)] : 0);
const debrisAges = [...debrisAll.values()].map(ageDays);

if (debris.length < 200) warnings.push(`Only ${debris.length} debris objects have fresh elements (need 200+). Close-call screening is NOT reliable. Run on a machine that can reach celestrak.org.`);

const out = {
  fetchedAt: new Date(NOW).toISOString(),
  source: src.source,
  maxAgeDays: MAX_AGE_DAYS,
  stats: {
    debrisSeen: debrisAll.size, debrisKept: debris.length, debrisDroppedStale: droppedDebris,
    debrisMedianAgeDaysBeforeFilter: +med(debrisAges).toFixed(1),
    fleetKept: fleet.size, fleetDropped: dropped,
  },
  warnings,
  fleet: [...fleet.values()].sort((a, b) => a.name.localeCompare(b.name)),
  debris,
};
await mkdir("public/data", { recursive: true });
await writeFile("public/data/orbits.json", JSON.stringify(out));
console.log(`wrote public/data/orbits.json: ${out.fleet.length} satellites, ${debris.length} fresh debris (dropped ${droppedDebris} stale)`);
for (const k of Object.keys(dropped)) if (dropped[k].length) console.log(`  dropped (${k}):`, dropped[k].join("; "));
for (const w of warnings) console.warn("WARNING:", w);
