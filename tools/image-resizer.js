const imageInput = document.getElementById('imageInput');
const fileName = document.getElementById('fileName');
const widthInput = document.getElementById('widthInput');
const heightInput = document.getElementById('heightInput');
const lockRatio = document.getElementById('lockRatio');
const formatSelect = document.getElementById('formatSelect');
const qualityRange = document.getElementById('qualityRange');
const qualityValue = document.getElementById('qualityValue');
const targetSizeKb = document.getElementById('targetSizeKb');
const targetHint = document.getElementById('targetHint');
const resizeBtn = document.getElementById('resizeBtn');
const downloadBtn = document.getElementById('downloadBtn');
const resetBtn = document.getElementById('resetBtn');
const statusEl = document.getElementById('status');

const originalPreview = document.getElementById('originalPreview');
const resizedPreview = document.getElementById('resizedPreview');
const originalEmpty = document.getElementById('originalEmpty');
const resizedEmpty = document.getElementById('resizedEmpty');
const originalMeta = document.getElementById('originalMeta');
const resizedMeta = document.getElementById('resizedMeta');

const state = {
  file: null,
  image: null,
  originalUrl: '',
  outputBlob: null,
  outputUrl: '',
  aspectRatio: 1,
  outputWidth: 0,
  outputHeight: 0,
  outputFormat: 'image/jpeg',
  outputQuality: 0.9
};

function setStatus(message, tone = 'neutral') {
  statusEl.textContent = message;
  if (tone === 'success' || tone === 'error') {
    statusEl.dataset.tone = tone;
  } else {
    delete statusEl.dataset.tone;
  }
}

function bytesToReadable(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 KB';
  }
  const kb = bytes / 1024;
  if (kb < 1024) {
    return `${kb.toFixed(1)} KB`;
  }
  return `${(kb / 1024).toFixed(2)} MB`;
}

function clampNumber(value, min, max) {
  const numeric = Number.parseFloat(value);
  if (!Number.isFinite(numeric)) {
    return min;
  }
  return Math.min(max, Math.max(min, numeric));
}

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }
  return parsed;
}

function setImageVisibility(imageEl, emptyEl, visible) {
  imageEl.style.display = visible ? 'block' : 'none';
  emptyEl.style.display = visible ? 'none' : 'block';
}

function updateQualityUI() {
  qualityValue.textContent = `${qualityRange.value}%`;
  const isLossy = formatSelect.value === 'image/jpeg' || formatSelect.value === 'image/webp';
  qualityRange.disabled = !isLossy;
  qualityValue.style.opacity = isLossy ? '1' : '0.45';

  targetSizeKb.disabled = !isLossy;
  targetHint.textContent = isLossy
    ? 'For JPEG/WEBP, quality is adjusted automatically to approach this size.'
    : 'Target size is unavailable for PNG because PNG quality is not adjustable in browser export.';
  targetHint.style.opacity = isLossy ? '1' : '0.65';
}

function clearOutput() {
  state.outputBlob = null;
  downloadBtn.disabled = true;
  if (state.outputUrl) {
    URL.revokeObjectURL(state.outputUrl);
    state.outputUrl = '';
  }

  resizedPreview.removeAttribute('src');
  setImageVisibility(resizedPreview, resizedEmpty, false);
  resizedMeta.textContent = 'No output generated.';
}

function syncDimensionInputsFromSource() {
  if (!state.image) {
    return;
  }

  const width = state.image.naturalWidth;
  const height = state.image.naturalHeight;
  state.aspectRatio = width / height;
  widthInput.value = String(width);
  heightInput.value = String(height);
}

function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const image = new Image();
      image.onload = () => resolve({ image, url: reader.result });
      image.onerror = () => reject(new Error('Could not read image data.'));
      image.src = reader.result;
    };

    reader.onerror = () => reject(new Error('Failed to read the selected file.'));
    reader.readAsDataURL(file);
  });
}

