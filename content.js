// Global variables
let isReading = false;
let speechSynthesis = window.speechSynthesis;
let utterance = null;
let paragraphs = [];
let words = [];
let currentParagraphIndex = 0;
let currentWordIndex = 0;
let controlBar = null;
let settings = {
  rate: 1.0,
  pitch: 1.0,
  voice: null
};

// Initialize when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  loadSettings();

  // Listen for messages from the background script
  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === "toggleReader") {
      toggleReader();
    }
  });

  // Listen for text selection
  document.addEventListener('mouseup', handleTextSelection);
});

// Initialize the extension even if the DOM is already loaded
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  loadSettings();

  // Listen for messages from the background script
  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === "toggleReader") {
      toggleReader();
    }
  });

  // Listen for text selection
  document.addEventListener('mouseup', handleTextSelection);
}

// Load user settings from storage
function loadSettings() {
  chrome.storage.sync.get({
    rate: 1.0,
    pitch: 1.0,
    voiceURI: ''
  }, (items) => {
    settings.rate = items.rate;
    settings.pitch = items.pitch;

    // Load available voices and set the selected one
    speechSynthesis.onvoiceschanged = () => {
      const voices = speechSynthesis.getVoices();
      if (items.voiceURI && voices.length > 0) {
        settings.voice = voices.find(voice => voice.voiceURI === items.voiceURI) || voices[0];
      } else if (voices.length > 0) {
        settings.voice = voices[0];
      }
    };

    // Trigger voices loading
    speechSynthesis.getVoices();
  });
}

// Save settings to storage
function saveSettings() {
  chrome.storage.sync.set({
    rate: settings.rate,
    pitch: settings.pitch,
    voiceURI: settings.voice ? settings.voice.voiceURI : ''
  });
}

// Toggle the read aloud functionality
function toggleReader() {
  if (isReading) {
    stopReading();
  } else {
    startReading();
  }
}

// Start reading from the current position or from the beginning
function startReading(selectedText = null) {
  // Create control bar if it doesn't exist
  if (!controlBar) {
    createControlBar();
  }

  // Show control bar
  controlBar.style.display = 'flex';

  // If there's selected text, use that as the starting point
  if (selectedText) {
    processSelectedText(selectedText);
  } else {
    // Otherwise, gather all text from the page
    gatherPageText();
  }

  // Start reading
  isReading = true;
  updateControlBar();
  readCurrentWord();
}

// Stop reading
function stopReading() {
  isReading = false;
  if (utterance) {
    speechSynthesis.cancel();
    utterance = null;
  }

  // Unhighlight any highlighted word
  removeHighlights();

  // Update control bar
  updateControlBar();
}

