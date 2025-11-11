# AGENTS.md

## Commands

**Initial setup:** No package installation needed. This is a vanilla JavaScript browser extension.

**Build:** No build step required. Use as-is.

**Lint:** No linter configured.

**Tests:** No test suite configured.

**Dev server:** Open `chrome://extensions/` in Chrome/Edge, enable Developer mode, click "Load unpacked", select the `extension/` folder.

## Tech Stack & Architecture

- **Vanilla JavaScript** browser extension (Manifest V3)
- **Web Speech API** for text-to-speech
- **Chrome Extension APIs** for storage, context menus, and messaging
- Architecture: Content scripts (`extension/js/*.js`) injected into pages, popup UI, background service worker
- Main components: `speechSynthesis.js`, `highlighter.js`, `floatingBar.js`, `settingsPanel.js`, `textExtractor.js`, `storageManager.js`

## Code Style

- ES6 classes for component organization
- Promises for async operations
- Chrome storage sync API for settings persistence
- No imports/modules (scripts loaded via manifest order)
- Minimal comments; self-documenting code preferred
