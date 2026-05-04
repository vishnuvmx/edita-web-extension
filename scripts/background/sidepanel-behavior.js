const openedTabByWindow = new Map();

function configureSidePanelBehavior() {
  return chrome.sidePanel
    .setPanelBehavior({
      openPanelOnActionClick: false,
    })
    .catch((error) => {
      console.error('Unable to set side panel behavior:', error);
    });
}

async function closeWindowPanel(windowId) {
  await chrome.sidePanel.close({ windowId });
  openedTabByWindow.delete(windowId);
}

async function openPanelForTab(tab) {
  if (!tab || typeof tab.id !== 'number' || typeof tab.windowId !== 'number') {
    return;
  }

  const windowId = tab.windowId;
  const activeTabId = openedTabByWindow.get(windowId);

  if (activeTabId === tab.id) {
    await closeWindowPanel(windowId);
    return;
  }

  if (typeof activeTabId === 'number') {
    try {
      await chrome.sidePanel.close({ windowId });
    } catch {
      // Ignore close races and continue opening for current tab.
    }
  }

  await chrome.sidePanel.setOptions({
    tabId: tab.id,
    path: 'sidepanel.html',
    enabled: true,
  });

  await chrome.sidePanel.open({ tabId: tab.id });
  openedTabByWindow.set(windowId, tab.id);
}

function cleanupClosedTab(tabId) {
  for (const [windowId, openedTabId] of openedTabByWindow.entries()) {
    if (openedTabId === tabId) {
      openedTabByWindow.delete(windowId);
    }
  }
}

function registerSidePanelActionHandler() {
  chrome.action.onClicked.addListener((tab) => {
    openPanelForTab(tab).catch((error) => {
      console.error('Unable to open side panel for tab:', error);
    });
  });

  chrome.tabs.onRemoved.addListener((tabId) => {
    cleanupClosedTab(tabId);
  });
}

self.EditaBackgroundBehavior = {
  configureSidePanelBehavior,
  registerSidePanelActionHandler,
};
