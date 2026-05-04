const coinDisc = document.getElementById('coinDisc');
const coinShadow = document.getElementById('coinShadow');
const flipBtn = document.getElementById('flipBtn');
const resetBtn = document.getElementById('resetBtn');
const lastResultEl = document.getElementById('lastResult');
const flipCountEl = document.getElementById('flipCount');
const headsCountEl = document.getElementById('headsCount');
const tailsCountEl = document.getElementById('tailsCount');
const statusEl = document.getElementById('status');

const FLIP_TIME_MS = 1000;

let totalFlips = 0;
let headsTotal = 0;
let tailsTotal = 0;
let isFlipping = false;

function setStatus(message, tone = 'neutral') {
  statusEl.textContent = message;
  if (tone === 'success' || tone === 'error') {
    statusEl.dataset.tone = tone;
  } else {
    delete statusEl.dataset.tone;
  }
}

function setCoinFace(result) {
  const rx = result === 'H' ? 0 : 180;
  const ry = result === 'H' ? 0 : 0;

  coinDisc.style.setProperty('--rx', `${rx}deg`);
  coinDisc.style.setProperty('--ry', `${ry}deg`);
}

function updateStats(result) {
  totalFlips += 1;
  if (result === 'H') {
    headsTotal += 1;
  } else {
    tailsTotal += 1;
  }

  lastResultEl.textContent = result;
  flipCountEl.textContent = String(totalFlips);
  headsCountEl.textContent = String(headsTotal);
  tailsCountEl.textContent = String(tailsTotal);
}

function startFlippingVisuals() {
  coinDisc.classList.add('flipping');
  coinShadow.style.transform = 'translateY(114px) scale(0.92)';
  coinShadow.style.opacity = '0.65';
}

function stopFlippingVisuals() {
  coinDisc.classList.remove('flipping');
  coinShadow.style.transform = 'translateY(110px) scale(1)';
  coinShadow.style.opacity = '1';
}

function randomFlip() {
  return Math.random() < 0.5 ? 'H' : 'T';
}

function flipCoin() {
  if (isFlipping) {
    return;
  }

  isFlipping = true;
  flipBtn.disabled = true;
  resetBtn.disabled = true;

  setStatus('Coin is flipping...', 'success');
  startFlippingVisuals();

  const result = randomFlip();

  window.setTimeout(() => {
    stopFlippingVisuals();
    setCoinFace(result);
    updateStats(result);

    const resultText = result === 'H' ? 'Heads' : 'Tails';
    setStatus(`You flipped ${resultText}!`, 'success');

    flipBtn.disabled = false;
    resetBtn.disabled = false;
    isFlipping = false;
  }, FLIP_TIME_MS);
}

function resetGame() {
  if (isFlipping) {
    return;
  }

  totalFlips = 0;
  headsTotal = 0;
  tailsTotal = 0;
  lastResultEl.textContent = 'H';
  flipCountEl.textContent = '0';
  headsCountEl.textContent = '0';
  tailsCountEl.textContent = '0';
  setCoinFace('H');
  setStatus('Game reset. Tap Flip Coin to start.');
}

flipBtn.addEventListener('click', flipCoin);
resetBtn.addEventListener('click', resetGame);

setCoinFace('H');
setStatus('Tap Flip Coin to start.');
