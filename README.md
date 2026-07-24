# PinPoint — Ask Any Diagram

A Chrome extension that turns any diagram on any page — articles, textbooks, PDFs rendered in the browser, lecture slides — into something you can interrogate. Press the shortcut, the page freezes, and then you point at the exact part you're confused about with a pin or a box, and a LLM tutor answers with its reasoning shown.

## Install (unpacked, 2 minutes)

1. Open `chrome://extensions`, turn on **Developer mode** (top right).
2. Click **Load unpacked** and choose this `pinpoint/` folder.
3. Click the PinPoint icon, paste a Gemini API key from [aistudio.google.com](https://aistudio.google.com), and press **Test**.
4. On any page with a diagram, press **Alt+Shift+P** (or the popup's button), point, and ask.

The default model is `gemini-3.5-flash` and it is recommended to use this for optimised performance of the system; you can switch models in the popup.

## How it works

![PinPoint Architecture](https://github.com/faiz-mubeen/pinpoint/blob/main/architecture/Pinpoint.png)

Why two images? The crop gives the model pixel detail on the pointed part; the full screenshot (with the selection outlined in teal on it) gives global context — labels elsewhere, arrows entering the region, the figure caption. The triage stage exists so the answer stage starts from a stated hypothesis it must verify against pixels, instead of free-associating.

## Features

- **Pin and Box pointing** with a live loupe magnifier, drop animation, pulse rings, spotlight veil, and animated selection ring.
- **Streaming answers** with three explicit sections; reasoning and caveats fold into a "Why this answer" drawer.
- **Self-check pass** (toggleable): a second model call audits the draft and shows a pass / issues / fail badge with corrections.
- **Answer depth**: Simple (ELI5), Standard (undergraduate), Expert.
- **Guided mode**: Socratic hints instead of final answers, for homework integrity.
- **Follow-up questions** on the same region, with short conversation history carried along.
- **Suggested question chips** for the first ask.
- **Recapture** and re-point without leaving the overlay; Esc closes everywhere.

## Safe & explainable AI policy

Enforced in three layers — code, prompt, and UI:

**Code layer.** A dangerous-capability flag from triage hard-stops the pipeline before an answer call is made. Gemini's own safety settings are set to block medium-and-above across all harm categories, and safety-blocked streams surface an honest message instead of a silent failure. The API key lives only in `chrome.storage.local`; images go only to Google's Gemini endpoint, only when the user presses Ask, and are never persisted by the extension.

**Prompt layer.** Every stage carries the same policy block: educational explanations only, no operational instructions for weapons/toxins/malware even if such a diagram is on screen; medical diagrams are taught scientifically with no personal medical advice; personal data accidentally captured in the screenshot must never be repeated or reasoned about; ambiguity must be stated as ambiguity, and claims must be tied to visible evidence or explicitly marked as background knowledge.

**UI layer.** A one-time consent card explains exactly what is sent and when, before the first use. If triage detects visible personal info, the answer carries a warning suggesting a recapture. Every answer exposes its reasoning ("How I read the diagram") and a confidence line, and the self-check verdict is shown rather than silently applied.

## Edge cases covered

| Case | Handling |
|---|---|
| No API key | Toast nudge in overlay + guided setup in popup with a live key test |
| Invalid key / wrong model / 403 | Specific, actionable error messages per status code |
| Rate limits (429) and 5xx | Automatic retry with exponential backoff and jitter |
| Restricted pages (chrome://, Web Store) | Detected before injection; badge feedback instead of a crash |
| Capture blocked by the page | Friendly toast explaining why |
| HiDPI / browser zoom | All coordinates mapped through the real bitmap-to-viewport scale |
| Tiny selection or accidental micro-drag | Treated as a pin; crop upscaled to ≥512px for the model |
| Selection at screen edges | Clamped to image bounds |
| Huge screenshots | Full image downscaled to ≤1568px before upload |
| Not actually a diagram | Triage flags it; user is told the answer may be less grounded |
| PII visible on screen | Triage flags it; prompt forbids using it; UI suggests recapture |
| Gemini safety block mid-stream | Explicit message with a rephrasing suggestion |
| Malformed JSON from triage/verify | Parse errors caught; retried or gracefully skipped |
| Double injection / SPA navigation | Load guard on the content script |
| Page CSS/JS interference | Entire UI in a closed Shadow DOM with `all: initial` |
| Keyboard & motion accessibility | Esc everywhere, Enter to ask, focus management, ARIA roles, `prefers-reduced-motion` respected |

## Project layout

```
pinpoint/
├── manifest.json          MV3 manifest (activeTab + scripting + storage only)
├── background.js          capture, launch, agent pipeline, error taxonomy
├── content/content.js     overlay UI: loupe, pin/box, panel, streaming render
├── popup/                 settings: key, model, depth, toggles
└── icons/                 generated pin glyph
```

## Notes and honest limitations

- `captureVisibleTab` captures the visible viewport, so scroll the diagram fully into view first. Chrome's built-in PDF viewer usually works; some embedded viewers block capture.
- The self-check pass roughly doubles token cost per question; turn it off in settings if cost matters more than the audit.
- Model availability depends on your key. If `gemini-3.5-flash` returns 404 on your account, pick another model in the popup.
- This is an educational tool. Verified answers reduce, but do not eliminate, the chance of a wrong reading of a low-quality figure — the confidence line tells you when to double-check.
