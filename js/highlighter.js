/**
 * Manages word highlighting during speech
 */
class Highlighter {
    constructor() {
        this.textNodes = [];
        this.activeHighlights = [];
        this.currentNodeIndex = -1;
        this.currentWordIndex = -1;
    }

    /**
     * Set the text nodes to be highlighted
     * @param {Array} textNodes - Array of text nodes
     */
    setTextNodes(textNodes) {
        this.textNodes = textNodes;
        this.clearHighlights();
    }

    /**
     * Highlight a specific word in a text node
     * @param {number} nodeIndex - Index of the text node
     * @param {number} wordIndex - Index of the word in the node
     */
    highlightWord(nodeIndex, wordIndex) {
        // Clear previous highlights
        this.clearHighlights();

        if (nodeIndex < 0 || nodeIndex >= this.textNodes.length) return;

        const textNode = this.textNodes[nodeIndex];
        const text = textNode.text;
        const words = TextExtractor.splitIntoWords(text);

        if (wordIndex < 0 || wordIndex >= words.length) return;

        const word = words[wordIndex];
        const parentElement = textNode.parentElement;

        // Create a range for the word
        const range = document.createRange();
        range.setStart(textNode.node, word.startIndex);
        range.setEnd(textNode.node, word.endIndex);

        // Get the bounding client rect for the word
        const rects = range.getClientRects();

        // Create highlight elements for each rect
        for (let i = 0; i < rects.length; i++) {
            const rect = rects[i];
            const highlight = document.createElement("div");
            highlight.className = "read-aloud-highlight active";

            // Position the highlight
            highlight.style.position = "absolute";
            highlight.style.left = `${rect.left + window.scrollX}px`;
            highlight.style.top = `${rect.top + window.scrollY}px`;
            highlight.style.width = `${rect.width}px`;
            highlight.style.height = `${rect.height}px`;
            highlight.style.zIndex = "9997";
            highlight.style.pointerEvents = "none";

            document.body.appendChild(highlight);
            this.activeHighlights.push(highlight);
        }

        // Update current indices
        this.currentNodeIndex = nodeIndex;
        this.currentWordIndex = wordIndex;

        // Scroll to the word if it's not in view
        this.scrollToHighlight();
    }

    /**
     * Scroll to the current highlight if needed
     */
    scrollToHighlight() {
        if (this.activeHighlights.length === 0 || this.currentNodeIndex < 0)
            return;

        const highlight = this.activeHighlights[0];
        const rect = highlight.getBoundingClientRect();

        // Check if the highlight is in view
        const isInView =
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= window.innerHeight &&
            rect.right <= window.innerWidth;

        if (!isInView) {
            // Get the current text node's parent element
            const textNode = this.textNodes[this.currentNodeIndex];
            if (!textNode || !textNode.parentElement) return;

            // Find the scrollable container for this element
            const scrollableContainer = this.findScrollableParent(
                textNode.parentElement
            );
            console.log("Found scrollable container:", scrollableContainer);

            if (
                scrollableContainer === document.documentElement ||
                scrollableContainer === document.body
            ) {
                // If the scrollable container is the document itself, use window.scrollTo
                console.log(
                    "Scrolling window to:",
                    rect.top + window.scrollY - window.innerHeight / 2
                );
                window.scrollTo({
                    top: rect.top + window.scrollY - window.innerHeight / 2,
                    behavior: "smooth",
                });
            } else {
                // Calculate the scroll position within the container
                const containerRect =
                    scrollableContainer.getBoundingClientRect();

                // Calculate vertical scroll position
                const highlightRelativeTop = rect.top - containerRect.top;
                const scrollTop =
                    scrollableContainer.scrollTop +
                    highlightRelativeTop -
                    containerRect.height / 2;

                // Calculate horizontal scroll position if needed
                const highlightRelativeLeft = rect.left - containerRect.left;
                const scrollLeft =
                    scrollableContainer.scrollLeft +
                    highlightRelativeLeft -
                    containerRect.width / 2;

                // Check if horizontal scrolling is needed
                const needsHorizontalScroll =
                    rect.left < containerRect.left ||
                    rect.right > containerRect.right;

                console.log("Scrolling container to:", {
                    top: scrollTop,
                    left: scrollLeft,
                });

                // Scroll the container
                scrollableContainer.scrollTo({
                    top: scrollTop,
                    left: needsHorizontalScroll
                        ? scrollLeft
                        : scrollableContainer.scrollLeft,
                    behavior: "smooth",
                });
            }
        }
    }

