const playlistInput = document.getElementById('playlistInput');
const apiKeyInput = document.getElementById('apiKeyInput');
const rememberKey = document.getElementById('rememberKey');
const clearKeyBtn = document.getElementById('clearKeyBtn');
const fillFromUrlBtn = document.getElementById('fillFromUrlBtn');
const processBtn = document.getElementById('processBtn');
const statusEl = document.getElementById('status');
const progressBar = document.getElementById('progressBar');
const detailsRoot = document.getElementById('detailsRoot');
const playlistLabel = document.getElementById('playlistLabel');
const itemLabel = document.getElementById('itemLabel');
const unavailableLabel = document.getElementById('unavailableLabel');
const shortsCountEl = document.getElementById('shortsCount');
const shortsViewsEl = document.getElementById('shortsViews');
const videosCountEl = document.getElementById('videosCount');
const videosViewsEl = document.getElementById('videosViews');
const liveCountEl = document.getElementById('liveCount');
const liveViewsEl = document.getElementById('liveViews');
const startDateInput = document.getElementById('startDate');
const endDateInput = document.getElementById('endDate');

const STORAGE_KEYS = {
  apiKey: 'youtubePlaylistAnalyzerApiKey',
  remember: 'youtubePlaylistAnalyzerRememberKey',
};

const CATEGORIES = [
  {
    key: 'shorts',
    title: 'Shorts',
    description: 'Videos with a runtime of 60 seconds or less.',
  },
  {
    key: 'videos',
    title: 'Videos',
    description: 'Regular videos that are not short-form and not live.',
  },
  {
    key: 'live',
    title: 'Live streams',
    description: 'Live broadcasts and archived live sessions.',
  },
];

function setStatus(message, tone = 'neutral') {
  statusEl.textContent = message;
  if (tone === 'success' || tone === 'error') {
    statusEl.dataset.tone = tone;
  } else {
    delete statusEl.dataset.tone;
  }
}

function setProgress(value) {
  const nextValue = Math.max(0, Math.min(100, Number(value) || 0));
  progressBar.style.width = `${nextValue}%`;
}

function formatNumber(value) {
  return new Intl.NumberFormat('en-US').format(Number(value) || 0);
}

function formatDuration(seconds) {
  const totalSeconds = Math.max(0, Math.floor(Number(seconds) || 0));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const remainingSeconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  }

  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
}

function parseDurationToSeconds(duration) {
  if (typeof duration !== 'string' || !duration) {
    return 0;
  }

  const matches = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!matches) {
    return 0;
  }

  const hours = Number(matches[1] || 0);
  const minutes = Number(matches[2] || 0);
  const seconds = Number(matches[3] || 0);
  return hours * 3600 + minutes * 60 + seconds;
}

function parsePlaylistId(value) {
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }

  if (/^[A-Za-z0-9_-]{10,}$/.test(trimmed) && !trimmed.includes('http')) {
    return trimmed;
  }

  try {
    const url = new URL(trimmed);
    const listId = url.searchParams.get('list');
    if (listId) {
      return listId;
    }
  } catch {
    // Fall through and treat the input as-is.
  }

  const listMatch = trimmed.match(/[?&]list=([A-Za-z0-9_-]+)/i);
  if (listMatch) {
    return listMatch[1];
  }

  return '';
}

