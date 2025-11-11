# AGENTS.md

## Commands

**Setup:** None required (static browser extension - no dependencies)

**Build:** Zip the `extension` folder for distribution

**Lint:** No linter configured

**Tests:** No tests configured

**Dev:** Load unpacked extension in browser at `chrome://extensions` (enable Developer mode)

## Tech Stack

- **JavaScript (ES5/ES6)**: Vanilla JS with class-based architecture
- **Chrome Extension Manifest V3**: Service worker, content scripts, storage API
- **Web Speech API**: Text-to-speech synthesis
- **HTML/CSS**: Popup and floating UI components

## Architecture

- `background.js`: Service worker for extension lifecycle and context menus
- `content.js`: Main content script coordinator
- `js/`: Modular components (storage, text extraction, highlighting, speech, UI)
- Scripts loaded in order via `manifest.json` (no ES6 imports in content scripts)

## Code Style

- Classes with static methods (StorageManager) or instances (SpeechManager)
- Promises for async operations
- Console logging for debugging
- No semicolons in some files, present in others (inconsistent)
- camelCase naming, descriptive function/variable names