    /**
     * Find the scrollable parent of an element
     * @param {Element} element - The element to find the scrollable parent for
     * @returns {Element} The scrollable parent element
     */
    findScrollableParent(element) {
        if (!element) return document.documentElement;

        // Check if the element itself is scrollable
        if (this.isScrollable(element)) {
            return element;
        }

        // Try to find the main content container first (common patterns)
        const mainContent = this.findMainContentContainer();
        if (mainContent && this.isScrollable(mainContent)) {
            console.log("Found main content container:", mainContent);
            return mainContent;
        }

        // If no main content container is found, look for scrollable parents
        let parent = element.parentElement;
        while (parent) {
            // Check if this parent is scrollable
            if (this.isScrollable(parent)) {
                return parent;
            }

            // Move up to the next parent
            parent = parent.parentElement;
        }

        // If no scrollable parent is found, return the document
        return document.documentElement;
    }

    /**
     * Try to find the main content container of the page
     * @returns {Element|null} The main content container or null if not found
     */
    findMainContentContainer() {
        // Common selectors for main content areas
        const mainContentSelectors = [
            "main",
            "article",
            "#content",
            ".content",
            "#main",
            ".main",
            "#main-content",
            ".main-content",
            '[role="main"]',
        ];

        // Try each selector
        for (const selector of mainContentSelectors) {
            const element = document.querySelector(selector);
            if (element) {
                return element;
            }
        }

        // If no main content container is found with common selectors,
        // try to find the element with the most text content
        return this.findElementWithMostText();
    }

    /**
     * Find the element with the most text content
     * @returns {Element|null} The element with the most text or null if not found
     */
    findElementWithMostText() {
        // Get all elements that might contain significant text
        const contentElements = Array.from(
            document.querySelectorAll("div, section, article, main")
        );

        if (contentElements.length === 0) return null;

        // Find the element with the most text content
        let maxTextElement = null;
        let maxTextLength = 0;

        for (const element of contentElements) {
            // Skip elements that are too small or invisible
            if (
                !this.isVisible(element) ||
                element.offsetWidth < 200 ||
                element.offsetHeight < 200
            ) {
                continue;
            }

            const textLength = element.textContent.trim().length;
            if (textLength > maxTextLength) {
                maxTextLength = textLength;
                maxTextElement = element;
            }
        }

        return maxTextElement;
    }

    /**
     * Check if an element is visible
     * @param {Element} element - The element to check
     * @returns {boolean} Whether the element is visible
     */
    isVisible(element) {
        if (!element) return false;

        const style = window.getComputedStyle(element);
        return (
            style.display !== "none" &&
            style.visibility !== "hidden" &&
            style.opacity !== "0" &&
            element.offsetWidth > 0 &&
            element.offsetHeight > 0
        );
    }

    /**
     * Check if an element is scrollable
     * @param {Element} element - The element to check
     * @returns {boolean} Whether the element is scrollable
     */
    isScrollable(element) {
        if (!element) return false;

        // Get the computed style
        const style = window.getComputedStyle(element);

        // Check if the element has a scrollable overflow style (vertical or horizontal)
        const hasScrollableOverflowY = [style.overflowY, style.overflow].some(
            (overflow) => ["auto", "scroll"].includes(overflow)
        );

        const hasScrollableOverflowX = [style.overflowX, style.overflow].some(
            (overflow) => ["auto", "scroll"].includes(overflow)
        );

        // Check if the element actually has content that overflows
        const hasVerticalOverflow = element.scrollHeight > element.clientHeight;
        const hasHorizontalOverflow = element.scrollWidth > element.clientWidth;

        // Element is scrollable if it has scrollable overflow and actual overflowing content
        // in either direction
        const hasScrollableOverflow =
            (hasScrollableOverflowY && hasVerticalOverflow) ||
            (hasScrollableOverflowX && hasHorizontalOverflow);

        // Special case for body and html elements
        if (element === document.body || element === document.documentElement) {
            return true;
        }

        // Check for fixed or sticky positioned elements that might be scrollable containers
        const position = style.position;
        const isFixedOrSticky = position === "fixed" || position === "sticky";

        // If the element is fixed/sticky and has overflow content, it's likely a scrollable container
        if (isFixedOrSticky && (hasVerticalOverflow || hasHorizontalOverflow)) {
            return true;
        }

        return hasScrollableOverflow;
    }

    /**
     * Clear all active highlights
     */
    clearHighlights() {
        this.activeHighlights.forEach((highlight) => {
            if (highlight.parentNode) {
                highlight.parentNode.removeChild(highlight);
            }
        });

        this.activeHighlights = [];
        this.currentNodeIndex = -1;
        this.currentWordIndex = -1;
    }

    /**
     * Get the current node and word indices
     * @returns {Object} Object with nodeIndex and wordIndex
     */
    getCurrentPosition() {
        return {
            nodeIndex: this.currentNodeIndex,
            wordIndex: this.currentWordIndex,
        };
    }
}

// Export the class
if (typeof module !== "undefined") {
    module.exports = Highlighter;
}
