# The editor — the owner edits their own words

Two ways in, both behind Google sign-in: a form at `/edit`, and tapping the
words on the page itself. the owner changes a line, presses Save, and it lands
as a commit in this repo and rebuilds the site. They needs no GitHub account,
no CMS account, and no app.

A visitor sees nothing of it: `/edit` is a separate route, `noindex`, and
disallowed in `robots.txt`, and no page a visitor lands on links to it. A
visitor does *download* one thing, and this file claimed otherwise for four
rounds: every public page `<link>`s the review widget's stylesheet, about
7.6 kB, because Astro hoists CSS that anything in a page's script graph can
reach — even when both imports to it are dynamic and behind a `localStorage`
check. Measured signed-out against the live sites again on 2026-07-31, which
is the only reason this paragraph is now the shape it is.

This is Tier 1 of PLAN §3.9 — text, in the shapes the content schemas already
describe. Inside those shapes the panel does more than this file used to say:
a list's rows can be added, removed and reordered, and an image field is a
picker that uploads a new photograph. Both arrived in 7.6. Since 0.20.0 the
panel also searches every page of this site for a word the owner can see,
offers the same page in the site's other language where there is one, and can
put a change back — the last five saves are listed and any of them can be
restored as a new commit.

What is still an issue and still a conversation is a shape that does not
exist yet: a new section, a new page, an eleventh entry in a collection. That
one is deliberate rather than unbuilt. A new entry needs a slug, a place in
the nav, a sitemap entry and a translation, and those are four decisions this
site's own structure makes today — the editor would be inventing them, once
per site, with nobody to ask. `sessions/23-cms-gaps.md` in `shaahink/drydock`
argues that boundary rather than assuming it.

> Corrected 2026-07-31, and written in general terms on purpose. This
> paragraph used to name three things this site could not do, and two of them
> had shipped in 7.6. Every copy said so in its own personalised wording, so
> no one edit could fix them and nobody made seven. It is why session 23 was
> told to read the sources and drive the editor rather than read the docs.

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
| `astro.config.mjs` | Where the editor is asked for: `editorRoute({ title })`. The page is **injected by the kit**, so there is no editor file in this repo to keep in step — including the looser CSP Google sign-in needs, which attaches to that route and leaves the public pages' policy untouched. The URL does not move; an injected route follows this site's own `build.format`. |
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

## What an owner sees first

Before any of the fields: a short panel saying what this is, that everything
typed here goes onto the real site, and that nothing is permanent. It appears
once, is dismissed with a button, and comes back from the `?` beside it. It is
three sentences and two links rather than a tour, deliberately — the strongest
version of onboarding is that every empty state and error already reads like a
person wrote it, which is where the effort went.

Below it, when the site has been given the pieces, two blocks and an action:

- **Did anyone come?** Visitors and views for the last 7 and 30 days, the three
  pages people actually read, and a link to their own permanent analytics page.
  A site with no traffic yet says so in words rather than showing four zeroes.
- **What you changed.** Their own last five content changes, in plain words
  (*"Changed 2 things on home"*), each with a link to exactly what changed —
  and whether the most recent one is on the site yet. When a deploy has failed,
  the host's own sentence is quoted, because *"Deployment rate limited — retry
  in 24 hours"* tells somebody what to do and *"something went wrong"* does not.
- **Ask for a change.** Anything bigger than words and pictures — a new section,
  a different layout — is a conversation, and this is what makes asking as easy
  as editing. It files a `content-request` issue in this repository under the
  owner's name.

**Every one of those is optional and silent when absent.** No analytics
credential means no traffic block, not an error; a repository the App cannot
read means no change list. Nothing here can delay or break the form — an owner
who came to fix a typo must never meet an outage in a subsystem they have never
heard of.

## What an owner can edit

Everything in `src/content` that is text, grouped the way the schema groups it.
Whatever the schemas describe as text. Image `alt`, the `<head>` facts and the
aria strings are all there too — including the ones with no visible place on
the page, which is exactly why this is a panel and not click-the-heading
editing.

Anything that is structure wearing a value's clothing belongs in the `omit`
list in `src/content/schema.ts`: image pixel sizes the layout depends on,
`order` numbers, `srcset` strings. Everything else is the owner's.

Repeaters — a list of cards, a gallery's images — show the rows that exist and
rows that exist, and each row can be moved up, moved down, or removed.
Removing asks twice — the button changes to "Tap again to remove" and forgets
the question after a few seconds, because a half-tap on a phone should not
delete anything. "Add" puts an empty row at the bottom and scrolls to it.

