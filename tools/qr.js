const qrInput = document.getElementById('qrInput');
const previewBox = document.getElementById('qrPreview');
const qrColor = document.getElementById('qrColor');
const qrColorText = document.getElementById('qrColorText');
const bgColor = document.getElementById('bgColor');
const bgColorText = document.getElementById('bgColorText');
const bgTransparent = document.getElementById('bgTransparent');

function getInitialValue() {
  const params = new URLSearchParams(window.location.search);
  return params.get('url') || '';
}

function normalizeColor(value) {
  if (!value) return '#ffffff';
  const cleaned = value.trim();

  if (!cleaned.startsWith('#')) {
    return `#${cleaned.padEnd(7, '0').slice(0, 7)}`;
  }

  return cleaned.length >= 7 ? cleaned.slice(0, 7) : '#ffffff';
}

function buildQrImage(text, colorDark, colorLight) {
  return new Promise((resolve, reject) => {
    const image = document.createElement('img');
    image.className = 'qr-preview-image';
    image.alt = 'QR code for the current page';
    image.referrerPolicy = 'no-referrer';

    const size = 320;
    const background = colorLight.replace('#', '');
    const foreground = colorDark.replace('#', '');
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}&color=${foreground}&bgcolor=${background}`;

    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Unable to generate QR image'));
    image.src = qrUrl;
  });
}

function renderPreview() {
  const value = qrInput.value.trim();
  previewBox.innerHTML = '';

  if (!value) {
    previewBox.innerHTML =
      '<div class="qr-empty-state">Enter a URL or text to generate a QR code</div>';
    return;
  }

  const fgColorVal = normalizeColor(qrColor.value);
  const bgColorVal =
    bgTransparent && bgTransparent.checked
      ? '#ffffff'
      : normalizeColor(bgColor ? bgColor.value : '#ffffff');

  buildQrImage(value, fgColorVal, bgColorVal)
    .then((image) => {
      previewBox.innerHTML = '';
      previewBox.appendChild(image);
    })
    .catch((error) => {
      console.error('QR generation error:', error);
      previewBox.innerHTML = '<div class="qr-empty-state">Error generating QR</div>';
    });
}

qrColor.addEventListener('change', (event) => {
  qrColorText.value = event.target.value.toUpperCase();
  renderPreview();
});

qrColorText.addEventListener('input', (event) => {
  const normalized = normalizeColor(event.target.value);
  qrColor.value = normalized;
  qrColorText.value = normalized.toUpperCase();
  renderPreview();
});

if (bgColor && bgColorText && bgTransparent) {
  bgColor.addEventListener('change', (event) => {
    bgColorText.value = event.target.value.toUpperCase();
    renderPreview();
  });

  bgColorText.addEventListener('input', (event) => {
    const normalized = normalizeColor(event.target.value);
    bgColor.value = normalized;
    bgColorText.value = normalized.toUpperCase();
    renderPreview();
  });

  bgTransparent.addEventListener('change', () => {
    bgColor.disabled = bgTransparent.checked;
    bgColorText.disabled = bgTransparent.checked;
    renderPreview();
  });
}

qrInput.addEventListener('input', renderPreview);

function initialize() {
  const initialValue = getInitialValue();
  if (initialValue) {
    qrInput.value = initialValue;
  }

  qrColorText.value = qrColor.value.toUpperCase();
  if (bgColorText && bgColor) {
    bgColorText.value = bgColor.value.toUpperCase();
  }
  renderPreview();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}
