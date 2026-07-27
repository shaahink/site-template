/* Regenerates vercel.json from headers.config.mjs. Run: npm run headers.
   The output is committed — deploys never run this. No splice here: the
   framework/outputDirectory keys ride the kit's `vercel` passthrough
   (sitekit 0.2.0). */

import { writeFileSync } from "node:fs";
import { vercelJson } from "@shaahink/sitekit/headers";
import config from "../headers.config.mjs";

const target = new URL("../vercel.json", import.meta.url);
writeFileSync(target, vercelJson(config));
console.log("vercel.json regenerated from headers.config.mjs");
