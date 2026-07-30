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
   **If the site reads right-to-left, read [RTL.md](RTL.md) first** — direction,
   the Persian face, the two typography rules, digits, slugs and ZWNJ, all of it
   measured on the two RTL sites already in the fleet. Astro's `i18n` has no
   notion of direction, so `dir` is yours to set and there is a trap in the
   obvious way to do it.
3. `src/components/Footer.astro` — the client's name and URL for the credit.
4. `src/content/pages/home.yaml` — real words; grow `src/content.config.ts`
   to match the content the site actually has.
5. `api/feedback.js` — locales and time zone.
6. `FEEDBACK.md` — confirm the `sk-feedback` App covers this repo, set the env,
   then record the review link. **There is no token to create**; the App mints a
   short-lived one per request and signs as `sk-feedback[bot]`.
7. `CMS.md` — the editor's one-time setup: three `CMS_*` variables and this
   site's origin added to the fleet's Google OAuth client. **Do both before you
   show `/edit` to the owner.** With the variables set and the origin missing,
   the page shows a complete, confident "Sign in with Google" card and Google
   refuses the button behind it with a 403 — measured on a live site, and it
   reads as a broken site rather than as a missing setting. The page cannot tell
   you: an origin is a Google-console fact, not something a site can read.
8. **Annotate the pages.** `Base.astro` scopes one with `data-sk-collection`
   and `index.astro` carries four `data-sk-edit` as the worked example; every
   element whose words come from the content wants one, so an owner edits the
   sentence they are looking at instead of hunting for it in a form. The build
   already fails on an annotation that would not save (`checkAnnotations`), so
   this is checked from the first one you add.
9. **Name the fields an owner will read** — `z.string().meta({ title: "…" })`
   in the schema. Left to the key, the bar says "Changing Html". And give each
   entry an `entryUrl` in the `editable` map — `"/"` is set for the one entry
   here — which is what puts "Edit this page on the site" in the panel.
10. **Set the Umami website id in both places it lives** — the tag in
    `src/layouts/Base.astro` and `umamiWebsiteId` in `api/content.ts`. They are
    the same id for the same site: the first records the visit, the second is
    how the owner's home reads their own traffic back.
11. Link the repo to a Vercel project (`vercel link`); `vercel.json` already
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
- **New CSS uses logical properties only** — the fleet is bidirectional, and
  two of its sites read right-to-left. Reading the stylesheet is not how you
  check: a leaked physical property shows up as horizontal overflow in a
  browser, which is measurable. [RTL.md §7](RTL.md) has the four measurements.
- **Dependencies are pinned exactly**; Renovate bumps them through PRs gated
  on CI (`.github/workflows/ci.yml`: `astro check`, build, and three
  regenerate-and-diff gates — headers, content, editor stylesheet).
- **Content lives in `src/content`**, validated by Zod schemas — pages are
  arrangement, not words. The editor generates itself from those schemas, so a
  field added there appears in the panel with no UI work at all.
- **`src/content/schema.ts` imports nothing but Zod.** `content.config.ts`
  wraps it for the build; the editor's Vercel function imports it directly, and
  a function can never reach `astro:content`. That split is load-bearing.
- **The editor itself is not in this repo, and neither is its page** — it is
  `@shaahink/sitekit/editor`, chrome included, so improving it is a version
  bump rather than five hand edits. `editorRoute()` in `astro.config.mjs`
  injects the route, which is why there is no `src/pages/edit.astro` to find:
  every site owned one until 0.11.0 and one change to Google's sign-in cost four
  client-repo commits in an afternoon. `public/editor-panel.css` is a copy the
  kit makes. Do not fork either. If a change to the editor would mean editing
  this repo, the boundary is wrong and the boundary should move.
