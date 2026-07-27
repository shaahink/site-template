/* This site's headers, in the kit's neutral form. vercel.json is GENERATED
   from this file — edit here, then `npm run headers`, and commit both. The
   same definition emits Cloudflare _headers/_redirects the day the host
   changes, which is the point: no host-specific file is ever hand-maintained. */

export default {
  /* Astro's static build, told to Vercel via the kit's 0.2.0 passthrough. */
  vercel: { framework: "astro", outputDirectory: "dist" },

  /* Screenshot uploads land on this branch; they must never deploy. */
  disableDeploymentsFor: ["feedback-assets"],

  /* Redirects emit for both hosts too. shade-site turned its old about.html
     meta-refresh page into the 301 it always wanted to be:
       redirects: [{ from: "/about.html", to: "/", status: 301 }], */

  headers: [
    {
      path: "/*",
      headers: {
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "X-Frame-Options": "SAMEORIGIN",
        "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
        "Strict-Transport-Security": "max-age=31536000; includeSubDomains"
      }
    },
    { path: "/api/*", headers: { "Cache-Control": "no-store" } },
    /* Astro's build output — CSS, JS and any self-hosted fonts — is
       content-hashed: a changed file is a new URL, so a year of immutable is
       safe. Assets with stable paths in public/ need their own rule with a
       shorter cache (see behrooz-website's /images/* for the pattern). */
    { path: "/_astro/*", headers: { "Cache-Control": "public, max-age=31536000, immutable" } }
  ]
};
