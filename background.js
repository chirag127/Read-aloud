// Initialize default settings when the extension is installed
chrome.runtime.onInstalled.addListener(() => {
    console.log("Extension installed or updated");

    // Set default settings all at once to avoid multiple storage operations
    chrome.storage.sync.get(["speed", "pitch", "voice"], (result) => {
        const settings = {
            speed: result.speed !== undefined ? result.speed : 1.0,
            pitch: result.pitch !== undefined ? result.pitch : 1.0,
            voice: result.voice !== undefined ? result.voice : "",
        };

        console.log("Initializing default settings:", settings);

        chrome.storage.sync.set(settings, () => {
            if (chrome.runtime.lastError) {
                console.error(
                    "Error setting default settings:",
                    chrome.runtime.lastError
                );
            } else {
                console.log("Default settings initialized successfully");
            }
        });
    });
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getVoices") {
        // This is handled in the content script since speechSynthesis is available there
        sendResponse({ success: true });
    }
    return true; // Keep the message channel open for async responses
});
