const fdAmountInput = document.getElementById('fdAmount');
const fdRateInput = document.getElementById('fdRate');
const fdTenureInput = document.getElementById('fdTenure');
const fdFrequencyInput = document.getElementById('fdFrequency');
const calculateBtn = document.getElementById('calculateBtn');
const resetBtn = document.getElementById('resetBtn');
const fdPrincipalEl = document.getElementById('fdPrincipal');
const fdInterestEl = document.getElementById('fdInterest');
const fdMaturityEl = document.getElementById('fdMaturity');
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

function calculateFD() {
  const principal = parsePositiveNumber(fdAmountInput.value, 100000);
  const rate = parsePositiveNumber(fdRateInput.value, 6.5);
  const tenure = parsePositiveNumber(fdTenureInput.value, 3);
  const frequency = parseInt(fdFrequencyInput.value, 10);

  fdAmountInput.value = String(Math.round(principal));
  fdRateInput.value = String(Number(rate.toFixed(2)));
  fdTenureInput.value = String(Number(tenure.toFixed(2)));

  // A = P(1 + r/100n)^(nt)
  const amount = principal * Math.pow(1 + rate / 100 / frequency, frequency * tenure);
  const interest = amount - principal;

  fdPrincipalEl.textContent = toCurrency(principal);
  fdInterestEl.textContent = toCurrency(Math.max(0, interest));
  fdMaturityEl.textContent = toCurrency(amount);

  setStatus('FD calculation completed.', 'success');
}

function resetCalculator() {
  fdAmountInput.value = '100000';
  fdRateInput.value = '6.5';
  fdTenureInput.value = '3';
  fdFrequencyInput.value = '12';
  calculateFD();
  setStatus('Defaults restored.', 'success');
}

calculateBtn.addEventListener('click', calculateFD);
resetBtn.addEventListener('click', resetCalculator);

[fdAmountInput, fdRateInput, fdTenureInput, fdFrequencyInput].forEach((input) => {
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      calculateFD();
    }
  });
});

calculateFD();
