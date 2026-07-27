/* The content model. Everything an owner might one day edit lives in
   src/content as YAML, validated here — the CMS session generates its editor
   from these schemas, so shape each field for that: strings the owner would
   recognise, numbers only where the layout needs them.

   This file starts with one page collection as the pattern. Grow it to match
   the content the site actually has — not the CMS you can imagine
   (sessions/03-astro-pilot.md in shaahink/drydock, "Schema overreach").

   Bilingual sites keep one schema and per-locale entries — home.en.yaml and
   home.fr.yaml, looked up as `home.${locale}`. Pass generateId to the glob
   loader for dotted names: the default id generator slugs "home.fr" into
   "homefr" (elfine, session 4):

     loader: glob({ pattern: "home.*.yaml", base: "./src/content/pages",
                    generateId: ({ entry }) => entry.replace(/\.yaml$/, "") })

   Localized alt texts and aria labels are content too — the French page
   describes photographs in French. */

import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "zod";

/** Per-page <head> facts. og fields feed the social cards. */
const meta = z.object({
  title: z.string(),
  description: z.string(),
  ogType: z.string().default("website"),
  ogDescription: z.string(),
  ogImage: z.string().optional(),
  canonical: z.string()
});

const homePage = defineCollection({
  loader: glob({ pattern: "home.yaml", base: "./src/content/pages" }),
  schema: z.object({
    meta,
    hero: z.object({
      title: z.string(),
      tagline: z.string()
    })
  })
});

export const collections = { homePage };
