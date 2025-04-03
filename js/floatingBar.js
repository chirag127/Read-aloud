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
        const settingsButton = document.getElementById("read-aloud-settings");

        // Store references to the SVG elements for play/pause toggle
        this.playIcon = playPauseButton.querySelector("svg");

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

        if (settingsButton) {
            settingsButton.addEventListener("click", () => {
                if (this.settingsPanel) {
                    this.settingsPanel.toggle();
                }
            });
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
     */
    setCallbacks(onPlayPause, onStop) {
        this.onPlayPauseCallback = onPlayPause;
        this.onStopCallback = onStop;
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
