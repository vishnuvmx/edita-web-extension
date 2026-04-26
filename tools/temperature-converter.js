const valueInput = document.getElementById('valueInput');
const fromUnit = document.getElementById('fromUnit');
const toUnit = document.getElementById('toUnit');
const convertBtn = document.getElementById('convertBtn');
const swapBtn = document.getElementById('swapBtn');
const copyBtn = document.getElementById('copyBtn');
const resetBtn = document.getElementById('resetBtn');
const primaryOutput = document.getElementById('primaryOutput');
const resultMeta = document.getElementById('resultMeta');
const celsiusValue = document.getElementById('celsiusValue');
const fahrenheitValue = document.getElementById('fahrenheitValue');
const kelvinValue = document.getElementById('kelvinValue');
const rankineValue = document.getElementById('rankineValue');
const statusEl = document.getElementById('status');

const UNITS = [
  { value: 'c', label: 'Celsius (°C)' },
  { value: 'f', label: 'Fahrenheit (°F)' },
  { value: 'k', label: 'Kelvin (K)' },
  { value: 'r', label: 'Rankine (°R)' }
];

function setStatus(message, tone = 'neutral') {
  statusEl.textContent = message;
  if (tone === 'success' || tone === 'error') {
    statusEl.dataset.tone = tone;
  } else {
    delete statusEl.dataset.tone;
  }
}

function formatNumber(value) {
  if (!Number.isFinite(value)) {
    return '-';
  }
  const text = value.toFixed(4);
  return text.replace(/\.0+$/, '').replace(/(\.\d*?[1-9])0+$/, '$1');
}

function toKelvin(value, unit) {
  switch (unit) {
    case 'c': return value + 273.15;
    case 'f': return (value + 459.67) * (5 / 9);
    case 'r': return value * (5 / 9);
    default: return value;
  }
}

function fromKelvin(value, unit) {
  switch (unit) {
    case 'c': return value - 273.15;
    case 'f': return value * (9 / 5) - 459.67;
    case 'r': return value * (9 / 5);
    default: return value;
  }
}

function populateUnits() {
  fromUnit.innerHTML = '';
  toUnit.innerHTML = '';
  UNITS.forEach((unit) => {
    const fromOption = document.createElement('option');
    fromOption.value = unit.value;
    fromOption.textContent = unit.label;
    fromUnit.appendChild(fromOption);

    const toOption = document.createElement('option');
    toOption.value = unit.value;
    toOption.textContent = unit.label;
    toUnit.appendChild(toOption);
  });
  fromUnit.value = 'c';
  toUnit.value = 'f';
}

function convertTemperature() {
  const rawValue = valueInput.value.trim();
  if (!rawValue) {
    primaryOutput.textContent = '-';
    resultMeta.textContent = 'Enter a value to convert.';
    celsiusValue.textContent = '-';
    fahrenheitValue.textContent = '-';
    kelvinValue.textContent = '-';
    rankineValue.textContent = '-';
    setStatus('Enter a temperature to convert.');
    return;
  }

  const numericValue = Number(rawValue);
  if (!Number.isFinite(numericValue)) {
    primaryOutput.textContent = '-';
    resultMeta.textContent = 'Value is not a valid number.';
    setStatus('Enter a valid number.', 'error');
    return;
  }

  const kelvin = toKelvin(numericValue, fromUnit.value);
  const converted = fromKelvin(kelvin, toUnit.value);

  primaryOutput.textContent = `${formatNumber(converted)} ${toUnit.value === 'c' ? '°C' : toUnit.value === 'f' ? '°F' : toUnit.value === 'r' ? '°R' : 'K'}`;
  resultMeta.textContent = `${UNITS.find((unit) => unit.value === fromUnit.value)?.label || 'Input'} to ${UNITS.find((unit) => unit.value === toUnit.value)?.label || 'Output'}`;
  celsiusValue.textContent = `${formatNumber(fromKelvin(kelvin, 'c'))} °C`;
  fahrenheitValue.textContent = `${formatNumber(fromKelvin(kelvin, 'f'))} °F`;
  kelvinValue.textContent = `${formatNumber(kelvin)} K`;
  rankineValue.textContent = `${formatNumber(fromKelvin(kelvin, 'r'))} °R`;
  setStatus('Temperature converted successfully.', 'success');
}

async function copyResult() {
  const output = primaryOutput.textContent.trim();
  if (!output || output === '-') {
    setStatus('Convert a temperature first.', 'error');
    return;
  }

  try {
    await navigator.clipboard.writeText(output);
    setStatus('Result copied to clipboard.', 'success');
  } catch {
    setStatus('Press Ctrl+C to copy the result.', 'error');
  }
}

function swapUnits() {
  const currentFrom = fromUnit.value;
  fromUnit.value = toUnit.value;
  toUnit.value = currentFrom;
  convertTemperature();
}

function resetConverter() {
  valueInput.value = '';
  fromUnit.value = 'c';
  toUnit.value = 'f';
  convertTemperature();
}

populateUnits();
convertBtn.addEventListener('click', convertTemperature);
swapBtn.addEventListener('click', swapUnits);
copyBtn.addEventListener('click', copyResult);
resetBtn.addEventListener('click', resetConverter);
valueInput.addEventListener('input', convertTemperature);
fromUnit.addEventListener('change', convertTemperature);
toUnit.addEventListener('change', convertTemperature);
setStatus('Choose units and enter a temperature to convert.');