function getVideoUrl(videoId) {
  return `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;
}

function getActiveTabUrl() {
  return new Promise((resolve) => {
    if (!chrome?.tabs?.query) {
      resolve('');
      return;
    }

    chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
      resolve(tabs?.[0]?.url || '');
    });
  });
}

function getSavedState() {
  return new Promise((resolve) => {
    if (!chrome?.storage?.local?.get) {
      resolve({});
      return;
    }

    chrome.storage.local.get([STORAGE_KEYS.apiKey, STORAGE_KEYS.remember], (items) => {
      resolve(items || {});
    });
  });
}

function saveState(apiKey) {
  if (!chrome?.storage?.local?.set || !chrome?.storage?.local?.remove) {
    return;
  }

  if (rememberKey.checked && apiKey) {
    chrome.storage.local.set({
      [STORAGE_KEYS.apiKey]: apiKey,
      [STORAGE_KEYS.remember]: true,
    });
    return;
  }

  chrome.storage.local.remove([STORAGE_KEYS.apiKey]);
  chrome.storage.local.set({ [STORAGE_KEYS.remember]: false });
}

function clearSavedKey() {
  apiKeyInput.value = '';
  rememberKey.checked = false;
  if (chrome?.storage?.local?.remove) {
    chrome.storage.local.remove([STORAGE_KEYS.apiKey]);
    chrome.storage.local.set({ [STORAGE_KEYS.remember]: false });
  }
  setStatus('Saved API key cleared.', 'success');
}

async function fetchJson(url) {
  const response = await fetch(url);
  const data = await response.json();

  if (!response.ok) {
    const message = data?.error?.message || `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  if (data?.error) {
    throw new Error(data.error.message || 'YouTube API request failed');
  }

  return data;
}

async function fetchPlaylistItems(playlistId, apiKey) {
  const items = [];
  let pageToken = '';
  let totalResults = 0;

  do {
    const params = new URLSearchParams({
      part: 'snippet,contentDetails',
      maxResults: '50',
      playlistId,
      key: apiKey,
    });

    if (pageToken) {
      params.set('pageToken', pageToken);
    }

    const data = await fetchJson(`https://www.googleapis.com/youtube/v3/playlistItems?${params.toString()}`);
    totalResults = Number(data?.pageInfo?.totalResults || totalResults || 0);

    (data.items || []).forEach((item) => {
      const videoId = item?.contentDetails?.videoId || item?.snippet?.resourceId?.videoId;
      if (!videoId) {
        return;
      }

      items.push({
        videoId,
        playlistItemId: item?.id || '',
        title: item?.snippet?.title || 'Untitled video',
      });
    });

    pageToken = data.nextPageToken || '';
    const progressBase = totalResults > 0 ? (items.length / totalResults) * 45 : 0;
    setStatus(`Loaded ${formatNumber(items.length)} playlist items...`);
    setProgress(Math.min(45, progressBase));
  } while (pageToken);

  return { items, totalResults };
}

async function fetchPlaylistTitle(playlistId, apiKey) {
  const params = new URLSearchParams({
    part: 'snippet',
    id: playlistId,
    key: apiKey,
  });

  const data = await fetchJson(`https://www.googleapis.com/youtube/v3/playlists?${params.toString()}`);
  return data?.items?.[0]?.snippet?.title || playlistId;
}

async function fetchVideos(videoIds, apiKey) {
  const videos = [];

  for (let index = 0; index < videoIds.length; index += 50) {
    const batch = videoIds.slice(index, index + 50);
    const params = new URLSearchParams({
      part: 'snippet,statistics,contentDetails,liveStreamingDetails',
      id: batch.join(','),
      key: apiKey,
      maxResults: '50',
    });

    const data = await fetchJson(`https://www.googleapis.com/youtube/v3/videos?${params.toString()}`);
    videos.push(...(data.items || []));

    const progress = 45 + ((index + batch.length) / videoIds.length) * 45;
    setStatus(`Analyzing ${formatNumber(index + batch.length)} of ${formatNumber(videoIds.length)} videos...`);
    setProgress(Math.min(90, progress));
  }

  return videos;
}

