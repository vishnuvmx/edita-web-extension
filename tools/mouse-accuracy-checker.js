const arenaEl = document.getElementById('arena');
const targetDotEl = document.getElementById('targetDot');
const targetCountEl = document.getElementById('targetCount');
const startBtn = document.getElementById('startBtn');
const resetBtn = document.getElementById('resetBtn');
const completionTimeEl = document.getElementById('completionTime');
const accuracyEl = document.getElementById('accuracy');
const hitsGoalEl = document.getElementById('hitsGoal');
const missesEl = document.getElementById('misses');
const avgReactionEl = document.getElementById('avgReaction');
const totalClicksEl = document.getElementById('totalClicks');
const statusEl = document.getElementById('status');

const DOT_SIZE = 24;

const state = {
  running: false,
  goal: 20,
  hits: 0,
  misses: 0,
  totalClicks: 0,
  startTimeMs: null,
  finishTimeMs: null,
  targetSpawnMs: null,
  reactionTotalMs: 0,
  timerId: null,
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

  if (state.finishTimeMs) {
    return state.finishTimeMs - state.startTimeMs;
  }

  return Date.now() - state.startTimeMs;
}

function updateStats() {
  const accuracy = state.totalClicks > 0 ? (state.hits / state.totalClicks) * 100 : 0;
  const avgReaction = state.hits > 0 ? Math.round(state.reactionTotalMs / state.hits) : 0;

  completionTimeEl.textContent = formatDuration(getElapsedMs());
  accuracyEl.textContent = `${accuracy.toFixed(2)}%`;
  hitsGoalEl.textContent = `${state.hits} / ${state.goal}`;
  missesEl.textContent = String(state.misses);
  avgReactionEl.textContent = `${avgReaction} ms`;
  totalClicksEl.textContent = String(state.totalClicks);
}

function stopLiveTimer() {
  if (state.timerId) {
    window.clearInterval(state.timerId);
    state.timerId = null;
  }
}

function startLiveTimer() {
  stopLiveTimer();
  state.timerId = window.setInterval(updateStats, 33);
}

function getGoalValue() {
  const parsed = Number.parseInt(targetCountEl.value, 10);
  if (!Number.isFinite(parsed)) {
    return 20;
  }

  return Math.min(100, Math.max(5, parsed));
}

function moveTargetToRandomPosition() {
  const rect = arenaEl.getBoundingClientRect();
  const safeWidth = Math.max(DOT_SIZE + 6, rect.width - 2);
  const safeHeight = Math.max(DOT_SIZE + 6, rect.height - 2);
  const left = DOT_SIZE / 2 + Math.random() * (safeWidth - DOT_SIZE);
  const top = DOT_SIZE / 2 + Math.random() * (safeHeight - DOT_SIZE);

  targetDotEl.style.left = `${left}px`;
  targetDotEl.style.top = `${top}px`;
  targetDotEl.classList.add('active');
  state.targetSpawnMs = Date.now();
}

function finishChallenge() {
  state.running = false;
  state.finishTimeMs = Date.now();
  targetDotEl.classList.remove('active');
  stopLiveTimer();
  updateStats();

  const accuracy = state.totalClicks > 0 ? (state.hits / state.totalClicks) * 100 : 0;
  const avgReaction = state.hits > 0 ? Math.round(state.reactionTotalMs / state.hits) : 0;
  setStatus(
    `Challenge complete in ${formatDuration(getElapsedMs())} | Accuracy ${accuracy.toFixed(2)}% | Avg reaction ${avgReaction} ms.`,
    'success'
  );
}

function startChallenge() {
  state.goal = getGoalValue();
  targetCountEl.value = String(state.goal);
  state.running = true;
  state.hits = 0;
  state.misses = 0;
  state.totalClicks = 0;
  state.startTimeMs = Date.now();
  state.finishTimeMs = null;
  state.targetSpawnMs = Date.now();
  state.reactionTotalMs = 0;

  moveTargetToRandomPosition();
  updateStats();
  startLiveTimer();
  setStatus('Challenge started. Click the orange target dot as quickly as possible.');
}

function resetChallenge() {
  state.running = false;
  state.goal = getGoalValue();
  state.hits = 0;
  state.misses = 0;
  state.totalClicks = 0;
  state.startTimeMs = null;
  state.finishTimeMs = null;
  state.targetSpawnMs = null;
  state.reactionTotalMs = 0;
  targetDotEl.classList.remove('active');
  stopLiveTimer();
  updateStats();
  setStatus('Challenge reset. Press Start Challenge to begin.');
}

targetDotEl.addEventListener('click', (event) => {
  event.preventDefault();
  event.stopPropagation();

  if (!state.running) {
    return;
  }

  state.totalClicks += 1;
  state.hits += 1;

  if (state.targetSpawnMs) {
    state.reactionTotalMs += Math.max(0, Date.now() - state.targetSpawnMs);
  }

  if (state.hits >= state.goal) {
    finishChallenge();
  } else {
    moveTargetToRandomPosition();
    updateStats();
  }
});

arenaEl.addEventListener('click', (event) => {
  if (!state.running) {
    return;
  }

  if (event.target === targetDotEl) {
    return;
  }

  state.totalClicks += 1;
  state.misses += 1;
  updateStats();
});

startBtn.addEventListener('click', () => {
  startChallenge();
});

resetBtn.addEventListener('click', () => {
  resetChallenge();
});

window.addEventListener('resize', () => {
  if (state.running) {
    moveTargetToRandomPosition();
  }
});

resetChallenge();
