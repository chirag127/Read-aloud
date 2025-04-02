/**
 * Manages the settings panel
 */
class SettingsPanel {
    constructor() {
        this.panel = null;
        this.isVisible = false;
        this.settings = {
            speed: 1.0,
            pitch: 1.0,
            voice: "",
        };
        this.voices = [];
        this.onSettingsChangeCallback = null;
    }

    /**
     * Create and inject the settings panel
     * @param {Array} voices - Available speech synthesis voices
     */
    create(voices) {
        // Remove existing panel if any
        this.remove();

        this.voices = voices || [];
        console.log("Creating settings panel with voices:", this.voices);

        // Create the panel element
        this.panel = document.createElement("div");
        this.panel.id = "read-aloud-settings-panel";

        // Create panel content
        this.panel.innerHTML = `
      <h3>Read Aloud Settings</h3>

      <label for="read-aloud-speed">Speed</label>
      <input type="range" id="read-aloud-speed" min="0.5" max="6" step="0.1" value="${
          this.settings.speed
      }">
      <span id="read-aloud-speed-value">${this.settings.speed.toFixed(
          1
      )}x</span>

      <label for="read-aloud-pitch">Pitch</label>
      <input type="range" id="read-aloud-pitch" min="0.5" max="2" step="0.1" value="${
          this.settings.pitch
      }">
      <span id="read-aloud-pitch-value">${this.settings.pitch.toFixed(1)}</span>

      <label for="read-aloud-voice">Voice</label>
      <select id="read-aloud-voice">
        <option value="">Default</option>
        ${this.voices
            .map(
                (voice) => `
          <option value="${voice.name}" ${
                    this.settings.voice === voice.name ? "selected" : ""
                }>
            ${voice.name} (${voice.lang})
          </option>
        `
            )
            .join("")}
      </select>
    `;

        // Add the panel to the document
        document.body.appendChild(this.panel);

        // Set up event listeners
        this.setupEventListeners();
    }

    /**
     * Set up event listeners for the settings controls
     */
    setupEventListeners() {
        const speedInput = document.getElementById("read-aloud-speed");
        const pitchInput = document.getElementById("read-aloud-pitch");
        const voiceSelect = document.getElementById("read-aloud-voice");
        const speedValue = document.getElementById("read-aloud-speed-value");
        const pitchValue = document.getElementById("read-aloud-pitch-value");

        if (speedInput) {
            speedInput.addEventListener("input", () => {
                const value = parseFloat(speedInput.value);
                this.settings.speed = value;
                if (speedValue) speedValue.textContent = value.toFixed(1) + "x";
                this.saveSettings();
            });
        }

        if (pitchInput) {
            pitchInput.addEventListener("input", () => {
                const value = parseFloat(pitchInput.value);
                this.settings.pitch = value;
                if (pitchValue) pitchValue.textContent = value.toFixed(1);
                this.saveSettings();
            });
        }

        if (voiceSelect) {
            voiceSelect.addEventListener("change", () => {
                this.settings.voice = voiceSelect.value;
                this.saveSettings();
            });
        }

        // Close panel when clicking outside
        document.addEventListener("click", (e) => {
            if (
                this.isVisible &&
                this.panel &&
                !this.panel.contains(e.target)
            ) {
                // Check if the click is on the settings button in the floating bar
                const settingsButton = document.getElementById(
                    "read-aloud-settings"
                );
                if (!settingsButton || !settingsButton.contains(e.target)) {
                    this.hide();
                }
            }
        });
    }

    /**
     * Save settings to storage and notify listeners
     */
    saveSettings() {
        console.log("Saving settings:", this.settings);
        StorageManager.saveSettings(this.settings)
            .then(() => {
                console.log("Settings saved successfully");
                if (this.onSettingsChangeCallback) {
                    this.onSettingsChangeCallback(this.settings);
                }
            })
            .catch((error) => {
                console.error("Error saving settings:", error);
            });
    }

    /**
     * Update settings from storage
     * @returns {Promise} Promise that resolves when settings are loaded
     */
    async updateSettings() {
        try {
            this.settings = await StorageManager.getSettings();
            console.log(
                "Settings panel updated settings from storage:",
                this.settings
            );

            // Update UI to reflect current settings
            const speedInput = document.getElementById("read-aloud-speed");
            const pitchInput = document.getElementById("read-aloud-pitch");
            const voiceSelect = document.getElementById("read-aloud-voice");
            const speedValue = document.getElementById(
                "read-aloud-speed-value"
            );
            const pitchValue = document.getElementById(
                "read-aloud-pitch-value"
            );

            if (speedInput) speedInput.value = this.settings.speed;
            if (pitchInput) pitchInput.value = this.settings.pitch;
            if (voiceSelect) voiceSelect.value = this.settings.voice;
            if (speedValue)
                speedValue.textContent = this.settings.speed.toFixed(1) + "x";
            if (pitchValue)
                pitchValue.textContent = this.settings.pitch.toFixed(1);

            return this.settings;
        } catch (error) {
            console.error("Error loading settings:", error);
            return this.settings;
        }
    }

    /**
     * Update the available voices
     * @param {Array} voices - Available speech synthesis voices
     */
    updateVoices(voices) {
        this.voices = voices || [];
        console.log("Updating voices in settings panel:", this.voices);

        const voiceSelect = document.getElementById("read-aloud-voice");
        if (voiceSelect) {
            // Save current selection
            const currentVoice = voiceSelect.value;

            // Update options
            voiceSelect.innerHTML = `
        <option value="">Default</option>
        ${this.voices
            .map(
                (voice) => `
          <option value="${voice.name}">
            ${voice.name} (${voice.lang})
          </option>
        `
            )
            .join("")}
      `;

            // Restore selection if possible
            if (currentVoice) {
                voiceSelect.value = currentVoice;
            }
        }
    }

    /**
     * Set callback for settings changes
     * @param {Function} callback - Function to call when settings change
     */
    setOnSettingsChangeCallback(callback) {
        this.onSettingsChangeCallback = callback;
    }

    /**
     * Show the settings panel
     */
    show() {
        if (this.panel) {
            this.panel.classList.add("visible");
            this.isVisible = true;
        }
    }

    /**
     * Hide the settings panel
     */
    hide() {
        if (this.panel) {
            this.panel.classList.remove("visible");
            this.isVisible = false;
        }
    }

    /**
     * Toggle the visibility of the settings panel
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
     * Remove the settings panel from the DOM
     */
    remove() {
        if (this.panel && this.panel.parentNode) {
            this.panel.parentNode.removeChild(this.panel);
            this.panel = null;
        }
    }

    /**
     * Get the current settings
     * @returns {Object} Current settings
     */
    getSettings() {
        return this.settings;
    }
}

// Export the class
if (typeof module !== "undefined") {
    module.exports = SettingsPanel;
}
