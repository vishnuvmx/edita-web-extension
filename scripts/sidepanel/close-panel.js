const closeButton = document.getElementById('closePanel');
const body = document.body;

if (closeButton) {
  closeButton.addEventListener('click', (event) => {
    event.preventDefault();
    body.dataset.state = 'closing';

    window.setTimeout(() => {
      chrome.windows.getCurrent({ populate: false })
        .then((currentWindow) => {
          if (!currentWindow || typeof currentWindow.id !== 'number') {
            return chrome.runtime.sendMessage({ action: 'closeSidePanel' });
          }

          return chrome.sidePanel.close({ windowId: currentWindow.id })
            .catch(() => chrome.runtime.sendMessage({ action: 'closeSidePanel', windowId: currentWindow.id }));
        })
        .catch(() => {
          chrome.runtime.sendMessage({ action: 'closeSidePanel' }).catch(() => {});
        });
    }, 120);
  });
}
