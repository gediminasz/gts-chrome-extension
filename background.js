chrome.webNavigation.onHistoryStateUpdated.addListener(function ({ tabId }) {
    chrome.tabs.sendMessage(tabId, "onHistoryStateUpdated");
});
