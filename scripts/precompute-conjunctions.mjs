// Screens every Indian satellite against every tracked debris object for the next 72 hours.
// Output: public/data/conjunctions.json  (run: node scripts/precompute-conjunctions.mjs)
//
// Method (simple, explainable):
//  1. Propagate all objects every STEP seconds with SGP4 (satellite.js).
//  2. For each (satellite, debris) pair, find local minima of the distance below COARSE_KM.
//  3. Refine each minimum to ~1 s resolution -> time of closest approach (TCA) and miss distance.
//  4. Keep events with miss distance <= KEEP_KM and score them.
// NOTE: public TLEs are accurate to roughly 1+ km, so this is an early-warning SCREEN, not a final answer.
import * as sat from "satellite.js";
import { readFile, writeFile } from "node:fs/promises";

const HOURS = 72;
const STEP = 30; // seconds
const COARSE_KM = 260; // must exceed half the distance covered in one step at ~15 km/s
const KEEP_KM = 10;

const data = JSON.parse(await readFile("public/data/orbits.json", "utf8"));
const start = new Date(data.fetchedAt);
const fleet = data.fleet.map((f) => ({ ...f, rec: sat.twoline2satrec(f.l1, f.l2) }));
const debris = data.debris.map((d) => ({ ...d, rec: sat.twoline2satrec(d.l1, d.l2) }));

const nF = fleet.length, nD = debris.length;
const fx = new Float64Array(nF * 3), dx = new Float64Array(nD * 3);
const fr = new Float64Array(nF), dr = new Float64Array(nD);
const fOk = new Uint8Array(nF), dOk = new Uint8Array(nD);

function stateAt(list, xs, rs, ok, t) {
  for (let i = 0; i < list.length; i++) {
    const pv = sat.propagate(list[i].rec, t);
    if (!pv || !pv.position || Number.isNaN(pv.position.x)) { ok[i] = 0; continue; }
    ok[i] = 1;
    xs[i * 3] = pv.position.x; xs[i * 3 + 1] = pv.position.y; xs[i * 3 + 2] = pv.position.z;
    rs[i] = Math.hypot(pv.position.x, pv.position.y, pv.position.z);
  }
}

const distAt = (a, b, t) => {
  const pa = sat.propagate(a.rec, t), pb = sat.propagate(b.rec, t);
  if (!pa?.position || !pb?.position) return { d: Infinity, v: 0 };
  const d = Math.hypot(pa.position.x - pb.position.x, pa.position.y - pb.position.y, pa.position.z - pb.position.z);
  const v = Math.hypot(pa.velocity.x - pb.velocity.x, pa.velocity.y - pb.velocity.y, pa.velocity.z - pb.velocity.z);
  return { d, v };
};

const nPairs = nF * nD;
let prev = new Float32Array(nPairs).fill(Infinity);
let prev2 = new Float32Array(nPairs).fill(Infinity);
const candidates = []; // [pairIndex, step index of minimum]

const steps = Math.floor((HOURS * 3600) / STEP);
const t0 = Date.now();
for (let k = 0; k <= steps; k++) {
  const t = new Date(start.getTime() + k * STEP * 1000);
  stateAt(fleet, fx, fr, fOk, t);
  stateAt(debris, dx, dr, dOk, t);
  for (let i = 0; i < nF; i++) {
    if (!fOk[i]) continue;
    const fxi = fx[i * 3], fyi = fx[i * 3 + 1], fzi = fx[i * 3 + 2], fri = fr[i];
    const base = i * nD;
    for (let j = 0; j < nD; j++) {
      const p = base + j;
      let d = Infinity;
      if (dOk[j] && Math.abs(fri - dr[j]) < COARSE_KM) {
        const ddx = fxi - dx[j * 3], ddy = fyi - dx[j * 3 + 1], ddz = fzi - dx[j * 3 + 2];
        d = Math.sqrt(ddx * ddx + ddy * ddy + ddz * ddz);
      }
      // local minimum at previous step
      if (prev[p] < COARSE_KM && prev[p] <= prev2[p] && prev[p] <= d) candidates.push(p * 100000 + (k - 1));
      prev2[p] = prev[p];
      prev[p] = d;
    }
  }
  if (k % 1000 === 0) console.log(`step ${k}/${steps}  candidates ${candidates.length}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
}

// --- refine
const events = [];
for (const c of candidates) {
  const k = c % 100000, p = Math.floor(c / 100000);
  const i = Math.floor(p / nD), j = p % nD;
  const center = start.getTime() + k * STEP * 1000;
  let best = { d: Infinity, v: 0, ms: center };
  for (let s = -STEP; s <= STEP; s++) {
    const ms = center + s * 1000;
    const r = distAt(fleet[i], debris[j], new Date(ms));
    if (r.d < best.d) best = { ...r, ms };
  }
  if (best.d <= KEEP_KM) {
    events.push({
      satId: fleet[i].id, sat: fleet[i].name, role: fleet[i].role,
      debId: debris[j].id, debris: debris[j].name,
      tca: new Date(best.ms).toISOString(),
      missKm: +best.d.toFixed(2),
      relKms: +best.v.toFixed(2),
      // transparent screening index: 100 at 0 km, ~37 at 3 km, ~5 at 9 km. NOT a collision probability.
      score: Math.round(100 * Math.exp(-best.d / 3)),
    });
  }
}
events.sort((a, b) => a.missKm - b.missKm);

const out = {
  generatedAt: new Date().toISOString(),
  windowStart: start.toISOString(),
  windowHours: HOURS,
  stepSec: STEP,
  keepKm: KEEP_KM,
  method: "SGP4 screening of every Indian satellite vs all tracked debris, refined to ~1 s",
  pairsScreened: nPairs, nSats: nF, nDebris: nD,
  events,
};
await writeFile("public/data/conjunctions.json", JSON.stringify(out));
console.log(`done in ${((Date.now() - t0) / 1000).toFixed(0)}s: ${candidates.length} candidates -> ${events.length} events <= ${KEEP_KM} km`);
console.log(events.slice(0, 12).map((e) => `${e.sat} x ${e.debris}  ${e.missKm} km  ${e.tca}  ${e.relKms} km/s`).join("\n"));
