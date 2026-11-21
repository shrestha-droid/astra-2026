// Fetches a fresh orbit snapshot (TLEs) and writes public/data/orbits.json.
// Run: node scripts/fetch-orbit-data.mjs
// Source: https://tle.ivanstanojevic.me (public mirror of NORAD/CelesTrak elements).
// The result is committed so the demo works fully offline.
import { writeFile, mkdir } from "node:fs/promises";

const API = "https://tle.ivanstanojevic.me/api/tle/";

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

const SEARCHES = [
  "IRNSS", "NVS", "INSAT", "GSAT-", "CMS-", "CARTOSAT", "RESOURCESAT", "RISAT", "OCEANSAT",
  "EOS-", "SCATSAT", "HYSIS", "NISAR", "ASTROSAT", "XPOSAT", "SARAL", "MICROSAT", "KALPANA", "IRS-P",
];

async function page(search, n) {
  const url = `${API}?search=${encodeURIComponent(search)}&page=${n}&page-size=100&sort=id&sort-dir=asc`;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const r = await fetch(url, { redirect: "follow" });
      if (r.ok) return r.json();
    } catch {}
    await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
  }
  throw new Error("failed " + url);
}

// Launch year from the international designator in line 1 (cols 10-11).
const launchYear = (l1) => { const yy = parseInt(l1.slice(9, 11), 10); return yy < 57 ? 2000 + yy : 1900 + yy; };
// Older / known-retired spacecraft are dropped: public elements list every tracked object, operational or not.
const RETIRED = /^(RISAT-1$|EOS-7$)/;
const compact = (m) => ({ id: m.satelliteId, name: m.name, epoch: m.date, l1: m.line1, l2: m.line2 });

// --- Indian fleet
const fleet = new Map();
for (const s of SEARCHES) {
  const d = await page(s, 1);
  for (const m of d.member) {
    const f = FLEET.find((x) => x.re.test(m.name));
    if (!f || fleet.has(m.satelliteId)) continue;
    const year = launchYear(m.line1);
    if (year < 2010 || RETIRED.test(m.name)) continue;
    fleet.set(m.satelliteId, { ...compact(m), role: f.role, sensor: f.sensor, launchYear: year });
  }
  console.log(s.padEnd(12), "->", fleet.size);
}

// --- Debris
const debris = new Map();
let n = 1, total = Infinity;
while ((n - 1) * 100 < total) {
  const d = await page("DEB", n);
  total = d.totalItems;
  for (const m of d.member) if (/DEB/.test(m.name)) debris.set(m.satelliteId, compact(m));
  n++;
  if (n > 60) break;
}
console.log("debris", debris.size, "of", total);

const out = {
  fetchedAt: new Date().toISOString(),
  source: "tle.ivanstanojevic.me (NORAD two-line elements, public)",
  fleet: [...fleet.values()].sort((a, b) => a.name.localeCompare(b.name)),
  debris: [...debris.values()],
};
await mkdir("public/data", { recursive: true });
await writeFile("public/data/orbits.json", JSON.stringify(out));
console.log("wrote public/data/orbits.json", out.fleet.length, "fleet,", out.debris.length, "debris");
