/**
 * Manages the floating control bar
 */
class FloatingBar {
    constructor() {
        this.bar = null;
        this.isDragging = false;
        this.dragOffsetX = 0;
        this.dragOffsetY = 0;
        this.isVisible = false;
        this.settingsPanel = null;
    }

    /**
     * Create and inject the floating bar
     */
    create() {
        // Remove existing bar if any
        this.remove();

        // Create the bar element
        this.bar = document.createElement("div");
        this.bar.id = "read-aloud-control-bar";
        this.bar.className = "hidden";
        this.bar.innerHTML = `
      <div id="read-aloud-progress-indicator" title="Reading progress">
        <svg width="32" height="32" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="16" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="2"></circle>
          <circle id="read-aloud-progress-circle" cx="18" cy="18" r="16" fill="none" stroke="white" stroke-width="2" stroke-dasharray="100.53 100.53" stroke-dashoffset="100.53" stroke-linecap="round" transform="rotate(-90 18 18)"></circle>
          <text id="read-aloud-progress-text" x="18" y="22" font-size="10" fill="white" text-anchor="middle" font-family="Arial, sans-serif">0%</text>
        </svg>
      </div>
      <div class="separator"></div>
      <button id="read-aloud-play-pause" title="Play/Pause">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="5,3 19,12 5,21"></polygon>
        </svg>
      </button>
      <button id="read-aloud-stop" title="Stop">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="4" y="4" width="16" height="16"></rect>
        </svg>
      </button>
      <div class="separator"></div>
      <button id="read-aloud-bookmark" title="Bookmark">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
        </svg>
      </button>
      <button id="read-aloud-skip-back-para" title="Skip Backward Paragraph (Ctrl+Left)">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="11,19 2,12 11,5"></polygon>
          <polygon points="22,19 13,12 22,5"></polygon>
        </svg>
      </button>
      <button id="read-aloud-skip-back-sent" title="Skip Backward Sentence (Ctrl+Down)">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="15,18 8,12 15,6"></polygon>
        </svg>
      </button>
      <button id="read-aloud-skip-forward-sent" title="Skip Forward Sentence (Ctrl+Up)">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="9,18 16,12 9,6"></polygon>
        </svg>
      </button>
      <button id="read-aloud-skip-forward-para" title="Skip Forward Paragraph (Ctrl+Right)">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="2,19 11,12 2,5"></polygon>
          <polygon points="13,19 22,12 13,5"></polygon>
        </svg>
      </button>
      <div class="separator"></div>
      <button id="read-aloud-settings" title="Settings">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
        </svg>
      </button>
    `;

        // Add the bar to the document
        document.body.appendChild(this.bar);

        // Make the bar draggable
        this.setupDragging();

        // Set up event listeners
        this.setupEventListeners();
    }

    /**
     * Set up dragging functionality
     */
    setupDragging() {
        this.bar.addEventListener("mousedown", (e) => {
            // Only start dragging if not clicking a button
            if (
                e.target.tagName !== "BUTTON" &&
                e.target.tagName !== "SVG" &&
                e.target.tagName !== "polygon" &&
                e.target.tagName !== "rect" &&
                e.target.tagName !== "path" &&
                e.target.tagName !== "circle"
            ) {
                this.isDragging = true;
                const rect = this.bar.getBoundingClientRect();
                this.dragOffsetX = e.clientX - rect.left;
                this.dragOffsetY = e.clientY - rect.top;
                e.preventDefault();
            }
        });

        document.addEventListener("mousemove", (e) => {
            if (this.isDragging) {
                const x = e.clientX - this.dragOffsetX;
                const y = e.clientY - this.dragOffsetY;

                // Keep the bar within the viewport
                const maxX = window.innerWidth - this.bar.offsetWidth;
                const maxY = window.innerHeight - this.bar.offsetHeight;

                this.bar.style.left = `${Math.max(0, Math.min(maxX, x))}px`;
                this.bar.style.top = `${Math.max(0, Math.min(maxY, y))}px`;
            }
        });

        document.addEventListener("mouseup", () => {
            this.isDragging = false;
        });
    }

