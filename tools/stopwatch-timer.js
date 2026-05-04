const minutesInput = document.getElementById('minutesInput');
const secondsInput = document.getElementById('secondsInput');
const startPauseBtn = document.getElementById('startPauseBtn');
const resetBtn = document.getElementById('resetBtn');
const timeValue = document.getElementById('timeValue');
const timeLabel = document.getElementById('timeLabel');
const statusEl = document.getElementById('status');
const ringProgress = document.getElementById('ringProgress');
const presetButtons = document.querySelectorAll('.preset-btn[data-seconds]');
const STORAGE_KEY = 'edita.stopwatchTimer.state.v1';
const TIMER_TOAST_MESSAGE = 'Time is up.';

const RADIUS = 88;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
ringProgress.style.strokeDasharray = String(CIRCUMFERENCE);

const state = {
  totalSeconds: 60,
  remainingSeconds: 60,
  running: false,
  intervalId: null,
  endTimeMs: null,
};

function saveState() {
  const payload = {
    totalSeconds: state.totalSeconds,
    remainingSeconds: state.remainingSeconds,
    running: state.running,
    endTimeMs: state.endTimeMs,
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (_error) {
    // Ignore persistence failure; timer still works in-memory.
  }
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return false;
    }

    const saved = JSON.parse(raw);
    if (!saved || typeof saved !== 'object') {
      return false;
    }

    const totalSeconds = Number.parseInt(saved.totalSeconds, 10);
    const remainingSeconds = Number.parseInt(saved.remainingSeconds, 10);
    const endTimeMs = Number.parseInt(saved.endTimeMs, 10);

    state.totalSeconds = Number.isFinite(totalSeconds) && totalSeconds > 0 ? totalSeconds : 60;
    state.remainingSeconds =
      Number.isFinite(remainingSeconds) && remainingSeconds >= 0
        ? remainingSeconds
        : state.totalSeconds;
    state.running = saved.running === true;
    state.endTimeMs = Number.isFinite(endTimeMs) ? endTimeMs : null;
    return true;
  } catch (_error) {
    return false;
  }
}

function setStatus(message, tone = 'neutral') {
  statusEl.textContent = message;
  if (tone === 'success' || tone === 'error') {
    statusEl.dataset.tone = tone;
  } else {
    delete statusEl.dataset.tone;
  }
}

function showTimerToast() {
  chrome.runtime
    .sendMessage({
      action: 'showTimerToast',
      message: TIMER_TOAST_MESSAGE,
      tone: 'success',
    })
    .catch(() => {
      // Ignore toast delivery failures; the timer state still updates locally.
    });
}

function formatTime(totalSeconds) {
  const safeSeconds = Math.max(0, totalSeconds);
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function applyInputsToState() {
  const minutes = Math.max(0, Number.parseInt(minutesInput.value, 10) || 0);
  const seconds = Math.min(59, Math.max(0, Number.parseInt(secondsInput.value, 10) || 0));
  const total = minutes * 60 + seconds;

  if (total <= 0) {
    state.totalSeconds = 1;
    state.remainingSeconds = 1;
    return false;
  }

  state.totalSeconds = total;
  state.remainingSeconds = total;
  return true;
}

function setInputsFromSeconds(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  minutesInput.value = String(minutes);
  secondsInput.value = String(seconds);
}

function updateRing() {
  const progressRatio = state.totalSeconds > 0 ? state.remainingSeconds / state.totalSeconds : 0;
  const offset = CIRCUMFERENCE * (1 - progressRatio);
  ringProgress.style.strokeDashoffset = String(offset);
}

function render() {
  timeValue.textContent = formatTime(state.remainingSeconds);
  updateRing();

  if (state.running) {
    timeLabel.textContent = 'Running';
    startPauseBtn.textContent = 'Pause';
  } else if (state.remainingSeconds === state.totalSeconds) {
    timeLabel.textContent = 'Ready';
    startPauseBtn.textContent = 'Start';
  } else if (state.remainingSeconds === 0) {
    timeLabel.textContent = 'Done';
    startPauseBtn.textContent = 'Start';
  } else {
    timeLabel.textContent = 'Paused';
    startPauseBtn.textContent = 'Resume';
  }
}

function syncRemainingFromClock() {
  if (!state.running || !Number.isFinite(state.endTimeMs)) {
    return;
  }

  const secondsLeft = Math.max(0, Math.ceil((state.endTimeMs - Date.now()) / 1000));
  state.remainingSeconds = secondsLeft;
}

function stopInterval() {
  if (state.intervalId) {
    clearInterval(state.intervalId);
    state.intervalId = null;
  }
  state.running = false;
}

function tick() {
  syncRemainingFromClock();
  render();
  saveState();

  if (state.remainingSeconds > 0) {
    return;
  }

  state.endTimeMs = null;
  stopInterval();
  saveState();
  setStatus('Time is up.', 'success');
  showTimerToast();
}

function startTimer() {
  if (!state.running) {
    if (state.remainingSeconds <= 0) {
      const hasDuration = applyInputsToState();
      if (!hasDuration) {
        setStatus('Set a duration greater than 0 seconds.', 'error');
        render();
        return;
      }
    }

    state.running = true;
    state.endTimeMs = Date.now() + state.remainingSeconds * 1000;
    state.intervalId = setInterval(tick, 1000);
    saveState();
    setStatus('Countdown started.');
    render();
  }
}

function pauseTimer() {
  syncRemainingFromClock();
  state.endTimeMs = null;
  stopInterval();
  saveState();
  setStatus('Timer paused.');
  render();
}

function resetTimer() {
  stopInterval();
  state.endTimeMs = null;
  const hasDuration = applyInputsToState();
  if (!hasDuration) {
    setStatus('Set a duration greater than 0 seconds.', 'error');
  } else {
    setStatus('Timer reset.');
  }
  saveState();
  render();
}

startPauseBtn.addEventListener('click', () => {
  if (state.running) {
    pauseTimer();
  } else {
    startTimer();
  }
});

resetBtn.addEventListener('click', resetTimer);

minutesInput.addEventListener('change', () => {
  if (state.running) {
    return;
  }
  applyInputsToState();
  saveState();
  render();
});

secondsInput.addEventListener('change', () => {
  if (state.running) {
    return;
  }
  applyInputsToState();
  saveState();
  render();
});

presetButtons.forEach((button) => {
  button.addEventListener('click', () => {
    if (state.running) {
      return;
    }
    const seconds = Number.parseInt(button.dataset.seconds, 10);
    if (!Number.isFinite(seconds) || seconds < 1) {
      return;
    }
    setInputsFromSeconds(seconds);
    applyInputsToState();
    saveState();
    render();
    setStatus('Preset duration applied.');
  });
});

if (!loadState()) {
  applyInputsToState();
  saveState();
}

if (state.running && Number.isFinite(state.endTimeMs)) {
  syncRemainingFromClock();
  if (state.remainingSeconds <= 0) {
    state.remainingSeconds = 0;
    state.running = false;
    state.endTimeMs = null;
    saveState();
    setStatus('Time is up.', 'success');
    showTimerToast();
  } else {
    state.intervalId = setInterval(tick, 1000);
    setStatus('Countdown resumed from saved timer state.');
  }
} else {
  state.running = false;
  state.endTimeMs = null;
  setStatus('Set a duration and press Start.');
}

setInputsFromSeconds(state.totalSeconds);
render();
