# 0FluffText ✨

> A privacy-first, client-side writing engine and PWA. Provides educational feedback via the **Coach’s Critique** while transforming text using the **Gemini API**.

---

## Features 📝
- **Coach’s Critique**: Highlights writing weaknesses (passive voice, redundancy) and explains corrections.
- **7 Transformation Styles**: Proofread, Rephrase, Shorten, Simplify, Modernize, Friendly, Emojify.
- **Custom Style Library**: Save up to 5 user-defined transformation profiles locally with BYOP (Bring Your Own Prompt).
- **Offline Capability**: Fully functional PWA with service worker caching.
- **No-Middleman Privacy**: Direct browser-to-API communication, no backend or intermediary servers.
  
---

## Architecture ⚙️
- **index.html**: Modern, high-contrast UI.
- **style.css**: Lightweight CSS-variable-based dark mode.
- **engine.js**: Prompt engineering, markdown parsing, Gemini 3 Flash REST integration.
- **app.js**: Application state, UI logic, localStorage management.
- **service-worker.js**: PWA asset versioning and offline persistence.
  
---

## Setup 🛠️
1. Get an API Key from [Google AI Studio](https://aistudio.google.com).
2. Add the API Key in Settings.
3. Start writing.

---

## Privacy 🔒
All processing occurs client-side. No data is sent to external servers beyond **Gemini API** calls. LocalStorage stores only user settings and custom styles.

---

## License 📄
[MIT](LICENSE)
