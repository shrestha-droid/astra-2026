import { ConjEvent, Conjunctions, FleetSat, Orbits, Role, elevationDeg, fmtDateTime, fmtDur, fmtTime, eciAt } from "./orbits";
import type { Scenario } from "./scenarios";

export type Tier = "high" | "elevated" | "watch";
// Public elements are good to ~1 km, so a "high" call is a pass inside 1 km; 1-5 km is a caution, 5-10 km a watch.
export const tierOf = (missKm: number): Tier => (missKm < 1 ? "high" : missKm < 5 ? "elevated" : "watch");
/** "1 in N" text for an illustrative collision chance; very small values are capped rather than shown with false precision. */
export const oneInText = (pc: number) => {
  const n = 1 / pc;
  return n >= 1e7 ? "under 1 in 10 million" : "1 in " + Math.max(1, Math.round(n)).toLocaleString("en-US");
};
export const TIER_META: Record<Tier, { label: string; color: string }> = {
  high: { label: "High", color: "#ff5d6c" },
  elevated: { label: "Elevated", color: "#ffc857" },
  watch: { label: "Watch", color: "#7aa7ff" },
};

export interface Pass { startMs: number; endMs: number; maxEl: number; maxElMs: number }
export interface HelperReport {
  sat: FleetSat;
  passes: Pass[];
  visibleFraction: number;
  elNow: number | null;
  events: ConjEvent[];
  /** clear: nothing flagged · watch: far/low-risk events · caution: 1-5 km near a pass, still usable · conflict: under 1 km near a pass */
  status: "clear" | "watch" | "caution" | "conflict";
  conflict?: ConjEvent;
  suitable: boolean;
}
export interface ScorePart { key: Role | "all"; label: string; value: number; max: number; detail: string }
export interface Pick { helper: HelperReport; pass: Pass; clear: boolean }
export interface Readiness {
  score: number; parts: ScorePart[]; helpers: HelperReport[];
  primary?: Pick; backup?: Pick; swaps: { from: HelperReport; to?: Pick; event: ConjEvent }[];
  brief: string[]; startMs: number; endMs: number;
}

const MIN_EL: Record<Role, number> = { eo: 45, weather: 10, comm: 10, nav: 10, science: 10 };
const HOUR = 3600_000;
const lc = (t: string) => t.charAt(0).toLowerCase() + t.slice(1);

function radarSuited(h: Scenario["hazard"], sensor: string) {
  const radar = /radar/i.test(sensor);
  if (h === "Cyclone" || h === "Flood") return radar || /wind|scatter|weather/i.test(sensor);
  return true;
}

