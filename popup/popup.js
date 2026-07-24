const $ = (id) => document.getElementById(id);

const DEFAULTS = {
  apiKey: "", model: "gemini-3.5-flash", depth: "standard",
  guidedMode: false, verifyPass: true, privacyBlur: true
};

let settings = { ...DEFAULTS };

async function load() {
  const stored = await chrome.storage.local.get("pinpointSettings");
  settings = { ...DEFAULTS, ...(stored.pinpointSettings || {}) };
  $("apiKey").value = settings.apiKey;
  $("model").value = settings.model;
  $("guidedMode").checked = settings.guidedMode;
  $("verifyPass").checked = settings.verifyPass;
  $("privacyBlur").checked = settings.privacyBlur;
  document.querySelectorAll("#depthSeg button").forEach((b) =>
    b.classList.toggle("on", b.dataset.v === settings.depth));
}

async function save(patch) {
  settings = { ...settings, ...patch };
  await chrome.storage.local.set({ pinpointSettings: settings });
}

$("apiKey").addEventListener("change", (e) => save({ apiKey: e.target.value.trim() }));
$("model").addEventListener("change", (e) => save({ model: e.target.value }));
$("guidedMode").addEventListener("change", (e) => save({ guidedMode: e.target.checked }));
$("verifyPass").addEventListener("change", (e) => save({ verifyPass: e.target.checked }));
$("privacyBlur").addEventListener("change", (e) => save({ privacyBlur: e.target.checked }));

document.querySelectorAll("#depthSeg button").forEach((b) => {
  b.addEventListener("click", () => {
    document.querySelectorAll("#depthSeg button").forEach((x) => x.classList.remove("on"));
    b.classList.add("on");
    save({ depth: b.dataset.v });
  });
});

$("testKey").addEventListener("click", async () => {
  const key = $("apiKey").value.trim();
  const st = $("keyStatus");
  st.className = "status"; st.textContent = "Testing…";
  if (!key) { st.className = "status bad"; st.textContent = "Paste a key first."; return; }
  await save({ apiKey: key });
  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${settings.model}:generateContent?key=${encodeURIComponent(key)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: "ping" }] }], generationConfig: { maxOutputTokens: 5 } })
      }
    );
    if (r.ok) { st.className = "status ok"; st.textContent = "Key works with " + settings.model + " ✓"; }
    else if (r.status === 404) { st.className = "status bad"; st.textContent = "Key ok, but this model isn't available on it."; }
    else if (r.status === 400 || r.status === 403) { st.className = "status bad"; st.textContent = "Key rejected — check it in AI Studio."; }
    else { st.className = "status bad"; st.textContent = "Error " + r.status + " — try again."; }
  } catch (_) {
    st.className = "status bad"; st.textContent = "Network error — are you online?";
  }
});

$("start").addEventListener("click", async () => {
  await save({ apiKey: $("apiKey").value.trim() });
  // Resolve the target tab HERE, in the popup, where currentWindow reliably
  // means the tab's window. Passing the id avoids a fragile re-query in the
  // background that can come back empty while the popup still holds focus.
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  await chrome.runtime.sendMessage({ type: "PINPOINT_START_FROM_POPUP", tabId: tab?.id });
  window.close();
});

load();
