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
            voice: "",
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
        console.log("Loaded voices:", this.voices);

        // Notify any listeners that voices have been updated
        if (this.onVoicesLoadedCallback) {
            this.onVoicesLoadedCallback(this.voices);
        }
    }

    /**
     * Set callback for when voices are loaded
     * @param {Function} callback - Function to call when voices are loaded
     */
    setOnVoicesLoadedCallback(callback) {
        this.onVoicesLoadedCallback = callback;

        // If voices are already loaded, call the callback immediately
        if (this.voices && this.voices.length > 0) {
            callback(this.voices);
        }
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
     * @param {Function} onStartReading - Callback for when reading starts
     */
    setCallbacks(onBoundary, onEnd, onStartReading) {
        this.onBoundaryCallback = onBoundary;
        this.onEndCallback = onEnd;
        this.onStartReadingCallback = onStartReading;
    }

    /**
     * Update settings from storage
     * @returns {Promise} Promise that resolves when settings are loaded
     */
    async updateSettings() {
        try {
            this.settings = await StorageManager.getSettings();
            console.log("Speech manager updated settings:", this.settings);

            // If we're currently speaking, apply the new settings
            if (this.isPlaying && this.utterance) {
                // We can't update the current utterance, so we need to stop and restart
                const currentNode = this.currentNodeIndex;
                const currentWord = this.currentWordIndex;

                // Remember the current position
                this.stop();

                // Start again from where we left off with new settings
                if (this.currentTextNodes.length > 0) {
                    this.startReading(
                        this.currentTextNodes,
                        currentNode,
                        currentWord
                    );

                    // Make sure the onStartReadingCallback is called to show the floating bar
                    if (this.onStartReadingCallback) {
                        this.onStartReadingCallback();
                    }
                }
            }

            return this.settings;
        } catch (error) {
            console.error("Error loading settings:", error);
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

        if (
            this.currentTextNodes.length === 0 ||
            this.currentNodeIndex >= this.currentTextNodes.length
        ) {
            return;
        }

        // Notify that reading is starting
        if (this.onStartReadingCallback) {
            this.onStartReadingCallback();
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
        const fullText = currentNode.text;
        let text = fullText;

        // If we have a word index, start from that word
        if (this.currentWordIndex > 0) {
            console.log(`Starting from word index ${this.currentWordIndex}`);
            const words = TextExtractor.splitIntoWords(fullText);

            // Make sure the word index is valid
            if (this.currentWordIndex < words.length) {
                // Get the character index of the start word
                const startCharIndex = words[this.currentWordIndex].startIndex;

                // Extract text from the start word to the end
                text = fullText.substring(startCharIndex);
                console.log(`Starting text: "${text}"`);
            }
        }

        this.utterance = new SpeechSynthesisUtterance(text);
        this.utterance.rate = Math.min(4, Math.max(0.5, this.settings.speed));
        this.utterance.pitch = this.settings.pitch;

        // Set voice if specified
        if (this.settings.voice) {
            const selectedVoice = this.voices.find(
                (voice) => voice.name === this.settings.voice
            );
            if (selectedVoice) {
                this.utterance.voice = selectedVoice;
            }
        }

        // Handle word boundaries for highlighting
        this.utterance.onboundary = (event) => {
            if (event.name === "word") {
                // If we're starting from a substring, we need to adjust the word index
                let adjustedWordIndex;

                if (this.currentWordIndex > 0 && text !== fullText) {
                    // We're starting from a substring of the full text

                    // Find the word in the substring
                    const subTextWordIndex = this.getWordIndexFromCharIndex(
                        text,
                        event.charIndex
                    );

                    if (subTextWordIndex !== -1) {
                        // Add the offset to get the word index in the full text
                        adjustedWordIndex =
                            this.currentWordIndex + subTextWordIndex;
                    } else {
                        adjustedWordIndex = -1;
                    }
                } else {
                    // We're reading the full text, so just get the word index directly
                    adjustedWordIndex = this.getWordIndexFromCharIndex(
                        text,
                        event.charIndex
                    );
                }

                if (this.highlighter && adjustedWordIndex !== -1) {
                    this.highlighter.highlightWord(
                        this.currentNodeIndex,
                        adjustedWordIndex
                    );
                }
                if (this.onBoundaryCallback) {
                    this.onBoundaryCallback(
                        this.currentNodeIndex,
                        adjustedWordIndex
                    );
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
            if (
                charIndex >= words[i].startIndex &&
                charIndex <= words[i].endIndex
            ) {
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
        console.log("Toggle play/pause, current state:", this.isPlaying);
        if (this.isPlaying) {
            this.pause();
            console.log("Paused speech");
        } else {
            // If we don't have an active utterance, we can't resume
            if (!this.utterance && this.currentTextNodes.length > 0) {
                console.log(
                    "No active utterance, starting from current position"
                );

                // Notify that reading is starting/resuming
                if (this.onStartReadingCallback) {
                    this.onStartReadingCallback();
                }

                this.readCurrentNode();
            } else {
                console.log("Resuming speech");

                // Notify that reading is starting/resuming
                if (this.onStartReadingCallback) {
                    this.onStartReadingCallback();
                }

                this.resume();
            }
        }
        console.log("New playing state:", this.isPlaying);
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

    /**
     * Get current reading position
     * @returns {Object} Object with nodeIndex and wordIndex
     */
    getCurrentPosition() {
        return {
            nodeIndex: this.currentNodeIndex,
            wordIndex: this.currentWordIndex,
        };
    }
}

// Export the class
if (typeof module !== "undefined") {
    module.exports = SpeechManager;
}