export function assess(scn: Scenario, startMs: number, horizonH: number, orbits: Orbits, conj: Conjunctions): Readiness {
  const endMs = startMs + horizonH * HOUR;
  const helpers: HelperReport[] = [];

  for (const sat of orbits.fleet) {
    if (sat.role === "science") continue;
    const min = MIN_EL[sat.role];
    const step = sat.geo ? 600_000 : 60_000;
    const passes: Pass[] = [];
    let cur: Pass | null = null, vis = 0, n = 0;
    for (let t = startMs; t <= endMs; t += step) {
      const el = elevationDeg(sat.rec, t, scn.lat, scn.lon);
      n++;
      if (el !== null && el >= min) {
        vis++;
        if (!cur) cur = { startMs: t, endMs: t, maxEl: el, maxElMs: t };
        cur.endMs = t;
        if (el > cur.maxEl) { cur.maxEl = el; cur.maxElMs = t; }
      } else if (cur) { passes.push(cur); cur = null; }
    }
    if (cur) passes.push(cur);

    const events = conj.events.filter((e) => e.satId === sat.id && Date.parse(e.tca) >= startMs && Date.parse(e.tca) <= endMs)
      .sort((a, b) => Date.parse(a.tca) - Date.parse(b.tca));

    // worst event near a usable window (within 3 h of a pass, or any time for geostationary satellites)
    let conflict: ConjEvent | undefined, caution: ConjEvent | undefined;
    for (const e of events) {
      const tier = tierOf(e.missKm);
      if (tier === "watch") continue;
      const tca = Date.parse(e.tca);
      const near = sat.geo || passes.some((p) => tca >= p.startMs - 3 * HOUR && tca <= p.endMs + 3 * HOUR);
      if (!near) continue;
      if (tier === "high" && (!conflict || e.missKm < conflict.missKm)) conflict = e;
      if (tier === "elevated" && (!caution || e.missKm < caution.missKm)) caution = e;
    }
    helpers.push({
      sat, passes, visibleFraction: vis / Math.max(n, 1),
      elNow: elevationDeg(sat.rec, startMs, scn.lat, scn.lon),
      events, conflict: conflict ?? caution,
      status: conflict ? "conflict" : caution ? "caution" : events.length ? "watch" : "clear",
      suitable: radarSuited(scn.hazard, sat.sensor),
    });
  }

  const by = (r: Role) => helpers.filter((h) => h.sat.role === r);
  const covering = (h: HelperReport) => (h.sat.role === "eo" ? h.passes.length > 0 : h.visibleFraction > 0.5);

  // ---- score
  const eo = by("eo").filter(covering);
  const clearPasses = eo.filter((h) => h.status !== "conflict").flatMap((h) => h.passes.map((p) => ({ h, p })));
  const flaggedPasses = eo.filter((h) => h.status === "conflict" || h.status === "caution").reduce((a, h) => a + h.passes.length, 0);
  const goodClear = clearPasses.filter((x) => x.h.suitable);
  const pool = goodClear.length ? goodClear : clearPasses; // fall back to any clear pass, at half credit
  const firstH = pool.length ? Math.max(0, Math.min(...pool.map((x) => x.p.startMs)) - startMs) / HOUR : Infinity;
  const timeScore = firstH <= 2 ? 28 : firstH <= 4 ? 24 : firstH <= 8 ? 18 : firstH <= 16 ? 10 : firstH <= 24 ? 5 : 0;
  const depthScore = Math.round((12 * Math.min(goodClear.length, 6)) / 6);
  const imaging = Math.round((goodClear.length ? timeScore : timeScore * 0.5) + depthScore);

  const wx = by("weather").filter(covering);
  const wxClear = wx.filter((h) => h.status !== "conflict").length;
  const weather = wxClear ? 20 : wx.length ? 8 : 0;

  const cm = by("comm").filter(covering);
  const cmClear = cm.filter((h) => h.status !== "conflict").length;
  const comms = cmClear >= 2 ? 20 : cmClear === 1 ? 12 : cm.length ? 6 : 0;

  const nv = by("nav").filter(covering);
  const nvClear = nv.filter((h) => h.status !== "conflict").length;
  const nav = nvClear >= 4 ? 20 : nvClear * 5;

  const parts: ScorePart[] = [
    { key: "eo", label: "Imaging passes", value: imaging, max: 40, detail: Number.isFinite(firstH) ? `first clear ${goodClear.length ? "" : "(non-ideal sensor) "}pass in ${firstH < 1 ? Math.round(firstH * 60) + " min" : firstH.toFixed(1) + " h"}; ${goodClear.length} suitable usable pass(es), ${flaggedPasses} with a close call flagged` : "no clear imaging pass in the window" },
    { key: "weather", label: "Weather watch", value: weather, max: 20, detail: `${wxClear} of ${wx.length} covering weather satellites clear` },
    { key: "comm", label: "Emergency comms", value: comms, max: 20, detail: `${cmClear} of ${cm.length} covering relay satellites clear` },
    { key: "nav", label: "NavIC positioning", value: nav, max: 20, detail: `${nvClear} of ${nv.length} navigation satellites in view and clear` },
  ];
  const score = parts.reduce((a, p) => a + p.value, 0);

  // ---- picks: unflagged first, then right sensor for the hazard, then earliest. Cautioned passes stay usable.
  const isClear = (h: HelperReport) => h.status === "clear" || h.status === "watch";
  const allPasses: Pick[] = [];
  for (const h of by("eo")) if (h.status !== "conflict") for (const p of h.passes) allPasses.push({ helper: h, pass: p, clear: isClear(h) });
  const rank = (a: Pick, b: Pick) =>
    Number(b.clear) - Number(a.clear) || Number(b.helper.suitable) - Number(a.helper.suitable) || a.pass.startMs - b.pass.startMs;
  const sorted = [...allPasses].sort(rank);
  const primary = sorted[0];
  const backup = sorted.find((p) => p.helper.sat.id !== primary?.helper.sat.id);

  // flagged satellites: under 1 km = avoid (swap), 1-5 km = keep but monitor
  const swaps = helpers
    .filter((h) => (h.status === "conflict" || h.status === "caution") && h.conflict)
    .map((h) => ({
      from: h, event: h.conflict!,
      to: sorted.find((p) => p.clear && p.helper.sat.id !== h.sat.id && (h.sat.role !== "eo" || p.helper.suitable)),
    }));

  // ---- plain-English brief
  const brief: string[] = [];
  const pcTxt = (e: ConjEvent) => `${oneInText(e.pc)} (illustrative)`;
  brief.push(`If a ${scn.hazard.toLowerCase()} hits ${scn.place} in the next ${horizonH} hours, India's fleet is ${score >= 75 ? "well" : score >= 50 ? "partly" : "poorly"} placed to respond (readiness ${score}/100).`);
  if (primary) {
    const flag = primary.helper.status === "caution" && primary.helper.conflict
      ? ` A ${primary.helper.conflict.missKm} km pass with ${primary.helper.conflict.debris} is predicted near it. That is a caution, not a stop: the pass is still usable, but the operator should monitor it.`
      : " No close approach is flagged around that pass.";
    brief.push(`Best imaging: ${primary.helper.sat.name}, ${lc(primary.helper.sat.sensor)}, passes overhead at ${fmtTime(primary.pass.maxElMs)} IST, peaking at ${Math.round(primary.pass.maxEl)}° elevation.${flag}`);
  } else brief.push("No imaging satellite gets a usable view of this area in the window.");
  if (backup) brief.push(`Backup: ${backup.helper.sat.name} at ${fmtTime(backup.pass.maxElMs)} IST (${Math.round(backup.pass.maxEl)}° peak).`);
  for (const s of swaps.slice(0, 3)) {
    const e = s.event, tier = tierOf(e.missKm);
    brief.push(`${s.from.sat.name}: ${tier === "high" ? "AVOID, a" : "caution, a"} ${e.missKm} km pass with ${e.debris} at ${fmtDateTime(Date.parse(e.tca))}, collision chance ${pcTxt(e)}.${tier === "high" && s.to ? ` Suggested swap: ${s.to.helper.sat.name} at ${fmtTime(s.to.pass.maxElMs)} IST.` : ""}`);
  }
  if (nv.length) brief.push(`NavIC: ${nvClear} navigation satellite(s) in view over ${scn.place} (4 are needed for a position fix). See the Rescue link tab for fix quality and dish pointing.`);
  if (cmClear) brief.push(`Emergency comms: ${cmClear} relay satellite(s) in view for rescue teams without mobile networks.`);

  return { score, parts, helpers, primary, backup, swaps, brief, startMs, endMs };
}

