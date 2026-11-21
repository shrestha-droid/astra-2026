import { ConjEvent, Conjunctions, FleetSat, Orbits, Role, elevationDeg, fmtDateTime, fmtDur, fmtTime, eciAt } from "./orbits";
import type { Scenario } from "./scenarios";

export type Tier = "high" | "elevated" | "watch";
export const tierOf = (missKm: number): Tier => (missKm < 3 ? "high" : missKm < 6 ? "elevated" : "watch");
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
  status: "clear" | "watch" | "conflict";
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
const an = (w: string) => (/^[aeiou]/i.test(w) ? "an " : "a ") + w;
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

    let conflict: ConjEvent | undefined;
    for (const e of events) {
      if (tierOf(e.missKm) === "watch") continue;
      const tca = Date.parse(e.tca);
      const near = sat.geo || passes.some((p) => tca >= p.startMs - 3 * HOUR && tca <= p.endMs + 3 * HOUR);
      if (near && (!conflict || e.missKm < conflict.missKm)) conflict = e;
    }
    helpers.push({
      sat, passes, visibleFraction: vis / Math.max(n, 1),
      elNow: elevationDeg(sat.rec, startMs, scn.lat, scn.lon),
      events, conflict, status: conflict ? "conflict" : events.length ? "watch" : "clear",
      suitable: radarSuited(scn.hazard, sat.sensor),
    });
  }

  const by = (r: Role) => helpers.filter((h) => h.sat.role === r);
  const covering = (h: HelperReport) => (h.sat.role === "eo" ? h.passes.length > 0 : h.visibleFraction > 0.5);

  // ---- score
  const eo = by("eo").filter(covering);
  const clearPasses = eo.filter((h) => h.status !== "conflict").flatMap((h) => h.passes.map((p) => ({ h, p })));
  const flaggedPasses = eo.filter((h) => h.status === "conflict").reduce((a, h) => a + h.passes.length, 0);
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
    { key: "eo", label: "Imaging passes", value: imaging, max: 40, detail: Number.isFinite(firstH) ? `first clear ${goodClear.length ? "" : "(non-ideal sensor) "}pass in ${firstH < 1 ? Math.round(firstH * 60) + " min" : firstH.toFixed(1) + " h"}; ${goodClear.length} suitable clear, ${flaggedPasses} flagged` : "no clear imaging pass in the window" },
    { key: "weather", label: "Weather watch", value: weather, max: 20, detail: `${wxClear} of ${wx.length} covering weather satellites clear` },
    { key: "comm", label: "Emergency comms", value: comms, max: 20, detail: `${cmClear} of ${cm.length} covering relay satellites clear` },
    { key: "nav", label: "NavIC positioning", value: nav, max: 20, detail: `${nvClear} of ${nv.length} navigation satellites in view and clear` },
  ];
  const score = parts.reduce((a, p) => a + p.value, 0);

  // ---- picks: clear first, then right sensor for the hazard, then earliest
  const allPasses: Pick[] = [];
  for (const h of by("eo")) for (const p of h.passes) allPasses.push({ helper: h, pass: p, clear: h.status !== "conflict" });
  const rank = (a: Pick, b: Pick) =>
    Number(b.clear) - Number(a.clear) || Number(b.helper.suitable) - Number(a.helper.suitable) || a.pass.startMs - b.pass.startMs;
  const sorted = [...allPasses].sort(rank);
  const primary = sorted[0];
  const backup = sorted.find((p) => p.helper.sat.id !== primary?.helper.sat.id);

  const swaps = helpers
    .filter((h) => h.status === "conflict" && h.conflict)
    .map((h) => ({
      from: h, event: h.conflict!,
      to: sorted.find((p) => p.clear && p.helper.sat.id !== h.sat.id && (h.sat.role !== "eo" || p.helper.suitable)),
    }));

  // ---- plain-English brief
  const brief: string[] = [];
  brief.push(`If a ${scn.hazard.toLowerCase()} hits ${scn.place} in the next ${horizonH} hours, India's fleet is ${score >= 75 ? "well" : score >= 50 ? "partly" : "poorly"} placed to respond (readiness ${score}/100).`);
  if (primary) {
    brief.push(`Best imaging: ${primary.helper.sat.name}, ${lc(primary.helper.sat.sensor)}, passes overhead at ${fmtTime(primary.pass.maxElMs)} IST, peaking at ${Math.round(primary.pass.maxEl)}° elevation.${primary.clear ? " No close approach is flagged around that pass." : " A close approach is flagged near that pass, so check with the operator."}`);
  } else brief.push("No imaging satellite gets a good view of this area in the window.");
  if (backup) brief.push(`Backup: ${backup.helper.sat.name} at ${fmtTime(backup.pass.maxElMs)} IST (${Math.round(backup.pass.maxEl)}° peak).`);
  for (const s of swaps.slice(0, 3)) {
    const e = s.event;
    brief.push(`${s.from.sat.name} has ${an(TIER_META[tierOf(e.missKm)].label.toLowerCase())} close approach with ${e.debris} (${e.missKm} km) at ${fmtDateTime(Date.parse(e.tca))}.${s.to ? ` Suggested swap: ${s.to.helper.sat.name} at ${fmtTime(s.to.pass.maxElMs)} IST.` : ""}`);
  }
  if (nv.length) brief.push(`NavIC: ${nvClear} navigation satellite(s) in clear view over ${scn.place} (4 are needed for a position fix).`);
  if (cmClear) brief.push(`Emergency comms: ${cmClear} relay satellite(s) in clear view for rescue teams without mobile networks.`);

  return { score, parts, helpers, primary, backup, swaps, brief, startMs, endMs };
}

/** What-if: slide the satellite along its orbit by shiftSec (a tiny phasing burn made earlier) and re-measure the miss distance. */
export function missAfterShift(e: ConjEvent, orbits: Orbits, shiftSec: number): number {
  const sat = orbits.fleet.find((f) => f.id === e.satId), deb = orbits.debris.find((d) => d.id === e.debId);
  if (!sat || !deb) return e.missKm;
  const tca = Date.parse(e.tca);
  let best = Infinity;
  for (let s = -90; s <= 90; s++) {
    const t = tca + s * 1000;
    const a = eciAt(sat.rec, t + shiftSec * 1000), b = eciAt(deb.rec, t);
    if (!a || !b) continue;
    const d = Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
    if (d < best) best = d;
  }
  return Number.isFinite(best) ? best : e.missKm;
}

export { fmtDur };