// Create the control bar
function createControlBar() {
  controlBar = document.createElement('div');
  controlBar.id = 'read-aloud-control-bar';
  controlBar.className = 'read-aloud-control-bar';

  // Play/Pause button
  const playPauseBtn = document.createElement('button');
  playPauseBtn.id = 'read-aloud-play-pause';
  playPauseBtn.textContent = '▶️';
  playPauseBtn.addEventListener('click', toggleReader);

  // Settings button
  const settingsBtn = document.createElement('button');
  settingsBtn.id = 'read-aloud-settings';
  settingsBtn.textContent = '⚙️';
  settingsBtn.addEventListener('click', toggleSettingsPanel);

  // Add buttons to the control bar
  controlBar.appendChild(playPauseBtn);
  controlBar.appendChild(settingsBtn);

  // Create settings panel (hidden by default)
  const settingsPanel = document.createElement('div');
  settingsPanel.id = 'read-aloud-settings-panel';
  settingsPanel.className = 'read-aloud-settings-panel';
  settingsPanel.style.display = 'none';

  // Rate control
  const rateControl = createRangeControl('Speed', 0.5, 2.0, 0.1, settings.rate, (value) => {
    settings.rate = parseFloat(value);
    saveSettings();
    if (utterance) {
      stopReading();
      startReading();
    }
  });

  // Pitch control
  const pitchControl = createRangeControl('Pitch', 0.5, 2.0, 0.1, settings.pitch, (value) => {
    settings.pitch = parseFloat(value);
    saveSettings();
    if (utterance) {
      stopReading();
      startReading();
    }
  });

  // Voice selection
  const voiceSelection = document.createElement('div');
  const voiceLabel = document.createElement('label');
  voiceLabel.textContent = 'Voice: ';
  const voiceSelect = document.createElement('select');
  voiceSelect.id = 'read-aloud-voice-select';

  // Populate voice options
  speechSynthesis.onvoiceschanged = () => {
    const voices = speechSynthesis.getVoices();
    voiceSelect.innerHTML = '';
    voices.forEach((voice, index) => {
      const option = document.createElement('option');
      option.value = voice.voiceURI;
      option.textContent = `${voice.name} (${voice.lang})`;
      if (settings.voice && voice.voiceURI === settings.voice.voiceURI) {
        option.selected = true;
      }
      voiceSelect.appendChild(option);
    });
  };

  voiceSelect.addEventListener('change', () => {
    const voices = speechSynthesis.getVoices();
    const selectedVoice = voices.find(voice => voice.voiceURI === voiceSelect.value);
    if (selectedVoice) {
      settings.voice = selectedVoice;
      saveSettings();
      if (utterance) {
        stopReading();
        startReading();
      }
    }
  });

  // Trigger voices loading
  speechSynthesis.getVoices();

  voiceSelection.appendChild(voiceLabel);
  voiceSelection.appendChild(voiceSelect);

  // Add controls to settings panel
  settingsPanel.appendChild(rateControl);
  settingsPanel.appendChild(pitchControl);
  settingsPanel.appendChild(voiceSelection);

  // Add settings panel to the control bar
  controlBar.appendChild(settingsPanel);

  // Add control bar to the page
  document.body.insertBefore(controlBar, document.body.firstChild);

  // Add some CSS to ensure the control bar is visible and stays on top
  const style = document.createElement('style');
  style.textContent = `
    .read-aloud-control-bar {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 40px;
      background-color: #f1f1f1;
      display: flex;
      align-items: center;
      padding: 0 10px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
      z-index: 10000;
    }
    .read-aloud-control-bar button {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      margin-right: 10px;
    }
    .read-aloud-settings-panel {
      position: absolute;
      top: 40px;
      right: 10px;
      width: 250px;
      background-color: white;
      border: 1px solid #ccc;
      border-radius: 4px;
      padding: 10px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      z-index: 10001;
    }
    .read-aloud-highlighted-word {
      background-color: yellow;
      color: black;
    }
    body {
      margin-top: 40px;
    }
  `;
  document.head.appendChild(style);
}

// Create a range control for settings
function createRangeControl(labelText, min, max, step, value, onChange) {
  const container = document.createElement('div');
  container.style.margin = '10px 0';

  const label = document.createElement('label');
  label.textContent = `${labelText}: `;

  const range = document.createElement('input');
  range.type = 'range';
  range.min = min;
  range.max = max;
  range.step = step;
  range.value = value;

  const valueDisplay = document.createElement('span');
  valueDisplay.textContent = value;
  valueDisplay.style.marginLeft = '5px';

  range.addEventListener('input', () => {
    valueDisplay.textContent = range.value;
    onChange(range.value);
  });

  container.appendChild(label);
  container.appendChild(range);
  container.appendChild(valueDisplay);

  return container;
}

// Toggle settings panel
function toggleSettingsPanel() {
  const settingsPanel = document.getElementById('read-aloud-settings-panel');
  if (settingsPanel.style.display === 'none') {
    settingsPanel.style.display = 'block';
  } else {
    settingsPanel.style.display = 'none';
  }
}

// Update control bar UI based on reading state
function updateControlBar() {
  const playPauseBtn = document.getElementById('read-aloud-play-pause');
  if (isReading) {
    playPauseBtn.textContent = '⏸️';
  } else {
    playPauseBtn.textContent = '▶️';
  }
}