function classifyVideo(video) {
  const snippet = video.snippet || {};
  const statistics = video.statistics || {};
  const contentDetails = video.contentDetails || {};
  const liveDetails = video.liveStreamingDetails || {};
  
  const publishedAt = snippet.publishedAt ? new Date(snippet.publishedAt) : null;
  const startLimit = startDateInput.value ? new Date(startDateInput.value) : null;
  const endLimit = endDateInput.value ? new Date(endDateInput.value) : null;

  if (publishedAt) {
    if (startLimit && publishedAt < startLimit) return null;
    if (endLimit) {
      const adjustedEnd = new Date(endLimit);
      adjustedEnd.setHours(23, 59, 59, 999);
      if (publishedAt > adjustedEnd) return null;
    }
  }

  const seconds = parseDurationToSeconds(contentDetails.duration || '');
  const views = Number(statistics.viewCount || 0);
  const isLive =
    snippet.liveBroadcastContent === 'live' ||
    snippet.liveBroadcastContent === 'upcoming' ||
    Boolean(liveDetails.actualStartTime) ||
    Boolean(liveDetails.actualEndTime);
  const isShort = !isLive && seconds > 0 && seconds <= 60;

  return {
    id: video.id || '',
    title: snippet.title || 'Untitled video',
    url: getVideoUrl(video.id || ''),
    durationSeconds: seconds,
    durationLabel: seconds > 0 ? formatDuration(seconds) : 'Unknown',
    views,
    isShort,
    isLive,
    isVideo: !isShort && !isLive,
  };
}

function createCategoryState() {
  return {
    shorts: [],
    videos: [],
    live: [],
  };
}

function updateSummary(categoryState, skippedCount, playlistName, itemCount) {
  const totals = Object.entries(categoryState).reduce(
    (accumulator, [key, items]) => {
      accumulator[key] = {
        count: items.length,
        views: items.reduce((sum, item) => sum + item.views, 0),
      };
      return accumulator;
    },
    {}
  );

  shortsCountEl.textContent = formatNumber(totals.shorts?.count || 0);
  shortsViewsEl.textContent = `${formatNumber(totals.shorts?.views || 0)} views`;
  videosCountEl.textContent = formatNumber(totals.videos?.count || 0);
  videosViewsEl.textContent = `${formatNumber(totals.videos?.views || 0)} views`;
  liveCountEl.textContent = formatNumber(totals.live?.count || 0);
  liveViewsEl.textContent = `${formatNumber(totals.live?.views || 0)} views`;

  playlistLabel.textContent = `Playlist: ${playlistName || 'Unknown playlist'}`;
  itemLabel.textContent = `Total Items: ${formatNumber(itemCount)}`;
  unavailableLabel.textContent = `Skipped: ${formatNumber(skippedCount)}`;
}

function renderCategory(category, items) {
  const details = document.createElement('details');
  details.className = 'category';
  details.open = category.key === 'shorts';

  const summary = document.createElement('summary');

  const left = document.createElement('div');
  left.className = 'category-name';

  const title = document.createElement('strong');
  title.textContent = category.title;

  const description = document.createElement('span');
  description.textContent = category.description;

  left.appendChild(title);
  left.appendChild(description);

  const right = document.createElement('div');
  right.className = 'category-meta';
  right.innerHTML = `<strong>${formatNumber(items.length)} videos</strong><span>${formatNumber(items.reduce((sum, item) => sum + item.views, 0))} total views</span>`;

  summary.appendChild(left);
  summary.appendChild(right);
  details.appendChild(summary);

  const body = document.createElement('div');
  body.className = 'category-body';

  if (!items.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-results';
    empty.textContent = 'No items matched this category in the selected playlist.';
    body.appendChild(empty);
  } else {
    const list = document.createElement('div');
    list.className = 'video-list';

    items.forEach((item) => {
      const row = document.createElement('div');
      row.className = 'video-row';

      const content = document.createElement('div');
      const strong = document.createElement('strong');
      strong.textContent = item.title;

      const meta = document.createElement('div');
      meta.className = 'meta';
      meta.textContent = `${formatNumber(item.views)} views • ${item.durationLabel}`;

      content.appendChild(strong);
      content.appendChild(meta);

      const link = document.createElement('a');
      link.href = item.url;
      link.target = '_blank';
      link.rel = 'noreferrer noopener';
      link.textContent = 'Open video';

      row.appendChild(content);
      row.appendChild(link);
      list.appendChild(row);
    });

    body.appendChild(list);
  }

  details.appendChild(body);
  return details;
}

