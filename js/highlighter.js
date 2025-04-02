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
      const highlight = document.createElement('div');
      highlight.className = 'read-aloud-highlight active';
      
      // Position the highlight
      highlight.style.position = 'absolute';
      highlight.style.left = `${rect.left + window.scrollX}px`;
      highlight.style.top = `${rect.top + window.scrollY}px`;
      highlight.style.width = `${rect.width}px`;
      highlight.style.height = `${rect.height}px`;
      highlight.style.zIndex = '9997';
      highlight.style.pointerEvents = 'none';
      
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
    if (this.activeHighlights.length === 0) return;
    
    const highlight = this.activeHighlights[0];
    const rect = highlight.getBoundingClientRect();
    
    const isInView = (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= window.innerHeight &&
      rect.right <= window.innerWidth
    );
    
    if (!isInView) {
      // Scroll to position the highlight in the middle of the viewport
      window.scrollTo({
        top: rect.top + window.scrollY - window.innerHeight / 2,
        behavior: 'smooth'
      });
    }
  }

  /**
   * Clear all active highlights
   */
  clearHighlights() {
    this.activeHighlights.forEach(highlight => {
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
      wordIndex: this.currentWordIndex
    };
  }
}

// Export the class
if (typeof module !== 'undefined') {
  module.exports = Highlighter;
}
