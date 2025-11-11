# AGENTS.md

## Commands

### Initial Setup
No package installation or virtual environment needed. This is a vanilla JavaScript browser extension.

### Build
```bash
Compress-Archive -Path extension\* -DestinationPath extension.zip
```

### Dev Server
Load unpacked extension in Chrome at `chrome://extensions/` (enable Developer Mode, click "Load unpacked", select `extension/` folder).

### Tests
No test framework configured.

### Lint
No linter configured.

## Tech Stack
- **Vanilla JavaScript** (ES5/ES6 classes)
- **Chrome Extension Manifest V3**
- **Web Speech API** for text-to-speech
- **Chrome Storage API** for settings persistence

## Architecture
- `extension/background.js` - Service worker (context menus, install handler)
- `extension/content.js` - Main orchestrator injected into web pages
- `extension/js/` - Modular components (speech, highlighting, text extraction, UI)
- `extension/popup.js` - Extension popup UI controller

## Code Style
- No comments unless complex logic requires it
- ES6 classes with JSDoc for public methods
- Camel case for variables and methods
- Event-driven architecture with callbacks
- Direct DOM manipulation (no frameworks)
