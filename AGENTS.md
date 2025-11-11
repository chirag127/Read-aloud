# AGENTS.md - Developer Guide

## Commands

**Initial Setup:** None required (vanilla JavaScript browser extension)

**Build:** None (no build step)

**Lint:** None (no linter configured)

**Tests:** None (no test suite)

**Dev Server:** Load extension in Chrome via `chrome://extensions/` → Enable "Developer mode" → "Load unpacked" → Select `extension/` folder

## Tech Stack

- Vanilla JavaScript (no frameworks)
- Chrome Extension Manifest V3
- Web Speech API for TTS
- Chrome Storage API for settings persistence

## Architecture

- `extension/manifest.json` - Extension configuration
- `extension/background.js` - Service worker for context menu & initialization
- `extension/content.js` - Main orchestrator, initializes all components
- `extension/js/` - Modular components: `speechSynthesis.js`, `highlighter.js`, `floatingBar.js`, `settingsPanel.js`, `textExtractor.js`, `storageManager.js`
- `extension/popup.js` - Extension popup UI logic
- `extension/content.css` - Styling for injected UI elements

## Code Style

- Use ES6 classes for components
- Camelcase for variables/functions
- `chrome.runtime.onMessage` for cross-script communication
- All injected DOM elements use `!important` CSS to prevent page interference
- Extensive `console.log` for debugging
