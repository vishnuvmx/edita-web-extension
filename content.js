(async () => {
  try {
    const moduleUrl = chrome.runtime.getURL('scripts/content/panel-overlay.js');
    const { initializePanelOverlay } = await import(moduleUrl);
    initializePanelOverlay();
  } catch (error) {
    console.error('Unable to initialize content overlay module:', error);
  }
})();