    /**
     * Set up event listeners for the bar buttons
     */
    setupEventListeners() {
        const playPauseButton = document.getElementById(
            "read-aloud-play-pause"
        );
        const stopButton = document.getElementById("read-aloud-stop");
        const bookmarkButton = document.getElementById("read-aloud-bookmark");
        const skipBackParaButton = document.getElementById("read-aloud-skip-back-para");
        const skipBackSentButton = document.getElementById("read-aloud-skip-back-sent");
        const skipForwardSentButton = document.getElementById("read-aloud-skip-forward-sent");
        const skipForwardParaButton = document.getElementById("read-aloud-skip-forward-para");
        const settingsButton = document.getElementById("read-aloud-settings");

        // Store references to the SVG elements for play/pause toggle
        this.playIcon = playPauseButton.querySelector("svg");
        this.bookmarkIcon = bookmarkButton.querySelector("svg");

        // Set up click handlers
        if (playPauseButton) {
            playPauseButton.addEventListener("click", () => {
                if (this.onPlayPauseCallback) {
                    const isPlaying = this.onPlayPauseCallback();
                    this.updatePlayPauseButton(isPlaying);
                }
            });
        }

        if (stopButton) {
            stopButton.addEventListener("click", () => {
                if (this.onStopCallback) {
                    this.onStopCallback();
                    this.updatePlayPauseButton(false);
                }
            });
        }

        if (bookmarkButton) {
            bookmarkButton.addEventListener("click", () => {
                if (this.onBookmarkCallback) {
                    this.onBookmarkCallback();
                }
            });
        }

        if (skipBackParaButton) {
            skipBackParaButton.addEventListener("click", () => {
                if (this.onSkipBackwardParagraphCallback) {
                    this.onSkipBackwardParagraphCallback();
                }
            });
        }

        if (skipBackSentButton) {
            skipBackSentButton.addEventListener("click", () => {
                if (this.onSkipBackwardSentenceCallback) {
                    this.onSkipBackwardSentenceCallback();
                }
            });
        }

        if (skipForwardSentButton) {
            skipForwardSentButton.addEventListener("click", () => {
                if (this.onSkipForwardSentenceCallback) {
                    this.onSkipForwardSentenceCallback();
                }
            });
        }

        if (skipForwardParaButton) {
            skipForwardParaButton.addEventListener("click", () => {
                if (this.onSkipForwardParagraphCallback) {
                    this.onSkipForwardParagraphCallback();
                }
            });
        }

        if (settingsButton) {
            settingsButton.addEventListener("click", () => {
                if (this.settingsPanel) {
                    this.settingsPanel.toggle();
                }
            });
        }
    }

    /**
     * Update the progress indicator
     * @param {number} percentage - Progress percentage (0-100)
     */
    updateProgress(percentage) {
        const progressCircle = document.getElementById('read-aloud-progress-circle');
        const progressText = document.getElementById('read-aloud-progress-text');
        
        if (progressCircle && progressText) {
            percentage = Math.max(0, Math.min(100, percentage));
            
            const circumference = 2 * Math.PI * 16;
            const offset = circumference - (percentage / 100) * circumference;
            
            progressCircle.style.strokeDasharray = `${circumference} ${circumference}`;
            progressCircle.style.strokeDashoffset = offset;
            progressText.textContent = `${Math.round(percentage)}%`;
        }
    }

    /**
     * Update the play/pause button icon
     * @param {boolean} isPlaying - Whether speech is currently playing
     */
    updatePlayPauseButton(isPlaying) {
        if (!this.playIcon) return;

        if (isPlaying) {
            // Show pause icon
            this.playIcon.innerHTML = `
        <rect x="6" y="4" width="4" height="16"></rect>
        <rect x="14" y="4" width="4" height="16"></rect>
      `;
        } else {
            // Show play icon
            this.playIcon.innerHTML = `
        <polygon points="5,3 19,12 5,21"></polygon>
      `;
        }
    }

    /**
     * Set the settings panel instance
     * @param {SettingsPanel} settingsPanel - The settings panel instance
     */
    setSettingsPanel(settingsPanel) {
        this.settingsPanel = settingsPanel;
    }

