/* Review mode — feedback intake
   ---------------------------------------------------------------------------
   The machinery lives in @shaahink/sitekit. This file is the edge: it reads
   this deployment's environment and passes values in, so the kit itself never
   touches process.env and the host stays swappable.

   Environment variables (Vercel → Settings → Environment Variables):
     FEEDBACK_GITHUB_TOKEN   required  fine-grained PAT: Issues RW, Contents RW
     FEEDBACK_GITHUB_REPO    required  e.g. "shaahink/<this-repo>"
     FEEDBACK_REVIEW_KEY     required  the secret in the ?review=... link
     FEEDBACK_ASSETS_BRANCH  optional  defaults to "feedback-assets"
     FEEDBACK_SITE_URL       optional  canonical site origin for links back
     FEEDBACK_ALLOWED_ORIGIN optional  one extra origin allowed to post
   ------------------------------------------------------------------------ */

import { createFeedbackHandler } from "@shaahink/sitekit/feedback";

const handler = createFeedbackHandler({
  env: () => ({
    token: process.env.FEEDBACK_GITHUB_TOKEN,
    repo: process.env.FEEDBACK_GITHUB_REPO,
    reviewKey: process.env.FEEDBACK_REVIEW_KEY,
    branch: process.env.FEEDBACK_ASSETS_BRANCH,
    siteUrl: process.env.FEEDBACK_SITE_URL,
    allowedOrigin: process.env.FEEDBACK_ALLOWED_ORIGIN
  }),
  /* TODO per site: the locales the pages actually declare, and where the
     owner actually lives. A locale's `label` becomes an issue label — make
     sure it exists in the repo (session 1 synced fr and fa everywhere). */
  locales: [{ prefix: "en", name: "English" }],
  timeZone: "Europe/London"
});

export const GET = handler.GET;
export const POST = handler.POST;
