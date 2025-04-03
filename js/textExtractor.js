/**
 * Extracts readable text from web pages
 */
class TextExtractor {
    /**
     * Extract all readable text from the page
     * @returns {Array} Array of text nodes and their parent elements
     */
    static extractTextNodes() {
        const textNodes = [];

        // Create a TreeWalker to efficiently traverse all text nodes
        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: function (node) {
                    // Skip empty or whitespace-only text nodes
                    if (!node.nodeValue || node.nodeValue.trim() === "") {
                        return NodeFilter.FILTER_REJECT;
                    }

                    // Skip nodes in hidden elements
                    if (!TextExtractor.isVisible(node.parentElement)) {
                        return NodeFilter.FILTER_REJECT;
                    }

                    // Skip nodes with very small text (likely not meant to be read)
                    const parentStyle = window.getComputedStyle(
                        node.parentElement
                    );
                    if (parseFloat(parentStyle.fontSize) < 6) {
                        return NodeFilter.FILTER_REJECT;
                    }

                    // Skip nodes with color very close to background (hidden text)
                    if (TextExtractor.hasInvisibleText(node.parentElement)) {
                        return NodeFilter.FILTER_REJECT;
                    }

                    return NodeFilter.FILTER_ACCEPT;
                },
            }
        );

        // Collect all visible text nodes
        let node;
        while ((node = walker.nextNode())) {
            // Skip nodes in elements that should be ignored
            const parentElement = node.parentElement;
            const parentTagName = parentElement.tagName.toLowerCase();

            // Skip common non-content elements
            if (
                [
                    "script",
                    "style",
                    "noscript",
                    "svg",
                    "path",
                    "meta",
                    "code",
                    "pre",
                ].includes(parentTagName)
            ) {
                continue;
            }

            // Skip elements with certain roles that shouldn't be read
            const role = parentElement.getAttribute("role");
            if (role && ["presentation", "none", "separator"].includes(role)) {
                continue;
            }

            // Skip elements with certain classes that often indicate non-content
            const className = parentElement.className.toLowerCase();
            if (
                className &&
                (className.includes("hidden") ||
                    className.includes("invisible") ||
                    className.includes("visually-hidden") ||
                    className.includes("sr-only") ||
                    className.includes("screen-reader") ||
                    className.includes("offscreen"))
            ) {
                continue;
            }

            // Add the text node to our collection
            // Don't trim the text to preserve original character offsets
            textNodes.push({
                node: node,
                parentElement: parentElement,
                text: node.nodeValue,
            });
        }

        return textNodes;
    }

    /**
     * Check if an element has text color very similar to its background color
     * @param {Element} element - The element to check
     * @returns {boolean} Whether the element has invisible text
     */
    static hasInvisibleText(element) {
        if (!element) return false;

        const style = window.getComputedStyle(element);

        // Parse colors to RGB
        const textColor = TextExtractor.parseColor(style.color);
        const bgColor = TextExtractor.parseColor(style.backgroundColor);

        // If background is transparent, it's not hiding text
        if (bgColor.a < 0.1) return false;

        // Calculate color difference
        const contrast = TextExtractor.calculateColorContrast(
            textColor,
            bgColor
        );

        // If contrast is too low, text is effectively invisible
        return contrast < 1.5;
    }

    /**
     * Parse a CSS color string into RGB components
     * @param {string} color - CSS color string
     * @returns {Object} RGB and alpha components
     */
    static parseColor(color) {
        // Default to black for color and transparent for background
        const defaultColor = { r: 0, g: 0, b: 0, a: 1 };
        const defaultBg = { r: 0, g: 0, b: 0, a: 0 };

        // If no color, return default
        if (!color || color === "transparent" || color === "rgba(0, 0, 0, 0)") {
            return color === "transparent" || color === "rgba(0, 0, 0, 0)"
                ? defaultBg
                : defaultColor;
        }

        // Handle rgb/rgba format
        if (color.startsWith("rgb")) {
            const parts = color.match(/\d+(\.\d+)?/g);
            if (parts && parts.length >= 3) {
                return {
                    r: parseInt(parts[0], 10),
                    g: parseInt(parts[1], 10),
                    b: parseInt(parts[2], 10),
                    a: parts.length > 3 ? parseFloat(parts[3]) : 1,
                };
            }
        }

        // Handle hex format
        if (color.startsWith("#")) {
            let hex = color.substring(1);
            if (hex.length === 3) {
                hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
            }
            return {
                r: parseInt(hex.substring(0, 2), 16),
                g: parseInt(hex.substring(2, 4), 16),
                b: parseInt(hex.substring(4, 6), 16),
                a: 1,
            };
        }

        // For other formats, return default
        return defaultColor;
    }

    /**
     * Calculate contrast between two colors
     * @param {Object} color1 - First color in RGB format
     * @param {Object} color2 - Second color in RGB format
     * @returns {number} Contrast ratio
     */
    static calculateColorContrast(color1, color2) {
        // Calculate luminance for each color
        const luminance1 = TextExtractor.calculateLuminance(color1);
        const luminance2 = TextExtractor.calculateLuminance(color2);

        // Calculate contrast ratio
        const brightest = Math.max(luminance1, luminance2);
        const darkest = Math.min(luminance1, luminance2);

        return (brightest + 0.05) / (darkest + 0.05);
    }

    /**
     * Calculate luminance of a color
     * @param {Object} color - Color in RGB format
     * @returns {number} Luminance value
     */
    static calculateLuminance(color) {
        // Convert RGB to relative luminance
        const r = color.r / 255;
        const g = color.g / 255;
        const b = color.b / 255;

        const R = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
        const G = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
        const B = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);

        return 0.2126 * R + 0.7152 * G + 0.0722 * B;
    }

    /**
     * Check if an element is visible
     * @param {Element} element - The element to check
     * @returns {boolean} Whether the element is visible
     */
    static isVisible(element) {
        // Base case: if element doesn't exist, it's not visible
        if (!element || !element.tagName) return false;

        // Skip certain elements that are typically not visible or not meant to be read
        const tagName = element.tagName.toLowerCase();
        if (
            [
                "script",
                "style",
                "noscript",
                "meta",
                "head",
                "svg",
                "path",
                "defs",
                "clippath",
                "template",
            ].includes(tagName)
        ) {
            return false;
        }

        // Check computed style properties
        const style = window.getComputedStyle(element);

        // Check basic visibility properties
        if (
            style.display === "none" ||
            style.visibility === "hidden" ||
            style.visibility === "collapse" ||
            style.opacity === "0" ||
            parseFloat(style.opacity) === 0
        ) {
            return false;
        }

        // Check if element has zero dimensions
        if (element.offsetWidth <= 0 || element.offsetHeight <= 0) {
            return false;
        }

        // Check if element is positioned off-screen
        const rect = element.getBoundingClientRect();
        if (
            rect.right <= 0 ||
            rect.bottom <= 0 ||
            rect.width <= 0 ||
            rect.height <= 0
        ) {
            return false;
        }

        // Check if element has 'aria-hidden' attribute
        if (element.getAttribute("aria-hidden") === "true") {
            return false;
        }

        // Check if element has 'hidden' attribute
        if (element.hasAttribute("hidden")) {
            return false;
        }

        // Check if element is clipped or has zero size due to overflow settings
        if (
            style.overflow === "hidden" &&
            (rect.width <= 1 || rect.height <= 1)
        ) {
            return false;
        }

        // Check if element has text-indent that pushes it off-screen (common hiding technique)
        if (parseInt(style.textIndent, 10) < -999) {
            return false;
        }

        // Recursively check parent visibility
        if (element.parentElement && element !== document.body) {
            return TextExtractor.isVisible(element.parentElement);
        }

        return true;
    }

    /**
     * Find the text node containing the selected text
     * @param {Selection} selection - The current selection
     * @returns {Object|null} The text node object or null if not found
     */
    static findSelectedTextNode(selection) {
        if (!selection || selection.rangeCount === 0) return null;

        const range = selection.getRangeAt(0);
        const startNode = range.startContainer;

        console.log("Selection range:", range);
        console.log("Start node:", startNode);
        console.log("Start offset:", range.startOffset);

        // If the start node is a text node, return it
        if (startNode.nodeType === Node.TEXT_NODE) {
            // Get the actual text content without trimming to preserve offsets
            const nodeText = startNode.nodeValue;
            console.log("Node text:", nodeText);

            return {
                node: startNode,
                parentElement: startNode.parentElement,
                text: nodeText, // Don't trim to preserve offsets
                startOffset: range.startOffset,
            };
        }

        return null;
    }

    /**
     * Split text into words for highlighting
     * @param {string} text - The text to split
     * @returns {Array} Array of word objects with text and indices
     */
    static splitIntoWords(text) {
        const words = [];
        const regex = /\S+/g;
        let match;

        console.log("Splitting text into words:", text);

        while ((match = regex.exec(text)) !== null) {
            words.push({
                text: match[0],
                startIndex: match.index,
                endIndex: match.index + match[0].length,
            });
        }

        console.log("Found words:", words);

        return words;
    }
}

// Export the class
if (typeof module !== "undefined") {
    module.exports = TextExtractor;
}
