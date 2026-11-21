import * as sat from "satellite.js";

export type Role = "nav" | "weather" | "comm" | "eo" | "science";
export type SatRec = ReturnType<typeof sat.twoline2satrec>;

export interface FleetSat {
  id: number; name: string; role: Role; sensor: string; launchYear: number;
  l1: string; l2: string; epoch: string; rec: SatRec; geo: boolean;
}
export interface Debris { id: number; name: string; l1: string; l2: string; rec: SatRec }
export interface Orbits {
  fleet: FleetSat[]; debris: Debris[]; fetchedAt: string; source: string;
  maxAgeDays: number; warnings: string[];
  stats: { debrisSeen: number; debrisKept: number; debrisDroppedStale: number; debrisMedianAgeDaysBeforeFilter: number; fleetKept: number };
}

export interface ConjEvent {
  satId: number; sat: string; role: Role; debId: number; debris: string;
  tca: string; missKm: number; relKms: number; pc: number; score: number;
}
export interface Conjunctions {
  generatedAt: string; windowStart: string; windowHours: number; stepSec: number;
  keepKm: number; method: string; pairsScreened: number; nSats: number; nDebris: number; events: ConjEvent[];
  fresh: boolean; source: string; dataAgeDays: { debrisMedian: number; fleetMedian: number };
  assumptions: { sigmaKm: number; hardBodyKm: number; note: string };
}

export const ROLE_META: Record<Role, { label: string; color: string; plural: string }> = {
  eo: { label: "Imaging", plural: "Imaging satellites", color: "#ff8a3d" },
  weather: { label: "Weather", plural: "Weather satellites", color: "#7aa7ff" },
  comm: { label: "Comms", plural: "Communication satellites", color: "#c4a1ff" },
  nav: { label: "NavIC", plural: "NavIC navigation", color: "#5eead4" },
  science: { label: "Science", plural: "Science missions", color: "#9aa4b8" },
};

type RawSat = Omit<FleetSat, "rec" | "geo">;
type RawDebris = Omit<Debris, "rec">;

export const RE = 6371; // km, scene scale 1 unit = 1000 km

/** Mean motion (rev/day) < 2 means a deep-space / geosynchronous-type orbit. */
function isGeo(l2: string) { return parseFloat(l2.slice(52, 63)) < 2.5; }

let cache: Promise<{ orbits: Orbits; conj: Conjunctions }> | null = null;

export function loadAll() {
  if (!cache) {
    cache = (async () => {
      const [o, c] = await Promise.all([
        fetch("/data/orbits.json").then((r) => r.json()),
        fetch("/data/conjunctions.json").then((r) => r.json()),
      ]);
      const fleet: FleetSat[] = (o.fleet as RawSat[]).map((f) => ({
        ...f, rec: sat.twoline2satrec(f.l1, f.l2), geo: isGeo(f.l2),
      }));
      const debris: Debris[] = (o.debris as RawDebris[]).map((d) => ({ ...d, rec: sat.twoline2satrec(d.l1, d.l2) }));
      return {
        orbits: { fleet, debris, fetchedAt: o.fetchedAt, source: o.source, maxAgeDays: o.maxAgeDays ?? 14, warnings: o.warnings ?? [], stats: o.stats } as Orbits,
        conj: c as Conjunctions,
      };
    })();
  }
  return cache;
}

export function eciAt(rec: SatRec, ms: number): { x: number; y: number; z: number } | null {
  const pv = sat.propagate(rec, new Date(ms));
  if (!pv || !pv.position || Number.isNaN(pv.position.x)) return null;
  return pv.position;
}

/** ECI (km) -> three.js scene units: (x, z, -y) / 1000 */
export function toScene(p: { x: number; y: number; z: number }, out: [number, number, number] = [0, 0, 0]) {
  out[0] = p.x / 1000; out[1] = p.z / 1000; out[2] = -p.y / 1000;
  return out;
}

export function gmstAt(ms: number) { return sat.gstime(new Date(ms)); }

/** Lat/lon (deg) on Earth surface -> unit vector in scene ECEF frame (rotate with the Earth group). */
export function latLonToScene(latDeg: number, lonDeg: number, r = 1): [number, number, number] {
  const la = (latDeg * Math.PI) / 180, lo = (lonDeg * Math.PI) / 180;
  return [r * Math.cos(la) * Math.cos(lo), r * Math.sin(la), -r * Math.cos(la) * Math.sin(lo)];
}

export function elevationDeg(rec: SatRec, ms: number, latDeg: number, lonDeg: number): number | null {
  const d = new Date(ms);
  const pv = sat.propagate(rec, d);
  if (!pv || !pv.position || Number.isNaN(pv.position.x)) return null;
  const ecf = sat.eciToEcf(pv.position, sat.gstime(d));
  const la = sat.ecfToLookAngles(
    { latitude: sat.degreesToRadians(latDeg), longitude: sat.degreesToRadians(lonDeg), height: 0 }, ecf,
  );
  return sat.radiansToDegrees(la.elevation);
}

/** Pointing angles (degrees) from a ground site to a satellite. */
export function lookAngles(rec: SatRec, ms: number, latDeg: number, lonDeg: number): { az: number; el: number } | null {
  const d = new Date(ms);
  const pv = sat.propagate(rec, d);
  if (!pv || !pv.position || Number.isNaN(pv.position.x)) return null;
  const la = sat.ecfToLookAngles(
    { latitude: sat.degreesToRadians(latDeg), longitude: sat.degreesToRadians(lonDeg), height: 0 },
    sat.eciToEcf(pv.position, sat.gstime(d)),
  );
  return { az: (sat.radiansToDegrees(la.azimuth) + 360) % 360, el: sat.radiansToDegrees(la.elevation) };
}

export function altitudeKm(rec: SatRec, ms: number): number | null {
  const p = eciAt(rec, ms);
  return p ? Math.hypot(p.x, p.y, p.z) - RE : null;
}

export const IST = "Asia/Kolkata";
export function fmtTime(ms: number, opts: Intl.DateTimeFormatOptions = {}) {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: IST, hour: "2-digit", minute: "2-digit", hour12: false, ...opts,
  }).format(new Date(ms));
}
export function fmtDateTime(ms: number) {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: IST, day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: false,
  }).format(new Date(ms)) + " IST";
}
export function fmtDur(ms: number) {
  const m = Math.round(Math.abs(ms) / 60000);
  const h = Math.floor(m / 60), mm = m % 60;
  return h ? `${h}h ${mm}m` : `${mm}m`;
}
