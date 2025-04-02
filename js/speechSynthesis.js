/**
 * Manages speech synthesis functionality
 */
class SpeechManager {
  constructor() {
    this.synth = window.speechSynthesis;
    this.utterance = null;
    this.voices = [];
    this.currentTextNodes = [];
    this.currentNodeIndex = 0;
    this.currentWordIndex = 0;
    this.isPlaying = false;
    this.settings = {
      speed: 1.0,
      pitch: 1.0,
      voice: ''
    };
    this.highlighter = null;
    this.onBoundaryCallback = null;
    this.onEndCallback = null;

    // Load available voices
    this.loadVoices();
    
    // Some browsers need a delay to load voices
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = this.loadVoices.bind(this);
    }
  }

  /**
   * Load available voices
   */
  loadVoices() {
    this.voices = this.synth.getVoices();
  }

  /**
   * Set the highlighter instance
   * @param {Highlighter} highlighter - The highlighter instance
   */
  setHighlighter(highlighter) {
    this.highlighter = highlighter;
  }

  /**
   * Set callbacks for speech events
   * @param {Function} onBoundary - Callback for word boundary event
   * @param {Function} onEnd - Callback for end of speech event
   */
  setCallbacks(onBoundary, onEnd) {
    this.onBoundaryCallback = onBoundary;
    this.onEndCallback = onEnd;
  }

  /**
   * Update settings from storage
   * @returns {Promise} Promise that resolves when settings are loaded
   */
  async updateSettings() {
    try {
      this.settings = await StorageManager.getSettings();
      return this.settings;
    } catch (error) {
      console.error('Error loading settings:', error);
      return this.settings;
    }
  }

  /**
   * Start reading from the given text nodes
   * @param {Array} textNodes - Array of text nodes to read
   * @param {number} startNodeIndex - Index of the node to start from
   * @param {number} startWordIndex - Index of the word to start from
   */
  startReading(textNodes, startNodeIndex = 0, startWordIndex = 0) {
    this.stop();
    
    this.currentTextNodes = textNodes;
    this.currentNodeIndex = startNodeIndex;
    this.currentWordIndex = startWordIndex;
    
    if (this.currentTextNodes.length === 0 || this.currentNodeIndex >= this.currentTextNodes.length) {
      return;
    }
    
    this.readCurrentNode();
  }

  /**
   * Read the current text node
   */
  readCurrentNode() {
    if (this.currentNodeIndex >= this.currentTextNodes.length) {
      if (this.onEndCallback) this.onEndCallback();
      return;
    }
    
    const currentNode = this.currentTextNodes[this.currentNodeIndex];
    const text = currentNode.text;
    
    this.utterance = new SpeechSynthesisUtterance(text);
    this.utterance.rate = this.settings.speed;
    this.utterance.pitch = this.settings.pitch;
    
    // Set voice if specified
    if (this.settings.voice) {
      const selectedVoice = this.voices.find(voice => voice.name === this.settings.voice);
      if (selectedVoice) {
        this.utterance.voice = selectedVoice;
      }
    }
    
    // Handle word boundaries for highlighting
    this.utterance.onboundary = (event) => {
      if (event.name === 'word') {
        const wordIndex = this.getWordIndexFromCharIndex(text, event.charIndex);
        if (this.highlighter && wordIndex !== -1) {
          this.highlighter.highlightWord(this.currentNodeIndex, wordIndex);
        }
        if (this.onBoundaryCallback) {
          this.onBoundaryCallback(this.currentNodeIndex, wordIndex);
        }
      }
    };
    
    // Move to the next node when done
    this.utterance.onend = () => {
      this.currentNodeIndex++;
      this.currentWordIndex = 0;
      this.readCurrentNode();
    };
    
    this.isPlaying = true;
    this.synth.speak(this.utterance);
  }

  /**
   * Get the word index from a character index
   * @param {string} text - The text being spoken
   * @param {number} charIndex - The character index from the speech event
   * @returns {number} The word index
   */
  getWordIndexFromCharIndex(text, charIndex) {
    const words = TextExtractor.splitIntoWords(text);
    for (let i = 0; i < words.length; i++) {
      if (charIndex >= words[i].startIndex && charIndex <= words[i].endIndex) {
        return i;
      }
    }
    return -1;
  }

  /**
   * Pause speech
   */
  pause() {
    if (this.isPlaying) {
      this.synth.pause();
      this.isPlaying = false;
    }
  }

  /**
   * Resume speech
   */
  resume() {
    if (!this.isPlaying) {
      this.synth.resume();
      this.isPlaying = true;
    }
  }

  /**
   * Stop speech
   */
  stop() {
    this.synth.cancel();
    this.isPlaying = false;
    if (this.highlighter) {
      this.highlighter.clearHighlights();
    }
  }

  /**
   * Toggle play/pause
   * @returns {boolean} New playing state
   */
  togglePlayPause() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.resume();
    }
    return this.isPlaying;
  }

  /**
   * Get available voices
   * @returns {Array} Array of available voices
   */
  getVoices() {
    return this.voices;
  }

  /**
   * Check if speech is currently playing
   * @returns {boolean} Whether speech is playing
   */
  isCurrentlyPlaying() {
    return this.isPlaying;
  }
}

// Export the class
if (typeof module !== 'undefined') {
  module.exports = SpeechManager;
}
