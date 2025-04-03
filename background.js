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

    // Create context menu items
    chrome.contextMenus.create({
        id: "read-selection-only",
        title: "Read Selection",
        contexts: ["selection"],
    });

    chrome.contextMenus.create({
        id: "read-from-selection",
        title: "Read from this text",
        contexts: ["selection"],
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

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "read-selection-only") {
        // Send message to content script to read only the selected text
        chrome.tabs.sendMessage(tab.id, {
            action: "readSelection",
            mode: "selectionOnly",
        });
    } else if (info.menuItemId === "read-from-selection") {
        // Send message to content script to read from the selected text to the end
        chrome.tabs.sendMessage(tab.id, {
            action: "readSelection",
            mode: "fromSelection",
        });
    }
});
