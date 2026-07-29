/* Review mode gate — the only feedback code a public visitor ever runs.
   Arriving with ?review=<key> turns review mode on (persisted so navigation
   and reloads keep it); ?review=off turns it back off. The widget itself is
   the kit's now, and it arrives as its own chunk that only review mode ever
   asks for. Its stylesheet is not so lazy: Astro hoists CSS reachable from a
   page's script graph, so every public page <link>s it. That was true before
   the chrome moved too — the sentence this comment used to end on said the
   opposite, and was measured false on the build that predates all of this. */
const STORE = "review-mode-key";

try {
  const asked = new URLSearchParams(location.search).get("review");
  if (asked !== null) {
    if (asked && asked !== "off") localStorage.setItem(STORE, asked);
    else localStorage.removeItem(STORE);
  }
  /* Both imports dynamic, so neither reaches the bundle every visitor
     downloads; and mountReviewWidget is *called* rather than the module
     bare-imported, because the kit is sideEffects:false and a bare import of a
     side-effecting module is tree-shaken away to nothing. */
  if (localStorage.getItem(STORE)) {
    Promise.all([
      import("@shaahink/sitekit/widget/chrome"),
      import("./feedback-chrome.css")
    ]).then(([widget]) => widget.mountReviewWidget());
  }
} catch {
  /* private browsing — review mode just stays off */
}
