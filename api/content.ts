/* The editor's content endpoint — the edge.
   ---------------------------------------------------------------------------
   Reads and writes the site's own YAML through the GitHub Contents API, so the
   owner's save becomes a commit and the commit becomes a deploy. The schemas
   come from src/content/schema.ts — the same ones the build validates against,
   which is the whole reason they were split out of content.config.ts: this
   file could never import `astro:content`.

   The GitHub credential is the **sk-feedback App**, reused deliberately
   (session 7, Decision 3). It already holds Contents: read/write on this repo,
   so no second registration, no second key, nothing more to rotate. The
   consequence is that content commits are authored by `sk-feedback[bot]`,
   which reads oddly next to "the owner edited home.yaml" — see CMS.md, where it is
   written down so it never looks like a mistake.

   Environment variables (Vercel → Settings → Environment Variables):
     CMS_ALLOWLIST          required  comma-separated Google emails and/or subs
     CMS_SESSION_SECRET     required  the same HMAC key api/auth.ts signs with
     FEEDBACK_GITHUB_APP_ID              ┐ already present for feedback;
     FEEDBACK_GITHUB_APP_PRIVATE_KEY     │ reused as-is. Key must be PKCS#8.
     FEEDBACK_GITHUB_APP_INSTALLATION_ID ┘
     FEEDBACK_GITHUB_REPO   required  e.g. "shaahink/<this-repo>"
     CMS_BRANCH             optional  defaults to the repo's default branch
     FEEDBACK_ALLOWED_ORIGIN optional one extra origin allowed to post
   ------------------------------------------------------------------------ */

import { createContentHandler } from "@shaahink/sitekit/cms";
import { editable } from "../src/content/schema.js";

const handler = createContentHandler({
  collections: editable,
  env: () => ({
    allowlist: process.env.CMS_ALLOWLIST,
    sessionSecret: process.env.CMS_SESSION_SECRET,
    appId: process.env.FEEDBACK_GITHUB_APP_ID,
    appPrivateKey: process.env.FEEDBACK_GITHUB_APP_PRIVATE_KEY,
    appInstallationId: process.env.FEEDBACK_GITHUB_APP_INSTALLATION_ID,
    repo: process.env.FEEDBACK_GITHUB_REPO,
    branch: process.env.CMS_BRANCH,
    allowedOrigin: process.env.FEEDBACK_ALLOWED_ORIGIN
  }),
  userAgent: "site-editor"
});

export const GET = handler.GET;
export const POST = handler.POST;
