import Link from "next/link";
import { ArrowRight, Eye, Radio, ShieldCheck } from "lucide-react";
import Galaxy from "@/components/Galaxy";
import BlurText from "@/components/BlurText";
import ShinyText from "@/components/ShinyText";
import StarBorder from "@/components/StarBorder";
import SpotlightCard from "@/components/SpotlightCard";
import CountUp from "@/components/CountUp";
import conj from "../../public/data/conjunctions.json";
import { BRAND } from "@/lib/brand";

const steps = [
  { n: "01", icon: Eye, title: "Pick a disaster", dom: "Domain 03 · Disaster management",
    body: "Choose a cyclone, flood or landslide zone. The tool asks one question: if this happened in the next 24 hours, which satellites could help?" },
  { n: "02", icon: Radio, title: "Find the helpers", dom: "Domains 02 · 04 · Earth observation, NavIC & comms",
    body: "It lists imaging passes (radar for cloudy storms, optical for clear skies), weather satellites, NavIC positioning and relay satellites for areas with no mobile network." },
  { n: "03", icon: ShieldCheck, title: "Check they are safe", dom: "Domain 06 · Sustainable space",
    body: "Every helper is screened against thousands of tracked debris objects. Flagged ones are swapped for a clear backup, and a what-if slider shows how a small nudge widens the gap." },
];

const problem = [
  { k: "The problem", v: "When a cyclone or flood hits, responders lean on a handful of satellites for pictures, weather, positioning and messages. Nobody gives them a simple answer to: will those satellites be overhead — and safe — when we need them?" },
  { k: "The context", v: "Low Earth orbit is crowded with debris from collisions like Fengyun-1C and Cosmos 2251. In the next 72 hours alone we found " + conj.events.length + " close approaches under 10 km involving India's active satellites." },
  { k: "Who it affects", v: "Disaster managers deciding where to look, satellite operators deciding what to protect, and rescue teams in areas where mobile networks are down." },
];

