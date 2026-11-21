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
const med = (a) => (a.length ? a.slice().sort((x, y) => x - y)[Math.floor(a.length / 2)] : 0);
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

// --- refine: continuous search for the true time of closest approach (not 1 s sampling).
// At ~14 km/s a 1 s grid can overstate the miss distance by several km, so we minimise distance over time directly.
const SIGMA_KM = 1.5;      // assumed 1-sigma position error per axis of public elements (illustrative)
const HARD_BODY_KM = 0.015; // assumed combined hard-body radius, 15 m (illustrative)
const events = [];
for (const c of candidates) {
  const k = c % 100000, p = Math.floor(c / 100000);
  const i = Math.floor(p / nD), j = p % nD;
  const center = start.getTime() + k * STEP * 1000;
  let lo = center - STEP * 1000, hi = center + STEP * 1000;
  const f = (ms) => distAt(fleet[i], debris[j], new Date(ms)).d;
  for (let it = 0; it < 48 && hi - lo > 1; it++) {   // ternary search to ~1 ms
    const m1 = lo + (hi - lo) / 3, m2 = hi - (hi - lo) / 3;
    if (f(m1) < f(m2)) hi = m2; else lo = m1;
  }
  const ms = (lo + hi) / 2;
  const best = distAt(fleet[i], debris[j], new Date(ms));
  if (best.d <= KEEP_KM) {
    const pc = (HARD_BODY_KM ** 2 / (2 * SIGMA_KM ** 2)) * Math.exp(-(best.d ** 2) / (2 * SIGMA_KM ** 2));
    events.push({
      satId: fleet[i].id, sat: fleet[i].name, role: fleet[i].role,
      debId: debris[j].id, debris: debris[j].name,
      tca: new Date(Math.round(ms)).toISOString(),
      missKm: +best.d.toFixed(2),
      relKms: +best.v.toFixed(2),
      // Illustrative collision chance: small-target 2-D Gaussian approximation with assumed position error.
      pc: +pc.toExponential(2),
      // Transparent screening index (100 at 0 km, ~37 at 3 km). NOT a probability.
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
  assumptions: { sigmaKm: SIGMA_KM, hardBodyKm: HARD_BODY_KM, note: "Collision chance is illustrative: assumes public-element position error and object size." },
  dataAgeDays: { debrisMedian: +med(debris.map((d) => (start - Date.parse(d.epoch)) / 864e5)).toFixed(1), fleetMedian: +med(fleet.map((d) => (start - Date.parse(d.epoch)) / 864e5)).toFixed(1) },
  fresh: debris.length >= 200,
  source: data.source,
  events,
};
await writeFile("public/data/conjunctions.json", JSON.stringify(out));
console.log(`done in ${((Date.now() - t0) / 1000).toFixed(0)}s: ${candidates.length} candidates -> ${events.length} events <= ${KEEP_KM} km`);
console.log(events.slice(0, 12).map((e) => `${e.sat} x ${e.debris}  ${e.missKm} km  ${e.tca}  ${e.relKms} km/s`).join("\n"));
