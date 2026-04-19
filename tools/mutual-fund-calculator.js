const mfInvestmentInput = document.getElementById('mfInvestment');
const mfReturnInput = document.getElementById('mfReturn');
const mfYearsInput = document.getElementById('mfYears');
const calculateBtn = document.getElementById('calculateBtn');
const resetBtn = document.getElementById('resetBtn');
const mfInvestedEl = document.getElementById('mfInvested');
const mfGainEl = document.getElementById('mfGain');
const mfFinalEl = document.getElementById('mfFinal');
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
    maximumFractionDigits: 0
  }).format(value);
}

function parsePositiveNumber(rawValue, fallback) {
  const numeric = Number.parseFloat(rawValue);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return fallback;
  }
  return numeric;
}

function calculateMF() {
  const investment = parsePositiveNumber(mfInvestmentInput.value, 10000);
  const annualReturn = parsePositiveNumber(mfReturnInput.value, 15);
  const years = parsePositiveNumber(mfYearsInput.value, 10);

  mfInvestmentInput.value = String(Math.round(investment));
  mfReturnInput.value = String(Number(annualReturn.toFixed(2)));
  mfYearsInput.value = String(Math.round(years));

  const months = Math.round(years * 12);
  const monthlyRate = annualReturn / 12 / 100;
  const totalInvested = investment * months;

  // FV of SIP formula: M = R * [((1 + r)^n - 1) / r] * (1 + r)
  let finalValue;
  if (monthlyRate === 0) {
    finalValue = totalInvested;
  } else {
    finalValue = investment * (((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate));
  }

  const gains = finalValue - totalInvested;

  mfInvestedEl.textContent = toCurrency(totalInvested);
  mfGainEl.textContent = toCurrency(Math.max(0, gains));
  mfFinalEl.textContent = toCurrency(finalValue);

  setStatus('Mutual fund returns calculated.', 'success');
}

function resetCalculator() {
  mfInvestmentInput.value = '10000';
  mfReturnInput.value = '15';
  mfYearsInput.value = '10';
  calculateMF();
  setStatus('Defaults restored.', 'success');
}

calculateBtn.addEventListener('click', calculateMF);
resetBtn.addEventListener('click', resetCalculator);

[mfInvestmentInput, mfReturnInput, mfYearsInput].forEach((input) => {
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      calculateMF();
    }
  });
});

calculateMF();