function renderDetails(categoryState) {
  detailsRoot.textContent = '';

  CATEGORIES.forEach((category) => {
    const items = [...categoryState[category.key]].sort((left, right) => {
      if (right.views !== left.views) {
        return right.views - left.views;
      }

      return left.title.localeCompare(right.title);
    });

    detailsRoot.appendChild(renderCategory(category, items));
  });
}

function resetUI() {
  setStatus('Ready to analyze a playlist.', 'neutral');
  setProgress(0);
  detailsRoot.innerHTML = '<div class="empty-results">Run an analysis to see the playlist contents grouped and sorted here.</div>';
  updateSummary(createCategoryState(), 0, 'not loaded', 0);
}

async function analyzePlaylist() {
  const playlistId = parsePlaylistId(playlistInput.value);
  const apiKey = apiKeyInput.value.trim();

  if (!playlistId) {
    setStatus('Enter a valid YouTube playlist URL or playlist ID.', 'error');
    return;
  }

  if (!apiKey) {
    setStatus('Enter a YouTube Data API key before analyzing.', 'error');
    return;
  }

  saveState(apiKey);
  processBtn.disabled = true;
  fillFromUrlBtn.disabled = true;
  clearKeyBtn.disabled = true;
  setProgress(5);
  setStatus('Fetching playlist items...');

  try {
    const playlistTitle = await fetchPlaylistTitle(playlistId, apiKey);
    const { items, totalResults } = await fetchPlaylistItems(playlistId, apiKey);
    const videoIds = items.map((item) => item.videoId);

    if (!videoIds.length) {
      throw new Error('No videos were found in this playlist.');
    }

    setProgress(50);
    setStatus('Fetching video metadata...');

    const videos = await fetchVideos(videoIds, apiKey);
    const categoryState = createCategoryState();
    let skippedCount = 0;

    videos.forEach((video) => {
      const classified = classifyVideo(video);
      if (!classified) {
        skippedCount += 1;
        return;
      }

      if (classified.isShort) {
        categoryState.shorts.push(classified);
      } else if (classified.isLive) {
        categoryState.live.push(classified);
      } else if (classified.isVideo) {
        categoryState.videos.push(classified);
      }
    });

    updateSummary(categoryState, skippedCount, playlistTitle, totalResults || items.length);
    renderDetails(categoryState);
    setProgress(100);
    setStatus('Playlist analysis complete.', 'success');
  } catch (error) {
    setProgress(0);
    setStatus(error?.message || 'Unable to analyze the playlist.', 'error');
  } finally {
    processBtn.disabled = false;
    fillFromUrlBtn.disabled = false;
    clearKeyBtn.disabled = false;
  }
}

async function fillFromCurrentUrl() {
  const params = new URLSearchParams(window.location.search);
  const value = (await getActiveTabUrl()) || params.get('url') || '';
  if (!value) {
    setStatus('No current page URL was provided.', 'error');
    return;
  }

  playlistInput.value = value;
  setStatus('Loaded the current page URL into the input.', 'success');
}

async function init() {
  const saved = await getSavedState();

  if (typeof saved[STORAGE_KEYS.apiKey] === 'string') {
    apiKeyInput.value = saved[STORAGE_KEYS.apiKey];
  }

  if (typeof saved[STORAGE_KEYS.remember] === 'boolean') {
    rememberKey.checked = saved[STORAGE_KEYS.remember];
  }

  const params = new URLSearchParams(window.location.search);
  const urlParam = params.get('url') || '';
  if (urlParam) {
    playlistInput.value = urlParam;
  }

  resetUI();
}

processBtn.addEventListener('click', analyzePlaylist);
fillFromUrlBtn.addEventListener('click', fillFromCurrentUrl);
clearKeyBtn.addEventListener('click', clearSavedKey);

apiKeyInput.addEventListener('input', () => {
  if (rememberKey.checked) {
    saveState(apiKeyInput.value.trim());
  }
});

rememberKey.addEventListener('change', () => {
  saveState(apiKeyInput.value.trim());
});

playlistInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    analyzePlaylist();
  }
});

init();