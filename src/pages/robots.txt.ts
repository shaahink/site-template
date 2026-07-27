/* robots.txt, generated so the sitemap URL tracks astro.config's `site`.
   /api/ is the feedback machinery — nothing a crawler should index. */

import type { APIRoute } from "astro";
import { absolute, robots } from "@shaahink/sitekit/seo";

export const GET: APIRoute = ({ site }) =>
  new Response(robots({ sitemap: absolute(site!, "/sitemap.xml"), disallow: ["/api/"] }), {
    headers: { "Content-Type": "text/plain; charset=utf-8" }
  });
