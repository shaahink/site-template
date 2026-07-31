/* Unlocking the editor with this device — the edge.
   ---------------------------------------------------------------------------
   The machinery lives in @shaahink/sitekit/cms. This file reads this
   deployment's environment and passes values in, so the kit itself never
   touches process.env and the host stays swappable — the same shape as
   api/auth.ts beside it.

     POST {action:"state"}             has this browser got a credential here
     POST {action:"register-options"}  begin enrolling — needs a live session
     POST {action:"register-verify"}   finish enrolling
     POST {action:"auth-options"}      begin unlocking
     POST {action:"auth-verify"}       finish unlocking, and get a session
     POST {action:"forget"}            drop this device's credential

   It is **not a second authority**. Enrolment requires a session this site
   already issued, and every unlock re-checks CMS_ALLOWLIST at that moment —
   take somebody off the list and their passkey stops opening the door on the
   next attempt. It removes a round trip through Google; it grants nothing.

   There is no database, by the hard rule and by preference: the credential
   record rides a cookie this server signs with the session secret, which
   makes it unforgeable, bound to the one device that enrolled it, and
   useless if stolen.

   Environment variables — both already set on this project for the editor:
     CMS_ALLOWLIST        required  who may edit — re-checked on every unlock
     CMS_SESSION_SECRET   required  signs the session, and this credential
   ------------------------------------------------------------------------ */

import { createPasskeyHandler } from "@shaahink/sitekit/cms";

const handler = createPasskeyHandler({
  env: () => ({
    allowlist: process.env.CMS_ALLOWLIST,
    sessionSecret: process.env.CMS_SESSION_SECRET
  })
});

export const POST = handler.POST;
