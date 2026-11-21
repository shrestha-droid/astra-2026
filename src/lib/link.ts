import { FleetSat, Orbits, lookAngles } from "./orbits";
import type { HelperReport } from "./readiness";

export interface InView { sat: FleetSat; az: number; el: number; flagged: boolean }
export interface LinkReport {
  nav: InView[];
  /** Position Dilution Of Precision from NavIC-only geometry. Lower is better. null = fewer than 4 satellites in view. */
  pdop: number | null;
  fix: "Good" | "Fair" | "Poor" | "No fix";
  relays: InView[];
}

const MIN_EL = 10;

/** 4x4 matrix inverse (Gauss-Jordan). Returns null if singular. */
function inv4(m: number[][]): number[][] | null {
  const a = m.map((r, i) => [...r, ...[0, 1, 2, 3].map((j) => (i === j ? 1 : 0))]);
  for (let c = 0; c < 4; c++) {
    let p = c;
    for (let r = c + 1; r < 4; r++) if (Math.abs(a[r][c]) > Math.abs(a[p][c])) p = r;
    if (Math.abs(a[p][c]) < 1e-12) return null;
    [a[c], a[p]] = [a[p], a[c]];
    const d = a[c][c];
    for (let k = 0; k < 8; k++) a[c][k] /= d;
    for (let r = 0; r < 4; r++) {
      if (r === c) continue;
      const f = a[r][c];
      for (let k = 0; k < 8; k++) a[r][k] -= f * a[c][k];
    }
  }
  return a.map((r) => r.slice(4));
}

/** PDOP from azimuth/elevation of the satellites in view (standard GNSS geometry: sqrt of trace of (G^T G)^-1 for the position part). */
export function pdopOf(sats: { az: number; el: number }[]): number | null {
  if (sats.length < 4) return null;
  const G = sats.map(({ az, el }) => {
    const a = (az * Math.PI) / 180, e = (el * Math.PI) / 180;
    return [-Math.cos(e) * Math.sin(a), -Math.cos(e) * Math.cos(a), -Math.sin(e), 1];
  });
  const N = [0, 1, 2, 3].map((i) => [0, 1, 2, 3].map((j) => G.reduce((s, row) => s + row[i] * row[j], 0)));
  const Q = inv4(N);
  if (!Q) return null;
  return Math.sqrt(Q[0][0] + Q[1][1] + Q[2][2]);
}

export function linkReport(orbits: Orbits, helpers: HelperReport[], lat: number, lon: number, ms: number): LinkReport {
  const flagged = new Set(helpers.filter((h) => h.status === "conflict").map((h) => h.sat.id));
  const look = (role: FleetSat["role"]) =>
    orbits.fleet
      .filter((f) => f.role === role)
      .map((sat) => {
        const la = lookAngles(sat.rec, ms, lat, lon);
        return la && la.el >= MIN_EL ? ({ sat, az: la.az, el: la.el, flagged: flagged.has(sat.id) } as InView) : null;
      })
      .filter((x): x is InView => x !== null)
      .sort((a, b) => b.el - a.el);

  const nav = look("nav");
  const usable = nav.filter((n) => !n.flagged);
  const pdop = pdopOf(usable);
  const fix = pdop === null ? "No fix" : pdop < 3 ? "Good" : pdop < 6 ? "Fair" : "Poor";
  return { nav, pdop, fix, relays: look("comm").slice(0, 6) };
}
