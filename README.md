# sk site template

The starting point for a new site in the **sk** fleet. Astro 7, strict
TypeScript, content in typed collections, and the shared machinery pre-wired:
review-mode feedback, **the owner's editor**, the sk credit line, generated host
config, CI, Renovate.

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
7. `CMS.md` — the editor's one-time setup: three `CMS_*` variables and this
   site's origin added to the fleet's Google OAuth client. Until then `/edit`
   says so plainly rather than showing a button that cannot work.
8. `src/pages/edit.astro` — restate this site's CSP directives with Google's
   origins added. Astro replaces a directive rather than merging into it, so
   anything astro.config adds to `connect-src` or `img-src` has to be repeated
   there. It is the only per-site part of the editor.
9. Link the repo to a Vercel project (`vercel link`); `vercel.json` already
   tells it the framework and output directory.

## Commands

```bash
npm run dev        # dev server at http://localhost:4321
npm run build      # production build into dist/
npm run preview    # serve the production build
npm run check      # typecheck the pages and content schemas
npm run headers    # regenerate vercel.json from headers.config.mjs
npm run content    # rewrite src/content in the form the editor writes back
npm run editor     # copy the editor's stylesheet out of the kit
```

`content` and `editor` are both regenerate-and-diff gates in CI, like
`headers`. Run `content` once, in its own commit, before the first owner edit —
it reflows the YAML into the form the editor writes back, so the owner's first
save is a one-line diff rather than a hundred-line one.

## Conventions

This template encodes the fleet's rules — the reasoning lives in
`shaahink/drydock`'s `PLAN.md`:

- **Handlers stay Web-standard** (`Request`/`Response`, `fetch`, Web Crypto;
  env read at the edge and passed in). Vercel is the host, not the platform.
- **`vercel.json` is generated** from `headers.config.mjs` — never hand-edit
  it; CI fails on drift.
- **New CSS uses logical properties only** — the fleet is bidirectional.
- **Dependencies are pinned exactly**; Renovate bumps them through PRs gated
  on CI (`.github/workflows/ci.yml`: `astro check`, build, and three
  regenerate-and-diff gates — headers, content, editor stylesheet).
- **Content lives in `src/content`**, validated by Zod schemas — pages are
  arrangement, not words. The editor generates itself from those schemas, so a
  field added there appears in the panel with no UI work at all.
- **`src/content/schema.ts` imports nothing but Zod.** `content.config.ts`
  wraps it for the build; the editor's Vercel function imports it directly, and
  a function can never reach `astro:content`. That split is load-bearing.
- **The editor itself is not in this repo** — it is
  `@shaahink/sitekit/editor`, chrome included, so improving it is a version
  bump rather than five hand edits. `src/pages/edit.astro` mounts it and does
  nothing else; `public/editor-panel.css` is a copy the kit makes. Do not
  fork either. If a change to the editor would mean editing this repo, the
  boundary is wrong and the boundary should move.