/** What-if: slide the satellite along its orbit by shiftSec (a tiny phasing burn made earlier) and re-measure the true closest approach. */
export function missAfterShift(e: ConjEvent, orbits: Orbits, shiftSec: number): number {
  const sat = orbits.fleet.find((f) => f.id === e.satId), deb = orbits.debris.find((d) => d.id === e.debId);
  if (!sat || !deb) return e.missKm;
  const tca = Date.parse(e.tca);
  const dist = (t: number) => {
    const a = eciAt(sat.rec, t + shiftSec * 1000), b = eciAt(deb.rec, t);
    return a && b ? Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z) : Infinity;
  };
  // coarse scan (0.5 s) to bracket the minimum, then a continuous ternary search
  let bestT = tca, best = Infinity;
  for (let t = tca - 120000; t <= tca + 120000; t += 500) { const d = dist(t); if (d < best) { best = d; bestT = t; } }
  let lo = bestT - 500, hi = bestT + 500;
  for (let i = 0; i < 40 && hi - lo > 1; i++) {
    const m1 = lo + (hi - lo) / 3, m2 = hi - (hi - lo) / 3;
    if (dist(m1) < dist(m2)) hi = m2; else lo = m1;
  }
  const out = dist((lo + hi) / 2);
  return Number.isFinite(out) ? out : e.missKm;
}

export { fmtDur };
