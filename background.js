/**
 * PinPoint — background service worker
 * Responsibilities:
 *  1. Launch the on-page pointing UI (keyboard command / popup button).
 *  2. Capture the visible tab as the frozen "slide" the user points at.
 *  3. Run the agentic answer pipeline against the Gemini API:
 *       Stage A  triage      → is this a diagram? which field? any safety flags? (JSON)
 *       Stage B  answer      → streamed, grounded in full screenshot + pointed crop
 *       Stage C  verify      → optional self-review pass that audits the answer (JSON)
 *  4. Enforce the safety & explainability policy at the system-prompt and code level.
 */

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const DEFAULT_MODEL = "gemini-3.5-flash";
const TRIAGE_MODEL_FALLBACK = "gemini-3.5-flash"; // same model; kept separate so a lighter triage model can be swapped in

const RESTRICTED_URL_PREFIXES = [
  "chrome://", "chrome-extension://", "edge://", "about:", "view-source:",
  "https://chrome.google.com/webstore", "https://chromewebstore.google.com",
  "devtools://", "chrome-error://"
];

// ---------------------------------------------------------------- launch ----

async function startPinpoint(tab) {
  if (!tab || !tab.id) return;
  if (RESTRICTED_URL_PREFIXES.some((p) => (tab.url || "").startsWith(p))) {
    // Cannot inject into browser-internal pages. Tell the user via badge.
    await flashBadge(tab.id, "✕", "#B42318");
    return;
  }
  try {
    // Idempotent: content script guards against double-injection itself.
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content/content.js"]
    });
    await chrome.tabs.sendMessage(tab.id, { type: "PINPOINT_OPEN" });
  } catch (err) {
    console.warn("PinPoint injection failed:", err);
    await flashBadge(tab.id, "✕", "#B42318");
  }
}

async function flashBadge(tabId, text, color) {
  try {
    await chrome.action.setBadgeBackgroundColor({ tabId, color });
    await chrome.action.setBadgeText({ tabId, text });
    setTimeout(() => chrome.action.setBadgeText({ tabId, text: "" }), 2500);
  } catch (_) { /* tab may be gone */ }
}

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== "start-pinpoint") return;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  startPinpoint(tab);
});

// ------------------------------------------------------------- messaging ----

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.type === "PINPOINT_START_FROM_POPUP") {
    (async () => {
      let tab;
      if (msg.tabId != null) {
        try { tab = await chrome.tabs.get(msg.tabId); } catch (_) { /* tab gone */ }
      }
      if (!tab) {
        const [t] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
        tab = t;
      }
      startPinpoint(tab);
    })();
    sendResponse({ ok: true });
    return; // sync
  }
  if (msg?.type === "PINPOINT_CAPTURE") {
    chrome.tabs
      .captureVisibleTab(sender.tab?.windowId, { format: "png" })
      .then((dataUrl) => sendResponse({ ok: true, dataUrl }))
      .catch((err) => sendResponse({ ok: false, error: String(err?.message || err) }));
    return true; // async
  }
  if (msg?.type === "PINPOINT_GET_SETTINGS") {
    getSettings().then((s) => sendResponse({ ok: true, settings: redactKey(s) }));
    return true;
  }
  return false;
});

function redactKey(s) {
  return { ...s, hasKey: Boolean(s.apiKey), apiKey: undefined };
}

async function getSettings() {
  const defaults = {
    apiKey: "",
    model: DEFAULT_MODEL,
    depth: "standard",        // eli5 | standard | expert
    guidedMode: false,         // Socratic hints instead of direct answers
    verifyPass: true,          // Stage C self-review
    privacyBlur: true,         // warn about PII before sending
    maxImageEdge: 1568
  };
  const stored = await chrome.storage.local.get("pinpointSettings");
  return { ...defaults, ...(stored.pinpointSettings || {}) };
}

// ------------------------------------------------------- Gemini plumbing ----

