const countInput = document.getElementById('uuidCount');
const uppercaseToggle = document.getElementById('uppercaseToggle');
const hyphenToggle = document.getElementById('hyphenToggle');
const generateBtn = document.getElementById('generateBtn');
const copyBtn = document.getElementById('copyBtn');
const output = document.getElementById('uuidOutput');
const statusEl = document.getElementById('status');

function setStatus(message, tone = 'neutral') {
  statusEl.textContent = message;
  if (tone === 'success' || tone === 'error') {
    statusEl.dataset.tone = tone;
  } else {
    delete statusEl.dataset.tone;
  }
}

function clampCount(value) {
  const numeric = Number.parseInt(value, 10);
  if (Number.isNaN(numeric)) {
    return 1;
  }
  return Math.max(1, Math.min(100, numeric));
}

function bytesToHex(bytes) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function createUuidV4() {
  const bytes = new Uint8Array(16);

  if (window.crypto && typeof window.crypto.getRandomValues === 'function') {
    window.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }

  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = bytesToHex(bytes);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function formatUuid(value) {
  let formatted = value;

  if (!hyphenToggle.checked) {
    formatted = formatted.replace(/-/g, '');
  }

  if (uppercaseToggle.checked) {
    formatted = formatted.toUpperCase();
  }

  return formatted;
}

function generateUuids() {
  const count = clampCount(countInput.value);
  countInput.value = String(count);

  const values = [];
  for (let i = 0; i < count; i += 1) {
    values.push(formatUuid(createUuidV4()));
  }

  output.value = values.join('\n');
  setStatus(`Generated ${count} UUID${count === 1 ? '' : 's'}.`, 'success');
}

async function copyAll() {
  if (!output.value.trim()) {
    setStatus('Generate UUIDs first.', 'error');
    return;
  }

  try {
    await navigator.clipboard.writeText(output.value);
    setStatus('Copied to clipboard.', 'success');
  } catch {
    output.focus();
    output.select();
    setStatus('Press Ctrl+C to copy.', 'error');
  }
}

generateBtn.addEventListener('click', generateUuids);
copyBtn.addEventListener('click', copyAll);

uppercaseToggle.addEventListener('change', () => {
  if (!output.value.trim()) {
    return;
  }
  output.value = output.value
    .split(/\r?\n/)
    .map((line) => formatUuid(line.trim().toLowerCase()))
    .join('\n');
});

hyphenToggle.addEventListener('change', () => {
  if (!output.value.trim()) {
    return;
  }

  const normalized = output.value
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/-/g, '').toLowerCase())
    .filter(Boolean)
    .map((line) => {
      const compact = line.padEnd(32, '0').slice(0, 32);
      const withHyphens = `${compact.slice(0, 8)}-${compact.slice(8, 12)}-${compact.slice(12, 16)}-${compact.slice(16, 20)}-${compact.slice(20)}`;
      return formatUuid(withHyphens);
    });

  output.value = normalized.join('\n');
});

generateUuids();
