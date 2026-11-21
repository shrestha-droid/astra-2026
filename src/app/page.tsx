import Scene from "@/components/Scene";

const chapters = [
  { n: "01", title: "Problem", body: "Replace with the problem domain released at the inauguration (by 5:00 PM)." },
  { n: "02", title: "Solution", body: "One sentence on what we built and why it matters." },
  { n: "03", title: "Demo", body: "The 3-minute walkthrough judges will see." },
];

export default function Home() {
  return (
    <>
      <Scene />
      <div className="guides" aria-hidden><div><span /><span /><span /></div></div>

      <header className="fixed top-0 inset-x-0 z-10 flex items-center justify-between px-[var(--inset)] py-5">
        <span className="label">ASTRA · 2026</span>
        <nav className="flex gap-2">
          <a className="pill" href="#chapters">Chapters</a>
          <a className="pill primary" href="#demo">Launch</a>
        </nav>
      </header>

      <main className="relative z-10 mx-auto max-w-[var(--maxw)] px-[var(--inset)]">
        <section className="min-h-svh flex flex-col justify-end pb-24 pt-40">
          <p className="label mb-6">Advanced Space Technology &amp; Research Arena</p>
          <h1 className="display max-w-[14ch]">Step into the <em className="not-italic text-[var(--accent)]">unknown</em> orbit.</h1>
          <p className="mt-8 max-w-[52ch] text-[var(--muted)]">
            Team project placeholder — built overnight at VIT Bhopal for ASTRA, hosted by Club ANTERiX.
          </p>
          <div className="mt-10 flex gap-3">
            <a className="pill primary" href="#demo">Explore the build</a>
            <a className="pill" href="#chapters">Read the field guide</a>
          </div>
        </section>

        <section id="chapters" className="grid gap-6 py-32 md:grid-cols-3">
          {chapters.map((c) => (
            <article key={c.n} className="glass p-8">
              <p className="label">Chapter {c.n}</p>
              <h2 className="mt-6 text-3xl font-extralight tracking-tight">{c.title}</h2>
              <p className="mt-4 text-[var(--muted)]">{c.body}</p>
            </article>
          ))}
        </section>

        <section id="demo" className="min-h-[60svh] py-32">
          <p className="label mb-4">Chapter 04</p>
          <h2 className="display text-[clamp(2.5rem,6vw,6rem)]">Live demo goes here.</h2>
        </section>

        <footer className="label border-t border-[var(--rule)] py-8">ASTRA 2026–27 · VIT Bhopal × Club ANTERiX</footer>
      </main>
    </>
  );
}