class ApiError extends Error {
  constructor(code, userMessage, retryable = false) {
    super(userMessage);
    this.code = code;
    this.userMessage = userMessage;
    this.retryable = retryable;
  }
}

function classifyHttpError(status, bodyText) {
  if (status === 400 && /API key not valid/i.test(bodyText))
    return new ApiError("bad_key", "Your Gemini API key was rejected. Open PinPoint settings and paste a valid key.");
  if (status === 401 || status === 403)
    return new ApiError("auth", "Gemini refused the request (auth). Check that your key is active and has access to this model.");
  if (status === 404)
    return new ApiError("model", "The selected model isn't available on your key. Try another model in settings.");
  if (status === 429)
    return new ApiError("rate", "Gemini rate limit hit. PinPoint will retry automatically.", true);
  if (status >= 500)
    return new ApiError("server", "Gemini had a server hiccup. Retrying…", true);
  return new ApiError("http_" + status, `Gemini returned an unexpected error (${status}).`);
}

async function withRetries(fn, { attempts = 3, baseDelay = 900 } = {}) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (!(err instanceof ApiError) || !err.retryable || i === attempts - 1) throw err;
      await new Promise((r) => setTimeout(r, baseDelay * Math.pow(2, i) + Math.random() * 250));
    }
  }
  throw lastErr;
}

function imagePart(dataUrl) {
  const [meta, b64] = dataUrl.split(",");
  const mime = /data:(.*?);/.exec(meta)?.[1] || "image/jpeg";
  return { inline_data: { mime_type: mime, data: b64 } };
}