    /**
     * Set callbacks for bar button actions
     * @param {Function} onPlayPause - Callback for play/pause button
     * @param {Function} onStop - Callback for stop button
     * @param {Function} onBookmark - Callback for bookmark button
     * @param {Function} onSkipBackwardSentence - Callback for skip backward sentence
     * @param {Function} onSkipForwardSentence - Callback for skip forward sentence
     * @param {Function} onSkipBackwardParagraph - Callback for skip backward paragraph
     * @param {Function} onSkipForwardParagraph - Callback for skip forward paragraph
     */
    setCallbacks(onPlayPause, onStop, onBookmark, onSkipBackwardSentence, onSkipForwardSentence, onSkipBackwardParagraph, onSkipForwardParagraph) {
        this.onPlayPauseCallback = onPlayPause;
        this.onStopCallback = onStop;
        this.onBookmarkCallback = onBookmark;
        this.onSkipBackwardSentenceCallback = onSkipBackwardSentence;
        this.onSkipForwardSentenceCallback = onSkipForwardSentence;
        this.onSkipBackwardParagraphCallback = onSkipBackwardParagraph;
        this.onSkipForwardParagraphCallback = onSkipForwardParagraph;
    }

    /**
     * Update the bookmark button to show bookmarked state
     * @param {boolean} isBookmarked - Whether the current page has a bookmark
     */
    updateBookmarkButton(isBookmarked) {
        if (!this.bookmarkIcon) return;

        if (isBookmarked) {
            this.bookmarkIcon.setAttribute("fill", "currentColor");
        } else {
            this.bookmarkIcon.setAttribute("fill", "none");
        }
    }

    /**
     * Show the floating bar
     */
    show() {
        if (this.bar) {
            this.bar.classList.remove("hidden");
            this.isVisible = true;

            // Ensure the bar is visible by checking its visibility after a short delay
            setTimeout(() => this.ensureVisibility(), 100);

            // Set up periodic visibility checks
            this.startVisibilityCheck();
        }
    }

    /**
     * Ensure the floating bar is visible and not hidden by other elements
     */
    ensureVisibility() {
        if (!this.bar || !this.isVisible) return;

        // Get the bar's bounding rectangle
        const rect = this.bar.getBoundingClientRect();

        // Check if the bar is visible in the viewport
        const isInViewport =
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= window.innerHeight &&
            rect.right <= window.innerWidth;

        // If not in viewport, reposition it
        if (!isInViewport) {
            this.bar.style.top = "10px";
            this.bar.style.right = "10px";
        }

        // Force the bar to be on top of other elements
        this.bar.style.zIndex = "2147483647";

        // Add a subtle animation to make it more noticeable
        this.bar.style.animation = "none";
        setTimeout(() => {
            this.bar.style.animation = "read-aloud-pulse 2s";
        }, 10);
    }

    /**
     * Start periodic visibility checks
     */
    startVisibilityCheck() {
        // Clear any existing interval
        if (this.visibilityInterval) {
            clearInterval(this.visibilityInterval);
        }

        // Check visibility every second
        this.visibilityInterval = setInterval(() => {
            if (this.isVisible) {
                this.ensureVisibility();
            } else {
                // Stop checking if the bar is hidden
                clearInterval(this.visibilityInterval);
                this.visibilityInterval = null;
            }
        }, 1000);
    }

    /**
     * Hide the floating bar
     */
    hide() {
        if (this.bar) {
            this.bar.classList.add("hidden");
            this.isVisible = false;

            // Clear visibility check interval
            if (this.visibilityInterval) {
                clearInterval(this.visibilityInterval);
                this.visibilityInterval = null;
            }

            // Also hide settings panel if visible
            if (this.settingsPanel) {
                this.settingsPanel.hide();
            }
        }
    }

    /**
     * Toggle the visibility of the floating bar
     * @returns {boolean} New visibility state
     */
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
        return this.isVisible;
    }

    /**
     * Remove the floating bar from the DOM
     */
    remove() {
        if (this.bar && this.bar.parentNode) {
            this.bar.parentNode.removeChild(this.bar);
            this.bar = null;
        }
    }

    /**
     * Check if the bar is currently visible
     * @returns {boolean} Whether the bar is visible
     */
    isCurrentlyVisible() {
        return this.isVisible;
    }
}

// Export the class
if (typeof module !== "undefined") {
    module.exports = FloatingBar;
}
