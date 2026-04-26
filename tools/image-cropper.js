const imageInput = document.getElementById('imageInput');
const fileName = document.getElementById('fileName');
const aspectSelect = document.getElementById('aspectSelect');
const xInput = document.getElementById('xInput');
const yInput = document.getElementById('yInput');
const widthInput = document.getElementById('widthInput');
const heightInput = document.getElementById('heightInput');
const centerBtn = document.getElementById('centerBtn');
const cropBtn = document.getElementById('cropBtn');
const downloadBtn = document.getElementById('downloadBtn');
const resetBtn = document.getElementById('resetBtn');
const sourceImage = document.getElementById('sourceImage');
const previewPlaceholder = document.getElementById('previewPlaceholder');
const cropOverlay = document.getElementById('cropOverlay');
const previewStage = document.getElementById('previewStage');
const previewMeta = document.getElementById('previewMeta');
const resultImage = document.getElementById('resultImage');
const statusEl = document.getElementById('status');

const state = { image: null, url: '', resultUrl: '', crop: { x: 0, y: 0, width: 1, height: 1 } };

function setStatus(message, tone = 'neutral') {
  statusEl.textContent = message;
  if (tone === 'success' || tone === 'error') {
    statusEl.dataset.tone = tone;
  } else {
    delete statusEl.dataset.tone;
  }
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function clearResult() {
  if (state.resultUrl) {
    URL.revokeObjectURL(state.resultUrl);
    state.resultUrl = '';
  }
  resultImage.removeAttribute('src');
  resultImage.style.display = 'none';
  downloadBtn.disabled = true;
}

function updatePreview() {
  if (!state.image) {
    previewPlaceholder.style.display = 'grid';
    sourceImage.style.display = 'none';
    cropOverlay.style.display = 'none';
    previewMeta.textContent = 'No image loaded.';
    return;
  }

  previewPlaceholder.style.display = 'none';
  sourceImage.style.display = 'block';
  previewMeta.textContent = `${state.image.naturalWidth} x ${state.image.naturalHeight} px`;

  const imageRect = sourceImage.getBoundingClientRect();
  const stageRect = previewStage.getBoundingClientRect();
  if (!imageRect.width || !imageRect.height) {
    cropOverlay.style.display = 'none';
    return;
  }

  const scaleX = imageRect.width / state.image.naturalWidth;
  const scaleY = imageRect.height / state.image.naturalHeight;
  cropOverlay.style.display = 'block';
  cropOverlay.style.left = `${(imageRect.left - stageRect.left) + (state.crop.x * scaleX)}px`;
  cropOverlay.style.top = `${(imageRect.top - stageRect.top) + (state.crop.y * scaleY)}px`;
  cropOverlay.style.width = `${state.crop.width * scaleX}px`;
  cropOverlay.style.height = `${state.crop.height * scaleY}px`;
}

function readCropFromInputs() {
  if (!state.image) {
    return;
  }

  const maxWidth = state.image.naturalWidth;
  const maxHeight = state.image.naturalHeight;
  const width = clamp(parsePositiveInt(widthInput.value, maxWidth), 1, maxWidth);
  const height = clamp(parsePositiveInt(heightInput.value, maxHeight), 1, maxHeight);
  const x = clamp(parsePositiveInt(xInput.value, 0), 0, Math.max(0, maxWidth - width));
  const y = clamp(parsePositiveInt(yInput.value, 0), 0, Math.max(0, maxHeight - height));

  state.crop = { x, y, width, height };
  xInput.value = String(x);
  yInput.value = String(y);
  widthInput.value = String(width);
  heightInput.value = String(height);
  updatePreview();
}

function applyAspectPreset() {
  if (!state.image) {
    return;
  }

  const maxWidth = state.image.naturalWidth;
  const maxHeight = state.image.naturalHeight;
  const aspect = aspectSelect.value;
  let width = maxWidth;
  let height = maxHeight;

  if (aspect !== 'free') {
    const [ratioWidth, ratioHeight] = aspect.split(':').map(Number);
    const ratio = ratioWidth / ratioHeight;
    const imageRatio = maxWidth / maxHeight;

    if (imageRatio > ratio) {
      height = maxHeight;
      width = Math.round(height * ratio);
    } else {
      width = maxWidth;
      height = Math.round(width / ratio);
    }
  }

  width = clamp(width, 1, maxWidth);
  height = clamp(height, 1, maxHeight);
  state.crop.width = width;
  state.crop.height = height;
  state.crop.x = Math.round((maxWidth - width) / 2);
  state.crop.y = Math.round((maxHeight - height) / 2);
  xInput.value = String(state.crop.x);
  yInput.value = String(state.crop.y);
  widthInput.value = String(width);
  heightInput.value = String(height);
  updatePreview();
}

function centerCurrentCrop() {
  if (!state.image) {
    return;
  }

  readCropFromInputs();
  const maxWidth = state.image.naturalWidth;
  const maxHeight = state.image.naturalHeight;

  state.crop.x = Math.round((maxWidth - state.crop.width) / 2);
  state.crop.y = Math.round((maxHeight - state.crop.height) / 2);
  xInput.value = String(state.crop.x);
  yInput.value = String(state.crop.y);
  updatePreview();
}

function resetCrop() {
  aspectSelect.value = 'free';
  if (state.image) {
    state.crop = { x: 0, y: 0, width: state.image.naturalWidth, height: state.image.naturalHeight };
    xInput.value = '0';
    yInput.value = '0';
    widthInput.value = String(state.image.naturalWidth);
    heightInput.value = String(state.image.naturalHeight);
    updatePreview();
  } else {
    xInput.value = '0';
    yInput.value = '0';
    widthInput.value = '1';
    heightInput.value = '1';
  }
  clearResult();
  setStatus('Crop settings reset.');
}

function loadImage(file) {
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

async function onFileSelected() {
  const file = imageInput.files && imageInput.files[0];
  clearResult();

  if (!file) {
    state.image = null;
    state.url = '';
    fileName.textContent = 'No file selected';
    sourceImage.removeAttribute('src');
    updatePreview();
    setStatus('Choose an image to start.');
    return;
  }

  try {
    const { image, url } = await loadImage(file);
    if (state.url) {
      URL.revokeObjectURL(state.url);
    }

    state.image = image;
    state.url = url;
    fileName.textContent = file.name;
    sourceImage.src = url;
    state.crop = { x: 0, y: 0, width: image.naturalWidth, height: image.naturalHeight };
    xInput.value = '0';
    yInput.value = '0';
    widthInput.value = String(image.naturalWidth);
    heightInput.value = String(image.naturalHeight);
    updatePreview();
    setStatus('Image loaded. Adjust the crop and export the result.', 'success');
  } catch (error) {
    state.image = null;
    setStatus(error.message || 'Could not load image.', 'error');
  }
}

async function cropImage() {
  if (!state.image) {
    setStatus('Choose an image first.', 'error');
    return;
  }

  readCropFromInputs();
  const canvas = document.createElement('canvas');
  canvas.width = state.crop.width;
  canvas.height = state.crop.height;
  const context = canvas.getContext('2d');
  context.drawImage(state.image, state.crop.x, state.crop.y, state.crop.width, state.crop.height, 0, 0, state.crop.width, state.crop.height);

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) {
    setStatus('Could not crop the image.', 'error');
    return;
  }

  if (state.resultUrl) {
    URL.revokeObjectURL(state.resultUrl);
  }

  state.resultUrl = URL.createObjectURL(blob);
  resultImage.src = state.resultUrl;
  resultImage.style.display = 'block';
  downloadBtn.disabled = false;
  previewMeta.textContent = `${state.crop.width} x ${state.crop.height} px cropped result`;
  setStatus('Image cropped successfully.', 'success');
}

function downloadCrop() {
  if (!state.resultUrl) {
    setStatus('Crop an image first.', 'error');
    return;
  }

  const link = document.createElement('a');
  link.href = state.resultUrl;
  link.download = 'cropped-image.png';
  link.click();
  setStatus('Cropped image downloaded.', 'success');
}

imageInput.addEventListener('change', onFileSelected);
aspectSelect.addEventListener('change', applyAspectPreset);
[xInput, yInput, widthInput, heightInput].forEach((input) => input.addEventListener('input', readCropFromInputs));
sourceImage.addEventListener('load', updatePreview);
centerBtn.addEventListener('click', centerCurrentCrop);
cropBtn.addEventListener('click', cropImage);
downloadBtn.addEventListener('click', downloadCrop);
resetBtn.addEventListener('click', resetCrop);
window.addEventListener('resize', updatePreview);
setStatus('Choose an image to begin cropping.');