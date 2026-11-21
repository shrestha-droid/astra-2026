# ASTRA 2026 — Space Hackathon Project

> Replace this with the one-line pitch once the Problem Domain is released (by 5 PM).

Built for **ASTRA — Advanced Space Technology & Research Arena** (VIT Bhopal × Club ANTERiX).

## Stack
Next.js (App Router) · TypeScript · Tailwind v4 · React Three Fiber / three.js · Framer Motion · Lenis

## Design language
Cinematic, atmospheric, editorial — inspired by the *Sylva* field-guide aesthetic: light Lexend type, continuous vertical
guides, frosted-glass cards, fog/haze depth in a live WebGL scene. Palette: deep-space navy + ANTERiX orange.
Design skills (layout, Three.js scroll worlds, shaders) live in `.claude/skills/` (from [MengTo/Skills](https://github.com/MengTo/Skills)).

## Run
```bash
npm install
npm run dev     # http://localhost:3000
npm run build
```

## Structure
- `src/components/SpaceScene.tsx` — starfield + fbm nebula shader + pointer parallax
- `src/app/page.tsx` — hero + chapters (placeholders)
- `HACKATHON.md` — rules, timeline, deliverables checklist
