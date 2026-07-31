// @ts-check
import { defineConfig } from "astro/config";
import { checkAnnotations, checkPlaceholders, editorRoute } from "@shaahink/sitekit/astro";
import { editable } from "./src/content/schema.js";

export default defineConfig({
  /* TODO: the real production URL once the Vercel project exists. */
  site: "https://example.vercel.app",

  /* The owner's editor. The whole route is the kit's — this site owns no
     editor page, so a change to the editor's markup or its CSP arrives as a
     version bump like every other kit change, and its URL still follows this
     site's build.format. The title is the one part that is genuinely ours:
     an owner should see whose site they are editing.

     `checkAnnotations` is the other half, and it fails the build: a
     `data-sk-edit` on this site that stops resolving — a renamed field, a
     deleted sentence, a layout change that dropped the collection attribute
     — is an element an owner can point at that would not save. It reads the
     same `editable` map api/content.ts hands the content handler, so the
     build and the editor cannot disagree about what is editable. Without it
     the rot is found by whoever opens that page in edit mode, which is the
     owner. SCALE.md §6.

     `checkPlaceholders` is that same bargain over the values rather than the
     markup, and it came from a live page rather than from a rule: a client's
     published contact address sat on a reserved `.example` domain for months,
     where no mail could ever reach it, and nothing in the build, the editor
     or the review widget had ever said a word about it — because this fleet's
     owner-ask lists are generated from what a client's material *lacked* and
     never from what the site *asserts*. It reads the same `editable` map that
     `checkAnnotations` reads, refuses the build on a reserved `.example` or
     `example.com` domain, on lorem, on TODO/FIXME/TBD and on a row of x's,
     and prints the exact `allow:` line for a string that is genuinely meant
     to be there — because a gate with no escape is a gate somebody deletes.
     It runs on `build` only: a dev server that refused to start because a
     paragraph says TODO would be a check that gets removed rather than a
     check that gets obeyed. */
  integrations: [
    editorRoute({ title: "Edit — Example" }), checkAnnotations({ collections: editable }),
    checkPlaceholders({
      collections: editable,
      /* Two escapes, and they are correct *here* and nowhere else. This
         is the template: its meta description and its og description are
         `TODO:` on purpose, because they are two of the sentences a new
         site has to write for itself, and the TODO is the instruction.

         **Delete both lines when you start a real site** — and then the
         build will not go green until you have written them, which is
         exactly the service this gate is for. */
      allow: ["homePage:meta.description", "homePage:meta.ogDescription"]
    })
  ],

  /* Locales for this site. One entry keeps URLs unprefixed; add a second and
     Astro's i18n routing takes over — set lang/dir per locale in the layout.
     RTL locales cost nothing if new CSS sticks to logical properties
     (PLAN §3.5).

     The bilingual pattern, proven on elfine (session 4): per-locale content
     entries (home.en.yaml / home.fr.yaml, one schema), a locale-prefixed
     pages dir (src/pages/fr/index.astro), and one shared component the thin
     pages parameterize with a locale prop. Two traps: the glob loader slugs
     the dot out of "home.fr" unless you pass generateId, and build.format
     "file" flattens /fr/ into /fr.html — locale-directory sites need the
     default "directory" format. */
  i18n: { locales: ["en"], defaultLocale: "en" },

  /* No markdown is rendered by default; this silences the build's
     Shiki-vs-CSP warning. Remove if the site gains markdown content. */
  markdown: { syntaxHighlight: false },

  /* Fonts are design, so the template ships none — the system stack applies
     until the site chooses faces. When it does, use the Fonts API so they are
     built and served same-origin:

     import { fontProviders } from "astro/config";
     fonts: [{ provider: fontProviders.google(), name: "…",
               cssVariable: "--font-…", weights: […], subsets: […],
               fallbacks: […] }],

     and add <Font cssVariable="…" /> to the layout head. Pin subsets
     explicitly if any script beyond latin matters — a dropped subset is
     silent tofu.

     ⚠ The built CSS hashes the family names, so site CSS must consume the
     cssVariable — never the raw name. A token like
     `--serif: "Cormorant Garamond", Georgia, serif` silently renders Georgia
     forever (Bez shipped exactly that in session 3; session 4's screenshot
     verification caught it). Write `--serif: var(--font-cormorant)` and put
     the fallback stack in the font entry above, where the variable is
     assembled.

     Preloading: pass `preload` on the layout's <Font /> components for the
     faces that paint above the fold, and only those — every preload competes
     with the hero image. Filter by subset or style, never by weight: the
     API records each merged file under its first face's weight, so a weight
     filter silently misses. Per-locale sites preload conditionally, so each
     locale pays only for its own families. */

  security: {
    csp: {
      /* Everything same-origin. data: images are the feedback widget's
         screenshot preview. Add third-party origins here deliberately, one
         by one, when the design demands them — and "media-src 'self'" the
         day the site ships audio or video (shade and elfine both needed it
         for their mp4s). When the analytics tag goes live (see Base.astro),
         https://sk-stats.vercel.app joins both connect-src below and the
         script resources — the tracker is an external script and its beacon
         posts back to the same origin. */
      directives: [
        "default-src 'self'",
        "img-src 'self' data:",
        "connect-src 'self'",
        "font-src 'self'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'"
      ],
      scriptDirective: {
        resources: ["'self'"],
        /* sha256 of the is:inline <head> snippet that adds html.js before
           first paint. Recompute if that one-liner ever changes:
           printf '%s' 'document.documentElement.classList.add("js");' | openssl dgst -sha256 -binary | base64 */
        hashes: ["sha256-WZRJfWvsnNCPcxzZwvyhovnZGqhZaC+8gPGPRbx6wTk="]
      },
      styleDirective: {
        resources: ["'self'"]
      }
    }
  }
});
