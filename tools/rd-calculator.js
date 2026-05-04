const rdMonthlyInput = document.getElementById('rdMonthly');
const rdRateInput = document.getElementById('rdRate');
const rdMonthsInput = document.getElementById('rdMonths');
const calculateBtn = document.getElementById('calculateBtn');
const resetBtn = document.getElementById('resetBtn');
const rdInvestedEl = document.getElementById('rdInvested');
const rdInterestEl = document.getElementById('rdInterest');
const rdMaturityEl = document.getElementById('rdMaturity');
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

function calculateRD() {
  const monthly = parsePositiveNumber(rdMonthlyInput.value, 5000);
  const rate = parsePositiveNumber(rdRateInput.value, 6);
  const months = parsePositiveNumber(rdMonthsInput.value, 60);

  rdMonthlyInput.value = String(Math.round(monthly));
  rdRateInput.value = String(Number(rate.toFixed(2)));
  rdMonthsInput.value = String(Math.round(months));

  const monthlyRate = rate / 100 / 12;
  const totalInvested = monthly * months;

  // RD formula: M = R * [((1 + r)^n - 1) / r] * (1 + r)
  let maturityValue;
  if (monthlyRate === 0) {
    maturityValue = totalInvested;
  } else {
    maturityValue =
      monthly * (((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate));
  }

  const interest = maturityValue - totalInvested;

  rdInvestedEl.textContent = toCurrency(totalInvested);
  rdInterestEl.textContent = toCurrency(Math.max(0, interest));
  rdMaturityEl.textContent = toCurrency(maturityValue);

  setStatus('RD calculation completed.', 'success');
}

function resetCalculator() {
  rdMonthlyInput.value = '5000';
  rdRateInput.value = '6';
  rdMonthsInput.value = '60';
  calculateRD();
  setStatus('Defaults restored.', 'success');
}

calculateBtn.addEventListener('click', calculateRD);
resetBtn.addEventListener('click', resetCalculator);

[rdMonthlyInput, rdRateInput, rdMonthsInput].forEach((input) => {
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      calculateRD();
    }
  });
});

calculateRD();
