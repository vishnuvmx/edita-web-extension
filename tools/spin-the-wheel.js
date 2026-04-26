const STORAGE_KEYS = {
  entries: 'edita_spin_wheel_entries',
  history: 'edita_spin_wheel_history'
};

const DEFAULT_ENTRIES = ['Coffee', 'Pizza', 'Movie', 'Walk', 'Music', 'Game'];
const MAX_HISTORY = 40;
const MIN_SPIN_OPTIONS = 2;

const wheelCanvas = document.getElementById('wheelCanvas');
const spinBtn = document.getElementById('spinBtn');
const saveEntriesBtn = document.getElementById('saveEntriesBtn');
const resetEntriesBtn = document.getElementById('resetEntriesBtn');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');
const entriesInput = document.getElementById('entriesInput');
const lastWinnerEl = document.getElementById('lastWinner');
const totalSpinsEl = document.getElementById('totalSpins');
const optionCountEl = document.getElementById('optionCount');
const historyListEl = document.getElementById('historyList');
const statusEl = document.getElementById('status');

let entries = [];
let history = [];
let isSpinning = false;
let currentRotation = 0;

function setStatus(message, tone = 'neutral') {
  statusEl.textContent = message;
  if (tone === 'success' || tone === 'error') {
    statusEl.dataset.tone = tone;
  } else {
    delete statusEl.dataset.tone;
  }
}

function safeParseArray(rawValue, fallback) {
  if (!rawValue) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(rawValue);
    if (!Array.isArray(parsed)) {
      return fallback;
    }
    return parsed;
  } catch (error) {
    return fallback;
  }
}

function normalizeEntries(rawText) {
  const parts = rawText
    .split(/[\n,]/g)
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

  const unique = [];
  const seen = new Set();

  parts.forEach((value) => {
    const key = value.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(value.slice(0, 26));
    }
  });

  return unique;
}

function saveEntries() {
  localStorage.setItem(STORAGE_KEYS.entries, JSON.stringify(entries));
}

function saveHistory() {
  localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(history));
}

function loadState() {
  const storedEntries = safeParseArray(localStorage.getItem(STORAGE_KEYS.entries), DEFAULT_ENTRIES.slice());
  const validEntries = storedEntries
    .map((value) => (typeof value === 'string' ? value.trim() : ''))
    .filter((value) => value.length > 0);

  entries = validEntries.length ? validEntries.slice(0, 20) : DEFAULT_ENTRIES.slice();

  const storedHistory = safeParseArray(localStorage.getItem(STORAGE_KEYS.history), []);
  history = storedHistory
    .filter((item) => item && typeof item.label === 'string' && typeof item.time === 'string')
    .slice(0, MAX_HISTORY);
}

function entryColor(index, total) {
  const hue = Math.round((index * 360) / total);
  return {
    fill: `hsl(${hue} 82% 56%)`,
    text: hue > 45 && hue < 210 ? '#0f172a' : '#ffffff'
  };
}

function drawWheel() {
  const context = wheelCanvas.getContext('2d');
  if (!context) {
    return;
  }

  const pixelRatio = window.devicePixelRatio || 1;
  const rect = wheelCanvas.getBoundingClientRect();
  const size = Math.max(220, Math.floor(Math.min(rect.width, rect.height)));

  wheelCanvas.width = Math.floor(size * pixelRatio);
  wheelCanvas.height = Math.floor(size * pixelRatio);
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

  const radius = size / 2;
  const center = radius;
  context.clearRect(0, 0, size, size);

  const segmentCount = entries.length;
  if (!segmentCount) {
    context.beginPath();
    context.arc(center, center, radius - 6, 0, Math.PI * 2);
    context.fillStyle = '#e2e8f0';
    context.fill();
    return;
  }

  const segmentAngle = (Math.PI * 2) / segmentCount;

  entries.forEach((entry, index) => {
    const startAngle = -Math.PI / 2 + index * segmentAngle;
    const endAngle = startAngle + segmentAngle;
    const colors = entryColor(index, segmentCount);

    context.beginPath();
    context.moveTo(center, center);
    context.arc(center, center, radius - 4, startAngle, endAngle);
    context.closePath();
    context.fillStyle = colors.fill;
    context.fill();

    const middle = startAngle + segmentAngle / 2;
    context.save();
    context.translate(center, center);
    context.rotate(middle);
    context.textAlign = 'right';
    context.textBaseline = 'middle';
    context.fillStyle = colors.text;
    context.font = "700 13px 'Poppins', 'Inter', sans-serif";
    context.fillText(entry, radius - 18, 0);
    context.restore();
  });
}

