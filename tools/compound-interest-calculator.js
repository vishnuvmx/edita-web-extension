const principalInput = document.getElementById('principal');
const rateInput = document.getElementById('rate');
const timeInput = document.getElementById('time');
const frequencyInput = document.getElementById('frequency');
const calculateBtn = document.getElementById('calculateBtn');
const resetBtn = document.getElementById('resetBtn');
const principalResultEl = document.getElementById('principal-result');
const interestResultEl = document.getElementById('interest-result');
const maturityResultEl = document.getElementById('maturity-result');
const statusEl = document.getElementById('status');

function setStatus(message, tone = 'neutral') {
  statusEl.textContent = message;
  if (tone === 'success' || tone === 'error') {
    statusEl.dataset.tone = tone;
  } else {
    delete statusEl.dataset.tone;
  }
}

function toCurrency(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
}

function parsePositiveNumber(rawValue, fallback) {
  const numeric = Number.parseFloat(rawValue);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return fallback;
  }
  return numeric;
}

function calculateCompoundInterest() {
  const principal = parsePositiveNumber(principalInput.value, 100000);
  const rate = parsePositiveNumber(rateInput.value, 8);
  const time = parsePositiveNumber(timeInput.value, 10);
  const frequency = parseInt(frequencyInput.value, 10);

  principalInput.value = String(Math.round(principal));
  rateInput.value = String(Number(rate.toFixed(2)));
  timeInput.value = String(Math.round(time));

  // A = P(1 + r/100n)^(nt)
  const amount = principal * Math.pow(1 + rate / 100 / frequency, frequency * time);
  const interest = amount - principal;

  principalResultEl.textContent = toCurrency(principal);
  interestResultEl.textContent = toCurrency(Math.max(0, interest));
  maturityResultEl.textContent = toCurrency(amount);

  setStatus('Compound interest calculated.', 'success');
}

function resetCalculator() {
  principalInput.value = '100000';
  rateInput.value = '8';
  timeInput.value = '10';
  frequencyInput.value = '12';
  calculateCompoundInterest();
  setStatus('Defaults restored.', 'success');
}

calculateBtn.addEventListener('click', calculateCompoundInterest);
resetBtn.addEventListener('click', resetCalculator);

[principalInput, rateInput, timeInput, frequencyInput].forEach((input) => {
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      calculateCompoundInterest();
    }
  });
});

calculateCompoundInterest();
