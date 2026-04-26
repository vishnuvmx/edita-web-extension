const colorInput = document.getElementById('colorInput');
const colorPicker = document.getElementById('colorPicker');
const colorPreview = document.getElementById('colorPreview');
const previewValue = document.getElementById('previewValue');
const previewSubtle = document.getElementById('previewSubtle');
const hexValue = document.getElementById('hexValue');
const rgbValue = document.getElementById('rgbValue');
const hslValue = document.getElementById('hslValue');
const statusEl = document.getElementById('status');
const copyHexBtn = document.getElementById('copyHex');
const copyRgbBtn = document.getElementById('copyRgb');
const copyHslBtn = document.getElementById('copyHsl');
const sampleButtons = document.querySelectorAll('[data-sample]');

let lastColor = { r: 16, g: 185, b: 129 };
let inputSyncLock = false;

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

function round(value) {
  return Math.round(value);
}

function componentToHex(value) {
  return clamp(round(value), 0, 255).toString(16).padStart(2, '0');
}

function rgbToHex(rgb) {
  return `#${componentToHex(rgb.r)}${componentToHex(rgb.g)}${componentToHex(rgb.b)}`.toUpperCase();
}

function rgbToHsl(rgb) {
  const red = rgb.r / 255;
  const green = rgb.g / 255;
  const blue = rgb.b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;

  let hue = 0;
  let saturation = 0;
  const lightness = (max + min) / 2;

  if (delta !== 0) {
    saturation = delta / (1 - Math.abs(2 * lightness - 1));

    switch (max) {
      case red:
        hue = ((green - blue) / delta) % 6;
        break;
      case green:
        hue = (blue - red) / delta + 2;
        break;
      default:
        hue = (red - green) / delta + 4;
        break;
    }
  }

  hue = Math.round(hue * 60);
  if (hue < 0) {
    hue += 360;
  }

  return {
    h: hue,
    s: Math.round(saturation * 100),
    l: Math.round(lightness * 100)
  };
}

function hslToRgb(hsl) {
  const hue = ((hsl.h % 360) + 360) % 360;
  const saturation = clamp(hsl.s, 0, 100) / 100;
  const lightness = clamp(hsl.l, 0, 100) / 100;
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const segment = hue / 60;
  const secondary = chroma * (1 - Math.abs((segment % 2) - 1));
  const match = lightness - chroma / 2;

  let red = 0;
  let green = 0;
  let blue = 0;

  if (segment >= 0 && segment < 1) {
    red = chroma;
    green = secondary;
  } else if (segment < 2) {
    red = secondary;
    green = chroma;
  } else if (segment < 3) {
    green = chroma;
    blue = secondary;
  } else if (segment < 4) {
    green = secondary;
    blue = chroma;
  } else if (segment < 5) {
    red = secondary;
    blue = chroma;
  } else {
    red = chroma;
    blue = secondary;
  }

  return {
    r: round((red + match) * 255),
    g: round((green + match) * 255),
    b: round((blue + match) * 255)
  };
}

