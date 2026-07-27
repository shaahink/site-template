// @ts-check
import { defineConfig } from "astro/config";

export default defineConfig({
  /* TODO: the real production URL once the Vercel project exists. */
  site: "https://example.vercel.app",

  /* Locales for this site. One entry keeps URLs unprefixed; add a second and
     Astro's i18n routing takes over — set lang/dir per locale in the layout.
     RTL locales cost nothing if new CSS sticks to logical properties
     (PLAN §3.5). */
  i18n: { locales: ["en"], defaultLocale: "en" },

  /* No markdown is rendered by default; this silences the build's
     Shiki-vs-CSP warning. Remove if the site gains markdown content. */
  markdown: { syntaxHighlight: false },

  /* Fonts are design, so the template ships none — the system stack applies
     until the site chooses faces. When it does, use the Fonts API so they are
     built and served same-origin:

     import { fontProviders } from "astro/config";
     fonts: [{ provider: fontProviders.google(), name: "…",
               cssVariable: "--font-…", weights: […], subsets: […] }],

     and add <Font cssVariable="…" /> to the layout head. Pin subsets
     explicitly if any script beyond latin matters — a dropped subset is
     silent tofu. */

  security: {
    csp: {
      /* Everything same-origin. data: images are the feedback widget's
         screenshot preview. Add third-party origins here deliberately, one
         by one, when the design demands them. */
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