async function onImageSelected() {
  const file = imageInput.files && imageInput.files[0];
  clearOutput();

  if (!file) {
    state.file = null;
    state.image = null;
    if (state.originalUrl) {
      URL.revokeObjectURL(state.originalUrl);
      state.originalUrl = '';
    }

    originalPreview.removeAttribute('src');
    setImageVisibility(originalPreview, originalEmpty, false);
    originalMeta.textContent = 'No file selected.';
    fileName.textContent = 'No file selected';
    setStatus('Select an image to begin.');
    return;
  }

  try {
    const { image, url } = await loadImageFromFile(file);

    if (state.originalUrl) {
      URL.revokeObjectURL(state.originalUrl);
    }

    state.file = file;
    state.image = image;
    state.originalUrl = url;
    fileName.textContent = file.name;

    originalPreview.src = state.originalUrl;
    setImageVisibility(originalPreview, originalEmpty, true);
    originalMeta.textContent = `${image.naturalWidth} x ${image.naturalHeight} px | ${bytesToReadable(file.size)}`;

    syncDimensionInputsFromSource();
    setStatus('Image loaded. Adjust settings and click Resize Image.', 'success');
  } catch (error) {
    state.file = null;
    state.image = null;
    setStatus(error.message || 'Could not load image.', 'error');
  }
}

function drawResizedImage(canvas, image, targetWidth, targetHeight) {
  const context = canvas.getContext('2d');
  context.clearRect(0, 0, canvas.width, canvas.height);

  context.drawImage(image, 0, 0, targetWidth, targetHeight);
}

function canvasToBlob(canvas, mimeType, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Unable to generate output image.'));
        return;
      }
      resolve(blob);
    }, mimeType, quality);
  });
}

async function exportWithTargetSize(canvas, mimeType, maxQuality, targetKb) {
  const targetBytes = targetKb * 1024;

  if (!(mimeType === 'image/jpeg' || mimeType === 'image/webp')) {
    const blob = await canvasToBlob(canvas, mimeType, undefined);
    return {
      blob,
      quality: null,
      warning: 'Target size works best with JPEG/WEBP. PNG output uses fixed compression.'
    };
  }

  const qMax = clampNumber(maxQuality, 0.1, 1);
  let low = 0.05;
  let high = qMax;
  let bestBlob = await canvasToBlob(canvas, mimeType, low);
  let bestQuality = low;

  const maxBlob = await canvasToBlob(canvas, mimeType, qMax);
  if (maxBlob.size <= targetBytes) {
    return { blob: maxBlob, quality: qMax, warning: '' };
  }

  for (let i = 0; i < 12; i += 1) {
    const mid = (low + high) / 2;
    const blob = await canvasToBlob(canvas, mimeType, mid);

    if (blob.size <= targetBytes) {
      bestBlob = blob;
      bestQuality = mid;
      low = mid;
    } else {
      high = mid;
      if (blob.size < bestBlob.size) {
        bestBlob = blob;
        bestQuality = mid;
      }
    }
  }

  let warning = '';
  if (bestBlob.size > targetBytes) {
    warning = 'Could not fully meet target size with current dimensions; lowered quality as much as possible.';
  }

  return { blob: bestBlob, quality: bestQuality, warning };
}

