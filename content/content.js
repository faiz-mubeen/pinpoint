/**
 * PinPoint — content script
 * Renders the entire experience inside a closed Shadow DOM so page CSS can't
 * touch it and it can't leak styles into the page.
 *
 * Flow: freeze (screenshot) → point (loupe + pin / box) → ask (streamed,
 * explainable answer) → follow up or re-point.
 */
(() => {
  if (window.__PINPOINT_LOADED__) return;
  window.__PINPOINT_LOADED__ = true;

  // ------------------------------------------------------------ state ----
  const S = {
    open: false,
    shot: null,          // { dataUrl, bitmap, scaleX, scaleY }
    mode: "pin",         // "pin" | "box"
    sel: null,           // { x, y, w, h } in CSS px on the frozen shot
    pinAt: null,         // { x, y } for pin mode
    crop: null,          // dataUrl of padded crop
    port: null,
    history: [],         // [{role, text}]
    busy: false,
    consented: false,
    settings: { hasKey: false, depth: "standard", guidedMode: false, verifyPass: true, privacyBlur: true }
  };

  const PIN_REGION = 190;   // CSS px square captured around a pin
  const MIN_BOX = 24;       // smaller drags are treated as a pin
  const CROP_PAD = 0.14;    // padding added around the selection
  const CROP_MIN_EDGE = 512;
  const FULL_MAX_EDGE = 1568;

  // ------------------------------------------------------------- host ----
  const host = document.createElement("div");
  host.id = "pinpoint-root";
  host.style.cssText = "all:initial; position:fixed; inset:0; z-index:2147483647; display:none;";
  const root = host.attachShadow({ mode: "closed" });
  document.documentElement.appendChild(host);

  const style = document.createElement("style");
  style.textContent = CSS();
  root.appendChild(style);

  const ui = document.createElement("div");
  ui.className = "pp";
  root.appendChild(ui);

  // -------------------------------------------------------- messaging ----
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg?.type === "PINPOINT_OPEN") open();
  });

  async function open() {
    if (S.open) { close(); return; }
    const stored = await chrome.storage.local.get(["pinpointConsent"]);
    S.consented = Boolean(stored.pinpointConsent);
    const res = await chrome.runtime.sendMessage({ type: "PINPOINT_GET_SETTINGS" });
    if (res?.ok) S.settings = res.settings;

    const cap = await chrome.runtime.sendMessage({ type: "PINPOINT_CAPTURE" });
    if (!cap?.ok) { toastOnPage("PinPoint couldn't capture this tab. Some pages (PDF viewers, store pages) block capture."); return; }

    const bitmap = await createImageBitmap(await (await fetch(cap.dataUrl)).blob());
    S.shot = {
      dataUrl: cap.dataUrl,
      bitmap,
      scaleX: bitmap.width / window.innerWidth,
      scaleY: bitmap.height / window.innerHeight
    };
    S.sel = null; S.pinAt = null; S.crop = null; S.history = []; S.busy = false;
    S.open = true;
    document.documentElement.style.overflow = "hidden";
    host.style.display = "block";
    render();
  }

  function close() {
    S.open = false;
    if (S.port) { try { S.port.disconnect(); } catch (_) {} S.port = null; }
    host.style.display = "none";
    document.documentElement.style.overflow = "";
    ui.replaceChildren();
  }

  function toastOnPage(text) {
    host.style.display = "block";
    ui.replaceChildren(el("div", { class: "pp-toast", role: "alert" }, text));
    setTimeout(() => { if (!S.open) host.style.display = "none"; ui.replaceChildren(); }, 3800);
  }

  // ----------------------------------------------------------- render ----
  function render() {
    ui.replaceChildren();

    // Frozen screenshot
    const shot = el("img", { class: "pp-shot", src: S.shot.dataUrl, alt: "" });
    ui.appendChild(shot);

    // Dim veil with spotlight hole (SVG mask)
    ui.appendChild(buildVeil());

    // Selection layer (pins, box, loupe)
    const layer = el("div", { class: "pp-layer", tabindex: "0", "aria-label": "Point at a part of the diagram. Press Escape to close." });
    ui.appendChild(layer);
    wirePointing(layer);

    // Top toolbar
    ui.appendChild(buildToolbar());

    // Side panel (hidden until a selection exists)
    ui.appendChild(buildPanel());

    if (!S.consented) ui.appendChild(buildConsent());
    if (!S.settings.hasKey) showKeyNudge();

    layer.focus();
    syncSelectionVisuals();
  }

  function buildVeil() {
    const svg = svgEl("svg", { class: "pp-veil", width: "100%", height: "100%" });
    const defs = svgEl("defs");
    const mask = svgEl("mask", { id: "pp-hole" });
    mask.append(
      svgEl("rect", { x: 0, y: 0, width: "100%", height: "100%", fill: "white" }),
      svgEl("rect", { id: "pp-hole-rect", x: 0, y: 0, width: 0, height: 0, rx: 14, fill: "black" })
    );
    defs.appendChild(mask);
    svg.append(
      defs,
      svgEl("rect", { x: 0, y: 0, width: "100%", height: "100%", fill: "rgba(8,12,22,0.52)", mask: "url(#pp-hole)" }),
      // Animated selection ring
      svgEl("rect", { id: "pp-ring", class: "pp-ring", x: 0, y: 0, width: 0, height: 0, rx: 14, fill: "none" })
    );
    return svg;
  }

  function buildToolbar() {
    const bar = el("div", { class: "pp-bar", role: "toolbar", "aria-label": "PinPoint tools" });
    const brand = el("div", { class: "pp-brand" });
    brand.append(el("span", { class: "pp-dot" }), el("span", {}, "PinPoint"));

    const modes = el("div", { class: "pp-modes", role: "radiogroup", "aria-label": "Selection mode" });
    for (const [id, label, iconFn] of [["pin", "Pin a point", iconPin], ["box", "Draw a box", iconBox]]) {
      const b = el("button", {
        class: "pp-mode" + (S.mode === id ? " is-on" : ""),
        role: "radio", "aria-checked": String(S.mode === id), title: label
      });
      b.append(iconFn(), el("span", {}, label.split(" ")[0] === "Pin" ? "Pin" : "Box"));
      b.addEventListener("click", () => { S.mode = id; S.sel = null; S.pinAt = null; render(); });
      modes.appendChild(b);
    }

    const hint = el("div", { class: "pp-hint", "aria-live": "polite" },
      S.mode === "pin" ? "Click the exact spot you're curious about" : "Drag a box around the part");

    const actions = el("div", { class: "pp-actions" });
    const recap = el("button", { class: "pp-ghost", title: "Take a fresh screenshot" });
    recap.append(iconRefresh(), el("span", {}, "Recapture"));
    recap.addEventListener("click", async () => { close(); open(); });
    const closeB = el("button", { class: "pp-ghost", title: "Close (Esc)" });
    closeB.append(iconX(), el("span", {}, "Esc"));
    closeB.addEventListener("click", close);
    actions.append(recap, closeB);

    bar.append(brand, modes, hint, actions);
    return bar;
  }

  // --------------------------------------------------------- pointing ----
  function wirePointing(layer) {
    // Loupe: a circular magnifier that follows the cursor.
    const loupe = el("div", { class: "pp-loupe", "aria-hidden": "true" });
    const lc = el("canvas", { class: "pp-loupe-c", width: 176, height: 176 });
    loupe.append(lc, el("div", { class: "pp-cross" }));
    layer.appendChild(loupe);
    const lctx = lc.getContext("2d");
    const ZOOM = 2.3;

    let dragging = false, start = null;

    function drawLoupe(x, y) {
      const { bitmap, scaleX, scaleY } = S.shot;
      const srcW = (lc.width / ZOOM) * scaleX, srcH = (lc.height / ZOOM) * scaleY;
      lctx.imageSmoothingEnabled = true;
      lctx.clearRect(0, 0, lc.width, lc.height);
      lctx.drawImage(
        bitmap,
        x * scaleX - srcW / 2, y * scaleY - srcH / 2, srcW, srcH,
        0, 0, lc.width, lc.height
      );
    }

    layer.addEventListener("pointermove", (e) => {
      const x = e.clientX, y = e.clientY;
      loupe.style.transform = `translate(${x + 22}px, ${y - 198}px)`;
      const flipX = x > window.innerWidth - 220, flipY = y < 220;
      loupe.style.transform = `translate(${flipX ? x - 198 : x + 22}px, ${flipY ? y + 22 : y - 198}px)`;
      loupe.classList.add("is-live");
      drawLoupe(x, y);
      if (dragging && start) {
        S.sel = normRect(start.x, start.y, e.clientX, e.clientY);
        syncSelectionVisuals();
      }
    });
    layer.addEventListener("pointerleave", () => loupe.classList.remove("is-live"));

    layer.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      layer.setPointerCapture(e.pointerId);
      if (S.mode === "box") { dragging = true; start = { x: e.clientX, y: e.clientY }; }
    });

    layer.addEventListener("pointerup", async (e) => {
      if (S.mode === "pin" || (dragging && start && dist(start, e) < MIN_BOX)) {
        S.pinAt = { x: e.clientX, y: e.clientY };
        const half = PIN_REGION / 2;
        S.sel = clampRect({ x: e.clientX - half, y: e.clientY - half, w: PIN_REGION, h: PIN_REGION });
      } else if (dragging && start) {
        S.pinAt = null;
        S.sel = clampRect(normRect(start.x, start.y, e.clientX, e.clientY));
        if (S.sel.w < MIN_BOX || S.sel.h < MIN_BOX) {
          const cx = S.sel.x + S.sel.w / 2, cy = S.sel.y + S.sel.h / 2, half = PIN_REGION / 2;
          S.pinAt = { x: cx, y: cy };
          S.sel = clampRect({ x: cx - half, y: cy - half, w: PIN_REGION, h: PIN_REGION });
        }
      }
      dragging = false; start = null;
      syncSelectionVisuals();
      if (S.sel) { await makeCrop(); openPanel(); }
    });

    layer.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
    ui.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); }, true);
  }

  function syncSelectionVisuals() {
    const hole = root.getElementById("pp-hole-rect");
    const ring = root.getElementById("pp-ring");
    ui.querySelectorAll(".pp-pin").forEach((n) => n.remove());
    if (!S.sel) {
      hole?.setAttribute("width", 0); hole?.setAttribute("height", 0);
      ring?.setAttribute("width", 0); ring?.setAttribute("height", 0);
      return;
    }
    for (const r of [hole, ring]) {
      if (!r) continue;
      r.setAttribute("x", S.sel.x); r.setAttribute("y", S.sel.y);
      r.setAttribute("width", S.sel.w); r.setAttribute("height", S.sel.h);
    }
    if (S.pinAt) {
      const pin = el("div", { class: "pp-pin", "aria-hidden": "true" });
      pin.style.transform = `translate(${S.pinAt.x}px, ${S.pinAt.y}px)`;
      pin.append(el("span", { class: "pp-pin-pulse" }), el("span", { class: "pp-pin-pulse d2" }), iconPinDrop());
      ui.querySelector(".pp-layer").appendChild(pin);
    }
  }

  // ------------------------------------------------------------- crop ----
  async function makeCrop() {
    const { bitmap, scaleX, scaleY } = S.shot;
    const padX = S.sel.w * CROP_PAD, padY = S.sel.h * CROP_PAD;
    const r = clampRect({ x: S.sel.x - padX, y: S.sel.y - padY, w: S.sel.w + padX * 2, h: S.sel.h + padY * 2 });
    const sx = r.x * scaleX, sy = r.y * scaleY, sw = r.w * scaleX, sh = r.h * scaleY;
    const upscale = Math.max(1, CROP_MIN_EDGE / Math.max(sw, sh)); // tiny crops get upscaled for the model
    const c = new OffscreenCanvas(Math.round(sw * upscale), Math.round(sh * upscale));
    const ctx = c.getContext("2d");
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, c.width, c.height);
    S.crop = await canvasToDataUrl(c, "image/jpeg", 0.92);
    S.fullForModel = await downscaledFull();
  }

  async function downscaledFull() {
    const { bitmap } = S.shot;
    const k = Math.min(1, FULL_MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const c = new OffscreenCanvas(Math.round(bitmap.width * k), Math.round(bitmap.height * k));
    const ctx = c.getContext("2d");
    ctx.drawImage(bitmap, 0, 0, c.width, c.height);
    // Draw a marker so the model can see WHERE the user pointed on the full shot.
    const { scaleX, scaleY } = S.shot;
    ctx.strokeStyle = "#14E0C0"; ctx.lineWidth = Math.max(3, 4 * k); ctx.setLineDash([10, 7]);
    ctx.strokeRect(S.sel.x * scaleX * k, S.sel.y * scaleY * k, S.sel.w * scaleX * k, S.sel.h * scaleY * k);
    return canvasToDataUrl(c, "image/jpeg", 0.85);
  }

  function canvasToDataUrl(canvas, type, q) {
    return canvas.convertToBlob({ type, quality: q }).then(
      (blob) => new Promise((res) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.readAsDataURL(blob); })
    );
  }

  // ------------------------------------------------------------ panel ----
  function buildPanel() {
    const panel = el("aside", { class: "pp-panel", role: "dialog", "aria-label": "Ask about the pointed region" });
    panel.append(el("div", { class: "pp-panel-inner", id: "pp-panel-inner" }));
    return panel;
  }

  function openPanel() {
    const panel = ui.querySelector(".pp-panel");
    const inner = root.getElementById("pp-panel-inner");
    inner.replaceChildren();
    panel.classList.add("is-open");

    // Crop preview card
    const preview = el("div", { class: "pp-preview" });
    preview.append(
      el("img", { src: S.crop, alt: "Your pointed region" }),
      el("div", { class: "pp-preview-tag" }, S.pinAt ? "Pinned region" : "Boxed region")
    );
    inner.appendChild(preview);

    // Thread
    const thread = el("div", { class: "pp-thread", id: "pp-thread", "aria-live": "polite" });
    inner.appendChild(thread);

    // Suggestion chips (only before the first question)
    if (!S.history.length) {
      const chips = el("div", { class: "pp-chips" });
      for (const q of ["What is this part?", "What does it do?", "Why do the arrows point this way?", "How does it connect to the rest?"]) {
        const c = el("button", { class: "pp-chip" }, q);
        c.addEventListener("click", () => { input.value = q; ask(); });
        chips.appendChild(c);
      }
      inner.appendChild(chips);
    }

    // Composer
    const composer = el("div", { class: "pp-composer" });
    const input = el("textarea", {
      class: "pp-input", rows: "1", placeholder: "Ask about the pointed part…",
      "aria-label": "Your question"
    });
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); ask(); }
      if (e.key === "Escape") close();
    });
    input.addEventListener("input", () => { input.style.height = "auto"; input.style.height = Math.min(input.scrollHeight, 120) + "px"; });
    const askB = el("button", { class: "pp-ask", title: "Ask (Enter)" });
    askB.append(iconSend());
    askB.addEventListener("click", ask);
    composer.append(input, askB);
    inner.appendChild(composer);

    const meta = el("div", { class: "pp-meta" },
      `${cap(S.settings.depth)} depth${S.settings.guidedMode ? " · Guided mode" : ""}${S.settings.verifyPass ? " · Verified answers" : ""}`);
    inner.appendChild(meta);

    input.focus();

    function ask() {
      const q = input.value.trim();
      if (!q || S.busy) return;
      input.value = ""; input.style.height = "auto";
      runAsk(q, thread);
    }
  }

  function showKeyNudge() {
    const n = el("div", { class: "pp-toast pp-toast-key", role: "alert" });
    n.append(
      el("strong", {}, "Add your Gemini API key to start. "),
      el("span", {}, "Click the PinPoint icon in the toolbar → paste your key. It never leaves this device.")
    );
    ui.appendChild(n);
    setTimeout(() => n.remove(), 7000);
  }

  function buildConsent() {
    const wrap = el("div", { class: "pp-consent", role: "alertdialog", "aria-label": "Privacy notice" });
    const card = el("div", { class: "pp-consent-card" });
    card.append(
      el("h2", {}, "Before your first question"),
      el("p", {}, "When you ask, PinPoint sends the visible screenshot and your pointed crop to Google's Gemini API to generate the answer. Nothing is sent until you press Ask, and nothing is stored by PinPoint."),
      el("p", { class: "pp-consent-tip" }, "Tip: close anything private on screen before capturing.")
    );
    const ok = el("button", { class: "pp-primary" }, "Got it — continue");
    ok.addEventListener("click", async () => {
      await chrome.storage.local.set({ pinpointConsent: true });
      S.consented = true; wrap.remove();
    });
    card.appendChild(ok);
    wrap.appendChild(card);
    return wrap;
  }

  // ---------------------------------------------------------- ask flow ----
  function runAsk(question, thread) {
    S.busy = true;
    ui.querySelector(".pp-chips")?.remove();
    S.history.push({ role: "user", text: question });
    thread.appendChild(el("div", { class: "pp-msg pp-msg-user" }, question));

    const aMsg = el("div", { class: "pp-msg pp-msg-ai" });
    const stageLine = el("div", { class: "pp-stage" });
    stageLine.append(el("span", { class: "pp-spin" }), el("span", { class: "pp-stage-t" }, "Reading the diagram"));
    const body = el("div", { class: "pp-md" });
    aMsg.append(stageLine, body);
    thread.appendChild(aMsg);
    thread.scrollTop = thread.scrollHeight;

    let fullText = "";
    const port = chrome.runtime.connect({ name: "pinpoint-ask" });
    S.port = port;

    port.onMessage.addListener((m) => {
      if (m.type === "STAGE") {
        stageLine.querySelector(".pp-stage-t").textContent = m.label;
      } else if (m.type === "TRIAGE") {
        if (S.settings.privacyBlur && m.triage?.safety?.pii_visible) {
          aMsg.prepend(notice("Personal info seems visible in this screenshot. PinPoint told the model to ignore it — but consider recapturing without it.", "warn"));
        }
        if (m.triage && m.triage.is_diagram === false) {
          aMsg.prepend(notice("This doesn't look like a diagram, so the answer may be less grounded.", "info"));
        }
      } else if (m.type === "CHUNK") {
        fullText += m.text;
        body.innerHTML = mdLite(visibleAnswer(fullText));
        thread.scrollTop = thread.scrollHeight;
      } else if (m.type === "REFUSAL") {
        stageLine.remove();
        body.appendChild(notice(m.message, "warn"));
        finish("");
      } else if (m.type === "VERIFY") {
        renderVerification(aMsg, m.verification);
      } else if (m.type === "ERROR") {
        stageLine.remove();
        body.appendChild(notice(m.message, "error"));
        finish("");
      } else if (m.type === "DONE") {
        stageLine.remove();
        finalRender(aMsg, body, fullText);
        finish(fullText);
      }
    });
    port.onDisconnect.addListener(() => { if (S.busy) { S.busy = false; } });

    port.postMessage({
      type: "ASK",
      payload: {
        fullImage: S.fullForModel,
        cropImage: S.crop,
        question,
        pageTitle: document.title,
        pageUrl: location.href,
        history: S.history.slice(0, -1).slice(-6)
      }
    });

    function finish(text) {
      S.busy = false;
      if (text) S.history.push({ role: "ai", text });
      try { port.disconnect(); } catch (_) {}
      openPanelComposerFocus();
    }
  }

  function openPanelComposerFocus() {
    root.querySelector?.(".pp-input")?.focus?.();
    const input = ui.querySelector(".pp-input");
    input?.focus();
  }

  /** While streaming, show only the Answer section; reasoning folds in at the end. */
  function visibleAnswer(text) {
    const i = text.indexOf("### How I read the diagram");
    return i === -1 ? text.replace(/^### Answer\s*/m, "") : text.slice(0, i).replace(/^### Answer\s*/m, "");
  }

  function finalRender(aMsg, body, fullText) {
    if (!fullText) return;
    const [answer, rest] = splitOnce(fullText, "### How I read the diagram");
    body.innerHTML = mdLite(answer.replace(/^### Answer\s*/m, ""));
    if (rest) {
      const [how, conf] = splitOnce(rest, "### Confidence & caveats");
      const det = el("details", { class: "pp-why" });
      det.append(
        el("summary", {}, "Why this answer — how the region was read"),
        Object.assign(el("div", { class: "pp-md pp-why-body" }), { innerHTML: mdLite(how) })
      );
      aMsg.appendChild(det);
      if (conf) {
        aMsg.appendChild(Object.assign(el("div", { class: "pp-conf" }), { innerHTML: mdLite(conf) }));
      }
    }
  }

  function renderVerification(aMsg, v) {
    if (!v || v.verdict === "skipped") return;
    const badge = el("div", { class: "pp-verify pp-verify-" + v.verdict });
    if (v.verdict === "pass") {
      badge.append(iconCheck(), el("span", {}, "Self-check passed"));
    } else {
      badge.append(iconAlert(), el("span", {}, v.verdict === "fail" ? "Self-check found problems" : "Self-check: minor notes"));
      const list = el("ul", { class: "pp-verify-list" });
      (v.issues || []).slice(0, 4).forEach((i) => list.appendChild(el("li", {}, i)));
      if (v.corrected_summary) list.appendChild(el("li", { class: "pp-verify-fix" }, "Correction: " + v.corrected_summary));
      badge.appendChild(list);
    }
    aMsg.appendChild(badge);
  }

  function notice(text, kind) {
    const n = el("div", { class: "pp-note pp-note-" + kind });
    n.append(kind === "error" ? iconAlert() : kind === "warn" ? iconShield() : iconInfo(), el("span", {}, text));
    return n;
  }

  // ---------------------------------------------------------- helpers ----
  function el(tag, attrs = {}, text) {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
    if (text != null) n.textContent = text;
    return n;
  }
  function svgEl(tag, attrs = {}) {
    const n = document.createElementNS("http://www.w3.org/2000/svg", tag);
    for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
    return n;
  }
  function normRect(x1, y1, x2, y2) {
    return { x: Math.min(x1, x2), y: Math.min(y1, y2), w: Math.abs(x2 - x1), h: Math.abs(y2 - y1) };
  }
  function clampRect(r) {
    const x = Math.max(0, r.x), y = Math.max(0, r.y);
    return { x, y, w: Math.min(r.w - (x - r.x), window.innerWidth - x), h: Math.min(r.h - (y - r.y), window.innerHeight - y) };
  }
  function dist(a, e) { return Math.hypot(e.clientX - a.x, e.clientY - a.y); }
  function cap(s) { return s ? s[0].toUpperCase() + s.slice(1) : s; }
  function splitOnce(text, marker) {
    const i = text.indexOf(marker);
    return i === -1 ? [text, ""] : [text.slice(0, i), text.slice(i + marker.length)];
  }
  function escapeHtml(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  /** Tiny, safe markdown: headings, bold, italics, inline code, lists, paragraphs. */
  function mdLite(src) {
    const lines = escapeHtml(src.trim()).split("\n");
    let html = "", inList = false;
    const inline = (s) => s
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\*([^*]+)\*/g, "<em>$1</em>");
    for (const raw of lines) {
      const line = raw.trimEnd();
      if (/^\s*[-*]\s+/.test(line)) {
        if (!inList) { html += "<ul>"; inList = true; }
        html += "<li>" + inline(line.replace(/^\s*[-*]\s+/, "")) + "</li>";
        continue;
      }
      if (inList) { html += "</ul>"; inList = false; }
      if (/^###\s+/.test(line)) { html += "<h4>" + inline(line.replace(/^###\s+/, "")) + "</h4>"; continue; }
      if (/^##\s+/.test(line)) { html += "<h4>" + inline(line.replace(/^##\s+/, "")) + "</h4>"; continue; }
      if (line === "") { continue; }
      html += "<p>" + inline(line) + "</p>";
    }
    if (inList) html += "</ul>";
    return html;
  }

  // ------------------------------------------------------------- icons ----
  function iconFrom(d, extra = "") {
    const s = svgEl("svg", { viewBox: "0 0 24 24", width: 16, height: 16, fill: "none", stroke: "currentColor", "stroke-width": 2, "stroke-linecap": "round", "stroke-linejoin": "round", "aria-hidden": "true" });
    s.innerHTML = d + extra;
    return s;
  }
  const iconPin = () => iconFrom('<path d="M12 21s-6-5.1-6-10a6 6 0 1 1 12 0c0 4.9-6 10-6 10z"/><circle cx="12" cy="11" r="2.2"/>');
  const iconBox = () => iconFrom('<rect x="4" y="4" width="16" height="16" rx="2" stroke-dasharray="4 3"/>');
  const iconRefresh = () => iconFrom('<path d="M21 12a9 9 0 1 1-2.6-6.4"/><path d="M21 3v6h-6"/>');
  const iconX = () => iconFrom('<path d="M6 6l12 12M18 6L6 18"/>');
  const iconSend = () => iconFrom('<path d="M4 12l16-8-6 16-2.5-6.5L4 12z"/>');
  const iconCheck = () => iconFrom('<path d="M4 12.5l5 5L20 6.5"/>');
  const iconAlert = () => iconFrom('<path d="M12 3l10 18H2L12 3z"/><path d="M12 10v5"/><circle cx="12" cy="18" r=".5"/>');
  const iconShield = () => iconFrom('<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z"/>');
  const iconInfo = () => iconFrom('<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><circle cx="12" cy="8" r=".5"/>');
  const iconPinDrop = () => {
    const s = svgEl("svg", { viewBox: "0 0 24 24", width: 30, height: 30, fill: "#FFB224", stroke: "#0C1220", "stroke-width": 1.2, "aria-hidden": "true", class: "pp-pin-glyph" });
    s.innerHTML = '<path d="M12 22s-7-5.6-7-11a7 7 0 1 1 14 0c0 5.4-7 11-7 11z"/><circle cx="12" cy="11" r="2.6" fill="#0C1220" stroke="none"/>';
    return s;
  };

  // --------------------------------------------------------------- css ----
  function CSS() {
    return `
:host { all: initial; }
* { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, "Segoe UI", Roboto, Inter, system-ui, sans-serif; }
.pp { position: fixed; inset: 0; color: #EAF0FA; }

.pp-shot { position: absolute; inset: 0; width: 100%; height: 100%; user-select: none; -webkit-user-drag: none; }
.pp-veil { position: absolute; inset: 0; pointer-events: none; }
.pp-layer { position: absolute; inset: 0; cursor: crosshair; outline: none; }

/* Animated selection ring — the marching dashed ring around the chosen region */
.pp-ring { stroke: #14E0C0; stroke-width: 2.5; stroke-dasharray: 10 7;
  filter: drop-shadow(0 0 8px rgba(20,224,192,.55)); animation: pp-march 1.4s linear infinite; }
@keyframes pp-march { to { stroke-dashoffset: -34; } }

/* Loupe */
.pp-loupe { position: absolute; top: 0; left: 0; width: 176px; height: 176px; border-radius: 50%;
  overflow: hidden; border: 2.5px solid rgba(20,224,192,.9); box-shadow: 0 10px 40px rgba(0,0,0,.5), inset 0 0 0 1px rgba(255,255,255,.15);
  opacity: 0; transition: opacity .15s ease; pointer-events: none; background: #0C1220; will-change: transform; }
.pp-loupe.is-live { opacity: 1; }
.pp-loupe-c { width: 100%; height: 100%; display: block; }
.pp-cross { position: absolute; inset: 0; }
.pp-cross::before, .pp-cross::after { content: ""; position: absolute; background: rgba(20,224,192,.85); }
.pp-cross::before { left: 50%; top: 18%; bottom: 18%; width: 1.5px; transform: translateX(-50%); }
.pp-cross::after { top: 50%; left: 18%; right: 18%; height: 1.5px; transform: translateY(-50%); }

/* Dropped pin */
.pp-pin { position: absolute; top: -15px; left: -15px; width: 30px; height: 30px; pointer-events: none; }
.pp-pin-glyph { position: absolute; left: 0; top: -26px; animation: pp-drop .35s cubic-bezier(.2,1.4,.4,1); filter: drop-shadow(0 4px 8px rgba(0,0,0,.45)); }
@keyframes pp-drop { from { transform: translateY(-14px) scale(.7); opacity: 0; } to { transform: none; opacity: 1; } }
.pp-pin-pulse { position: absolute; left: 50%; top: 0; width: 14px; height: 14px; border-radius: 50%;
  border: 2px solid rgba(255,178,36,.8); transform: translate(-50%,-50%); animation: pp-pulse 1.8s ease-out infinite; }
.pp-pin-pulse.d2 { animation-delay: .9s; }
@keyframes pp-pulse { from { transform: translate(-50%,-50%) scale(.5); opacity: .9; } to { transform: translate(-50%,-50%) scale(3.4); opacity: 0; } }

/* Toolbar */
.pp-bar { position: absolute; top: 16px; left: 50%; transform: translateX(-50%);
  display: flex; align-items: center; gap: 14px; padding: 8px 12px; border-radius: 14px;
  background: rgba(12,18,32,.92); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,.09);
  box-shadow: 0 12px 40px rgba(0,0,0,.45); animation: pp-slide-down .3s ease; }
@keyframes pp-slide-down { from { transform: translate(-50%,-12px); opacity: 0; } }
.pp-brand { display: flex; align-items: center; gap: 7px; font-weight: 700; font-size: 13.5px; letter-spacing: .2px; }
.pp-dot { width: 9px; height: 9px; border-radius: 50%; background: #14E0C0; box-shadow: 0 0 10px #14E0C0; }
.pp-modes { display: flex; background: rgba(255,255,255,.06); border-radius: 10px; padding: 3px; gap: 3px; }
.pp-mode { display: flex; align-items: center; gap: 6px; padding: 6px 11px; border: 0; border-radius: 8px;
  background: transparent; color: #B9C4D6; font-size: 12.5px; font-weight: 600; cursor: pointer; }
.pp-mode.is-on { background: #14E0C0; color: #06251F; }
.pp-hint { font-size: 12.5px; color: #93A1B8; }
.pp-actions { display: flex; gap: 6px; }
.pp-ghost { display: flex; align-items: center; gap: 6px; padding: 6px 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,.12);
  background: transparent; color: #B9C4D6; font-size: 12px; cursor: pointer; }
.pp-ghost:hover { background: rgba(255,255,255,.07); color: #EAF0FA; }

/* Panel */
.pp-panel { position: absolute; top: 0; right: 0; bottom: 0; width: min(420px, 92vw);
  transform: translateX(105%); transition: transform .32s cubic-bezier(.2,.9,.3,1); }
.pp-panel.is-open { transform: none; }
.pp-panel-inner { height: 100%; display: flex; flex-direction: column; gap: 12px; padding: 16px;
  background: rgba(12,18,32,.96); backdrop-filter: blur(14px); border-left: 1px solid rgba(255,255,255,.08);
  box-shadow: -18px 0 50px rgba(0,0,0,.45); }
.pp-preview { position: relative; border-radius: 12px; overflow: hidden; border: 1.5px solid rgba(20,224,192,.5); flex: 0 0 auto; }
.pp-preview img { display: block; width: 100%; max-height: 150px; object-fit: contain; background: #0A0F1B; }
.pp-preview-tag { position: absolute; left: 8px; bottom: 8px; padding: 3px 9px; border-radius: 999px;
  background: rgba(12,18,32,.85); color: #14E0C0; font-size: 11px; font-weight: 700; letter-spacing: .4px; text-transform: uppercase; }
.pp-thread { flex: 1 1 auto; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; padding-right: 2px; }
.pp-msg { border-radius: 12px; padding: 10px 12px; font-size: 13.5px; line-height: 1.55; }
.pp-msg-user { align-self: flex-end; max-width: 90%; background: #14E0C0; color: #06251F; font-weight: 600; }
.pp-msg-ai { align-self: stretch; background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.07); }
.pp-md h4 { font-size: 12px; text-transform: uppercase; letter-spacing: .6px; color: #7FE8D8; margin: 10px 0 4px; }
.pp-md p { margin: 6px 0; }
.pp-md ul { margin: 6px 0 6px 18px; }
.pp-md code { font-family: ui-monospace, Menlo, monospace; font-size: 12px; background: rgba(255,255,255,.09); padding: 1px 5px; border-radius: 5px; }
.pp-stage { display: flex; align-items: center; gap: 8px; font-size: 12.5px; color: #93A1B8; margin-bottom: 6px; }
.pp-spin { width: 12px; height: 12px; border-radius: 50%; border: 2px solid rgba(20,224,192,.25); border-top-color: #14E0C0; animation: pp-rot .8s linear infinite; }
@keyframes pp-rot { to { transform: rotate(360deg); } }

.pp-why { margin-top: 10px; border-top: 1px dashed rgba(255,255,255,.14); padding-top: 8px; }
.pp-why summary { cursor: pointer; font-size: 12.5px; font-weight: 700; color: #9FB3D0; list-style: none; }
.pp-why summary::before { content: "▸ "; color: #14E0C0; }
.pp-why[open] summary::before { content: "▾ "; }
.pp-why-body { margin-top: 6px; color: #C4CFDF; font-size: 13px; }
.pp-conf { margin-top: 8px; font-size: 12.5px; color: #93A1B8; font-style: italic; }

.pp-verify { margin-top: 10px; display: flex; flex-direction: column; gap: 5px; font-size: 12.5px;
  border-radius: 10px; padding: 8px 10px; }
.pp-verify > span { font-weight: 700; }
.pp-verify svg { flex: 0 0 auto; }
.pp-verify-pass { background: rgba(20,224,192,.1); color: #6FE8D2; flex-direction: row; align-items: center; gap: 7px; }
.pp-verify-minor_issues { background: rgba(255,178,36,.1); color: #FFCE73; }
.pp-verify-fail { background: rgba(255,99,99,.12); color: #FF9E9E; }
.pp-verify-list { margin: 2px 0 0 18px; color: #D8DEE9; font-weight: 400; }
.pp-verify-fix { color: #FFCE73; }

.pp-note { display: flex; gap: 8px; align-items: flex-start; border-radius: 10px; padding: 9px 11px; font-size: 12.5px; margin-bottom: 8px; }
.pp-note svg { flex: 0 0 auto; margin-top: 1px; }
.pp-note-info { background: rgba(125,211,252,.1); color: #A8DDF7; }
.pp-note-warn { background: rgba(255,178,36,.12); color: #FFCE73; }
.pp-note-error { background: rgba(255,99,99,.12); color: #FF9E9E; }

.pp-chips { display: flex; flex-wrap: wrap; gap: 7px; }
.pp-chip { border: 1px solid rgba(20,224,192,.4); background: rgba(20,224,192,.07); color: #7FE8D8;
  border-radius: 999px; padding: 6px 12px; font-size: 12.5px; cursor: pointer; transition: all .15s; }
.pp-chip:hover { background: rgba(20,224,192,.18); transform: translateY(-1px); }

.pp-composer { display: flex; gap: 8px; align-items: flex-end; }
.pp-input { flex: 1; resize: none; border-radius: 12px; border: 1.5px solid rgba(255,255,255,.14);
  background: rgba(255,255,255,.05); color: #EAF0FA; font-size: 13.5px; padding: 10px 12px; outline: none; line-height: 1.4; }
.pp-input:focus { border-color: #14E0C0; box-shadow: 0 0 0 3px rgba(20,224,192,.18); }
.pp-input::placeholder { color: #66748C; }
.pp-ask { width: 40px; height: 40px; border-radius: 12px; border: 0; background: #14E0C0; color: #06251F;
  display: grid; place-items: center; cursor: pointer; transition: transform .12s; }
.pp-ask:hover { transform: scale(1.06); }
.pp-meta { font-size: 11px; color: #66748C; text-align: center; }

.pp-toast { position: absolute; bottom: 24px; left: 50%; transform: translateX(-50%); max-width: 480px;
  background: rgba(12,18,32,.96); border: 1px solid rgba(255,255,255,.12); color: #EAF0FA;
  padding: 12px 16px; border-radius: 12px; font-size: 13px; box-shadow: 0 12px 40px rgba(0,0,0,.5); }
.pp-toast-key strong { color: #14E0C0; }

.pp-consent { position: absolute; inset: 0; display: grid; place-items: center; background: rgba(4,8,16,.55); }
.pp-consent-card { width: min(440px, 90vw); background: #101828; border: 1px solid rgba(255,255,255,.1);
  border-radius: 16px; padding: 22px; box-shadow: 0 24px 80px rgba(0,0,0,.6); }
.pp-consent-card h2 { font-size: 16px; margin-bottom: 10px; color: #EAF0FA; }
.pp-consent-card p { font-size: 13.5px; line-height: 1.55; color: #B9C4D6; margin-bottom: 8px; }
.pp-consent-tip { color: #FFCE73 !important; }
.pp-primary { margin-top: 8px; width: 100%; padding: 11px; border: 0; border-radius: 10px;
  background: #14E0C0; color: #06251F; font-weight: 700; font-size: 13.5px; cursor: pointer; }

@media (prefers-reduced-motion: reduce) {
  .pp-ring, .pp-pin-pulse, .pp-spin, .pp-pin-glyph { animation: none !important; }
  .pp-panel { transition: none; }
}
`;
  }
})();
