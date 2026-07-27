/* Regenerates vercel.json from headers.config.mjs. Run: npm run headers.
   The output is committed — deploys never run this.

   The two build keys are added here because the kit's emitter does not carry
   them yet — they belong in a HostConfig `vercel` passthrough in sitekit
   0.2.0, and this splice disappears when that ships. The house formatting
   (one line per header pair) has to survive the round-trip, hence the
   re-application of the emitter's own regex. */

import { writeFileSync } from "node:fs";
import { vercelJson } from "@shaahink/sitekit/headers";
import config from "../headers.config.mjs";

const emitted = JSON.parse(vercelJson(config));

const out = {
  "$schema": emitted["$schema"],
  framework: "astro",
  outputDirectory: "dist",
  ...emitted
};

const text = JSON.stringify(out, null, 2).replace(
  /\{\n\s+"key": (".*"),\n\s+"value": (".*")\n\s+\}/g,
  '{ "key": $1, "value": $2 }'
);

const target = new URL("../vercel.json", import.meta.url);
writeFileSync(target, text + "\n");
console.log("vercel.json regenerated from headers.config.mjs");
