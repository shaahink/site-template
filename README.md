# sk site template

The starting point for a new site in the **sk** fleet. Astro 7, strict
TypeScript, content in typed collections, and the shared machinery pre-wired:
review-mode feedback, the sk credit line, generated host config, CI, Renovate.

**What it deliberately does not ship: a design.** Every site in the fleet
looks different on purpose — `src/styles/styles.css` is all but empty, the
layout is bare, and the only palette anywhere (the feedback widget's) is
neutral so you replace it. The template gives you the plumbing; the face is
the actual work.

## Start a site

```bash
gh repo create shaahink/<name> --private --template shaahink/site-template --clone
cd <name>
npm install
npm run dev
```

Then work through the TODOs:

1. `package.json` — name and description.
2. `astro.config.mjs` — `site`, locales, fonts when the design chooses them.
3. `src/components/Footer.astro` — the client's name and URL for the credit.
4. `src/content/pages/home.yaml` — real words; grow `src/content.config.ts`
   to match the content the site actually has.
5. `api/feedback.js` — locales and time zone.
6. `FEEDBACK.md` — one-time token + env setup, then record the review link.
7. Link the repo to a Vercel project (`vercel link`); `vercel.json` already
   tells it the framework and output directory.

## Commands

```bash
npm run dev        # dev server at http://localhost:4321
npm run build      # production build into dist/
npm run preview    # serve the production build
npm run check      # typecheck the pages and content schemas
npm run headers    # regenerate vercel.json from headers.config.mjs
```

## Conventions

This template encodes the fleet's rules — the reasoning lives in
`shaahink/drydock`'s `PLAN.md`:

- **Handlers stay Web-standard** (`Request`/`Response`, `fetch`, Web Crypto;
  env read at the edge and passed in). Vercel is the host, not the platform.
- **`vercel.json` is generated** from `headers.config.mjs` — never hand-edit
  it; CI fails on drift.
- **New CSS uses logical properties only** — the fleet is bidirectional.
- **Dependencies are pinned exactly**; Renovate bumps them through PRs gated
  on CI (`.github/workflows/ci.yml`: `astro check`, build, headers drift).
- **Content lives in `src/content`**, validated by Zod schemas — pages are
  arrangement, not words. The future CMS generates its editor from those
  schemas.
