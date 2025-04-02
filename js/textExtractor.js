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
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: function(node) {
          // Skip empty text nodes and nodes in hidden elements
          if (node.nodeValue.trim() === '' || !TextExtractor.isVisible(node.parentElement)) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    let node;
    while ((node = walker.nextNode())) {
      // Skip script, style, and other non-content elements
      const parentTagName = node.parentElement.tagName.toLowerCase();
      if (['script', 'style', 'noscript', 'svg', 'path', 'meta'].includes(parentTagName)) {
        continue;
      }

      textNodes.push({
        node: node,
        parentElement: node.parentElement,
        text: node.nodeValue.trim()
      });
    }

    return textNodes;
  }

  /**
   * Check if an element is visible
   * @param {Element} element - The element to check
   * @returns {boolean} Whether the element is visible
   */
  static isVisible(element) {
    if (!element) return false;
    
    const style = window.getComputedStyle(element);
    return style.display !== 'none' && 
           style.visibility !== 'hidden' && 
           style.opacity !== '0' &&
           element.offsetWidth > 0 &&
           element.offsetHeight > 0;
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
    
    // If the start node is a text node, return it
    if (startNode.nodeType === Node.TEXT_NODE) {
      return {
        node: startNode,
        parentElement: startNode.parentElement,
        text: startNode.nodeValue.trim(),
        startOffset: range.startOffset
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
    
    while ((match = regex.exec(text)) !== null) {
      words.push({
        text: match[0],
        startIndex: match.index,
        endIndex: match.index + match[0].length
      });
    }
    
    return words;
  }
}

// Export the class
if (typeof module !== 'undefined') {
  module.exports = TextExtractor;
}
