// Initialize default settings when the extension is installed
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get(['speed', 'pitch', 'voice'], (result) => {
    // Set default values if not already set
    if (!result.speed) {
      chrome.storage.sync.set({ speed: 1.0 });
    }
    if (!result.pitch) {
      chrome.storage.sync.set({ pitch: 1.0 });
    }
    if (!result.voice) {
      chrome.storage.sync.set({ voice: '' }); // Empty string means default voice
    }
  });
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getVoices') {
    // This is handled in the content script since speechSynthesis is available there
    sendResponse({ success: true });
  }
  return true; // Keep the message channel open for async responses
});
