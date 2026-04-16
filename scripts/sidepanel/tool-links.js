const cards = document.querySelectorAll('.tool-card[data-tool]');

function openTool(card) {
  const href = card.getAttribute('href');
  if (!href) {
    return;
  }

  if (!['qr', 'youtube-thumbnail'].includes(card.dataset.tool) || !chrome.tabs || typeof chrome.tabs.query !== 'function') {
    window.location.href = href;
    return;
  }

  chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
    const toolUrl = new URL(href, window.location.href);
    const activeTab = tabs && tabs[0];

    if (activeTab && typeof activeTab.url === 'string' && activeTab.url) {
      toolUrl.searchParams.set('url', activeTab.url);
    }

    window.location.href = toolUrl.toString();
  });
}

cards.forEach((card) => {
  card.addEventListener('click', (event) => {
    event.preventDefault();
    openTool(card);
  });
});
