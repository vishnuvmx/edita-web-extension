const promptModeEl = document.getElementById('promptMode');
const promptBoxEl = document.getElementById('promptBox');
const typingInputEl = document.getElementById('typingInput');
const startBtn = document.getElementById('startBtn');
const shuffleBtn = document.getElementById('shuffleBtn');
const resetBtn = document.getElementById('resetBtn');
const completionTimeEl = document.getElementById('completionTime');
const grossWpmEl = document.getElementById('grossWpm');
const netWpmEl = document.getElementById('netWpm');
const accuracyEl = document.getElementById('accuracy');
const cpmEl = document.getElementById('cpm');
const progressEl = document.getElementById('progress');
const statusEl = document.getElementById('status');

const QUICK_PROMPT = 'The quick brown fox jumps over the lazy dog near five quacking zebras.';
const FAMOUS_PARAGRAPHS = [
  'Success is not final, failure is not fatal: it is the courage to continue that counts.',
  'In the middle of every difficulty lies opportunity, and calm focus turns challenge into progress.',
  'We are what we repeatedly do. Excellence, then, is not an act but a habit practiced daily.',
  'The future depends on what you do today, especially the small consistent actions no one sees.',
];

const state = {
  prompt: QUICK_PROMPT,
  testStarted: false,
  testFinished: false,
  startTimeMs: null,
  finishTimeMs: null,
  tickTimerId: null,
};

function setStatus(message, tone = 'neutral') {
  statusEl.textContent = message;
  if (tone === 'success' || tone === 'error') {
    statusEl.dataset.tone = tone;
  } else {
    delete statusEl.dataset.tone;
  }
}

function formatDuration(ms) {
  const safeMs = Math.max(0, Number.isFinite(ms) ? ms : 0);
  const minutes = Math.floor(safeMs / 60000);
  const seconds = Math.floor((safeMs % 60000) / 1000);
  const millis = safeMs % 1000;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}:${String(millis).padStart(3, '0')}`;
}

function getElapsedMs() {
  if (!state.startTimeMs) {
    return 0;
  }

  if (state.testFinished && state.finishTimeMs) {
    return state.finishTimeMs - state.startTimeMs;
  }

  return Date.now() - state.startTimeMs;
}

function pickPrompt() {
  if (promptModeEl.value === 'quick') {
    return QUICK_PROMPT;
  }

  const index = Math.floor(Math.random() * FAMOUS_PARAGRAPHS.length);
  return FAMOUS_PARAGRAPHS[index];
}

function updatePromptVisuals(userInput) {
  const prompt = state.prompt;
  const fragment = document.createDocumentFragment();

  for (let index = 0; index < prompt.length; index += 1) {
    const span = document.createElement('span');
    span.className = 'prompt-char';
    span.textContent = prompt[index];

    if (index < userInput.length) {
      if (userInput[index] === prompt[index]) {
        span.classList.add('correct');
      } else {
        span.classList.add('incorrect');
      }
    } else if (!state.testFinished && index === userInput.length) {
      span.classList.add('current');
    }

    fragment.appendChild(span);
  }

  promptBoxEl.textContent = '';
  promptBoxEl.appendChild(fragment);
}

function getStats(userInput) {
  const typedChars = userInput.length;
  let correctChars = 0;
  let mistakes = 0;

  for (let i = 0; i < typedChars; i += 1) {
    if (state.prompt[i] === userInput[i]) {
      correctChars += 1;
    } else {
      mistakes += 1;
    }
  }

  const elapsedMs = getElapsedMs();
  const minutes = elapsedMs > 0 ? elapsedMs / 60000 : 0;
  const grossWpm = minutes > 0 ? typedChars / 5 / minutes : 0;
  const netWpmRaw = minutes > 0 ? grossWpm - mistakes / minutes : 0;
  const netWpm = Math.max(0, netWpmRaw);
  const accuracy = typedChars > 0 ? (correctChars / typedChars) * 100 : 100;
  const cpm = minutes > 0 ? Math.round(typedChars / minutes) : 0;
  const progress =
    state.prompt.length > 0 ? Math.min(100, (typedChars / state.prompt.length) * 100) : 0;

  return {
    elapsedMs,
    grossWpm,
    netWpm,
    accuracy,
    cpm,
    progress,
    typedChars,
    correctChars,
    mistakes,
  };
}

function renderStats(userInput) {
  const stats = getStats(userInput);
  completionTimeEl.textContent = formatDuration(stats.elapsedMs);
  grossWpmEl.textContent = stats.grossWpm.toFixed(2);
  netWpmEl.textContent = stats.netWpm.toFixed(2);
  accuracyEl.textContent = `${stats.accuracy.toFixed(2)}%`;
  cpmEl.textContent = String(stats.cpm);
  progressEl.textContent = `${stats.progress.toFixed(2)}%`;
}

function stopTick() {
  if (state.tickTimerId) {
    window.clearInterval(state.tickTimerId);
    state.tickTimerId = null;
  }
}

function startTick() {
  stopTick();
  state.tickTimerId = window.setInterval(() => {
    renderStats(typingInputEl.value);
  }, 33);
}

function loadNewPrompt() {
  state.prompt = pickPrompt();
  typingInputEl.maxLength = state.prompt.length;
  updatePromptVisuals(typingInputEl.value);
}

function startTest() {
  state.testStarted = false;
  state.testFinished = false;
  state.startTimeMs = null;
  state.finishTimeMs = null;
  typingInputEl.value = '';
  typingInputEl.disabled = false;
  loadNewPrompt();
  renderStats('');
  setStatus('Test ready. Start typing to begin the timer.');
  typingInputEl.focus();
  stopTick();
}

function finalizeTest() {
  if (state.testFinished) {
    return;
  }

  state.testFinished = true;
  state.finishTimeMs = Date.now();
  stopTick();
  renderStats(typingInputEl.value);

  const stats = getStats(typingInputEl.value);
  setStatus(
    `Completed in ${formatDuration(stats.elapsedMs)} | Net WPM ${stats.netWpm.toFixed(2)} | Accuracy ${stats.accuracy.toFixed(2)}%.`,
    'success'
  );
}

function onInputChange() {
  const userInput = typingInputEl.value;

  if (!state.testStarted && userInput.length > 0) {
    state.testStarted = true;
    state.startTimeMs = Date.now();
    startTick();
    setStatus('Timer started. Keep going...');
  }

  updatePromptVisuals(userInput);
  renderStats(userInput);

  if (userInput.length === state.prompt.length) {
    if (userInput === state.prompt) {
      finalizeTest();
    } else {
      setStatus(
        'You reached the end, but there are mistakes. Fix highlighted characters.',
        'error'
      );
    }
  }
}

promptModeEl.addEventListener('change', () => {
  startTest();
  setStatus('Mode changed and prompt refreshed.');
});

startBtn.addEventListener('click', () => {
  startTest();
});

shuffleBtn.addEventListener('click', () => {
  const hadInput = typingInputEl.value.length > 0;
  startTest();
  setStatus(hadInput ? 'Prompt shuffled and test restarted.' : 'Prompt shuffled.');
});

resetBtn.addEventListener('click', () => {
  typingInputEl.value = '';
  state.testStarted = false;
  state.testFinished = false;
  state.startTimeMs = null;
  state.finishTimeMs = null;
  stopTick();
  updatePromptVisuals('');
  renderStats('');
  setStatus('Input cleared. Start typing again.');
  typingInputEl.focus();
});

typingInputEl.addEventListener('input', onInputChange);

startTest();
