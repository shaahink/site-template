# The editor — the owner edits their own words

Two ways in, both behind Google sign-in: a form at `/edit`, and tapping the
words on the page itself. the owner changes a line, presses Save, and it lands
as a commit in this repo and rebuilds the site. They needs no GitHub account,
no CMS account, and no app.

Public visitors see nothing and download nothing. `/edit` is a separate route,
`noindex`, and disallowed in `robots.txt`.

This is Tier 1 of PLAN §3.9 — text, in the shapes the content schemas already
describe. Adding a section, reordering a list or uploading a new image: still
an issue, still a conversation, deliberately.

---

## How it works

```
 /edit  →  Google sign-in  →  POST /api/auth  →  session cookie (self-renewing)
                                        |
             the panel, generated from the content schemas
                                        |
                   Save  →  POST /api/content  →  commit  →  deploy
```

| File | Role |
| --- | --- |
| `src/content/schema.ts` | The schemas, Zod only. The build validates against them and the editor generates its form from them — one definition, both jobs. Its `editable` map says which YAML file backs which collection, and which fields to leave out. |
| `src/content.config.ts` | The Astro half: each schema paired with the loader that finds its files. |
| `src/pages/edit.astro` | The route. Mounts the panel and carries the looser CSP that Google sign-in needs, so the public pages keep theirs untouched. Twenty lines of wiring — no editor behaviour. |
| `api/auth.ts` · `api/content.ts` | The edges: read this deployment's environment, hand off to `@shaahink/sitekit/cms`. |
| `public/editor-panel.css` · `public/editor-inline.css` | The panel's chrome and the on-page editing marks, **copied** from the kit by `npm run editor`. Never hand-edited; CI regenerates and diffs both. |
| `scripts/normalize-content.mjs` | Keeps the YAML in the one form that makes edits produce small diffs. CI enforces it. |

**The panel itself is not in this repo.** It is `@shaahink/sitekit/editor` —
`mountEditor()` builds every control from the field descriptions
`/api/content` sends, and knows nothing about this site in particular. That is
deliberate, and it is the point: four hand-maintained copies of one admin
screen is what the kit exists to prevent, so improving the editor is a version
bump here rather than an edit. It also means the panel looks the same on every
site in the fleet — a neutral working surface, not this site's palette.
Nobody's face is their admin panel.

Nothing in the panel is hand-built per field either. Add a field to a schema
and it appears in the editor.

---

## What an owner sees

Everything in `src/content` that is text, grouped the way the schema groups it.
Whatever the schemas describe as text. Image `alt`, the `<head>` facts and the
aria strings are all there too — including the ones with no visible place on
the page, which is exactly why this is a panel and not click-the-heading
editing.

Anything that is structure wearing a value's clothing belongs in the `omit`
list in `src/content/schema.ts`: image pixel sizes the layout depends on,
`order` numbers, `srcset` strings. Everything else is the owner's.

Repeaters — a list of cards, a gallery's images — show the rows that exist and
let their text be edited. There is no add or remove button.

Persian and Arabic fields read right-to-left inside the panel: every control
carries `dir="auto"`, so each field decides from its own content rather than
from the panel's language.

---

## Editing on the page itself

The panel reaches every field. **Tapping the words reaches the ones the owner
can point at**, which is most of what an owner actually wants to change — and
it removes the step where they have to work out which form field corresponds to
the sentence they are looking at.

From the panel, **"Edit this page on the site"** opens the page with editing
switched on. That link is the only way in that involves no typing, which is to
say the only one that exists on a phone. (The long way round is adding
`?edit=1` to the address, which is what the link does for you.)

Highlighted text can be typed on. Grey text has to be changed in the panel, and
says so when tapped — any field whose value carries markup the design depends
on. A bar along the bottom says what is being changed, undoes one edit or all
of them, and saves. It rides above the on-screen keyboard rather than hiding
underneath it.

It covers every piece of text the pages annotate.

Some things are deliberately not editable in place, and the panel is where they
live: anything with no visible text at all (the `<head>` facts, image
descriptions, the aria strings), and anything belonging to a collection other
than the page's own. A page shows one content file, so anything from a
different one is the panel's job.

**Nothing is public until Save.** Unsaved work survives a reload — it is kept
as you type and offered back next time, never restored silently — so an
interrupted edit on a phone is not a lost one. If the sign-in has lapsed by the
time Save is pressed, the editor says so, keeps the work, and lets you sign in
again without leaving the page.

---

## One-time setup