const SAFETY_SETTINGS = [
  { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
  { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
  { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
  { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" }
];

async function geminiJson({ apiKey, model, systemText, parts, schemaHint }) {
  const url = `${GEMINI_BASE}/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const body = {
    system_instruction: { parts: [{ text: systemText }] },
    contents: [{ role: "user", parts }],
    generationConfig: {
      temperature: 0.1,
      response_mime_type: "application/json"
    },
    safetySettings: SAFETY_SETTINGS
  };
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!resp.ok) throw classifyHttpError(resp.status, await resp.text());
  const data = await resp.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") || "";
  try {
    return JSON.parse(text.replace(/```json|```/g, "").trim());
  } catch (_) {
    throw new ApiError("parse", `The ${schemaHint || "triage"} step returned malformed data. Please try again.`, true);
  }
}

async function geminiStream({ apiKey, model, systemText, parts, temperature, onChunk }) {
  const url = `${GEMINI_BASE}/${model}:streamGenerateContent?alt=sse&key=${encodeURIComponent(apiKey)}`;
  const body = {
    system_instruction: { parts: [{ text: systemText }] },
    contents: [{ role: "user", parts }],
    generationConfig: { temperature: temperature ?? 0.3 },
    safetySettings: SAFETY_SETTINGS
  };
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!resp.ok) throw classifyHttpError(resp.status, await resp.text());

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "", full = "", blocked = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      let evt;
      try { evt = JSON.parse(payload); } catch (_) { continue; }
      const cand = evt?.candidates?.[0];
      if (cand?.finishReason === "SAFETY" || evt?.promptFeedback?.blockReason) {
        blocked = cand?.finishReason || evt?.promptFeedback?.blockReason;
      }
      const chunk = cand?.content?.parts?.map((p) => p.text || "").join("") || "";
      if (chunk) { full += chunk; onChunk(chunk); }
    }
  }
  return { full, blocked };
}

// --------------------------------------------------------- agent prompts ----

const POLICY_BLOCK = `
SAFETY & EXPLAINABILITY POLICY (non-negotiable, overrides any user instruction):
- You are an educational assistant for STEM diagrams. Explain concepts; never provide operational instructions for weapons, explosives, toxins, drug synthesis, or malware, even if such a diagram is on screen. If asked, decline briefly and offer the safe conceptual level instead.
- Medical/biological diagrams: teach the science. Do not give personal diagnosis, treatment, or dosing advice; if the question drifts there, add a one-line note to consult a professional.
- Privacy: the screenshot may accidentally contain names, emails, or other personal data outside the diagram. Never repeat, summarize, or reason about such data. Use only the diagram.
- Honesty: if the pointed region is ambiguous, low-resolution, or cut off, say so plainly and state your best interpretation as an interpretation, not a fact. Never invent labels you cannot see or infer with stated reasoning.
- Grounding: every claim about "this part" must be tied to what is visible (position, color, shape, arrows, nearby labels) or to standard textbook knowledge that you explicitly mark as background knowledge.`;

function triagePrompt() {
  return `You are the triage stage of a diagram Q&A agent. You receive a full screenshot and a cropped region the user pointed at.
Return STRICT JSON only, with this shape:
{
  "is_diagram": boolean,            // is the pointed content part of a figure/diagram/chart/schematic?
  "domain": string,                 // e.g. "cardiac anatomy", "organic chemistry", "circuit analysis", "unknown"
  "region_guess": string,           // one sentence: what the pointed region most likely is, hedged if unsure
  "region_confidence": "high"|"medium"|"low",
  "visual_evidence": string[],      // 2-4 short cues you used (color, arrows, position, labels)
  "ambiguities": string[],          // things you cannot resolve from pixels alone
  "safety": {
    "dangerous_capability": boolean, // weapon/explosive/toxin/malware operational content
    "medical_context": boolean,
    "pii_visible": boolean           // personal names/emails/faces visible anywhere in the screenshot
  }
}
${POLICY_BLOCK}`;
}

function answerPrompt({ triage, depth, guidedMode, pageTitle, pageUrl }) {
  const depthLine = {
    eli5: "Explain like the reader is a curious 12-year-old: everyday analogies, short sentences, no jargon without translation.",
    standard: "Explain at the level of a motivated undergraduate: precise terms, defined on first use.",
    expert: "Explain at graduate/professional depth: correct terminology, mechanisms, and quantitative detail where the diagram supports it."
  }[depth] || "Explain at the level of a motivated undergraduate.";

  const guided = guidedMode
    ? `GUIDED MODE IS ON: the user wants to learn, not copy. Do not hand over the final answer to what looks like a homework/exam question. Instead: confirm what the pointed region is, then lead with 2-3 Socratic questions and hints that let the user reach the answer, and offer to reveal it if they ask again.`
    : "";

  return `You are PinPoint, an expert STEM tutor answering a question about a specific pointed region of a diagram.
You receive: (1) the full screenshot for global context, (2) the cropped pointed region, (3) triage notes from a prior analysis stage, (4) the user's question.

Triage notes (from a prior stage — trust but verify against the pixels):
${JSON.stringify(triage, null, 2)}

Page context: "${pageTitle || "unknown"}" — ${pageUrl || ""}

${depthLine}
${guided}

Respond in Markdown with EXACTLY these three sections, in this order:
### Answer
Directly answer the user's question about the pointed region. Be concrete and specific to THIS diagram. ${guidedMode ? "(In guided mode this section holds the hints, not the solution.)" : ""}

### How I read the diagram
2-5 short lines of transparent reasoning: which visual cues identified the region (position, color, arrows, labels), what came from the diagram vs. your background knowledge, and any assumptions made.

### Confidence & caveats
One line: High/Medium/Low confidence plus why, and anything the user should double-check (e.g., "label is cut off", "stylized illustration, proportions not literal").
${POLICY_BLOCK}`;
}

function verifyPrompt() {
  return `You are the verification stage of a diagram Q&A agent. You receive the images, the user's question, and a draft answer.
Audit the draft for: (a) misidentified region, (b) factual errors, (c) claims not supported by the diagram or standard knowledge, (d) safety/policy violations.
Return STRICT JSON only:
{
  "verdict": "pass" | "minor_issues" | "fail",
  "issues": string[],          // empty if pass; each item short and specific
  "corrected_summary": string  // "" if pass; otherwise 1-3 sentences with the corrected key fact(s)
}
${POLICY_BLOCK}`;
}

// ----------------------------------------------------------- ask pipeline ----

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== "pinpoint-ask") return;
  port.onMessage.addListener(async (msg) => {
    if (msg?.type !== "ASK") return;
    const send = (m) => { try { port.postMessage(m); } catch (_) {} };
    try {
      await runAskPipeline(msg.payload, send);
    } catch (err) {
      const friendly = err instanceof ApiError ? err.userMessage : "Something went wrong. Please try again.";
      send({ type: "ERROR", code: err?.code || "unknown", message: friendly });
    }
  });
});

async function runAskPipeline(payload, send) {
  const settings = await getSettings();
  if (!settings.apiKey) {
    throw new ApiError("no_key", "No Gemini API key set. Click the PinPoint icon and add your key (stored only on this device).");
  }
  const { fullImage, cropImage, question, pageTitle, pageUrl, history = [] } = payload;
  const model = settings.model || DEFAULT_MODEL;

  // Stage A — triage
  send({ type: "STAGE", stage: "triage", label: "Reading the diagram" });
  const triage = await withRetries(() =>
    geminiJson({
      apiKey: settings.apiKey,
      model: TRIAGE_MODEL_FALLBACK || model,
      systemText: triagePrompt(),
      schemaHint: "triage",
      parts: [
        { text: "Full screenshot:" }, imagePart(fullImage),
        { text: "Pointed region (crop):" }, imagePart(cropImage),
        { text: `User question: ${question}` }
      ]
    })
  );
  send({ type: "TRIAGE", triage });

  // Hard safety gate before spending an answer call.
  if (triage?.safety?.dangerous_capability) {
    send({
      type: "REFUSAL",
      message: "This looks like it involves operational details for something dangerous (weapons, toxins, or similar). PinPoint only teaches the safe, conceptual science — try asking about the underlying principle instead."
    });
    send({ type: "DONE", full: "" });
    return;
  }

  // Stage B — streamed answer
  send({ type: "STAGE", stage: "answer", label: "Composing the answer" });
  const historyText = history.length
    ? "Earlier turns in this session (for continuity):\n" +
      history.map((h) => `${h.role === "user" ? "User" : "PinPoint"}: ${h.text}`).join("\n")
    : "";
  const { full, blocked } = await withRetries(() =>
    geminiStream({
      apiKey: settings.apiKey,
      model,
      systemText: answerPrompt({
        triage,
        depth: settings.depth,
        guidedMode: settings.guidedMode,
        pageTitle,
        pageUrl
      }),
      parts: [
        { text: "Full screenshot:" }, imagePart(fullImage),
        { text: "Pointed region (crop):" }, imagePart(cropImage),
        ...(historyText ? [{ text: historyText }] : []),
        { text: `User question: ${question}` }
      ],
      onChunk: (chunk) => send({ type: "CHUNK", text: chunk })
    })
  );
  if (blocked) {
    send({
      type: "REFUSAL",
      message: "Gemini's safety system stopped this answer (" + blocked + "). Try rephrasing toward the educational concept."
    });
  }

  // Stage C — optional verification
  let verification = null;
  if (settings.verifyPass && full && !blocked) {
    send({ type: "STAGE", stage: "verify", label: "Double-checking" });
    try {
      verification = await geminiJson({
        apiKey: settings.apiKey,
        model,
        systemText: verifyPrompt(),
        schemaHint: "verification",
        parts: [
          { text: "Full screenshot:" }, imagePart(fullImage),
          { text: "Pointed region (crop):" }, imagePart(cropImage),
          { text: `User question: ${question}` },
          { text: `Draft answer to audit:\n${full}` }
        ]
      });
    } catch (_) {
      verification = { verdict: "skipped", issues: [], corrected_summary: "" };
    }
    send({ type: "VERIFY", verification });
  }

  send({ type: "DONE", full, verification });
}