// Gather all text from the page
function gatherPageText() {
  // Reset current indices
  currentParagraphIndex = 0;
  currentWordIndex = 0;

  // Get all text nodes that are visible
  const textElements = Array.from(document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, td, th, div'))
    .filter(el => {
      const style = window.getComputedStyle(el);
      return style.display !== 'none' &&
             style.visibility !== 'hidden' &&
             el.offsetWidth > 0 &&
             el.offsetHeight > 0 &&
             el.textContent.trim().length > 0;
    });

  // Process each text element
  paragraphs = textElements.map(el => {
    const text = el.textContent.trim();
    return {
      element: el,
      text: text,
      words: text.split(/\s+/).filter(word => word.length > 0)
    };
  }).filter(para => para.words.length > 0);

  // Flatten all words for easier navigation
  words = [];
  paragraphs.forEach(para => {
    para.words.forEach(word => {
      words.push({
        text: word,
        paraIndex: paragraphs.indexOf(para),
        element: para.element
      });
    });
  });
}

// Process selected text
function processSelectedText(selection) {
  const range = selection.getRangeAt(0);
  const startNode = range.startContainer;

  // Find the containing element
  let element = startNode.nodeType === Node.TEXT_NODE ? startNode.parentElement : startNode;

  // Get the selected text
  const text = selection.toString().trim();

  // Reset paragraphs and words
  paragraphs = [{
    element: element,
    text: text,
    words: text.split(/\s+/).filter(word => word.length > 0)
  }];

  // Flatten all words
  words = [];
  paragraphs[0].words.forEach(word => {
    words.push({
      text: word,
      paraIndex: 0,
      element: paragraphs[0].element
    });
  });

  // Reset indices
  currentParagraphIndex = 0;
  currentWordIndex = 0;
}

// Handle text selection
function handleTextSelection() {
  const selection = window.getSelection();
  if (selection.rangeCount > 0 && selection.toString().trim().length > 0) {
    // If control bar is visible, allow starting from selection
    if (controlBar && controlBar.style.display === 'flex') {
      // Stop current reading
      if (isReading) {
        stopReading();
      }

      // Start reading from selection
      startReading(selection);
    }
  }
}

// Read the current word
function readCurrentWord() {
  if (!isReading || currentWordIndex >= words.length) {
    stopReading();
    return;
  }

  // Get the current word
  const word = words[currentWordIndex];

  // Highlight the current word
  highlightWord(word);

  // Create utterance for the current word
  utterance = new SpeechSynthesisUtterance(word.text);
  utterance.rate = settings.rate;
  utterance.pitch = settings.pitch;
  if (settings.voice) {
    utterance.voice = settings.voice;
  }

  // Set up the event for when the word finishes
  utterance.onend = () => {
    if (isReading) {
      // Move to the next word
      currentWordIndex++;
      readCurrentWord();
    }
  };

  // Speak the word
  speechSynthesis.speak(utterance);
}

// Highlight the current word
function highlightWord(word) {
  // Remove any existing highlights
  removeHighlights();

  // Find the word in the element
  const element = word.element;
  const text = element.textContent;

  // Create a temporary element to hold the text
  const tempDiv = document.createElement('div');

  // Split the text by the word to highlight
  const parts = text.split(new RegExp(`(\\b${word.text}\\b)`, 'i'));

  // Flag to ensure we only highlight the first occurrence (in case of duplicates)
  let found = false;

  // Process each part
  parts.forEach(part => {
    if (part.toLowerCase() === word.text.toLowerCase() && !found) {
      // Create a span for the highlighted word
      const span = document.createElement('span');
      span.className = 'read-aloud-highlighted-word';
      span.textContent = part;
      tempDiv.appendChild(span);
      found = true;
    } else {
      // Create a text node for normal text
      tempDiv.appendChild(document.createTextNode(part));
    }
  });

  // Store the original content for restoration
  element.dataset.originalContent = element.innerHTML;

  // Replace with the highlighted content
  element.innerHTML = tempDiv.innerHTML;

  // Scroll the highlighted word into view if needed
  const highlightedSpan = element.querySelector('.read-aloud-highlighted-word');
  if (highlightedSpan) {
    // Use getBoundingClientRect for precise positioning
    const rect = highlightedSpan.getBoundingClientRect();
    const isInView = (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );

    if (!isInView) {
      highlightedSpan.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }
}

// Remove all highlights
function removeHighlights() {
  const elements = document.querySelectorAll('[data-original-content]');
  elements.forEach(element => {
    element.innerHTML = element.dataset.originalContent;
    delete element.dataset.originalContent;
  });
}