### 1. The Google OAuth client

One client covers every site in the fleet; if it already exists, skip to step 2
and just add this site's origin to it.

At <https://console.cloud.google.com>, as the account that owns the fleet:

1. **New project** — `sk-platform`.
2. **APIs & Services → OAuth consent screen → External.** App name `sk`.
   Scopes: `openid`, `email`, `profile` and nothing else — these are
   non-sensitive, so Google requires no verification review.
3. **Credentials → Create credentials → OAuth client ID → Web
   application.** Under **Authorized JavaScript origins** add this site's
   origin, no trailing slash:

   ```
   https://example.vercel.app
   ```

   Leave **Authorized redirect URIs empty** — the button flow hands the token
   to our own JavaScript and never redirects.

There is no client secret. The site only ever *verifies* an ID token; it never
exchanges a code, so there is nothing secret to hold.

### 2. Environment variables

In Vercel → Settings → Environment Variables:

| Variable | Value |
| --- | --- |
| `CMS_GOOGLE_CLIENT_ID` | ends `.apps.googleusercontent.com` |
| `CMS_ALLOWLIST` | comma-separated Google emails and/or `sub` ids |
| `CMS_SESSION_SECRET` | any long random string — `openssl rand -base64 32` |

The GitHub credential is **not** new: `FEEDBACK_GITHUB_APP_ID`,
`FEEDBACK_GITHUB_APP_PRIVATE_KEY`, `FEEDBACK_GITHUB_APP_INSTALLATION_ID` and
`FEEDBACK_GITHUB_REPO` are already set for review mode, and the editor reuses
them.

### 3. The allowlist

Either form works. The email is what you actually know when someone says "use
my gmail"; the `sub` is Google's stable id and survives an email change. The
account must have a verified email — an unverified one is refused whatever the
allowlist says.

An unset or empty allowlist admits nobody. A half-configured site is not an
open door.

---

## Things worth knowing before they surprise you

**The commits are authored by `sk-feedback[bot]`.** That is not a mistake. The
editor reuses the same GitHub App as review mode, because it already holds
Contents: read/write on this repo — a second App would mean a second key, three
more environment variables and a second thing to rotate, to change a name. The
human is named in the commit message:

```
Edit home.yaml: hero.tagline

Changed by The Owner <owner@example.com> through the site editor.
```

**Rotating `CMS_SESSION_SECRET` signs everyone out**, immediately and without
warning. That is the intended blunt instrument, and it is the reason a mystery
logout after a config change is explicable rather than alarming.

**Two people editing at once**: whoever saves second is told to reload. Every
edit carries the version of the file it was based on, and a stale one is
refused rather than silently overwriting the other person's work.

**Removing someone from the allowlist takes effect immediately**, not when
their cookie expires — it is re-checked on every request.

**A save can be rejected by the schema.** If a value is too long or the wrong
shape, the message appears next to the field and nothing is committed. The
whole document is re-validated after the change is applied, not just the field
that changed.

**The content must stay normalized.** `npm run content` rewrites it into the
one form that keeps edits to small, readable diffs, and CI fails if a hand edit
drifts out of it. If a one-field edit ever produces a hundred-line diff, that
is what has gone wrong.

**A save is a commit, so it is a deploy.** The change is live in a minute or
so, and the panel links to the commit. Anything wrong is one revert away —
which is the real safety net here, and the reason the diffs are kept readable.

---

## Wiring a new site up

Everything above is already here. What a new site has to do:

1. **Keep `src/content/schema.ts` free of anything Astro-shaped.** Zod only —
   a Vercel function can never import `astro:content`. Add each new schema
   there and wrap it in `src/content.config.ts`.
2. **Add the collection to the `editable` map** with the file or directory that
   backs it, a label an owner would recognise, and an `omit` list.
3. **Run `npm run content` once**, in its own commit, before the first owner
   edit. It reflows the YAML into the form the editor writes back, so the
   owner's first save is a one-line diff rather than a hundred-line one.
4. **Restate this site's CSP directives in `src/pages/edit.astro`.** Astro
   replaces rather than merges, so every directive the site sets globally and
   Google needs to widen has to be spelled out there again. It is the one part
   of the editor that is genuinely per-site, and it changes only when the
   site's own CSP does.
5. **Set the three `CMS_*` environment variables**, and add this site's origin
   to the fleet's one Google OAuth client.
6. **Add `/edit` — or `/edit.html`, if `build.format` is `file` — to the
   `disallow` list** in `src/pages/robots.txt.ts`.
