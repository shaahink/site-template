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
/** Whether a section is on the site.
    ---------------------------------------------------------------------------
    Put it on the sections that can genuinely come and go, and *only* on those.
    PLAN §3.9 draws the line here: whether a section the designer built appears
    at all is content and therefore the owner's; creating one, moving one, or
    changing how it looks is still a content-request issue.

    Deciding the list is per-site work, and it is judgement rather than a
    default. A hero, an about block and a contact block are what a page *is*; a
    seasonal offer, a gallery, a set of collaborators, anything advertising
    something that might end — those are what an owner wants a switch for.

    Defaulting to true means no content file needs changing and a section
    *without* the field simply cannot be hidden, which is the safe answer for
    anything structural. The editor lifts it out of the form and draws it as a
    switch at the head of the section, so it never sits among the words.

    It is on `notes` below so the pattern is here and working. Delete that
    section or keep it; keep the shape either way. */
export const visible = z.boolean().default(true);

/** A picture.
    ---------------------------------------------------------------------------
    **Spell it exactly like this and the owner gets a photo picker for free.**
    The kit recognises a picture from its shape — a `src` string beside `w` and
    `h` integers — rather than from anything a site declares, so a new site
    inherits the picker by following the convention. Choosing a photograph
    scales it in the browser, writes the file and both sizes, and holds Save
    until `alt` has been written.

    `w`/`h` belong in `omit` below. They are structure wearing a number's
    clothing and the layouts depend on them; omitting them hides them from the
    form, not from the picker, which reads this schema.

    Two shapes the picker cannot serve, and both exist in the fleet: images
    behind `astro:assets` (nimagiti), where the YAML holds a path Astro
    resolves inside the build; and pre-built responsive variants (elfine),
    where a new photograph would need a `srcset` of several files that do not
    exist yet. Either is a fine choice — `omit` the image field and leave new
    photographs to a content-request issue — but if the site can use this
    shape, use this shape. */
export const picture = z.object({
  src: z.string(),
  alt: z.string().default(""),
  w: z.number().int().positive(),
  h: z.number().int().positive()
});

export const homePageSchema = z.object({
  meta,
  hero: z.object({
    title: z.string(),
    tagline: z.string().meta({ title: "Tagline under the title" })
  }),
  /* A section that can be turned off — the working example of the pattern.
     index.astro renders it through `isVisible`, and a site that grows a nav
     filters that nav's links through `visibleOnly`. */
  notes: z.object({
    visible,
    title: z.string(),
    body: z.string().meta({ title: "The paragraph" })
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
