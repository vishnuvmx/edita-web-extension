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

function showToastOnActiveTab(message, sendResponse) {
  const toastMessage = typeof message?.message === 'string' && message.message.trim() ? message.message : 'Time is up.';
  const toastTone = message?.tone === 'error' ? 'error' : 'success';

  chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
    const activeTab = Array.isArray(tabs) ? tabs.find((tab) => typeof tab.id === 'number') : null;

    if (!activeTab || typeof activeTab.id !== 'number') {
      sendResponse({ success: false, error: 'No active tab found' });
      return;
    }

    chrome.tabs.sendMessage(activeTab.id, {
      action: 'showToast',
      message: toastMessage,
      tone: toastTone
    }, () => {
      if (chrome.runtime.lastError) {
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
        return;
      }

      sendResponse({ success: true });
    });
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

    if (message.action === 'showTimerToast') {
      showToastOnActiveTab(message, sendResponse);
      return true;
    }

    return false;
  });
}

self.EditaBackgroundMessages = {
  registerSidePanelMessageHandler
};