export default function Home() {
  return (
    <>
      <div className="guides" aria-hidden><div><span /><span /><span /></div></div>

      <header className="fixed inset-x-0 top-0 z-30 flex items-center justify-between bg-gradient-to-b from-[#03050a]/95 via-[#03050a]/70 to-transparent px-[var(--inset)] pb-6 pt-5 backdrop-blur-[2px]">
        <span className="label">{BRAND.name}</span>
        <nav className="flex gap-2">
          <a className="pill hidden sm:inline-flex" href="#problem">Problem</a>
          <a className="pill hidden sm:inline-flex" href="#how">How it works</a>
          <Link className="pill primary" href="/mission">Launch</Link>
        </nav>
      </header>

      {/* HERO */}
      <section className="relative isolate flex min-h-svh items-end overflow-hidden">
        <div className="absolute inset-0 -z-10 opacity-90">
          <Galaxy density={0.9} glowIntensity={0.35} saturation={0.5} hueShift={215} twinkleIntensity={0.4} rotationSpeed={0.02} speed={0.6} mouseRepulsion={false} />
        </div>
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#03050a] via-transparent to-[#03050a]/40" />
        <div className="mx-auto w-full max-w-[var(--maxw)] px-[var(--inset)] pb-24 pt-40">
          <p className="label mb-6"><ShinyText text={BRAND.event} speed={4} /></p>
          <BlurText text="Satellites protect India in a disaster." animateBy="words" trigger="load" delay={110}
            className="display max-w-[16ch]" />
          <p className="mt-2 text-[clamp(2rem,5vw,4.5rem)] font-extralight leading-none tracking-tight text-[var(--orange)]">We protect the satellites.</p>
          <p className="mt-8 max-w-[54ch] text-lg text-[var(--ink-muted)]">
            A readiness check that tells emergency teams which Indian satellites can help right now — and whether space junk is about to get in the way.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <StarBorder as="a" href="/mission" color="#ff8a3d" duration={5} className="text-sm">
              Open Mission Control <ArrowRight className="ml-2 inline size-4" />
            </StarBorder>
            <a className="pill" href="#how">See how it works</a>
          </div>
        </div>
      </section>

      <main className="relative z-10 mx-auto max-w-[var(--maxw)] px-[var(--inset)]">
        {/* PROBLEM STATEMENT */}
        <section id="problem" className="py-32">
          <p className="label mb-4">The challenge we defined</p>
          <h2 className="display text-[clamp(2.2rem,5vw,4.5rem)] max-w-[22ch]">Are the satellites we rely on ready when it matters?</h2>
          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {problem.map((p) => (
              <SpotlightCard key={p.k} className="p-7" spotlightColor="rgba(255,138,61,0.18)">
                <p className="label mb-4 !text-[var(--orange)]">{p.k}</p>
                <p className="text-[15px] leading-relaxed text-white/80">{p.v}</p>
              </SpotlightCard>
            ))}
          </div>
        </section>

        {/* NUMBERS */}
        <section className="grid grid-cols-2 gap-y-12 border-y border-[var(--rule)] py-16 md:grid-cols-4">
          {[
            { to: conj.nSats, l: "Indian satellites tracked" },
            { to: conj.nDebris, l: "Debris objects screened" },
            { to: conj.pairsScreened, l: "Satellite–debris pairs checked" },
            { to: conj.events.length, l: "Close calls in 72 h" },
          ].map((s) => (
            <div key={s.l}>
              <CountUp to={s.to} separator="," duration={1.6} className="text-[clamp(2.4rem,4.5vw,4rem)] font-extralight tracking-tight" />
              <p className="label mt-2">{s.l}</p>
            </div>
          ))}
        </section>

        {/* HOW */}
        <section id="how" className="py-32">
          <p className="label mb-4">How it works</p>
          <h2 className="display text-[clamp(2.2rem,5vw,4.5rem)] max-w-[20ch]">One chain: disaster, helpers, safety check.</h2>
          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {steps.map((s) => (
              <SpotlightCard key={s.n} className="p-7" spotlightColor="rgba(122,167,255,0.2)">
                <div className="flex items-center justify-between">
                  <s.icon className="size-6 text-[var(--cool)]" />
                  <span className="label">{s.n}</span>
                </div>
                <h3 className="mt-8 text-2xl font-extralight tracking-tight">{s.title}</h3>
                <p className="label mt-2 !text-[10px] !normal-case !tracking-wider">{s.dom}</p>
                <p className="mt-4 text-[15px] leading-relaxed text-white/75">{s.body}</p>
              </SpotlightCard>
            ))}
          </div>
        </section>

        {/* HONESTY / DATA */}
        <section className="grid gap-10 border-t border-[var(--rule)] py-24 md:grid-cols-2">
          <div>
            <p className="label mb-4">Built on</p>
            <ul className="space-y-3 text-[15px] text-white/75">
              <li>Public NORAD orbit elements, refreshed {new Date(conj.windowStart).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}, bundled so the demo works offline.</li>
              <li>SGP4 orbit propagation, refined to about 1 second around every close approach.</li>
              <li>India&apos;s fleet: NavIC, Cartosat, RISAT, EOS, INSAT, GSAT, NISAR and more.</li>
              <li>Next: ISRO portals (Bhuvan, MOSDAC, VEDAS, Bhoonidhi) for live imagery and cyclone layers.</li>
            </ul>
          </div>
          <div>
            <p className="label mb-4">Honest limits</p>
            <p className="text-[15px] leading-relaxed text-white/75">
              Public orbit data is good to roughly a kilometre, so this is an early-warning screen, not a final collision call. Operators confirm with precise tracking. Operational status of each satellite is not verified from public data.
            </p>
          </div>
        </section>

        <footer className="label flex flex-wrap justify-between gap-2 border-t border-[var(--rule)] py-8">
          <span>{BRAND.name}</span><span>{BRAND.event}</span>
        </footer>
      </main>
    </>
  );
}
