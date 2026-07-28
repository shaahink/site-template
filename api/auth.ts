/* The editor's sign-in — the edge.
   ---------------------------------------------------------------------------
   The machinery lives in @shaahink/sitekit/cms. This file reads this
   deployment's environment and passes values in, so the kit itself never
   touches process.env and the host stays swappable — the same shape as
   api/feedback.js.

     GET     what the page needs to render a sign-in button (the client ID is
             public by design; Google's own examples put it in the HTML)
     POST    a Google ID token in, a session cookie back
     DELETE  sign out

   Environment variables (Vercel → Settings → Environment Variables):
     CMS_GOOGLE_CLIENT_ID   required  ends .apps.googleusercontent.com
     CMS_ALLOWLIST          required  comma-separated Google emails and/or subs
     CMS_SESSION_SECRET     required  HMAC key; rotating it signs everyone out
     FEEDBACK_ALLOWED_ORIGIN optional one extra origin allowed to post
   ------------------------------------------------------------------------ */

import { createAuthHandler } from "@shaahink/sitekit/cms";

const handler = createAuthHandler({
  env: () => ({
    googleClientId: process.env.CMS_GOOGLE_CLIENT_ID,
    allowlist: process.env.CMS_ALLOWLIST,
    sessionSecret: process.env.CMS_SESSION_SECRET,
    allowedOrigin: process.env.FEEDBACK_ALLOWED_ORIGIN
  })
});

export const GET = handler.GET;
export const POST = handler.POST;
export const DELETE = handler.DELETE;
