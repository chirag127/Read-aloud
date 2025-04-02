document.addEventListener('DOMContentLoaded', function() {
  const startReadingButton = document.getElementById('startReading');
  
  startReadingButton.addEventListener('click', function() {
    // Send message to content script to start reading
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {action: "startReading"});
      window.close(); // Close the popup
    });
  });
});
