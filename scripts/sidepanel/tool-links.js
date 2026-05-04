const cards = document.querySelectorAll('.tool-card[data-tool]');
const searchInput = document.getElementById('searchInput');
const clearSearchBtn = document.getElementById('clearSearch');
const noResults = document.getElementById('noResults');
const toolsGrid = document.querySelector('.tools-grid');

function openTool(card) {
  const href = card.getAttribute('href');
  if (!href) {
    return;
  }

  if (
    !['qr', 'youtube-thumbnail', 'youtube-playlist-analyzer'].includes(card.dataset.tool) ||
    !chrome.tabs ||
    typeof chrome.tabs.query !== 'function'
  ) {
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

function getToolName(card) {
  const nameElement = card.querySelector('.tool-name');
  const categoryElement = card.querySelector('.folder-tab');
  const toolName = nameElement ? nameElement.textContent.toLowerCase() : '';
  const category = categoryElement ? categoryElement.textContent.toLowerCase() : '';
  return `${toolName} ${category}`;
}

function filterTools(searchQuery) {
  const query = searchQuery.toLowerCase().trim();
  let visibleCount = 0;

  cards.forEach((card) => {
    const toolInfo = getToolName(card);
    const isVisible = query === '' || toolInfo.includes(query);

    if (isVisible) {
      card.classList.remove('hidden');
      visibleCount++;
    } else {
      card.classList.add('hidden');
    }
  });

  // Show/hide no results message
  if (query !== '' && visibleCount === 0) {
    noResults.style.display = 'block';
    toolsGrid.style.display = 'none';
  } else {
    noResults.style.display = 'none';
    toolsGrid.style.display = 'grid';
  }

  // Show/hide clear button
  clearSearchBtn.style.display = query ? 'flex' : 'none';
}

// Search input event listener
searchInput.addEventListener('input', (event) => {
  filterTools(event.target.value);
});

// Clear search button
clearSearchBtn.addEventListener('click', () => {
  searchInput.value = '';
  filterTools('');
  searchInput.focus();
});

cards.forEach((card) => {
  card.addEventListener('click', (event) => {
    event.preventDefault();
    openTool(card);
  });
});
