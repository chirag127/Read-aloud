/**
 * Manages storage operations for the Read Aloud extension
 */
class StorageManager {
  /**
   * Get all settings from storage
   * @returns {Promise} Promise that resolves with the settings object
   */
  static getSettings() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['speed', 'pitch', 'voice'], (result) => {
        const settings = {
          speed: result.speed || 1.0,
          pitch: result.pitch || 1.0,
          voice: result.voice || ''
        };
        resolve(settings);
      });
    });
  }

  /**
   * Save settings to storage
   * @param {Object} settings - The settings object to save
   * @returns {Promise} Promise that resolves when settings are saved
   */
  static saveSettings(settings) {
    return new Promise((resolve) => {
      chrome.storage.sync.set(settings, () => {
        resolve();
      });
    });
  }

  /**
   * Update a single setting
   * @param {string} key - The setting key to update
   * @param {any} value - The new value
   * @returns {Promise} Promise that resolves when the setting is updated
   */
  static updateSetting(key, value) {
    return new Promise((resolve) => {
      const setting = {};
      setting[key] = value;
      chrome.storage.sync.set(setting, () => {
        resolve();
      });
    });
  }
}

// Export the class
if (typeof module !== 'undefined') {
  module.exports = StorageManager;
}
