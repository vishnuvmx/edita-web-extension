const ytInput = document.getElementById('ytInput');
const previewBox = document.getElementById('previewBox');
const downloadHdBtn = document.getElementById('downloadHdBtn');
const downloadFhdBtn = document.getElementById('downloadFhdBtn');
const statusEl = document.getElementById('status');

const QUALITY_SOURCES = {
  hd: [
    'hqdefault.jpg',
    'mqdefault.jpg',
    'sddefault.jpg',
    'maxresdefault.jpg'
  ],
  fhd: [
    'maxresdefault.jpg',
    'sddefault.jpg',
    'hqdefault.jpg',
    'mqdefault.jpg'
  ]
};

function setStatus(message, tone = 'neutral') {
  statusEl.textContent = message;
  if (tone === 'success' || tone === 'error') {
    statusEl.dataset.tone = tone;
  } else {
    delete statusEl.dataset.tone;
  }
}

function getVideoId(value) {
  const trimmed = value.trim();

  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }

  const host = parsed.hostname.replace(/^www\./, '');

  if (host === 'youtu.be') {
    const id = parsed.pathname.slice(1).split('/')[0];
    return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
  }

  if (host.endsWith('youtube.com')) {
    const watchId = parsed.searchParams.get('v');
    if (watchId && /^[a-zA-Z0-9_-]{11}$/.test(watchId)) {
      return watchId;
    }

    const parts = parsed.pathname.split('/').filter(Boolean);
    const maybeId = parts[1] || '';

    if ((parts[0] === 'shorts' || parts[0] === 'embed' || parts[0] === 'live') && /^[a-zA-Z0-9_-]{11}$/.test(maybeId)) {
      return maybeId;
    }
  }

  return null;
}

function isWatchUrl(value) {
  try {
    const parsed = new URL(value.trim());
    const host = parsed.hostname.replace(/^www\./, '');
    return host.endsWith('youtube.com') && parsed.pathname === '/watch' && /^[a-zA-Z0-9_-]{11}$/.test(parsed.searchParams.get('v') || '');
  } catch {
    return false;
  }
}

function getThumbnailUrl(videoId, fileName) {
  return `https://img.youtube.com/vi/${videoId}/${fileName}`;
}

function createImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.referrerPolicy = 'no-referrer';
    image.alt = 'YouTube thumbnail preview';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Image failed to load'));
    image.src = url;
  });
}

async function resolveThumbnailUrl(videoId, quality) {
  const candidates = QUALITY_SOURCES[quality] || QUALITY_SOURCES.fhd;

  for (const fileName of candidates) {
    const url = getThumbnailUrl(videoId, fileName);
    try {
      await createImage(url);
      return url;
    } catch {
      // Try the next available thumbnail size.
    }
  }

  throw new Error('Unable to load thumbnail preview');
}

async function loadThumbnail(videoId, quality) {
  const candidates = QUALITY_SOURCES[quality] || QUALITY_SOURCES.fhd;

  for (const fileName of candidates) {
    const url = getThumbnailUrl(videoId, fileName);
    try {
      return await createImage(url);
    } catch {
      // Try the next available thumbnail size.
    }
  }

  throw new Error('Unable to load thumbnail preview');
}

function setPreviewEmpty(message) {
  previewBox.innerHTML = '';
  const placeholder = document.createElement('div');
  placeholder.className = 'empty-state';
  placeholder.textContent = message;
  previewBox.appendChild(placeholder);
}

async function renderPreview() {
  const videoId = getVideoId(ytInput.value);

  if (!videoId) {
    downloadHdBtn.disabled = true;
    downloadFhdBtn.disabled = true;
    setPreviewEmpty('Open the tool from a YouTube watch page or paste a link to preview the thumbnail.');
    return;
  }

  setStatus('Loading thumbnail preview...');

  try {
    const image = await loadThumbnail(videoId, 'fhd');
    previewBox.innerHTML = '';
    previewBox.appendChild(image);
    downloadHdBtn.disabled = false;
    downloadFhdBtn.disabled = false;
    setStatus('Thumbnail ready.', 'success');
  } catch (error) {
    downloadHdBtn.disabled = true;
    downloadFhdBtn.disabled = true;
    setStatus(error.message || 'Unable to load thumbnail preview.', 'error');
    setPreviewEmpty('Preview unavailable for this video.');
  }
}

async function downloadThumbnail(quality) {
  const videoId = getVideoId(ytInput.value);
  if (!videoId) {
    setStatus('Please enter a valid YouTube watch URL.', 'error');
    return;
  }

  const suffix = quality === 'hd' ? 'hd' : 'fhd';

  try {
    setStatus(`Preparing ${suffix.toUpperCase()} download...`);
    const downloadUrl = await resolveThumbnailUrl(videoId, quality);
    await downloadFile(downloadUrl, `Edita/youtube-thumbnail-${suffix}-${videoId}.jpg`);
    setStatus(`${suffix.toUpperCase()} download started.`, 'success');
  } catch (error) {
    setStatus(error.message || 'Download failed.', 'error');
  }
}

function downloadFile(url, filename) {
  return new Promise((resolve, reject) => {
    if (!chrome || !chrome.runtime) {
      reject(new Error('Extension API not available'));
      return;
    }

    chrome.runtime.sendMessage({
      action: 'downloadFile',
      url,
      filename
    }, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      if (!response || !response.success) {
        reject(new Error(response?.error || 'Download failed'));
        return;
      }

      resolve(response.downloadId);
    });
  });
}

downloadHdBtn.addEventListener('click', () => {
  downloadThumbnail('hd');
});

downloadFhdBtn.addEventListener('click', () => {
  downloadThumbnail('fhd');
});

ytInput.addEventListener('input', () => {
  renderPreview();
});

function getInitialValue() {
  const params = new URLSearchParams(window.location.search);
  const value = params.get('url') || '';
  if (!value || !isWatchUrl(value)) {
    return '';
  }
  return value;
}

function initialize() {
  const initialValue = getInitialValue();
  ytInput.value = initialValue;

  if (!initialValue) {
    setPreviewEmpty('Open the tool from a YouTube watch page or paste a link to preview the thumbnail.');
    return;
  }

  renderPreview();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}