function renderHistory() {
  historyListEl.innerHTML = '';

  if (!history.length) {
    const item = document.createElement('li');
    item.textContent = 'No spins yet.';
    historyListEl.appendChild(item);
    return;
  }

  history.forEach((entry) => {
    const item = document.createElement('li');
    const winner = document.createElement('strong');
    winner.textContent = entry.label;

    const time = document.createElement('span');
    time.textContent = entry.time;

    item.appendChild(winner);
    item.appendChild(time);
    historyListEl.appendChild(item);
  });
}

function updateSummary() {
  totalSpinsEl.textContent = String(history.length);
  optionCountEl.textContent = String(entries.length);
  entriesInput.value = entries.join('\n');

  if (history.length) {
    lastWinnerEl.textContent = history[0].label;
  } else {
    lastWinnerEl.textContent = '-';
  }

  spinBtn.disabled = entries.length < MIN_SPIN_OPTIONS || isSpinning;
}

function syncView() {
  updateSummary();
  drawWheel();
  renderHistory();
}

function addHistory(winner) {
  const stamp = new Date().toLocaleString();
  history.unshift({ label: winner, time: stamp });
  history = history.slice(0, MAX_HISTORY);
  saveHistory();
}

function parseAndStoreEntries(rawText) {
  const parsed = normalizeEntries(rawText);
  if (parsed.length < MIN_SPIN_OPTIONS) {
    setStatus('Please save at least 2 valid entries.', 'error');
    return false;
  }

  entries = parsed.slice(0, 20);
  saveEntries();
  setStatus('Entries saved locally.', 'success');
  syncView();
  return true;
}

function computeSpinTarget(winnerIndex) {
  const segmentSize = 360 / entries.length;
  const centerAngle = (winnerIndex + 0.5) * segmentSize;
  const targetWithinCircle = (360 - centerAngle + 360) % 360;
  const currentWithinCircle = ((currentRotation % 360) + 360) % 360;
  const offset = (targetWithinCircle - currentWithinCircle + 360) % 360;
  const extraTurns = 6 * 360;

  return currentRotation + extraTurns + offset;
}

function spinWheel() {
  if (isSpinning || entries.length < MIN_SPIN_OPTIONS) {
    return;
  }

  isSpinning = true;
  spinBtn.disabled = true;
  saveEntriesBtn.disabled = true;
  resetEntriesBtn.disabled = true;
  clearHistoryBtn.disabled = true;
  setStatus('Wheel is spinning...', 'success');

  const winnerIndex = Math.floor(Math.random() * entries.length);
  const winner = entries[winnerIndex];
  const targetRotation = computeSpinTarget(winnerIndex);

  currentRotation = targetRotation;
  wheelCanvas.style.setProperty('--wheel-rotation', `${currentRotation}deg`);

  window.setTimeout(() => {
    isSpinning = false;
    addHistory(winner);
    syncView();

    spinBtn.disabled = entries.length < MIN_SPIN_OPTIONS;
    saveEntriesBtn.disabled = false;
    resetEntriesBtn.disabled = false;
    clearHistoryBtn.disabled = false;

    setStatus(`Winner: ${winner}`, 'success');
  }, 4600);
}

function clearHistory() {
  if (isSpinning) {
    return;
  }

  history = [];
  saveHistory();
  syncView();
  setStatus('Spin history cleared.', 'success');
}

function resetEntries() {
  if (isSpinning) {
    return;
  }

  entries = DEFAULT_ENTRIES.slice();
  saveEntries();
  syncView();
  setStatus('Default entries restored.', 'success');
}

saveEntriesBtn.addEventListener('click', () => {
  parseAndStoreEntries(entriesInput.value);
});

entriesInput.addEventListener('blur', () => {
  if (!entriesInput.value.trim()) {
    return;
  }
  parseAndStoreEntries(entriesInput.value);
});

resetEntriesBtn.addEventListener('click', resetEntries);
clearHistoryBtn.addEventListener('click', clearHistory);
spinBtn.addEventListener('click', spinWheel);
window.addEventListener('resize', drawWheel);

loadState();
syncView();
setStatus('Data is saved locally in your browser profile.');