function normalizeHex(hex) {
  const clean = hex.trim().replace(/^#/, '');
  if (/^[0-9a-f]{3}$/i.test(clean)) {
    return clean.split('').map((char) => char + char).join('').toUpperCase();
  }

  if (/^[0-9a-f]{6}$/i.test(clean)) {
    return clean.toUpperCase();
  }

  throw new Error('Enter a valid HEX color.');
}

function parseNumberToken(token) {
  const trimmed = token.trim();
  if (!trimmed) {
    throw new Error('Enter a valid color.');
  }

  if (trimmed.endsWith('%')) {
    return { value: Number.parseFloat(trimmed), percent: true };
  }

  return { value: Number.parseFloat(trimmed), percent: false };
}

function parseRgb(value) {
  const inner = value.trim().replace(/^rgba?\(/i, '').replace(/\)$/,'');
  const parts = inner.split('/')[0].split(',').length > 1
    ? inner.split('/')[0].split(',')
    : inner.split('/')[0].trim().split(/\s+/);

  if (parts.length < 3) {
    throw new Error('Enter a valid RGB color.');
  }

  const red = parseNumberToken(parts[0]);
  const green = parseNumberToken(parts[1]);
  const blue = parseNumberToken(parts[2]);

  const convert = (component) => {
    if (component.percent) {
      return clamp(component.value, 0, 100) * 2.55;
    }
    return clamp(component.value, 0, 255);
  };

  return {
    r: round(convert(red)),
    g: round(convert(green)),
    b: round(convert(blue))
  };
}

function parseHsl(value) {
  const inner = value.trim().replace(/^hsla?\(/i, '').replace(/\)$/,'');
  const parts = inner.split('/')[0].split(',').length > 1
    ? inner.split('/')[0].split(',')
    : inner.split('/')[0].trim().split(/\s+/);

  if (parts.length < 3) {
    throw new Error('Enter a valid HSL color.');
  }

  const hue = Number.parseFloat(parts[0]);
  const saturation = parseNumberToken(parts[1]);
  const lightness = parseNumberToken(parts[2]);

  if (!Number.isFinite(hue) || !saturation.percent || !lightness.percent) {
    throw new Error('HSL must use degrees and percentages, like hsl(160, 84%, 39%).');
  }

  return hslToRgb({
    h: hue,
    s: saturation.value,
    l: lightness.value
  });
}

function parseColor(value) {
  const input = value.trim();
  if (!input) {
    throw new Error('Enter a color value.');
  }

  const lowered = input.toLowerCase();

  if (lowered.startsWith('#') || /^[0-9a-f]{3,6}$/i.test(input)) {
    const hex = normalizeHex(input);
    return {
      rgb: {
        r: Number.parseInt(hex.slice(0, 2), 16),
        g: Number.parseInt(hex.slice(2, 4), 16),
        b: Number.parseInt(hex.slice(4, 6), 16)
      }
    };
  }

  if (lowered.startsWith('rgb')) {
    return { rgb: parseRgb(input) };
  }

  if (lowered.startsWith('hsl')) {
    return { rgb: parseHsl(input) };
  }

  throw new Error('Use HEX, RGB, or HSL format.');
}

function getReadableTextColor(rgb) {
  const luminance = (0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b) / 255;
  return luminance > 0.58 ? '#0f172a' : '#ffffff';
}

function applyColor(rgb, sourceLabel) {
  lastColor = rgb;
  const hex = rgbToHex(rgb);
  const hsl = rgbToHsl(rgb);
  const rgbText = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
  const hslText = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
  const textColor = getReadableTextColor(rgb);

  colorPreview.style.setProperty('--preview-color', hex);
  colorPreview.style.setProperty('--preview-text', textColor);
  previewValue.textContent = hex;
  previewSubtle.textContent = rgbText;
  colorPicker.value = hex;
  hexValue.textContent = hex;
  rgbValue.textContent = rgbText;
  hslValue.textContent = hslText;

  if (!inputSyncLock) {
    colorInput.value = sourceLabel === 'picker' ? hex : colorInput.value.trim();
  }
}

function showParsedColor(input, rgb, label) {
  applyColor(rgb, label);
  setStatus(`Converted ${label} to HEX, RGB, and HSL.`, 'success');
  if (input !== undefined) {
    inputSyncLock = true;
    colorInput.value = input;
    inputSyncLock = false;
  }
}

function updateFromInput(value) {
  try {
    const parsed = parseColor(value);
    const label = value.trim().toLowerCase().startsWith('hsl')
      ? 'HSL'
      : value.trim().toLowerCase().startsWith('rgb')
        ? 'RGB'
        : 'HEX';

    applyColor(parsed.rgb, label);
    setStatus(`Converted ${label} to HEX, RGB, and HSL.`, 'success');
  } catch (error) {
    setStatus(error.message || 'Unable to parse color.', 'error');
  }
}

async function copyText(text, label) {
  try {
    await navigator.clipboard.writeText(text);
    setStatus(`${label} copied to clipboard.`, 'success');
  } catch {
    setStatus(`Press Ctrl+C to copy ${label.toLowerCase()}.`, 'error');
  }
}

colorInput.addEventListener('input', (event) => {
  updateFromInput(event.target.value);
});

colorPicker.addEventListener('input', (event) => {
  const hex = event.target.value;
  colorInput.value = hex;
  updateFromInput(hex);
});

sampleButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const sample = button.dataset.sample || '#10b981';
    colorInput.value = sample;
    updateFromInput(sample);
  });
});

copyHexBtn.addEventListener('click', () => copyText(hexValue.textContent.trim(), 'HEX'));
copyRgbBtn.addEventListener('click', () => copyText(rgbValue.textContent.trim(), 'RGB'));
copyHslBtn.addEventListener('click', () => copyText(hslValue.textContent.trim(), 'HSL'));

updateFromInput(colorInput.value);