Every picture has a **Choose a photograph** button. It scales the file in the
browser before anything is sent — a photograph off a phone is 3–6 MB and what
lands in the repository is a few hundred kilobytes — writes the pixel sizes
itself, and holds the save until the photograph has been described. That
description is what somebody using a screen reader hears, and nothing later in
the chain will ever ask for it. Folded away underneath is the old box for
pointing an image at a file that is already there, which still works.

A photograph and the words that go with it are **one commit**, never two, so
the site is never briefly pointing at a picture that has not arrived yet.
Removing a row removes the reference; the file itself stays in the repository,
where git history can get it back.


Persian and Arabic fields read right-to-left inside the panel: every control
carries `dir="auto"`, so each field decides from its own content rather than
from the panel's language.

### Turning a section off

A section whose schema carries `visible` gets a switch at the top of its box.
Turning it off takes it off the site — properly off, not rendered at all, so
nothing of it is left in the page for a search engine to find. Nothing is
deleted: every word stays in the file and the switch is where it comes back.

The template ships one, `notes`, as the working example. Decide each site's
list deliberately: a hero, an about block and a contact block are what a page
*is*; a seasonal offer, a gallery or a set of collaborators are what an owner
wants a switch for.

**If the site has a navigation, filter it from the same data** — see
`src/pages/index.astro`, where the call and the trap are written out. A link
to a section that is not rendered scrolls nowhere, silently, and the nav is the
first thing an owner tries after turning something off.

Because a section that is off is not on the page at all, the panel is the only
place to turn it back on.

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
them. The recent-changes list and the deploy state come from that same
credential — nothing was added for them.

Three more, all optional, for the owner's own traffic:

| Variable | Value |
| --- | --- |
| `UMAMI_URL` | the analytics instance, e.g. `https://sk-stats.vercel.app` |
| `UMAMI_USERNAME` | the **read-only** account, never the admin one |
| `UMAMI_PASSWORD` | its password |

Leave all three out and the editor simply has no traffic block. There is no
`UMAMI_TEAM_ID` here: that one is for enumerating a whole fleet, and this reads
one website by id, which the instance serves without it.

**The website id is not a variable.** It is already public — the page's own
tracker tag carries it — so it lives in the repository, passed to
`createContentHandler` as `umamiWebsiteId` in `api/content.ts`. Keep it equal to
the one in `src/layouts/Base.astro`; they are the same site, one writing and one
reading.

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
4. **Annotate the pages.** `data-sk-collection="<name>"` (with
   `data-sk-entry` where a collection has more than one) on the element that
   scopes a page, and `data-sk-edit="<field path>"` on each element whose words
   come from the content. That is what lets an owner tap the sentence they are
   looking at rather than find it again in a form, and it is where the per-site
   work in this list actually is: the template ships the shape — one scope in
   `Base.astro`, four annotations in `index.astro` — and a real site carries it
   across every page it has. Nothing to configure: the build already reads the
   pages back and fails on an annotation that would not save, by the same route
   the panel judges one at runtime.
5. **Name the fields in the owner's words** — `z.string().meta({ title: "…" })`.
   The inline bar says "Changing {label}" while they type, and a short key makes
   that useless: `name.fa` reads as "Fa". Add `entryUrl` to the `editable` map
   too, so the panel can offer "Edit this page on the site" — without it the
   only way into inline editing is typing `?edit=1` onto a URL, which nobody
   does on a phone.
6. **Set the Umami website id in both of its homes** — the tag in
   `src/layouts/Base.astro` and `umamiWebsiteId` in `api/content.ts`. One id,
   two readers: the tag records the visit and the editor's home reads the
   traffic back. Only the first is visible if the second is wrong, so they are
   worth setting in the same commit.
7. **Set the three `CMS_*` environment variables**, and add this site's origin
   to the fleet's one Google OAuth client.
8. **Add `/edit` — or `/edit.html`, if `build.format` is `file` — to the
   `disallow` list** in `src/pages/robots.txt.ts`.

What is *not* on this list any more, and used to be: restating this site's CSP
directives for the editor's page. There is no page here to restate them in, and
the theory behind the instruction was wrong anyway — `insertDirective`
**appends** to what the site already declares rather than replacing it, read off
a real built page in 0.11.0. So a site's own sources reach the editor route on
their own, and the route only ever names what the editor itself loads.
