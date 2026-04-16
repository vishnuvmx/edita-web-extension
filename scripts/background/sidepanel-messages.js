function closeSidePanelWithWindow(windowId, sendResponse) {
  if (typeof windowId !== 'number' || windowId < 0) {
    sendResponse({ success: false, error: 'Missing window id' });
    return;
  }

  chrome.sidePanel.close({ windowId })
    .then(() => sendResponse({ success: true }))
    .catch((error) => {
      console.error('Unable to close side panel:', error);
      sendResponse({ success: false, error: String(error) });
    });
}

function downloadFile(url, filename, sendResponse) {
  if (!url || !filename) {
    sendResponse({ success: false, error: 'Missing URL or filename' });
    return;
  }

  chrome.downloads.download({
    url,
    filename,
    conflictAction: 'uniquify',
    saveAs: false
  }, (downloadId) => {
    if (chrome.runtime.lastError || typeof downloadId !== 'number') {
      sendResponse({ success: false, error: chrome.runtime.lastError?.message || 'Download failed' });
      return;
    }
    sendResponse({ success: true, downloadId });
  });
}

function registerSidePanelMessageHandler() {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!message || !message.action) {
      return false;
    }

    if (message.action === 'closeSidePanel') {
      if (typeof message.windowId === 'number' && message.windowId >= 0) {
        closeSidePanelWithWindow(message.windowId, sendResponse);
      } else {
        chrome.windows.getLastFocused({ populate: false })
          .then((currentWindow) => closeSidePanelWithWindow(currentWindow && currentWindow.id, sendResponse))
          .catch((error) => {
            console.error('Unable to resolve window for side panel close:', error);
            sendResponse({ success: false, error: String(error) });
          });
      }
      return true;
    }

    if (message.action === 'downloadFile') {
      downloadFile(message.url, message.filename, sendResponse);
      return true;
    }

    return false;
  });
}

self.EditaBackgroundMessages = {
  registerSidePanelMessageHandler
};
