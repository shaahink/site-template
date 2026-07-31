/* The editor's sign-in — the edge.
   ---------------------------------------------------------------------------
   The machinery lives in @shaahink/sitekit/cms. This file reads this
   deployment's environment and passes values in, so the kit itself never
   touches process.env and the host stays swappable — the same shape as
   api/feedback.js.

     GET     what the page needs to render a way in — which paths exist, and
             the client ID (public by design; Google's own examples put it in
             the HTML)
     GET  ?handoff=1&to=…    start the fleet hand-off (session 22)
     GET  ?ticket=…&state=…  come back from it, with a session
     POST    a Google ID token in, a session cookie back
     DELETE  sign out

   Environment variables (Vercel → Settings → Environment Variables):
     CMS_GOOGLE_CLIENT_ID   required  ends .apps.googleusercontent.com
     CMS_ALLOWLIST          required  comma-separated Google emails and/or subs
     CMS_SESSION_SECRET     required  HMAC key; rotating it signs everyone out
     CMS_AUTH_ORIGIN        optional  the fleet's sign-in origin — whoever
                                      mounts api/handoff.ts. The same string on
                                      every site in the fleet. Unset, this site
                                      offers only Google's button directly,
                                      which needs this exact origin registered
                                      in the Google console
     FEEDBACK_ALLOWED_ORIGIN optional one extra origin allowed to post
   ------------------------------------------------------------------------ */

import { createAuthHandler } from "@shaahink/sitekit/cms";

const handler = createAuthHandler({
  env: () => ({
    googleClientId: process.env.CMS_GOOGLE_CLIENT_ID,
    allowlist: process.env.CMS_ALLOWLIST,
    sessionSecret: process.env.CMS_SESSION_SECRET,
    authOrigin: process.env.CMS_AUTH_ORIGIN,
    allowedOrigin: process.env.FEEDBACK_ALLOWED_ORIGIN
  })
});

export const GET = handler.GET;
export const POST = handler.POST;
export const DELETE = handler.DELETE;
