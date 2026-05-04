const ppfAnnualInput = document.getElementById('ppfAnnual');
const ppfRateInput = document.getElementById('ppfRate');
const ppfYearsInput = document.getElementById('ppfYears');
const calculateBtn = document.getElementById('calculateBtn');
const resetBtn = document.getElementById('resetBtn');
const ppfInvestedEl = document.getElementById('ppfInvested');
const ppfInterestEl = document.getElementById('ppfInterest');
const ppfMaturityEl = document.getElementById('ppfMaturity');
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

function calculatePPF() {
  const annual = parsePositiveNumber(ppfAnnualInput.value, 150000);
  const rate = parsePositiveNumber(ppfRateInput.value, 7.1);
  const years = parsePositiveNumber(ppfYearsInput.value, 15);

  ppfAnnualInput.value = String(Math.round(annual));
  ppfRateInput.value = String(Number(rate.toFixed(2)));
  ppfYearsInput.value = String(Math.round(years));

  const totalInvested = annual * years;

  // PPF formula: A = P * [((1 + r)^n - 1) / r] * (1 + r)
  const rate_decimal = rate / 100;
  const maturityValue =
    annual * (((Math.pow(1 + rate_decimal, years) - 1) / rate_decimal) * (1 + rate_decimal));
  const interest = maturityValue - totalInvested;

  ppfInvestedEl.textContent = toCurrency(totalInvested);
  ppfInterestEl.textContent = toCurrency(Math.max(0, interest));
  ppfMaturityEl.textContent = toCurrency(maturityValue);

  setStatus('PPF calculation completed.', 'success');
}

function resetCalculator() {
  ppfAnnualInput.value = '150000';
  ppfRateInput.value = '7.1';
  ppfYearsInput.value = '15';
  calculatePPF();
  setStatus('Defaults restored.', 'success');
}

calculateBtn.addEventListener('click', calculatePPF);
resetBtn.addEventListener('click', resetCalculator);

[ppfAnnualInput, ppfRateInput, ppfYearsInput].forEach((input) => {
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      calculatePPF();
    }
  });
});

calculatePPF();
