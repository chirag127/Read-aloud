chrome.action.onClicked.addListener((tab) => {

    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: toggleReadAloud
    });
  });


  function toggleReadAloud() {

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { action: "toggleReader" });
    });
  }