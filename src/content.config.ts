/* The Astro half of the content model.
   ---------------------------------------------------------------------------
   The schemas live in src/content/schema.ts with Zod as their only import;
   this file pairs each with the loader that finds its files. The split is what
   lets the editor's Vercel function import the same schemas the build validates
   against — `astro:content` and `astro/loaders` only exist inside Astro's
   build, so a function can never reach them. See CMS.md.

   Adding a collection touches three places: the schema in schema.ts, the loader
   here, and an entry in schema.ts's `editable` map so the editor can find its
   file. Miss the third and the collection simply isn't editable — which is a
   legitimate choice, not an error.

   If the site puts images through astro:assets, hand `image()` to the schema
   here — `schema: ({ image }) => pageSchema(image)`. See nimagiti. */

import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { homePageSchema } from "./content/schema.js";

const homePage = defineCollection({
  loader: glob({ pattern: "home.yaml", base: "./src/content/pages" }),
  schema: homePageSchema
});

export const collections = { homePage };
