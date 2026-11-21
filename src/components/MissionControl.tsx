"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity, ArrowLeft, CloudSun, Crosshair, Flame, Info, Mountain, Navigation, Pause, Play, Radio,
  RotateCcw, ScanEye, ShieldAlert, ShieldCheck, Waves, Wind,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CountUp from "@/components/CountUp";
import ShinyText from "@/components/ShinyText";
import { BRAND } from "@/lib/brand";
import {
  ConjEvent, Conjunctions, Orbits, ROLE_META, Role, fmtDateTime, fmtDur, fmtTime, loadAll,
} from "@/lib/orbits";
import { HelperReport, Readiness, TIER_META, assess, missAfterShift, tierOf } from "@/lib/readiness";
import { SCENARIOS, Scenario } from "@/lib/scenarios";
import { cn } from "@/lib/utils";

const Globe = dynamic(() => import("@/components/Globe"), { ssr: false });

const HOUR = 3600_000;
const HAZARD_ICON = { Cyclone: Wind, Flood: Waves, Landslide: Mountain, Wildfire: Flame, Earthquake: Activity } as const;
const ROLE_ICON: Record<Role, typeof Radio> = { eo: ScanEye, weather: CloudSun, comm: Radio, nav: Navigation, science: Info };
const SPEEDS = [{ l: "1×", v: 1 }, { l: "1 min/s", v: 60 }, { l: "10 min/s", v: 600 }, { l: "1 h/s", v: 3600 }];
const evKey = (e: ConjEvent) => `${e.satId}-${e.debId}-${e.tca}`;

