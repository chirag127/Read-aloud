/**
 * Manages storage operations for the Read Aloud extension
 */
class StorageManager {
    /**
     * Get all settings from storage
     * @returns {Promise} Promise that resolves with the settings object
     */
    static getSettings() {
        return new Promise((resolve, reject) => {
            try {
                chrome.storage.sync.get(
                    ["speed", "pitch", "voice"],
                    (result) => {
                        if (chrome.runtime.lastError) {
                            console.error(
                                "Error getting settings:",
                                chrome.runtime.lastError
                            );
                            reject(chrome.runtime.lastError);
                            return;
                        }

                        console.log("Retrieved settings from storage:", result);
                        const settings = {
                            speed:
                                result.speed !== undefined ? result.speed : 1.0,
                            pitch:
                                result.pitch !== undefined ? result.pitch : 1.0,
                            voice:
                                result.voice !== undefined ? result.voice : "",
                        };
                        resolve(settings);
                    }
                );
            } catch (error) {
                console.error("Exception getting settings:", error);
                reject(error);
            }
        });
    }

    /**
     * Save settings to storage
     * @param {Object} settings - The settings object to save
     * @returns {Promise} Promise that resolves when settings are saved
     */
    static saveSettings(settings) {
        return new Promise((resolve, reject) => {
            try {
                chrome.storage.sync.set(settings, () => {
                    if (chrome.runtime.lastError) {
                        console.error(
                            "Error saving settings:",
                            chrome.runtime.lastError
                        );
                        reject(chrome.runtime.lastError);
                        return;
                    }
                    console.log("Settings saved successfully:", settings);
                    resolve();
                });
            } catch (error) {
                console.error("Exception saving settings:", error);
                reject(error);
            }
        });
    }

    /**
     * Update a single setting
     * @param {string} key - The setting key to update
     * @param {any} value - The new value
     * @returns {Promise} Promise that resolves when the setting is updated
     */
    static updateSetting(key, value) {
        return new Promise((resolve, reject) => {
            try {
                const setting = {};
                setting[key] = value;
                chrome.storage.sync.set(setting, () => {
                    if (chrome.runtime.lastError) {
                        console.error(
                            "Error updating setting:",
                            chrome.runtime.lastError
                        );
                        reject(chrome.runtime.lastError);
                        return;
                    }
                    console.log(`Setting ${key} updated to:`, value);
                    resolve();
                });
            } catch (error) {
                console.error("Exception updating setting:", error);
                reject(error);
            }
        });
    }
}

// Export the class
if (typeof module !== "undefined") {
    module.exports = StorageManager;
}
