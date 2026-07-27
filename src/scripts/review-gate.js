/* Review mode gate — the only feedback code a public visitor ever runs.
   Arriving with ?review=<key> turns review mode on (persisted so navigation
   and reloads keep it); ?review=off turns it back off. The widget itself is a
   separate chunk that only review mode ever fetches — the public downloads
   nothing and sees nothing. */
const STORE = "review-mode-key";

try {
  const asked = new URLSearchParams(location.search).get("review");
  if (asked !== null) {
    if (asked && asked !== "off") localStorage.setItem(STORE, asked);
    else localStorage.removeItem(STORE);
  }
  if (localStorage.getItem(STORE)) import("./feedback-chrome.js");
} catch {
  /* private browsing — review mode just stays off */
}
