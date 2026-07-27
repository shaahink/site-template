/* Review mode — screenshot proxy
   ---------------------------------------------------------------------------
   Serves screenshots from the feedback-assets branch so GitHub can render
   them inside this private repo's issues. Logic in @shaahink/sitekit/shot;
   this file only wires the environment in.
   ------------------------------------------------------------------------ */

import { createShotHandler } from "@shaahink/sitekit/shot";

const handler = createShotHandler({
  env: () => ({
    token: process.env.FEEDBACK_GITHUB_TOKEN,
    repo: process.env.FEEDBACK_GITHUB_REPO,
    branch: process.env.FEEDBACK_ASSETS_BRANCH
  })
});

export const GET = handler.GET;
