# Building a right-to-left site from this template

Everything here was measured on a live site in the fleet, and every rule says
which one. Two exist and they are deliberately different shapes:

| | **nimagiti** | **mosleh-clinic** |
|---|---|---|
| Languages | bilingual English + Farsi, `/en` and `/fa` | Farsi only, unprefixed |
| Direction | **computed** from the locale | **literal**, stated once |
| Why | the same layout has to serve both halves | there is no other half to serve |

Read the column that matches the site you are starting. Where they agree, that
is the fleet's practice; where they differ, the difference is the point.

The template itself is LTR and English, so nothing below is switched on by
default. What the template *does* give you is the one thing that makes any of
it possible: **logical CSS properties everywhere**, so a direction flip is an
attribute rather than a stylesheet.

---

## 1. Direction is set in one place

**Bilingual (nimagiti).** The layout derives it and nothing else decides:

```astro
const dir = locale === "fa" ? "rtl" : "ltr";
...
<html lang={locale} dir={dir}>
```

**Single-locale RTL (mosleh-clinic).** State it as a literal and say so:

```astro
<html lang="fa" dir="rtl">
```

Astro's `i18n` config has **no notion of direction** — do not go looking for
one. `locales: ["fa"]` gets you URLs and nothing else; `dir` is yours to set.

### The `dir="auto"` trap

**Do not sprinkle `dir="auto"`.** nimagiti's live page moved a plus sign 38 px
across because `auto` resolves a string's direction from its **first strong
character**, and a Persian-numeral string beginning with a digit has no strong
character until later. The bug was in production for weeks and looked like a
CSS problem.

Set direction explicitly at the layout instead. Where a run genuinely is mixed —
a Latin phone number, an English procedure name inside a Farsi sentence — wrap
*that run* in `<span dir="ltr">` or `<bdi>`, deliberately and visibly.

`mosleh-clinic` has **zero** `dir="auto"` on 23 pages (measured in a browser,
both widths), and it has plenty of mixed runs. You do not need it.

**Where `dir="auto"` is right, and it is not your call:** the editor's own form
controls carry it, so a Farsi entry typed into an English panel still reads
right-to-left (`CMS.md`). That is the kit's, not the site's.

### Brackets and mixed runs resolve themselves — if the direction is explicit

`mosleh-clinic/services/rehab` has eight headings of the form
`آسیب‌شناسی ورزشی (Sports Pathology)`. Measured with a `Range` over the
individual characters, the `(` sits at the **right** of the Latin run and the
`)` at the left — which is correct: the preceding strong type is Farsi, so the
bracket pair takes the embedding direction, is mirrored, and the reader sees
`(Sports Pathology)` the right way round with the Latin reading left-to-right
inside it. **Unicode gets this right on its own.** It gets it wrong when the
paragraph direction is `auto` and resolves the wrong way, which is §1's trap
again.

---

## 2. Two typography rules, and one of them is the whole game

```css
/* Bilingual: gate them on the language. */
html[lang="fa"] body { line-height: 1.85; }
html[lang="fa"] *    { letter-spacing: normal; }

/* Single-locale: no gate needed. */
html { line-height: 1.85; }
html[lang="fa"], html[lang="fa"] * { letter-spacing: normal !important; }
```

1. **`line-height: 1.85`**, not the 1.5 a Latin design would take. Persian
   ascenders and descenders need the room, and dense Farsi at Latin leading
   reads as a grey block.
2. **`letter-spacing: normal`, forced on everything.** Tracking forces gaps
   into cursive-joined letters and the word visibly comes apart. nimagiti's
   stylesheet calls this "the biggest Farsi fix on the site". Set it — do not
   leave it unset — because a stray `letter-spacing` on a heading is exactly
   what gets added later by somebody adapting a Latin design.
   `mosleh-clinic` uses `!important` for that reason; on a Farsi-only site
   nothing legitimate ever wants tracking.

