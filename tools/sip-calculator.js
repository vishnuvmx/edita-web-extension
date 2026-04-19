const monthlyInvestmentInput = document.getElementById('monthlyInvestment');
const annualReturnInput = document.getElementById('annualReturn');
const investmentYearsInput = document.getElementById('investmentYears');
const calculateBtn = document.getElementById('calculateBtn');
const resetBtn = document.getElementById('resetBtn');
const investedAmountEl = document.getElementById('investedAmount');
const estimatedReturnsEl = document.getElementById('estimatedReturns');
const maturityValueEl = document.getElementById('maturityValue');
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

function calculateFutureValue(monthlyInvestment, annualReturn, years) {
  const months = Math.round(years * 12);
  const monthlyRate = annualReturn / 12 / 100;

  if (monthlyRate === 0) {
    return monthlyInvestment * months;
  }

  const compounded = (Math.pow(1 + monthlyRate, months) - 1) / monthlyRate;
  return monthlyInvestment * compounded * (1 + monthlyRate);
}

function updateResults() {
  const monthlyInvestment = parsePositiveNumber(monthlyInvestmentInput.value, 5000);
  const annualReturn = parsePositiveNumber(annualReturnInput.value, 12);
  const years = parsePositiveNumber(investmentYearsInput.value, 10);

  monthlyInvestmentInput.value = String(Math.round(monthlyInvestment));
  annualReturnInput.value = String(Number(annualReturn.toFixed(2)));
  investmentYearsInput.value = String(Math.round(years));

  const totalMonths = Math.round(years) * 12;
  const investedAmount = monthlyInvestment * totalMonths;
  const maturityValue = calculateFutureValue(monthlyInvestment, annualReturn, Math.round(years));
  const estimatedReturns = maturityValue - investedAmount;

  investedAmountEl.textContent = toCurrency(investedAmount);
  estimatedReturnsEl.textContent = toCurrency(Math.max(0, estimatedReturns));
  maturityValueEl.textContent = toCurrency(maturityValue);

  setStatus('SIP estimate updated.', 'success');
}

function resetCalculator() {
  monthlyInvestmentInput.value = '5000';
  annualReturnInput.value = '12';
  investmentYearsInput.value = '10';
  updateResults();
  setStatus('Defaults restored.', 'success');
}

calculateBtn.addEventListener('click', updateResults);
resetBtn.addEventListener('click', resetCalculator);

[monthlyInvestmentInput, annualReturnInput, investmentYearsInput].forEach((input) => {
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      updateResults();
    }
  });
});

updateResults();