export default function MissionControl() {
  const [data, setData] = useState<{ orbits: Orbits; conj: Conjunctions } | null>(null);
  const [scenario, setScenario] = useState<Scenario>(SCENARIOS[0]);
  const [eventStart, setEventStart] = useState<number | null>(null);
  const [simMs, setSimMs] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(60);
  const [selSat, setSelSat] = useState<number | null>(null);
  const [selEvent, setSelEvent] = useState<ConjEvent | null>(null);
  const [shift, setShift] = useState(0);
  const [tab, setTab] = useState("brief");
  const [show, setShow] = useState({ debris: true, orbit: true, beams: true });

  const simRef = useRef(0), playingRef = useRef(true), speedRef = useRef(60);
  useEffect(() => { playingRef.current = playing; }, [playing]);
  useEffect(() => { speedRef.current = speed; }, [speed]);

  useEffect(() => {
    loadAll().then((d) => {
      const start = Date.parse(d.conj.windowStart), end = start + d.conj.windowHours * HOUR;
      const now = Math.min(Math.max(Date.now(), start + 30 * 60000), end - 26 * HOUR);
      simRef.current = now; setSimMs(now); setEventStart(now); setData(d);
    });
  }, []);

  const range = useMemo(() => {
    if (!data) return { start: 0, end: 1 };
    const s = Date.parse(data.conj.windowStart);
    return { start: s, end: s + data.conj.windowHours * HOUR };
  }, [data]);

  const readiness: Readiness | null = useMemo(
    () => (data && eventStart ? assess(scenario, eventStart, 24, data.orbits, data.conj) : null),
    [data, scenario, eventStart],
  );

  const onTick = useCallback((ms: number) => setSimMs(ms), []);
  const scrub = (ms: number) => { simRef.current = ms; setSimMs(ms); };

  const pickScenario = (s: Scenario) => { setScenario(s); setEventStart(simRef.current); setSelEvent(null); setSelSat(null); };
  const jumpToEvent = (e: ConjEvent) => {
    setSelEvent(e); setSelSat(e.satId); setShift(0);
    scrub(Math.max(range.start, Date.parse(e.tca) - 4 * 60000)); setPlaying(false);
  };

  const events = useMemo(() => {
    if (!data) return [] as ConjEvent[];
    const roles = new Set<Role>(["eo", "weather", "comm", "nav"]);
    return data.conj.events.filter((e) => roles.has(e.role)).sort((a, b) => Date.parse(a.tca) - Date.parse(b.tca));
  }, [data]);

  if (!data || !readiness) {
    return (
      <div className="grid min-h-svh place-items-center">
        <ShinyText text="Loading orbits…" className="text-lg" speed={3} />
      </div>
    );
  }

  const { orbits, conj } = data;
  const selectedHelper = readiness.helpers.find((h) => h.sat.id === selSat);

  return (
    <div className="relative h-svh w-full overflow-hidden">
      {/* 3D world */}
      <div className="absolute inset-0">
        <Globe
          orbits={orbits} simRef={simRef} playingRef={playingRef} speedRef={speedRef} range={range} onTick={onTick}
          scenario={scenario} readiness={readiness} selectedSatId={selSat} onSelectSat={setSelSat}
          selectedEvent={selEvent} show={show}
        />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(3,5,10,0.75)_100%)]" />

      {/* top bar */}
      <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-3 px-4 py-3 lg:px-6">
        <div className="glass flex items-center gap-3 rounded-full px-3 py-1.5">
          <Link href="/" aria-label="Back to home" className="grid size-7 place-items-center rounded-full bg-white/10 hover:bg-white/20">
            <ArrowLeft className="size-4" />
          </Link>
          <div className="leading-tight">
            <div className="text-sm font-light tracking-wide">{BRAND.name}</div>
            <div className="label hidden !text-[10px] sm:block">Disaster-readiness of India&apos;s satellites</div>
          </div>
        </div>
        <div className="glass hidden items-center gap-3 rounded-full px-4 py-2 text-xs md:flex">
          <span className="size-2 animate-pulse rounded-full bg-emerald-400" />
          <span className="tabular-nums">{fmtDateTime(simMs)}</span>
          <span className="text-white/40">|</span>
          <span className="text-white/60">orbit data {fmtDateTime(Date.parse(orbits.fetchedAt))} · works offline</span>
        </div>
      </header>

      {/* panels */}
      <div className="absolute inset-x-0 bottom-0 top-14 z-10 flex flex-col gap-3 overflow-y-auto px-3 pb-24 lg:flex-row lg:justify-between lg:overflow-hidden lg:px-5 lg:pb-24" style={{ paddingBottom: undefined }}>
        <div className="h-[46svh] shrink-0 lg:hidden" />

        {/* LEFT */}
        <aside className="panel scroll-thin w-full shrink-0 space-y-4 overflow-y-auto p-4 lg:w-[340px]">
          <div>
            <p className="label mb-2">1 · Pick a disaster</p>
            <div className="grid grid-cols-2 gap-1.5">
              {SCENARIOS.map((s) => {
                const Icon = HAZARD_ICON[s.hazard]; const on = s.id === scenario.id;
                return (
                  <button key={s.id} onClick={() => pickScenario(s)} title={s.name}
                    className={cn("flex items-center gap-2 rounded-xl border px-2 py-2 text-left transition",
                      on ? "border-orange-400/70 bg-orange-400/10" : "border-white/10 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.07]")}>
                    <span className={cn("grid size-7 shrink-0 place-items-center rounded-lg", on ? "bg-orange-400 text-black" : "bg-white/10")}>
                      <Icon className="size-3.5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-xs font-normal leading-tight">{s.name}</span>
                      <span className="block truncate text-[11px] leading-tight text-white/50">{s.place}</span>
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-xs leading-relaxed text-white/50">{scenario.needs}</p>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="label">2 · Readiness (next 24 h)</p>
              <Button size="xs" variant="ghost" onClick={() => setEventStart(simRef.current)} title="Run the report from the current clock time">
                <RotateCcw /> from {fmtTime(simMs)}
              </Button>
            </div>
            <Ring score={readiness.score} />
            <div className="mt-3 space-y-2.5">
              {readiness.parts.map((p) => (
                <div key={p.label}>
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="font-normal">{p.label}</span>
                    <span className="tabular-nums text-white/60">{p.value}/{p.max}</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${(p.value / p.max) * 100}%`, background: ROLE_META[p.key as Role]?.color ?? "#fff" }} />
                  </div>
                  <p className="mt-0.5 text-[11px] leading-snug text-white/45">{p.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <div className="hidden min-w-0 flex-1 lg:block" />

        {/* RIGHT */}
        <aside className="panel scroll-thin flex w-full shrink-0 flex-col overflow-hidden p-4 lg:w-[400px]">
          <Tabs value={tab} onValueChange={setTab} className="flex min-h-0 flex-1 flex-col">
            <TabsList className="grid w-full grid-cols-3 bg-white/5">
              <TabsTrigger value="brief">Brief</TabsTrigger>
              <TabsTrigger value="helpers">Helpers</TabsTrigger>
              <TabsTrigger value="close">Close calls</TabsTrigger>
            </TabsList>

            <TabsContent value="brief" className="scroll-thin mt-3 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
              <p className="label">Event {fmtDateTime(readiness.startMs)} → +24 h</p>
              {readiness.brief.map((b, i) => (
                <p key={i} className={cn("text-[13px] leading-relaxed", i === 0 ? "font-normal text-white" : "text-white/75")}>{b}</p>
              ))}
              {readiness.swaps.length > 0 && (
                <div className="rounded-xl border border-amber-300/25 bg-amber-300/5 p-3 text-xs leading-relaxed text-amber-100/90">
                  <ShieldAlert className="mb-1 size-4 text-amber-300" />
                  Flagged satellites are screened from public data. Operators should confirm with precise tracking before acting.
                </div>
              )}
            </TabsContent>

            <TabsContent value="helpers" className="scroll-thin mt-3 min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
              {(["eo", "weather", "comm", "nav"] as Role[]).map((r) => {
                const list = readiness.helpers.filter((h) => h.sat.role === r)
                  .filter((h) => (r === "eo" ? h.passes.length > 0 : h.visibleFraction > 0.5));
                if (!list.length) return null;
                const Icon = ROLE_ICON[r];
                return (
                  <div key={r}>
                    <p className="label mb-1.5 flex items-center gap-1.5" style={{ color: ROLE_META[r].color }}>
                      <Icon className="size-3.5" /> {ROLE_META[r].plural} · {list.length}
                    </p>
                    <div className="space-y-1.5">
                      {list.map((h) => <HelperRow key={h.sat.id} h={h} startMs={readiness.startMs} active={h.sat.id === selSat} onClick={() => setSelSat(h.sat.id)} />)}
                    </div>
                  </div>
                );
              })}
            </TabsContent>

            <TabsContent value="close" className="scroll-thin mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
              <p className="text-xs leading-relaxed text-white/55">
                {events.length} close approaches under {conj.keepKm} km in the next {conj.windowHours} h, from {conj.pairsScreened.toLocaleString("en-IN")} satellite–debris pairs.
              </p>
              {events.map((e) => {
                const on = selEvent && evKey(selEvent) === evKey(e); const t = TIER_META[tierOf(e.missKm)];
                return (
                  <div key={evKey(e)} className={cn("rounded-xl border p-2.5 transition", on ? "border-white/40 bg-white/10" : "border-white/10 bg-white/[0.03] hover:border-white/25")}>
                    <button className="w-full text-left" onClick={() => jumpToEvent(e)}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-[13px] font-normal">{e.sat}</span>
                        <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-normal tracking-wide" style={{ background: t.color + "26", color: t.color }}>
                          {t.label} · {e.missKm} km
                        </span>
                      </div>
                      <div className="mt-0.5 truncate text-xs text-white/55">× {e.debris}</div>
                      <div className="mt-0.5 text-[11px] text-white/40">{fmtDateTime(Date.parse(e.tca))} · closing at {e.relKms} km/s</div>
                    </button>
                    {on && (
                      <div className="mt-3 border-t border-white/10 pt-3">
                        <p className="label mb-2">What if we nudge it?</p>
                        <Slider value={[shift]} min={0} max={60} step={1} onValueChange={(v) => setShift(v[0])} />
                        <p className="mt-2 text-xs leading-relaxed text-white/70">
                          {shift === 0
                            ? <>Drag to slide <span className="text-white">{e.sat}</span> along its orbit and watch the miss distance change.</>
                            : <>Moved {shift}s along track: miss distance <span className="text-white">{e.missKm} km</span> →{" "}
                              <span className="font-normal text-emerald-300">{missAfterShift(e, orbits, shift).toFixed(1)} km</span></>}
                        </p>
                        <p className="mt-1 text-[11px] leading-snug text-white/40">Illustrative along-track phasing, not a flight-dynamics plan.</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </TabsContent>
          </Tabs>
        </aside>
      </div>

      {/* bottom controls */}
      <footer className="absolute inset-x-0 bottom-0 z-20 flex flex-col items-center gap-2 px-3 pb-3 lg:px-6">
        <div className="panel flex w-full max-w-4xl flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl px-4 py-2.5">
          <Button size="icon-sm" variant="secondary" onClick={() => setPlaying((p) => !p)} aria-label={playing ? "Pause" : "Play"}>
            {playing ? <Pause /> : <Play />}
          </Button>
          <div className="hidden gap-1 sm:flex">
            {SPEEDS.map((s) => (
              <button key={s.v} onClick={() => setSpeed(s.v)}
                className={cn("rounded-full px-2.5 py-1 text-[11px] transition", speed === s.v ? "bg-white text-black" : "bg-white/10 text-white/70 hover:bg-white/20")}>
                {s.l}
              </button>
            ))}
          </div>
          <div className="min-w-[160px] flex-1">
            <Slider value={[simMs]} min={range.start} max={range.end} step={60000} onValueChange={(v) => scrub(v[0])} aria-label="Time" />
          </div>
          <div className="hidden items-center gap-3 text-[11px] text-white/70 sm:flex">
            {([["debris", "Debris"], ["orbit", "Orbit"], ["beams", "Beams"]] as const).map(([k, l]) => (
              <label key={k} className="flex cursor-pointer items-center gap-1.5">
                <Switch size="sm" checked={show[k]} onCheckedChange={(c) => setShow((s) => ({ ...s, [k]: c }))} /> {l}
              </label>
            ))}
          </div>
        </div>
        <div className="hidden flex-wrap justify-center gap-x-4 gap-y-1 text-[11px] text-white/60 sm:flex">
          {(["eo", "weather", "comm", "nav"] as Role[]).map((r) => (
            <span key={r} className="flex items-center gap-1.5"><i className="size-2 rounded-full" style={{ background: ROLE_META[r].color }} />{ROLE_META[r].label}</span>
          ))}
          <span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-slate-400/60" />Debris</span>
          <span className="flex items-center gap-1.5"><Crosshair className="size-3 text-orange-300" />Disaster zone</span>
          {selectedHelper && <span className="text-white/80">Selected: {selectedHelper.sat.name}</span>}
        </div>
      </footer>
    </div>
  );
}

function Ring({ score }: { score: number }) {
  const c = score >= 80 ? "#5eead4" : score >= 55 ? "#ffc857" : "#ff5d6c";
  const r = 46, L = 2 * Math.PI * r;
  return (
    <div className="flex items-center gap-4">
      <div className="relative size-28 shrink-0">
        <svg viewBox="0 0 110 110" className="size-full -rotate-90">
          <circle cx="55" cy="55" r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="7" />
          <circle cx="55" cy="55" r={r} fill="none" stroke={c} strokeWidth="7" strokeLinecap="round"
            strokeDasharray={L} strokeDashoffset={L * (1 - score / 100)} style={{ transition: "stroke-dashoffset 900ms cubic-bezier(.16,1,.3,1), stroke 400ms" }} />
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <div className="text-center leading-none">
            <CountUp key={score} to={score} duration={1.1} trigger="load" className="text-3xl font-extralight" />
            <div className="label mt-1 !text-[10px]">/ 100</div>
          </div>
        </div>
      </div>
      <p className="text-xs leading-relaxed text-white/60">
        How well India&apos;s satellites can see, reach and guide a response here — counting only satellites with no flagged close call.
      </p>
    </div>
  );
}

const dayKey = (ms: number) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date(ms));
const dayTag = (ms: number, start: number) => (dayKey(ms) === dayKey(start) ? "" : " +1d");

function HelperRow({ h, active, onClick, startMs }: { h: HelperReport; active: boolean; onClick: () => void; startMs: number }) {
  const flagged = h.status === "conflict", watch = h.status === "watch";
  const next = h.passes[0];
  const Icon = flagged ? ShieldAlert : ShieldCheck;
  return (
    <button onClick={onClick}
      className={cn("flex w-full items-center gap-2.5 rounded-xl border px-2.5 py-2 text-left transition",
        active ? "border-white/40 bg-white/10" : "border-white/10 bg-white/[0.03] hover:border-white/25")}>
      <Icon className="size-4 shrink-0" style={{ color: flagged ? "#ff5d6c" : watch ? "#ffc857" : "#5eead4" }} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-normal">{h.sat.name}</span>
        <span className="block truncate text-[11px] text-white/50">{h.sat.sensor}</span>
      </span>
      <span className="shrink-0 text-right text-[11px] leading-tight text-white/60">
        {h.sat.role === "eo" && next ? (<>{fmtTime(next.maxElMs)}{dayTag(next.maxElMs, startMs)}<br />{Math.round(next.maxEl)}° peak</>)
          : (<>{Math.round(h.visibleFraction * 100)}% in view<br />{h.elNow !== null ? Math.round(h.elNow) + "° now" : ""}</>)}
      </span>
    </button>
  );
}

export { fmtDur };
