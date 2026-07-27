/* The sitemap, generated at build from the same content that drives the
   pages — the canonicals in src/content/pages are the single list of URLs
   this site claims, and astro.config's `site` is the only place the origin
   lives. Grow the metas list as the site grows page collections; each one
   already carries the canonical this file needs. */

import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { absolute, sitemap } from "@shaahink/sitekit/seo";

export const GET: APIRoute = async ({ site }) => {
  const metas = [(await getCollection("homePage"))[0]!.data.meta];
  const xml = sitemap(metas.map((meta) => ({ loc: absolute(site!, meta.canonical) })));
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
};
