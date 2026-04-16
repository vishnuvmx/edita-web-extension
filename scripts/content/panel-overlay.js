const PANEL_ID = 'edita-tools-overlay-panel';
const PANEL_WIDTH = 400;
const OPEN_TRANSFORM = 'translateX(0)';
const CLOSED_TRANSFORM = 'translateX(calc(100% + 24px))';
const CLOSE_ANIMATION_MS = 360;

let panelContainer = null;

function getHostElement() {
  return document.body || document.documentElement;
}

function createPanel() {
  const container = document.createElement('div');
  container.id = PANEL_ID;
  container.dataset.open = 'false';

  Object.assign(container.style, {
    position: 'fixed',
    top: '0',
    right: '0',
    width: `min(${PANEL_WIDTH}px, 100vw)`,
    height: '100vh',
    zIndex: '2147483647',
    transform: CLOSED_TRANSFORM,
    opacity: '0',
    pointerEvents: 'none',
    transition: 'transform 320ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 220ms ease',
    willChange: 'transform, opacity',
    boxShadow: '-12px 0 32px rgba(15, 23, 42, 0.14)'
  });

  const iframe = document.createElement('iframe');
  iframe.src = chrome.runtime.getURL('sidepanel.html');
  iframe.title = 'Edita Tools';

  Object.assign(iframe.style, {
    width: '100%',
    height: '100%',
    border: 'none',
    display: 'block',
    backgroundColor: '#ffffff',
    borderRadius: '16px 0 0 16px',
    overflow: 'hidden'
  });

  container.appendChild(iframe);
  getHostElement().appendChild(container);
  return container;
}

function openPanel(container) {
  if (!container) {
    return false;
  }

  container.dataset.open = 'true';
  container.style.pointerEvents = 'auto';

  requestAnimationFrame(() => {
    container.style.transform = OPEN_TRANSFORM;
    container.style.opacity = '1';
  });

  return true;
}

function removePanel(container) {
  if (!container || !container.parentNode) {
    return;
  }

  container.remove();
  chrome.runtime.sendMessage({ action: 'panelClosed' }).catch(() => {});
}

function closePanel(container) {
  if (!container || container.dataset.open !== 'true') {
    return false;
  }

  container.dataset.open = 'false';
  container.style.pointerEvents = 'none';
  container.style.transform = CLOSED_TRANSFORM;
  container.style.opacity = '0';

  const handleTransitionEnd = (event) => {
    if (event.target !== container || event.propertyName !== 'transform') {
      return;
    }

    container.removeEventListener('transitionend', handleTransitionEnd);
    removePanel(container);
  };

  container.addEventListener('transitionend', handleTransitionEnd);

  window.setTimeout(() => {
    if (container && container.parentNode && container.dataset.open === 'false') {
      container.removeEventListener('transitionend', handleTransitionEnd);
      removePanel(container);
    }
  }, CLOSE_ANIMATION_MS);

  return true;
}

function ensurePanel() {
  if (!panelContainer || !document.getElementById(PANEL_ID)) {
    panelContainer = createPanel();
  }

  return panelContainer;
}

function openPanelForCurrentTab() {
  return openPanel(ensurePanel());
}

function closePanelForCurrentTab() {
  return closePanel(document.getElementById(PANEL_ID));
}

function bindOverlayLifecycle() {
  if (window.__editaOverlayLifecycleBound) {
    return;
  }

  window.__editaOverlayLifecycleBound = true;

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      return;
    }

    const panel = document.getElementById(PANEL_ID);
    if (panel && panel.dataset.open === 'true') {
      closePanel(panel);
    }
  });

  window.addEventListener('pagehide', () => {
    const panel = document.getElementById(PANEL_ID);
    if (panel) {
      panel.remove();
    }
  });

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'openPanel') {
      const isOpen = openPanelForCurrentTab();
      sendResponse({ success: true, isOpen });
      return true;
    }

    if (message.action === 'closePanel') {
      closePanelForCurrentTab();
      sendResponse({ success: true, isOpen: false });
      return true;
    }

    if (message.action === 'togglePanel') {
      const panel = document.getElementById(PANEL_ID);
      const isOpen = panel && panel.dataset.open === 'true' ? (closePanel(panel), false) : openPanelForCurrentTab();
      sendResponse({ success: true, isOpen });
      return true;
    }

    return false;
  });

  window.addEventListener('message', (event) => {
    if (event.data && event.data.action === 'closePanel') {
      const panel = document.getElementById(PANEL_ID);
      if (panel) {
        closePanel(panel);
      }
    }
  });
}

export function initializePanelOverlay() {
  bindOverlayLifecycle();
}
