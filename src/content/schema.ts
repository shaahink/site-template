/* The content model. Everything an owner might one day edit lives in
   src/content as YAML, validated by these schemas — the editor generates
   itself from them, so shape each field for that: strings the owner would
   recognise, numbers only where the layout needs them.

   This file starts with one page collection as the pattern. Grow it to match
   the content the site actually has — not the CMS you can imagine
   (sessions/03-astro-pilot.md in shaahink/drydock, "Schema overreach").

   **Zod is the only import here, and that is the point.** content.config.ts
   wraps these in defineCollection() for the build; api/content.ts imports them
   directly for the editor. That second path is why the split exists:
   `astro:content` and `astro/loaders` are virtual modules that exist only
   inside Astro's build, and a site is a static build plus plain Vercel
   functions — a function can never import them. Keep this file free of
   anything Astro-shaped.

   That includes `image()`. If the site puts images through astro:assets, the
   validator only exists inside the build, so take the image type as a generic
   parameter and instantiate the schema twice — with `image()` in
   content.config.ts, with `z.string()` here. Generic, not `() => z.ZodType`: a
   widened return type erases ImageMetadata and every component reading
   `.width` off the parsed value stops typechecking. nimagiti does this; see
   its src/content/schema.ts.

   Bilingual sites keep one schema and per-locale entries — home.en.yaml and
   home.fr.yaml, looked up as `home.${locale}`. Pass generateId to the glob
   loader for dotted names: the default id generator slugs "home.fr" into
   "homefr" (elfine, session 4). Give each entry a name in `entryLabels` below,
   because "home.fr" only reads as "the French page" to someone who already
   knows.

   Localized alt texts and aria labels are content too — the French page
   describes photographs in French. */

import { z } from "zod";

/** Per-page <head> facts. og fields feed the social cards. */
export const meta = z.object({
  title: z.string(),
  description: z.string(),
  ogType: z.string().default("website"),
  ogDescription: z.string(),
  ogImage: z.string().optional(),
  canonical: z.string()
});

/* Name a field with `.meta({ title })` wherever its key is not already a word
   the owner would use. This is not cosmetic: the inline editor puts the label
   in the bar as "Changing {label}" while they type, and that sentence is the
   whole of what tells them which piece of text they have their finger on. A
   key like `p1`, `sub`, `cta` or `fa` produces "Changing P1" — a programmer's
   shorthand handed to a client. The keys themselves stay as they are, because
   they are what the YAML files spell. */
export const homePageSchema = z.object({
  meta,
  hero: z.object({
    title: z.string(),
    tagline: z.string().meta({ title: "Tagline under the title" })
  })
});

/* Which YAML file backs which collection, for the editor.
   ---------------------------------------------------------------------------
   Astro's loaders know this too, but only inside the build — the handler needs
   it as plain data. `file` is a collection of exactly one entry; `dir` is one
   file per entry, and `entryLabels` names them.

   `omit` is what an owner should not be able to break from a form: image pixel
   sizes the layout depends on, `srcset` strings, `order` numbers. Anything that
   is structure wearing a value's clothing. Array items are spelled the way the
   form model spells them — `images[].w`, not `images[0].w` — and omitting a
   whole object is usually better than omitting its leaves, or the panel shows
   an empty box with its label still on it. */
export const editable = {
  homePage: {
    label: "Home page",
    schema: homePageSchema,
    file: "src/content/pages/home.yaml",
    /* Where this entry can be seen on the site, so the panel can offer to go
       and edit it on the page itself. It is the only route to inline editing
       that does not involve typing `?edit=1` onto the end of a URL, which is
       to say the only one that exists on a phone — so give every entry one.

       "/" because this template builds with format "directory"; a site with
       format "file" says "/index.html". A directory collection takes a
       pattern instead: entryUrl: "/projects/{entry}". Only site-relative
       paths; the kit drops anything else. */
    entryUrl: "/"
    // omit: ["hero.image.w", "hero.image.h"]
  }
};