Headings want a **calmer** leading than the body — both sites use `1.45`.

If a face ships a single weight (nimagiti's Lalezar), add `font-synthesis:
none`, or the browser fakes a bold and smears the joins.

---

## 3. The Persian face is self-hosted, and `fontProviders.google()` is how

```js
fonts: [
  {
    provider: fontProviders.google(),
    name: "Vazirmatn",
    cssVariable: "--font-vazirmatn",
    weights: [400, 500, 700],
    subsets: ["latin", "arabic"],
    fallbacks: ["Tahoma", "system-ui", "sans-serif"]
  }
]
```

Three things here have each cost somebody an afternoon:

- **`fontProviders.google()` is not a Google Fonts request.** The provider is a
  registry consulted **at build time**; the built output carries `.woff2` files
  under your own origin. Measured on `mosleh-clinic` in a browser: **0 requests
  to `fonts.googleapis.com` or `fonts.gstatic.com` across 46 page-visits**, two
  self-hosted `.woff2` answering 200. So `font-src 'self'` is the whole CSP
  entry and a visitor in Iran waits on nobody but you. The hard rule against
  Google Fonts is about the *request*, and there is none.
- **Pin `arabic` beside `latin` explicitly.** A dropped subset renders as
  silent tofu, and on a Farsi site the dropped subset is the entire language.
  Verify from the browser rather than the config: `document.fonts` should report
  the family `loaded` at each weight.
- **Consume the `cssVariable`, never the family name.** The built CSS hashes
  family names — `--sans: "Vazirmatn", sans-serif` renders the fallback
  forever, silently. One site in this fleet shipped exactly that. Write
  `--sans: var(--font-vazirmatn)`.

Bilingual sites remap a variable per language rather than duplicating rules:

```css
:root            { --font-app-body: var(--font-inter); }
html[lang="fa"]  { --font-app-body: var(--font-vazirmatn); }
```

---

## 4. ZWNJ survives the whole chain — verify it once, per site

Farsi needs U+200C (zero-width non-joiner) for `می‌شود`, `خانه‌ها` and every
plural. A normaliser that strips or re-encodes it would damage every page
silently and everywhere, so **check it rather than trust it**:

1. Put ZWNJ in the YAML.
2. Run `npm run content` (`sitekit-normalize`) and diff **bytes, not glyphs** —
   `git diff` and look for `e2 80 8c` surviving, or count the code points
   before and after. Two identical-looking strings are the failure mode.
3. Build, and check the built page carries it too.

Measured on `mosleh-clinic`: ZWNJ survives `npm run content`, and it also
survives the **editor's write path** — a save of a field carrying two ZWNJ
travelled JSON body → handler → YAML → commit intact, counted as `e2 80 8c` in
the committed diff. So an owner typing Farsi into the panel cannot break it.

---

## 5. Persian digits: one policy, written down once

- **Persian digits (۰۱۲۳۴۵۶۷۸۹) in everything a person reads** — prose, dates,
  counts, UI chrome. `۵۰ سال`, not `50 سال`.
- **Latin digits in everything a machine reads** — URLs and slugs, JSON-LD
  values (schema.org expects Latin; a Persian-numeral `telephone` or date is a
  broken value), `datetime` attributes, and any English string.
- **Phone numbers: whatever the client actually prints.** Both forms are normal
  in Iran. Ask; do not decide. Wrap the answer in `dir="ltr"`.

Verify it in the rendered page, not the YAML: scan every paragraph, list item,
heading and caption carrying Farsi text for `[0-9]`. `mosleh-clinic` measures
**0** across 23 pages.

---

## 6. Slugs: two different problems, two rules

**Medical, technical and internationally standard terms use the English word,
not a transliteration.** `sinusitis`, not `sinuzit` — a romanised Farsi slug
matches nothing anybody types.

**Names and places transliterate.** The fleet's table, so the next site reuses
the romanisation instead of inventing one:

```
ا/آ a    ب b    پ p    ت t    ث s    ج j    چ ch   ح h    خ kh
د d     ذ z    ر r    ز z    ژ zh   س s    ش sh   ص s    ض z
ط t     ظ z    ع —    غ gh   ف f    ق gh   ک k    گ g    ل l
م m     ن n    و v (u/o as vowel)   ه h    ی y (i as vowel)
short vowels: َ a   ِ e   ُ o          ZWNJ → hyphen
```

`مصلح` → `mosleh`, `مریم` → `maryam`, `محمدتقی` → `mohammad-taghi`, `شیراز` →
`shiraz`. `ق`/`غ` both become `gh`; `ع` is dropped rather than apostrophised,
because apostrophes in slugs are a nuisance.

---

## 7. Logical properties, and how to prove you kept to them

The fleet rule is `margin-inline-start` / `padding-inline-end` / `inset-inline`
and Tailwind's `ms-`/`me-`/`ps-`/`pe-`/`start-`/`end-` — never `ml-`/`mr-`/
`left-`/`right-`. On an LTR site breaking it is a latent bug; on an RTL site it
is a visible one, which is the one mercy here.

**Reading the stylesheet is not the check.** Grep finds `left:` in a comment
and misses a physical property inside a component library. Drive the built site
in a browser and measure four things — which is how `mosleh-clinic` was signed
off, at 1440×900 and at 390×844 with the mobile flag set (phone width *without*
the flag is a narrow desktop and `pointer: coarse` never fires):

1. **`documentElement.scrollWidth − clientWidth`** on every page. A leaked
   physical property on an RTL page shows up as horizontal overflow more
   reliably than as anything else. Target: **0**.
2. **Every visible element's box against the viewport**, both edges — anything
   with `right > vw + 1` or `left < −1`. On RTL a stray `ml-`/`left-` pushes
   content off the **left**, which a screenshot of the top of the page will not
   show you. Target: **0** elements.
3. **Computed `letter-spacing` on every leaf carrying Persian text.** Target:
   `normal` everywhere. This is the rule most likely to be broken by a later
   commit.
4. **Computed `direction` on `<html>` and `<body>`**, and `text-align` on a
   heading — it should compute to `start`, not `right`. `right` works and is
   still wrong: it will not follow the next locale.

`mosleh-clinic` passes all four on 23 pages at both widths.

---

## 8. The editor already speaks the owner's language

You do not localise the editor and you must not try. Since 0.17.0 the kit ships
Farsi, French and English; `/edit`'s `lang="en"` in the built page is a
**starting value**, and the panel resolves the real locale at runtime —
`?lang=` → what it remembered → `navigator.languages` — then writes both `lang`
and `dir` onto its own document. A Farsi-reading owner gets a Farsi,
right-to-left editor with no per-site work at all.

**Testing that needs care.** Setting an `Accept-Language` header does nothing:
the kit reads `navigator.languages`. In CDP that means
`Emulation.setUserAgentOverride`'s `acceptLanguage`, not
`Network.setExtraHTTPHeaders`. Or just visit `/edit?lang=fa`.

---

## 9. SEO on an RTL site is the same job, in Farsi

Nothing about right-to-left changes the work; what changes is that
boilerplate is more obvious in a language the writer does not read. Per-page
Farsi `<title>` and meta descriptions **written**, never templated from a key.
JSON-LD is data rather than executable script, so it costs the CSP nothing —
add it. Latin digits inside it (§5).

---

## The short version

1. Set `dir` once, in the layout. Never `dir="auto"` on your own markup.
2. `line-height: 1.85`; `letter-spacing: normal`, forced.
3. Self-host the face through `fontProviders`, pin the `arabic` subset,
   consume the CSS variable.
4. Prove ZWNJ survives `npm run content` in bytes, once.
5. Persian digits for people, Latin digits for machines.
6. English words for standard terms, the table for names.
7. Logical properties — and prove it in a browser at two widths, not by
   reading the CSS.
