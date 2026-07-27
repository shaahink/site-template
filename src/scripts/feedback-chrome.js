/* Review mode — client feedback widget (this site's chrome)
   ---------------------------------------------------------------------------
   The chrome: strings, palette, DOM and interaction — everything a visitor
   sees, which stays this site's own (feedback-chrome.css carries a
   deliberately neutral palette — restyle it in this site's terms). The mechanics — element refinement, CSS paths,
   context extraction, image downscaling, the POST envelope — come from
   @shaahink/sitekit/widget.

   Nothing here is bundled for the public: review-gate.js dynamic-imports this
   module only when review mode is on, so Astro splits it into a chunk that
   only reviewers ever fetch.

   Talks to:  POST /api/feedback   (see api/feedback.js)
   Storage:   localStorage["review-mode-key"]  — set by the gate
              localStorage["review-mode-name"] — remembered commenter name
   ------------------------------------------------------------------------ */

import {
  refine,
  describe,
  context,
  shrink,
  buildPayload,
  postFeedback,
  squash,
  clamp
} from "@shaahink/sitekit/widget";

import "./feedback-chrome.css";

(function () {
  "use strict";

  var KEY_STORE = "review-mode-key";
  var NAME_STORE = "review-mode-name";
  var ENDPOINT = "/api/feedback";

  var reviewKey = read(KEY_STORE);
  if (!reviewKey) return;

  /* Tidy the URL so he isn't looking at ?review=... the whole visit. The key
     already lives in localStorage, so navigation and reloads keep working. */
  if (/[?&]review=/.test(location.search)) {
    var url = new URL(location.href);
    url.searchParams.delete("review");
    history.replaceState(null, "", url.pathname + url.search + url.hash);
  }

  /* ---------- Strings ------------------------------------------------------
     This site is English-only, so the widget is too. */

  var T = {
    comment: "Comment",
    picking: "Tap whatever you mean",
    cancel: "Cancel",
    wholePage: "Comment on the whole page",
    exit: "Leave review mode",
    placeholder: "What’s on your mind?",
    namePlaceholder: "Your first name",
    photo: "Add a photo",
    photoHint: "or paste a screenshot",
    remove: "Remove",
    send: "Send",
    sending: "Sending…",
    sent: "Sent — thank you!",
    sentTitle: "Sent!",
    sentBody: "Your note landed with Shahin. Keep going — leave as many as you like.",
    failed: "Couldn’t send that.",
    copy: "Copy the text",
    copied: "Copied",
    broaden: "Select more",
    wholePageLabel: "Whole page",
    tooBig: "That image is too heavy — try a smaller one.",
    badImage: "Couldn’t read that image.",
    empty: "Write something first.",
    intro: "Review mode — tap anything to leave a note.",
    countOne: "1 note sent",
    countMany: "{n} notes sent"
  };

  /* How the kit's pickers see this site: ignore our own chrome, and label
     whole-page notes plainly. Landmark selectors stay on the kit defaults,
     which this site's section[id] + h2 structure matches. */
  var PICK_OPTS = { exclude: isOurs };
  var CTX_OPTS = { wholePageLabel: T.wholePageLabel };

  /* ---------- Boot ---------------------------------------------------------- */

  var root, bar, barLabel, barBadge, menu, highlight, highlightTag, pinLayer, toastEl;
  var picking = false, sheet = null, sent = [];

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", build);
  } else {
    build();
  }

  function build() {
    root = el("div", "rv-root");
    root.setAttribute("role", "region");
    root.setAttribute("aria-label", "Review mode");

    pinLayer = el("div", "rv-pins");
    root.appendChild(pinLayer);

    bar = el("div", "rv-bar");
    var main = el("button", "rv-main");
    main.appendChild(el("span", "rv-dot"));
    barLabel = el("span");
    barLabel.textContent = T.comment;
    main.appendChild(barLabel);
    barBadge = el("span", "rv-badge");
    barBadge.style.display = "none";
    main.appendChild(barBadge);
    main.addEventListener("click", function () {
      closeMenu();
      picking ? stopPicking() : startPicking();
    });

    var more = el("button", "rv-more");
    more.textContent = "▾";
    more.setAttribute("aria-label", "More");
    more.addEventListener("click", function (e) {
      e.stopPropagation();
      menu ? closeMenu() : openMenu();
    });

    bar.appendChild(main);
    bar.appendChild(more);
    root.appendChild(bar);
    document.body.appendChild(root);

    toast(T.intro, 3600);
  }

  /* ---------- Menu ---------------------------------------------------------- */

  function openMenu() {
    menu = el("div", "rv-menu");

    if (sent.length) {
      var count = el("div", "rv-count");
      count.textContent = sent.length === 1
        ? T.countOne
        : T.countMany.replace("{n}", String(sent.length));
      menu.appendChild(count);
    }

    menu.appendChild(menuItem(T.wholePage, function () {
      closeMenu();
      openComposer(null, null);
    }));
    menu.appendChild(menuItem(T.exit, function () {
      closeMenu();
      remove(KEY_STORE);
      location.reload();
    }));

    root.appendChild(menu);
    setTimeout(function () { document.addEventListener("click", closeMenu, { once: true }); }, 0);
  }

  function menuItem(label, onClick) {
    var b = el("button");
    b.textContent = label;
    b.addEventListener("click", onClick);
    return b;
  }

  function closeMenu() {
    if (menu) { menu.remove(); menu = null; }
  }

  /* ---------- Picking an element -------------------------------------------
     Capture-phase listeners so a tap on a link opens the composer instead of
     navigating. Everything inside .rv-root is ignored. */

  function startPicking() {
    picking = true;
    bar.classList.add("is-picking");
    barLabel.textContent = T.picking;
    document.documentElement.classList.add("rv-picking");

    highlight = el("div", "rv-hl");
    highlightTag = el("div", "rv-hl-tag");
    highlight.appendChild(highlightTag);
    highlight.style.display = "none";
    root.appendChild(highlight);

    document.addEventListener("pointermove", onHover, true);
    document.addEventListener("click", onPick, true);
    document.addEventListener("keydown", onEscape, true);
  }

  function stopPicking() {
    picking = false;
    bar.classList.remove("is-picking");
    barLabel.textContent = T.comment;
    document.documentElement.classList.remove("rv-picking");
    if (highlight) { highlight.remove(); highlight = null; }

    document.removeEventListener("pointermove", onHover, true);
    document.removeEventListener("click", onPick, true);
    document.removeEventListener("keydown", onEscape, true);
  }

  function onEscape(e) {
    if (e.key === "Escape") { e.preventDefault(); stopPicking(); }
  }

  function onHover(e) {
    var target = refine(e.target, PICK_OPTS);
    if (!target) { highlight.style.display = "none"; return; }
    drawHighlight(target);
  }

  function onPick(e) {
    if (isOurs(e.target)) return;
    e.preventDefault();
    e.stopPropagation();

    var target = refine(e.target, PICK_OPTS);
    if (!target) return;

    var point = { x: e.clientX + window.scrollX, y: e.clientY + window.scrollY };
    stopPicking();
    openComposer(target, point);
  }

  function isOurs(node) {
    return !!(node && node.closest && node.closest(".rv-root"));
  }

  function drawHighlight(target) {
    var rect = target.getBoundingClientRect();
    highlight.style.display = "block";
    highlight.style.left = rect.left + "px";
    highlight.style.top = rect.top + "px";
    highlight.style.width = rect.width + "px";
    highlight.style.height = rect.height + "px";
    highlightTag.textContent = describe(target);
  }

  /* ---------- Composer ------------------------------------------------------ */

  function openComposer(target, point) {
    closeComposer();

    var ctx = context(target, CTX_OPTS);
    var image = null;

    var scrim = el("div", "rv-scrim");
    scrim.addEventListener("click", closeComposer);

    var box = el("div", "rv-sheet");
    box.addEventListener("click", function (e) { e.stopPropagation(); });

    /* Context strip — what you're commenting on, plus a way to widen it. */
    var ctxRow = el("div", "rv-ctx");
    var ctxText = el("div", "rv-ctx-text");
    ctxRow.appendChild(ctxText);

    var upBtn = null;
    if (target) {
      upBtn = el("button", "rv-up");
      upBtn.textContent = "⤴";
      upBtn.title = T.broaden;
      upBtn.setAttribute("aria-label", T.broaden);
      upBtn.addEventListener("click", function () {
        var parent = target.parentElement;
        if (!parent || parent === document.body) return;
        target = parent;
        ctx = context(target, CTX_OPTS);
        paintCtx();
        flash(target);
      });
      ctxRow.appendChild(upBtn);
    }

    function paintCtx() {
      ctxText.innerHTML = "";
      /* Picking a section heading makes section and label the same string —
         show it once rather than "Works › Works". */
      var label = squash(ctx.label, 60);
      var showLabel = label && label !== squash(ctx.section, 60);

      if (ctx.section) {
        var lead = el("span");
        lead.textContent = ctx.section + (showLabel ? " › " : "");
        ctxText.appendChild(lead);
      }
      if (showLabel || (!ctx.section && label)) {
        var strong = el("b");
        strong.textContent = label;
        ctxText.appendChild(strong);
      }
      if (!ctx.section && !label) ctxText.textContent = ctx.tag || T.wholePageLabel;
    }
    paintCtx();
    box.appendChild(ctxRow);

    /* Fields */
    var body = el("div", "rv-body");

    var textarea = document.createElement("textarea");
    textarea.placeholder = T.placeholder;
    textarea.maxLength = 5000;
    body.appendChild(textarea);

    var attachRow = el("div", "rv-attach");
    var fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.style.display = "none";

    var attachBtn = el("button", "rv-attach-btn");
    attachBtn.type = "button";
    attachBtn.textContent = "📷 " + T.photo;
    attachBtn.addEventListener("click", function () { fileInput.click(); });

    var hint = el("span");
    hint.textContent = T.photoHint;

    var thumbWrap = el("span", "rv-thumb");
    thumbWrap.style.display = "none";
    var thumbImg = document.createElement("img");
    var thumbX = el("button");
    thumbX.textContent = "×";
    thumbX.title = T.remove;
    thumbX.setAttribute("aria-label", T.remove);
    thumbX.addEventListener("click", clearImage);
    thumbWrap.appendChild(thumbImg);
    thumbWrap.appendChild(thumbX);

    attachRow.appendChild(attachBtn);
    attachRow.appendChild(thumbWrap);
    attachRow.appendChild(hint);
    attachRow.appendChild(fileInput);
    body.appendChild(attachRow);

    var nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.placeholder = T.namePlaceholder;
    nameInput.maxLength = 60;
    nameInput.value = read(NAME_STORE) || "";
    if (!nameInput.value) body.appendChild(nameInput);

    /* Honeypot — invisible to people, tempting to bots. */
    var trap = document.createElement("input");
    trap.type = "text";
    trap.name = "website";
    trap.tabIndex = -1;
    trap.setAttribute("aria-hidden", "true");
    trap.autocomplete = "off";
    trap.style.cssText = "position:absolute;left:-9999px;width:1px;height:1px;opacity:0";
    body.appendChild(trap);

    box.appendChild(body);

    var foot = el("div", "rv-foot");
    var cancel = el("button", "rv-ghost");
    cancel.textContent = T.cancel;
    cancel.addEventListener("click", closeComposer);
    var msg = el("span", "rv-msg");
    var send = el("button", "rv-send");
    send.textContent = T.send;
    send.addEventListener("click", submit);
    foot.appendChild(cancel);
    foot.appendChild(msg);
    foot.appendChild(send);
    box.appendChild(foot);

    root.appendChild(scrim);
    root.appendChild(box);
    sheet = { scrim: scrim, box: box };

    position(box, point);
    setTimeout(function () { textarea.focus(); }, 30);

    /* Keep the sheet above the on-screen keyboard on phones. */
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", onViewport);
      sheet.onViewport = onViewport;
    }
    function onViewport() {
      if (window.innerWidth > 640) return;
      var vv = window.visualViewport;
      box.style.transform = "translateY(-" + Math.max(0, window.innerHeight - vv.height - vv.offsetTop) + "px)";
    }

    /* Paste a screenshot straight in — the fastest path on a laptop. */
    box.addEventListener("paste", function (e) {
      var items = (e.clipboardData || {}).items || [];
      for (var i = 0; i < items.length; i++) {
        if (items[i].type && items[i].type.indexOf("image/") === 0) {
          e.preventDefault();
          loadImage(items[i].getAsFile());
          return;
        }
      }
    });

    ["dragenter", "dragover"].forEach(function (name) {
      box.addEventListener(name, function (e) { e.preventDefault(); box.classList.add("rv-drop"); });
    });
    ["dragleave", "drop"].forEach(function (name) {
      box.addEventListener(name, function (e) { e.preventDefault(); box.classList.remove("rv-drop"); });
    });
    box.addEventListener("drop", function (e) {
      var file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (file) loadImage(file);
    });

    fileInput.addEventListener("change", function () {
      if (fileInput.files && fileInput.files[0]) loadImage(fileInput.files[0]);
    });

    function loadImage(file) {
      if (!file || file.type.indexOf("image/") !== 0) return;
      note("");
      shrink(file).then(function (dataUrl) {
        image = dataUrl;
        thumbImg.src = dataUrl;
        thumbWrap.style.display = "";
        attachBtn.style.display = "none";
        hint.style.display = "none";
      }).catch(function (error) {
        note(error && error.message === "too big" ? T.tooBig : T.badImage);
      });
    }

    function clearImage() {
      image = null;
      fileInput.value = "";
      thumbWrap.style.display = "none";
      attachBtn.style.display = "";
      hint.style.display = "";
    }

    function note(text) { msg.textContent = text || ""; }

    function submit() {
      var comment = textarea.value.trim();
      if (!comment) { note(T.empty); textarea.focus(); return; }

      var name = nameInput.value.trim();
      if (name) write(NAME_STORE, name);

      send.disabled = true;
      send.textContent = T.sending;
      note("");

      var payload = buildPayload({
        key: reviewKey,
        website: trap.value,
        comment: comment,
        name: name || read(NAME_STORE) || "",
        image: image,
        target: ctx
      });

      postFeedback(ENDPOINT, payload).then(function () {
        sent.push(comment);
        if (point) dropPin(point, sent.length, comment);
        bumpBadge();
        buzz();
        showSuccess(comment);
      }).catch(function (error) {
        send.disabled = false;
        send.textContent = T.send;
        note(T.failed + " " + (error.message || ""));
        offerCopy(foot, comment, ctx);
      });
    }

    /* Swap the whole sheet for a confirmation. A toast alone is too easy to
       miss on a phone, and "did that send?" is the one question this tool
       must never leave open. */
    function showSuccess(comment) {
      ctxRow.remove();
      body.remove();
      foot.remove();

      var done = el("div", "rv-done");
      var check = el("div", "rv-check");
      check.innerHTML = '<svg viewBox="0 0 28 28" aria-hidden="true"><path d="M6 14.5l5.5 5.5L22 8.5"/></svg>';
      done.appendChild(check);

      var title = el("h3");
      title.textContent = T.sentTitle;
      done.appendChild(title);

      var blurb = el("p");
      blurb.textContent = T.sentBody;
      done.appendChild(blurb);

      var quote = el("div", "rv-done-quote");
      quote.textContent = "“" + squash(comment, 130) + "”";
      done.appendChild(quote);

      done.appendChild(el("div", "rv-done-bar"));

      box.setAttribute("role", "status");
      box.setAttribute("aria-live", "polite");
      box.appendChild(done);
      position(box, point);

      setTimeout(function () {
        closeComposer();
        toast(T.sent, 2600);
      }, 2000);
    }
  }

  function bumpBadge() {
    barBadge.textContent = String(sent.length);
    barBadge.style.display = "";
    barBadge.classList.remove("is-new");
    void barBadge.offsetWidth;
    barBadge.classList.add("is-new");
  }

  function buzz() {
    try { if (navigator.vibrate) navigator.vibrate(18); } catch (e) { /* unsupported */ }
  }

  function closeComposer() {
    if (!sheet) return;
    if (sheet.onViewport && window.visualViewport) {
      window.visualViewport.removeEventListener("resize", sheet.onViewport);
    }
    sheet.scrim.remove();
    sheet.box.remove();
    sheet = null;
  }

  /* Desktop: anchor the card near the click, clamped inside the viewport.
     Phones get the bottom-sheet layout from CSS, so skip it. */
  function position(box, point) {
    if (window.innerWidth <= 640) return;
    var width = Math.min(380, window.innerWidth - 32);
    var height = box.offsetHeight || 300;
    var x = point ? point.x - window.scrollX + 16 : window.innerWidth / 2 - width / 2;
    var y = point ? point.y - window.scrollY + 16 : window.innerHeight / 2 - height / 2;
    box.style.left = clamp(x, 16, window.innerWidth - width - 16) + "px";
    box.style.top = clamp(y, 16, Math.max(16, window.innerHeight - height - 16)) + "px";
  }

  /* If the network is down, never swallow what was written. */
  function offerCopy(foot, comment, ctx) {
    if (foot.querySelector(".rv-copy")) return;
    var copy = el("button", "rv-ghost rv-copy");
    copy.textContent = T.copy;
    copy.addEventListener("click", function () {
      var text = comment + "\n\n— " + (ctx.section || "") + " " + (ctx.label || "") + "\n" + location.href;
      (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).then(function () {
        copy.textContent = T.copied;
      }).catch(function () {
        window.prompt(T.copy, text);
      });
    });
    foot.insertBefore(copy, foot.firstChild);
  }

  /* ---------- Pins ---------------------------------------------------------- */

  function dropPin(point, index, comment) {
    var pin = el("div", "rv-pin");
    pin.textContent = String(index);
    pin.title = comment;
    pin.style.left = point.x + "px";
    pin.style.top = point.y + "px";
    /* Pins sit in document space, so track the page as it scrolls. */
    pinLayer.style.position = "fixed";
    pin.style.position = "fixed";
    reposition();
    window.addEventListener("scroll", reposition, { passive: true });
    function reposition() {
      pin.style.left = (point.x - window.scrollX) + "px";
      pin.style.top = (point.y - window.scrollY) + "px";
    }
    pinLayer.appendChild(pin);
  }

  function flash(target) {
    var rect = target.getBoundingClientRect();
    var box = el("div", "rv-hl");
    box.style.left = rect.left + "px";
    box.style.top = rect.top + "px";
    box.style.width = rect.width + "px";
    box.style.height = rect.height + "px";
    root.appendChild(box);
    setTimeout(function () { box.remove(); }, 550);
  }

  /* ---------- Toast --------------------------------------------------------- */

  function toast(text, ms) {
    if (toastEl) toastEl.remove();
    toastEl = el("div", "rv-toast");
    toastEl.textContent = text;
    root.appendChild(toastEl);
    var mine = toastEl;
    setTimeout(function () { if (mine === toastEl) { mine.remove(); toastEl = null; } }, ms || 3000);
  }

  /* ---------- Small helpers ------------------------------------------------- */

  function el(tag, className) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    return node;
  }

  function read(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  }

  function write(key, value) {
    try { localStorage.setItem(key, value); } catch (e) { /* private mode */ }
  }

  function remove(key) {
    try { localStorage.removeItem(key); } catch (e) { /* private mode */ }
  }
})();