async function resizeImage() {
  if (!state.image) {
    setStatus('Please upload an image first.', 'error');
    return;
  }

  const fallbackWidth = state.image.naturalWidth;
  const fallbackHeight = state.image.naturalHeight;
  const targetWidth = parsePositiveInt(widthInput.value, fallbackWidth);
  const targetHeight = parsePositiveInt(heightInput.value, fallbackHeight);

  widthInput.value = String(targetWidth);
  heightInput.value = String(targetHeight);

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  drawResizedImage(canvas, state.image, targetWidth, targetHeight);

  const format = formatSelect.value;
  const quality = clampNumber(Number(qualityRange.value) / 100, 0.1, 1);
  const isLossy = format === 'image/jpeg' || format === 'image/webp';
  const targetKb = isLossy ? Number.parseInt(targetSizeKb.value, 10) : Number.NaN;

  try {
    let output;

    if (Number.isFinite(targetKb) && targetKb > 0) {
      output = await exportWithTargetSize(canvas, format, quality, targetKb);
    } else {
      const blob = await canvasToBlob(canvas, format, format === 'image/png' ? undefined : quality);
      output = { blob, quality: format === 'image/png' ? null : quality, warning: '' };
    }

    if (state.outputUrl) {
      URL.revokeObjectURL(state.outputUrl);
    }

    state.outputBlob = output.blob;
    state.outputUrl = URL.createObjectURL(output.blob);
    state.outputWidth = targetWidth;
    state.outputHeight = targetHeight;
    state.outputFormat = format;
    state.outputQuality = output.quality ?? 1;

    resizedPreview.src = state.outputUrl;
    setImageVisibility(resizedPreview, resizedEmpty, true);

    const qualityText = output.quality ? ` | Quality: ${Math.round(output.quality * 100)}%` : '';
    resizedMeta.textContent = `${targetWidth} x ${targetHeight} px | ${bytesToReadable(output.blob.size)} | ${format.replace('image/', '').toUpperCase()}${qualityText}`;

    downloadBtn.disabled = false;

    if (output.warning) {
      setStatus(output.warning, 'error');
    } else {
      setStatus('Resized image is ready to download.', 'success');
    }
  } catch (error) {
    clearOutput();
    setStatus(error.message || 'Resize failed.', 'error');
  }
}

function getOutputExtension(mimeType) {
  if (mimeType === 'image/png') {
    return 'png';
  }
  if (mimeType === 'image/webp') {
    return 'webp';
  }
  return 'jpg';
}

function downloadImage() {
  if (!state.outputBlob || !state.outputUrl) {
    setStatus('Resize the image before downloading.', 'error');
    return;
  }

  const originalName = state.file && state.file.name ? state.file.name.replace(/\.[^.]+$/, '') : 'image';
  const extension = getOutputExtension(state.outputFormat);
  const filename = `${originalName}-${state.outputWidth}x${state.outputHeight}.${extension}`;

  const link = document.createElement('a');
  link.href = state.outputUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();

  setStatus('Download started.', 'success');
}

function resetAll() {
  imageInput.value = '';
  fileName.textContent = 'No file selected';
  widthInput.value = '1200';
  heightInput.value = '800';
  lockRatio.checked = true;
  formatSelect.value = 'image/jpeg';
  qualityRange.value = '90';
  targetSizeKb.value = '';

  if (state.originalUrl) {
    URL.revokeObjectURL(state.originalUrl);
  }
  state.originalUrl = '';
  state.file = null;
  state.image = null;

  originalPreview.removeAttribute('src');
  setImageVisibility(originalPreview, originalEmpty, false);
  originalMeta.textContent = 'No file selected.';

  updateQualityUI();
  clearOutput();
  setStatus('Reset complete. Select a new image to continue.');
}

widthInput.addEventListener('input', () => {
  if (!lockRatio.checked || !state.image) {
    return;
  }

  const width = parsePositiveInt(widthInput.value, state.image.naturalWidth);
  const nextHeight = Math.max(1, Math.round(width / state.aspectRatio));
  heightInput.value = String(nextHeight);
});

heightInput.addEventListener('input', () => {
  if (!lockRatio.checked || !state.image) {
    return;
  }

  const height = parsePositiveInt(heightInput.value, state.image.naturalHeight);
  const nextWidth = Math.max(1, Math.round(height * state.aspectRatio));
  widthInput.value = String(nextWidth);
});

formatSelect.addEventListener('change', updateQualityUI);
qualityRange.addEventListener('input', updateQualityUI);
imageInput.addEventListener('change', onImageSelected);
resizeBtn.addEventListener('click', resizeImage);
downloadBtn.addEventListener('click', downloadImage);
resetBtn.addEventListener('click', resetAll);

updateQualityUI();
setStatus('Select an image to begin.');
