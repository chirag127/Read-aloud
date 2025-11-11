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
        },
        // Start reading callback
        () => {
            // Make sure the floating bar is visible whenever reading starts
            floatingBar.show();
            floatingBar.updatePlayPauseButton(true);
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
        },
        // Bookmark callback
        () => {
            handleBookmark();
        },
        // Skip backward sentence callback
        () => {
            speechManager.skipBackwardSentence();
        },
        // Skip forward sentence callback
        () => {
            speechManager.skipForwardSentence();
        },
        // Skip backward paragraph callback
        () => {
            speechManager.skipBackwardParagraph();
        },
        // Skip forward paragraph callback
        () => {
            speechManager.skipForwardParagraph();
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

    // Load settings and apply theme
    Promise.all([
        speechManager.updateSettings(),
        settingsPanel.updateSettings(),
    ])
        .then(() => {
            console.log("Settings loaded");
            const theme = settingsPanel.getSettings().theme;
            settingsPanel.applyTheme(theme);
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
            readSelectionFromContextMenu();
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
    let hasBookmark = false;

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
     * Handle bookmark button click
     */
    function handleBookmark() {
        const currentUrl = window.location.href;
        const position = speechManager.getCurrentPosition();

        if (hasBookmark) {
            StorageManager.deleteBookmark(currentUrl)
                .then(() => {
                    hasBookmark = false;
                    floatingBar.updateBookmarkButton(false);
                    console.log("Bookmark deleted");
                })
                .catch((error) => {
                    console.error("Error deleting bookmark:", error);
                });
        } else {
            const bookmark = {
                url: currentUrl,
                nodeIndex: position.nodeIndex,
                wordIndex: position.wordIndex,
                timestamp: Date.now(),
            };

            StorageManager.saveBookmark(bookmark)
                .then(() => {
                    hasBookmark = true;
                    floatingBar.updateBookmarkButton(true);
                    console.log("Bookmark saved");
                })
                .catch((error) => {
                    console.error("Error saving bookmark:", error);
                });
        }
    }

    /**
     * Check for existing bookmark on page load
     */
    function checkForBookmark() {
        const currentUrl = window.location.href;

        StorageManager.getBookmark(currentUrl)
            .then((bookmark) => {
                if (bookmark) {
                    hasBookmark = true;
                    floatingBar.updateBookmarkButton(true);
                    showResumePrompt(bookmark);
                } else {
                    hasBookmark = false;
                    floatingBar.updateBookmarkButton(false);
                }
            })
            .catch((error) => {
                console.error("Error checking for bookmark:", error);
            });
    }

    /**
     * Show resume prompt when a bookmark is found
     * @param {Object} bookmark - The bookmark object
     */
    function showResumePrompt(bookmark) {
        const prompt = document.createElement("div");
        prompt.id = "read-aloud-resume-prompt";
        prompt.className = "read-aloud-resume-prompt";
        prompt.innerHTML = `
            <div class="read-aloud-resume-content">
                <p>Resume reading from where you left off?</p>
                <div class="read-aloud-resume-buttons">
                    <button id="read-aloud-resume-yes">Resume</button>
                    <button id="read-aloud-resume-no">Start Over</button>
                    <button id="read-aloud-resume-dismiss">Dismiss</button>
                </div>
            </div>
        `;

        document.body.appendChild(prompt);

        document
            .getElementById("read-aloud-resume-yes")
            .addEventListener("click", () => {
                const textNodes = TextExtractor.extractTextNodes();
                highlighter.setTextNodes(textNodes);
                speechManager.startReading(
                    textNodes,
                    bookmark.nodeIndex,
                    bookmark.wordIndex
                );
                prompt.remove();
            });

        document
            .getElementById("read-aloud-resume-no")
            .addEventListener("click", () => {
                StorageManager.deleteBookmark(window.location.href);
                hasBookmark = false;
                floatingBar.updateBookmarkButton(false);
                const textNodes = TextExtractor.extractTextNodes();
                highlighter.setTextNodes(textNodes);
                speechManager.startReading(textNodes, 0, 0);
                prompt.remove();
            });

        document
            .getElementById("read-aloud-resume-dismiss")
            .addEventListener("click", () => {
                prompt.remove();
            });

        setTimeout(() => {
            if (prompt.parentNode) {
                prompt.remove();
            }
        }, 10000);
    }

    /**
     * Read from selection to the end of the page
     * Called from the context menu
     */
    function readSelectionFromContextMenu() {
        console.log("Context menu: Reading from selection to end of page");

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

                    console.log("Selection offset:", selectedNode.startOffset);
                    console.log("Words in node:", words);

                    for (let j = 0; j < words.length; j++) {
                        if (
                            selectedNode.startOffset >= words[j].startIndex &&
                            selectedNode.startOffset <= words[j].endIndex
                        ) {
                            startWordIndex = j;
                            console.log(
                                "Found starting word index:",
                                j,
                                "Word:",
                                words[j].text
                            );
                            break;
                        }
                    }

                    break;
                }
            }
        }

        // Start reading from the selection to the end of the page
        // The floating bar will be shown automatically via the onStartReading callback
        speechManager.startReading(textNodes, startNodeIndex, startWordIndex);
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
        // The floating bar will be shown automatically via the onStartReading callback
        speechManager.startReading(textNodes, startNodeIndex, startWordIndex);
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
        
        // Navigation shortcuts (Ctrl + Arrow keys)
        if (e.ctrlKey && !e.shiftKey && !e.altKey) {
            if (e.key === "ArrowUp") {
                e.preventDefault();
                speechManager.skipForwardSentence();
            } else if (e.key === "ArrowDown") {
                e.preventDefault();
                speechManager.skipBackwardSentence();
            } else if (e.key === "ArrowLeft") {
                e.preventDefault();
                speechManager.skipBackwardParagraph();
            } else if (e.key === "ArrowRight") {
                e.preventDefault();
                speechManager.skipForwardParagraph();
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

    checkForBookmark();
}
