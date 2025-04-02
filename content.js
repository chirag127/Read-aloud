// Import utility classes
// Note: In a Chrome extension content script, we can't use ES6 imports
// So we'll include these scripts in the manifest.json in the correct order

// Initialize components when the page is fully loaded
document.addEventListener("DOMContentLoaded", initializeReadAloud);

// Also handle cases where the page is already loaded
if (
    document.readyState === "complete" ||
    document.readyState === "interactive"
) {
    initializeReadAloud();
}

/**
 * Initialize the Read Aloud extension
 */
function initializeReadAloud() {
    // Create instances of our utility classes
    const speechManager = new SpeechManager();
    const highlighter = new Highlighter();
    const floatingBar = new FloatingBar();
    const settingsPanel = new SettingsPanel();

    // Set up relationships between components
    speechManager.setHighlighter(highlighter);
    floatingBar.setSettingsPanel(settingsPanel);

    // Set up callbacks
    speechManager.setCallbacks(
        // Word boundary callback
        (nodeIndex, wordIndex) => {
            // This is handled by the highlighter
        },
        // End of speech callback
        () => {
            floatingBar.updatePlayPauseButton(false);
            floatingBar.hide();
        }
    );

    floatingBar.setCallbacks(
        // Play/Pause callback
        () => {
            const isPlaying = speechManager.togglePlayPause();
            return isPlaying;
        },
        // Stop callback
        () => {
            speechManager.stop();
            floatingBar.hide();
        }
    );

    settingsPanel.setOnSettingsChangeCallback((settings) => {
        console.log("Settings changed in panel:", settings);
        speechManager
            .updateSettings()
            .then(() => {
                console.log("Speech manager updated with new settings");
            })
            .catch((error) => {
                console.error("Error updating speech manager settings:", error);
            });
    });

    // Set up voice loading callback
    speechManager.setOnVoicesLoadedCallback((voices) => {
        console.log("Voices loaded in content script:", voices);
        settingsPanel.updateVoices(voices);
    });

    // Load settings
    Promise.all([
        speechManager.updateSettings(),
        settingsPanel.updateSettings(),
    ])
        .then(() => {
            console.log("Settings loaded");
        })
        .catch((error) => {
            console.error("Error loading settings:", error);
        });

    // Create UI components
    floatingBar.create();
    settingsPanel.create(speechManager.getVoices());

    // Listen for messages from the popup and background script
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === "startReading") {
            startReading();
            sendResponse({ success: true });
        } else if (request.action === "readSelection") {
            // Handle context menu selection reading
            // This should work even if the top bar is not visible
            readSelectionFromContextMenu(request.readFromSelection);
            sendResponse({ success: true });
        }
        return true;
    });

    // Add context menu event listener
    document.addEventListener("contextmenu", () => {
        // We'll use this to capture the current selection before the context menu appears
        captureSelection();
    });

    // Track the current selection
    let currentSelection = null;

    /**
     * Capture the current selection
     */
    function captureSelection() {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
            currentSelection = selection;
        } else {
            currentSelection = null;
        }
    }

    /**
     * Read selection from context menu
     * @param {boolean} readFromSelection - Whether to read from selection to end or just the selection
     */
    function readSelectionFromContextMenu(readFromSelection = false) {
        console.log(
            "Context menu reading, readFromSelection:",
            readFromSelection
        );

        if (!currentSelection || currentSelection.toString().trim() === "") {
            console.log("No valid selection for context menu reading");
            return;
        }

        // Extract text nodes from the page
        const textNodes = TextExtractor.extractTextNodes();

        if (textNodes.length === 0) {
            console.log("No readable text found on the page");
            return;
        }

        // Set the text nodes for the highlighter
        highlighter.setTextNodes(textNodes);

        // Find the selected node and its position
        const selectedNode =
            TextExtractor.findSelectedTextNode(currentSelection);
        let startNodeIndex = 0;
        let startWordIndex = 0;

        if (selectedNode) {
            // Find the index of the selected node in our text nodes array
            for (let i = 0; i < textNodes.length; i++) {
                if (textNodes[i].node === selectedNode.node) {
                    startNodeIndex = i;

                    // Find the word index within the node
                    const words = TextExtractor.splitIntoWords(
                        selectedNode.text
                    );
                    for (let j = 0; j < words.length; j++) {
                        if (
                            selectedNode.startOffset >= words[j].startIndex &&
                            selectedNode.startOffset <= words[j].endIndex
                        ) {
                            startWordIndex = j;
                            break;
                        }
                    }

                    break;
                }
            }
        }

        // If we're only reading the selection (not from selection to end)
        if (!readFromSelection) {
            // Create a subset of text nodes containing only the selection
            // This is a simplified implementation - in a real extension, you'd want to
            // handle multi-node selections more robustly
            const selectionText = currentSelection.toString();
            console.log("Reading only selection:", selectionText);

            // For simplicity, we'll just read the node containing the selection
            // A more complete implementation would extract exactly the selected text
        }

        // Start reading
        speechManager.startReading(textNodes, startNodeIndex, startWordIndex);

        // Show the floating bar (even if it wasn't visible before)
        floatingBar.show();
        floatingBar.updatePlayPauseButton(true);
    }

    /**
     * Start reading the page
     * @param {boolean} fromSelection - Whether to start from the current selection
     */
    function startReading(fromSelection = false) {
        // Extract text nodes from the page
        const textNodes = TextExtractor.extractTextNodes();

        if (textNodes.length === 0) {
            console.log("No readable text found on the page");
            return;
        }

        // Set the text nodes for the highlighter
        highlighter.setTextNodes(textNodes);

        // Determine starting position
        let startNodeIndex = 0;
        let startWordIndex = 0;

        // Only start from selection if the floating bar is already visible
        if (fromSelection && currentSelection) {
            // If we're trying to read from a selection but the bar isn't visible, start from the beginning instead
            if (!floatingBar.isCurrentlyVisible()) {
                console.log(
                    "Ignoring selection because floating bar is not visible, starting from beginning"
                );
                fromSelection = false;
            } else {
                const selectedNode =
                    TextExtractor.findSelectedTextNode(currentSelection);

                if (selectedNode) {
                    // Find the index of the selected node in our text nodes array
                    for (let i = 0; i < textNodes.length; i++) {
                        if (textNodes[i].node === selectedNode.node) {
                            startNodeIndex = i;

                            // Find the word index within the node
                            const words = TextExtractor.splitIntoWords(
                                selectedNode.text
                            );
                            for (let j = 0; j < words.length; j++) {
                                if (
                                    selectedNode.startOffset >=
                                        words[j].startIndex &&
                                    selectedNode.startOffset <=
                                        words[j].endIndex
                                ) {
                                    startWordIndex = j;
                                    break;
                                }
                            }

                            break;
                        }
                    }
                }
            }
        }

        // Start reading
        speechManager.startReading(textNodes, startNodeIndex, startWordIndex);

        // Show the floating bar
        floatingBar.show();
        floatingBar.updatePlayPauseButton(true);
    }

    // Add keyboard shortcut for starting/stopping reading
    document.addEventListener("keydown", (e) => {
        // Alt+R to start/stop reading
        if (e.altKey && e.key === "r") {
            if (speechManager.isCurrentlyPlaying()) {
                speechManager.stop();
                floatingBar.hide();
            } else {
                startReading();
            }
        }
    });

    // Add listener for selection changes
    document.addEventListener("selectionchange", () => {
        const selection = window.getSelection();
        if (selection && selection.toString().trim() !== "") {
            // User has selected some text
            currentSelection = selection;
        }
    });

    // Add listener for double-click to start reading from that word
    document.addEventListener("dblclick", (e) => {
        // Only start reading from selection if the floating bar is already visible
        if (
            floatingBar.isCurrentlyVisible() &&
            currentSelection &&
            currentSelection.toString().trim() !== ""
        ) {
            console.log(
                "Starting reading from selection with floating bar visible"
            );
            startReading(true);
        } else if (
            currentSelection &&
            currentSelection.toString().trim() !== ""
        ) {
            console.log(
                "Ignoring selection reading because floating bar is not visible"
            );
        }
    });
}
