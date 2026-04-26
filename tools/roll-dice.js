const diceCube = document.getElementById('diceCube');
const diceShadow = document.getElementById('diceShadow');
const rollBtn = document.getElementById('rollBtn');
const resetBtn = document.getElementById('resetBtn');
const lastResultEl = document.getElementById('lastResult');
const rollCountEl = document.getElementById('rollCount');
const averageValueEl = document.getElementById('averageValue');
const statusEl = document.getElementById('status');

const ORIENTATIONS = {
  1: { x: 90, y: 0 },
  2: { x: 0, y: 0 },
  3: { x: -180, y: 0 },
  4: { x: 0, y: -90 },
  5: { x: -90, y: 0 },
  6: { x: 0, y: 90 }
};

const BASE_TILT_X = -24;
const BASE_TILT_Y = 36;
const ROLL_TIME_MS = 1200;

let totalRolls = 0;
let sumResults = 0;
let isRolling = false;

function setStatus(message, tone = 'neutral') {
  statusEl.textContent = message;
  if (tone === 'success' || tone === 'error') {
    statusEl.dataset.tone = tone;
  } else {
    delete statusEl.dataset.tone;
  }
}

function setDiceFace(result, extraSpinX = 0, extraSpinY = 0) {
  const orientation = ORIENTATIONS[result] || ORIENTATIONS[1];
  const x = BASE_TILT_X + orientation.x + extraSpinX;
  const y = BASE_TILT_Y + orientation.y + extraSpinY;

  diceCube.style.setProperty('--rx', `${x}deg`);
  diceCube.style.setProperty('--ry', `${y}deg`);
}

function updateStats(result) {
  totalRolls += 1;
  sumResults += result;
  const average = sumResults / totalRolls;

  lastResultEl.textContent = String(result);
  rollCountEl.textContent = String(totalRolls);
  averageValueEl.textContent = average.toFixed(2);
}

function startRollingVisuals() {
  diceCube.classList.add('rolling');
  diceShadow.style.transform = 'translateY(90px) scale(0.92)';
  diceShadow.style.opacity = '0.65';
}

function stopRollingVisuals() {
  diceCube.classList.remove('rolling');
  diceShadow.style.transform = 'translateY(86px) scale(1)';
  diceShadow.style.opacity = '1';
}

function randomResult() {
  return Math.floor(Math.random() * 6) + 1;
}

function rollDice() {
  if (isRolling) {
    return;
  }

  isRolling = true;
  rollBtn.disabled = true;
  resetBtn.disabled = true;

  setStatus('Dice is rolling...', 'success');
  startRollingVisuals();

  const result = randomResult();

  window.setTimeout(() => {
    stopRollingVisuals();

    // Add extra turns before landing to make the stop feel physical.
    const extraSpinX = 360 * (2 + Math.floor(Math.random() * 2));
    const extraSpinY = 360 * (2 + Math.floor(Math.random() * 2));
    setDiceFace(result, extraSpinX, extraSpinY);

    updateStats(result);
    setStatus(`You rolled a ${result}!`, 'success');

    rollBtn.disabled = false;
    resetBtn.disabled = false;
    isRolling = false;
  }, ROLL_TIME_MS);
}

function resetGame() {
  if (isRolling) {
    return;
  }

  totalRolls = 0;
  sumResults = 0;
  lastResultEl.textContent = '1';
  rollCountEl.textContent = '0';
  averageValueEl.textContent = '0.00';
  setDiceFace(1);
  setStatus('Game reset. Tap Roll Dice to start.');
}

rollBtn.addEventListener('click', rollDice);
resetBtn.addEventListener('click', resetGame);

setDiceFace(1);
setStatus('Tap Roll Dice to start.');
