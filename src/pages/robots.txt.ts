/* robots.txt, generated so the sitemap URL tracks astro.config's `site`.
   /api/ is the feedback and editor machinery; /edit is the owner's editor,
   which is behind Google sign-in and has no public content — neither is
   anything a crawler should index. A site that builds with format "file" serves
   the editor at /edit.html and must say that here instead. */

import type { APIRoute } from "astro";
import { absolute, robots } from "@shaahink/sitekit/seo";

export const GET: APIRoute = ({ site }) =>
  new Response(robots({ sitemap: absolute(site!, "/sitemap.xml"), disallow: ["/api/", "/edit"] }), {
    headers: { "Content-Type": "text/plain; charset=utf-8" }
  });
