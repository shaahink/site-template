/* Rewrites every content file in its normalized form. Run: npm run content.
   ---------------------------------------------------------------------------
   The editor writes YAML back through `yaml`'s document API, which preserves
   comments and each scalar's style but emits its own line breaks. Against a
   hand-authored file that means the first save reflows unrelated long lines
   and buries the owner's actual change in a hundred-line diff — which would
   defeat the point, since reviewing those edits as readable diffs is the
   safety net under the whole feature.

   So the reflow happens once, here, in its own reviewed commit. After it,
   `normalize()` is a fixed point and every editor write is minimal.

   CI runs this and diffs, the same way it does for vercel.json: a hand edit
   that un-normalizes a file fails the build instead of quietly waiting to
   ambush the next owner edit. */

import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { normalize } from "@shaahink/sitekit/cms";

const root = new URL("../src/content/", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, out);
    else if (/\.ya?ml$/.test(name)) out.push(path);
  }
  return out;
}

let changed = 0;
for (const file of walk(root)) {
  /* Windows checkouts are CRLF because core.autocrlf converts on the way out,
     but git stores LF and the editor reads and writes through GitHub's
     Contents API, which deals in the stored bytes. Normalize in that form, and
     write it back that way — git converts again on checkout. */
  const source = readFileSync(file, "utf8").replace(/\r\n/g, "\n");
  const output = normalize(source);
  if (output === source) continue;
  writeFileSync(file, output, "utf8");
  changed++;
}

console.log(
  changed === 0 ? "content already normalized" : `content normalized: ${changed} file(s) rewritten`
);
