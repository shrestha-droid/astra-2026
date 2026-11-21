import Link from "next/link";
import Galaxy from "@/components/Galaxy";
import BlurText from "@/components/BlurText";
import ShinyText from "@/components/ShinyText";
import StarBorder from "@/components/StarBorder";
import CountUp from "@/components/CountUp";
import conj from "../../public/data/conjunctions.json";
import { BRAND } from "@/lib/brand";

const IST = "Asia/Kolkata";
const when = (iso: string) =>
  new Intl.DateTimeFormat("en-IN", { timeZone: IST, day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(iso));

const events = [...conj.events].sort((a, b) => a.missKm - b.missKm);
const nearest = events[0];
const fromBigThree = events.filter((e) => /FENGYUN 1C|COSMOS 2251|IRIDIUM 33/.test(e.debris)).length;
const tier = (km: number) => (km < 1 ? { n: "High", c: "#ff5d6c" } : km < 5 ? { n: "Elevated", c: "#ffc857" } : { n: "Watch", c: "#7aa7ff" });
const oneIn = (pc: number) => (1 / pc >= 1e7 ? "< 1 in 10 million" : "1 in " + Math.max(1, Math.round(1 / pc)).toLocaleString("en-US"));

const steps = [
  { n: "01", t: "Choose the disaster", d: "Six what-if scenarios on today's orbits: two cyclones, Assam floods, Wayanad landslides, a glacial lake outburst, an island earthquake. Pick one and set the clock.", tag: "Domain 03" },
  { n: "02", t: "Find who can help", d: "For the next 24 hours: radar and optical passes (radar when cloud is the problem), INSAT weather imagers, NavIC satellite geometry, and the relay satellite a rescue team should point a dish at.", tag: "Domains 02, 04" },
  { n: "03", t: "Check they are safe", d: "Each helper is tested against fresh debris tracks. A pass under 1 km near the imaging window means swap it. 1 to 5 km, keep it and watch it. Slide the satellite along its orbit and see the gap open.", tag: "Domain 06" },
];

export default function Home() {
  return (
    <>
      <div className="guides" aria-hidden><div><span /><span /><span /></div></div>

      <header className="fixed inset-x-0 top-0 z-30 flex items-baseline justify-between bg-gradient-to-b from-[#03050a]/95 via-[#03050a]/70 to-transparent px-[var(--inset)] pb-6 pt-5">
        <span className="serif text-xl">{BRAND.name}</span>
        <nav className="flex gap-6">
          <a className="navlink hidden sm:inline" href="#question">The question</a>
          <a className="navlink hidden sm:inline" href="#ledger">Near-misses</a>
          <a className="navlink hidden sm:inline" href="#method">Method</a>
          <Link className="navlink !text-[var(--orange)]" href="/mission">Mission control →</Link>
        </nav>
      </header>

      {/* HERO */}
      <section className="relative isolate flex min-h-svh items-end overflow-hidden">
        <div className="absolute inset-0 -z-10 opacity-70">
          <Galaxy density={0.7} glowIntensity={0.25} saturation={0.4} hueShift={215} twinkleIntensity={0.35} rotationSpeed={0.015} speed={0.5} mouseRepulsion={false} />
        </div>
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#03050a] via-[#03050a]/20 to-[#03050a]/50" />
        <div className="mx-auto w-full max-w-[var(--maxw)] px-[var(--inset)] pb-20 pt-40">
          <p className="label mb-8"><ShinyText text={`${BRAND.event} · Team ${BRAND.teamNo} · ${BRAND.team}`} speed={5} /></p>
          <BlurText text="Satellites protect India in a disaster." animateBy="words" trigger="load" delay={90} className="display max-w-[15ch]" />
          <p className="display mt-1 text-[var(--orange)] italic">We protect the satellites.</p>
          <p className="mono mt-12 max-w-[64ch] text-[13px] leading-relaxed text-[var(--ink-muted)]">
            Orbit data of {when(conj.windowStart)} IST. <span className="text-[var(--fg)]"><CountUp to={conj.nSats} duration={1.2} /></span> Indian satellites
            checked against <span className="text-[var(--fg)]"><CountUp to={conj.nDebris} separator="," duration={1.4} /></span> tracked debris fragments.{" "}
            <span className="text-[var(--fg)]">{events.length}</span> close approaches under 10 km in the next 72 hours; the nearest is{" "}
            <span className="text-[var(--orange)]">{nearest.missKm} km</span>.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-6">
            <StarBorder as="a" href="/mission" color="#ff8a3d" duration={5} radius={2} className="text-sm">
              Open mission control
            </StarBorder>
            <a className="navlink underline underline-offset-4" href="#method">How it works</a>
          </div>
        </div>
      </section>

      <main className="relative z-10 mx-auto max-w-[var(--maxw)] px-[var(--inset)]">
        {/* THE QUESTION */}
        <section id="question" className="grid gap-12 py-32 md:grid-cols-[5fr_6fr] md:gap-20">
          <div>
            <p className="label mb-5">The question</p>
            <h2 className="serif text-[clamp(2.4rem,4.6vw,4.4rem)] leading-[1.02]">Overhead, and unharmed, at the hour we need them?</h2>
          </div>
          <div className="divide-y divide-[var(--rule)] border-y border-[var(--rule)]">
            {[
              ["Problem", "After a cyclone or flood, emergency teams work from a short list of satellites: radar that sees through cloud, weather imagers, NavIC for positions, relays when towers are down. Nothing tells them which of those will pass over the affected area in the next day, or whether one is about to have a near-miss with debris."],
              ["Context", `Low Earth orbit still holds the wreckage of the 2007 Fengyun-1C anti-satellite test and the 2009 Iridium–Cosmos collision. Their fragments account for ${fromBigThree} of the ${events.length} close approaches we found for India's fleet.`],
              ["Who it is for", "Disaster managers choosing where to point a satellite. Operators deciding whether a pass is worth a manoeuvre. Rescue teams who need a position fix and a working relay when mobile networks are down."],
            ].map(([k, v]) => (
              <div key={k} className="grid gap-3 py-7 sm:grid-cols-[8rem_1fr]">
                <p className="label pt-1 !text-[var(--orange)]">{k}</p>
                <p className="text-[15px] leading-[1.75] text-white/80">{v}</p>
              </div>
            ))}
          </div>
        </section>

        {/* LEDGER: real data */}
        <section id="ledger" className="pb-32">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="label mb-4">From the screening run</p>
              <h2 className="serif text-[clamp(2.2rem,4vw,3.8rem)] leading-none">The next 72 hours, closest first</h2>
            </div>
            <p className="mono max-w-[38ch] text-[11px] leading-relaxed text-[var(--ink-muted)]">
              {conj.pairsScreened.toLocaleString("en-IN")} satellite–debris pairs. Orbit elements median {conj.dataAgeDays.debrisMedian} days old, source CelesTrak. Collision chances are illustrative.
            </p>
          </div>
          <div className="mono overflow-x-auto text-[12px]">
            <div className="min-w-[640px]">
              <div className="grid grid-cols-[1.6fr_1.6fr_.7fr_1fr_.8fr_.9fr] gap-4 border-b border-white/25 pb-2 text-[10px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                <span>Satellite</span><span>Debris</span><span className="text-right">Miss</span><span>Closest at (IST)</span><span className="text-right">Speed</span><span className="text-right">Chance</span>
              </div>
              {events.slice(0, 8).map((e) => {
                const t = tier(e.missKm);
                return (
                  <div key={e.satId + "-" + e.debId + e.tca} className="grid grid-cols-[1.6fr_1.6fr_.7fr_1fr_.8fr_.9fr] gap-4 border-b border-[var(--rule)] py-3">
                    <span className="truncate text-[var(--fg)]">{e.sat}</span>
                    <span className="truncate text-white/60">{e.debris}</span>
                    <span className="text-right" style={{ color: t.c }}>{e.missKm.toFixed(2)} km</span>
                    <span className="text-white/70">{when(e.tca)}</span>
                    <span className="text-right text-white/60">{e.relKms.toFixed(1)} km/s</span>
                    <span className="text-right text-white/60">{oneIn(e.pc)}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <p className="mono mt-4 text-[11px] text-[var(--ink-muted)]">
            High under 1 km · Elevated 1 to 5 km · Watch 5 to 10 km. {events.length - 8} more in <Link href="/mission" className="underline underline-offset-4 hover:text-white">mission control</Link>.
          </p>
        </section>

        {/* METHOD */}
        <section id="method" className="border-t border-[var(--rule)] py-32">
          <p className="label mb-5">Method</p>
          <h2 className="serif max-w-[18ch] text-[clamp(2.4rem,4.6vw,4.4rem)] leading-[1.02]">Disaster, then helpers, then a safety check.</h2>
          <ol className="mt-14 divide-y divide-[var(--rule)] border-y border-[var(--rule)]">
            {steps.map((s) => (
              <li key={s.n} className="grid gap-4 py-8 md:grid-cols-[6rem_1fr_2fr_8rem] md:items-baseline md:gap-8">
                <span className="mono text-[var(--orange)]">{s.n}</span>
                <h3 className="serif text-3xl leading-tight">{s.t}</h3>
                <p className="text-[15px] leading-[1.75] text-white/75">{s.d}</p>
                <span className="label md:text-right">{s.tag}</span>
              </li>
            ))}
          </ol>
        </section>

        {/* BUILT ON / LIMITS */}
        <section className="grid gap-14 border-t border-[var(--rule)] py-24 md:grid-cols-2">
          <div>
            <p className="label mb-5">Built on</p>
            <ul className="space-y-3 text-[15px] leading-relaxed text-white/75">
              <li>Orbit elements from CelesTrak (NORAD data). Anything older than 14 days is rejected, and failed satellites are removed.</li>
              <li>SGP4 propagation. The true closest approach is found by continuous search, not coarse sampling.</li>
              <li>The latest INSAT-3DS infrared image, fetched from ISRO&apos;s MOSDAC portal.</li>
              <li>NavIC position-fix geometry (PDOP) and relay-dish pointing for rescue teams.</li>
            </ul>
          </div>
          <div>
            <p className="label mb-5">What we do not claim</p>
            <ul className="space-y-3 text-[15px] leading-relaxed text-white/75">
              <li>Public orbit data is good to about a kilometre. This is an early-warning screen, not a collision call.</li>
              <li>The chances shown assume a 1.5 km position error and a 15 m combined size. They are illustrative.</li>
              <li>Satellite status comes from public catalogues plus a short list of known failures, not from ISRO.</li>
              <li>The scenarios are what-ifs on current orbits, not live disaster reports.</li>
            </ul>
          </div>
        </section>

        <footer className="mono flex flex-wrap justify-between gap-3 border-t border-[var(--rule)] py-8 text-[11px] uppercase tracking-[0.12em] text-[var(--ink-muted)]">
          <span>{BRAND.team} · Team {BRAND.teamNo}</span>
          <span>{BRAND.event}</span>
        </footer>
      </main>
    </>
  );
}
