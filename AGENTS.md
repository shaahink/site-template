# <Site name> — <one line on whose site this is>

TODO: replace this stub when the site takes shape. Until then, README.md
describes what the template provides.

## Stack

Astro 7, strict TypeScript, static output. Content lives in typed collections
under `src/content/`, validated by `src/content.config.ts`; the pages are
arrangement, not words. Feedback machinery comes from `@shaahink/sitekit`
(pinned exactly) — see `FEEDBACK.md`.

`vercel.json` is generated from `headers.config.mjs` (`npm run headers`) —
never hand-edit it; CI fails on drift.

## Run it

```bash
npm install
npm run dev      # dev server
npm run check    # typecheck pages + content schemas
npm run build    # dist/
```

`vercel dev` when touching the `/api` functions.

## Conventions

This site is part of the **sk** fleet. The plan, the locked decisions and the
rules every site inherits live in `shaahink/drydock` — read `PLAN.md` there
before proposing anything architectural.

Two that bite most often: handlers stay Web standard (no `@vercel/*`, no Node
built-ins — Vercel is the host, not the platform), and CSS uses logical
properties only, because the sites are bidirectional.
