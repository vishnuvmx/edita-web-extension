const valueInput = document.getElementById('valueInput');
const baseInput = document.getElementById('baseInput');
const modeSelect = document.getElementById('modeSelect');
const computeBtn = document.getElementById('computeBtn');
const resetBtn = document.getElementById('resetBtn');
const resultValue = document.getElementById('resultValue');
const resultMeta = document.getElementById('resultMeta');
const resultNote = document.getElementById('resultNote');
const statusEl = document.getElementById('status');
const modeButtons = Array.from(document.querySelectorAll('.mode-btn'));

const { formatMathValue } = window.MathExpressionUtils;

function setStatus(message, tone = 'neutral') {
  statusEl.textContent = message;

  if (tone === 'success' || tone === 'error') {
    statusEl.dataset.tone = tone;
  } else {
    delete statusEl.dataset.tone;
  }
}

function readNumber(input, label) {
  const value = Number(input.value);
  if (!Number.isFinite(value)) {
    throw new Error(`Enter a valid ${label.toLowerCase()}.`);
  }
  return value;
}

function normalizeBase(baseValue) {
  if (baseValue === 'e') {
    return Math.E;
  }

  const base = Number(baseValue);
  if (!Number.isFinite(base)) {
    throw new Error('Enter a valid base.');
  }

  return base;
}

function syncMode(mode) {
  modeSelect.value = mode;

  const isCustom = mode === 'custom';
  baseInput.disabled = !isCustom;

  if (mode === 'natural') {
    baseInput.value = String(Math.E);
  } else if (mode === 'common') {
    baseInput.value = '10';
  }

  modeButtons.forEach((button) => {
    const baseValue = button.dataset.base;
    const isActive =
      (mode === 'natural' && baseValue === 'e') ||
      (mode === 'common' && baseValue === '10') ||
      (mode === 'custom' && baseValue === baseInput.value);

    button.dataset.active = isActive ? 'true' : 'false';
  });
}

function calculateLogarithm() {
  try {
    const value = readNumber(valueInput, 'value');
    const base = normalizeBase(baseInput.value);

    if (!(value > 0)) {
      throw new Error('Value must be greater than 0.');
    }

    if (!(base > 0) || base === 1) {
      throw new Error('Base must be greater than 0 and not equal to 1.');
    }

    const result = Math.log(value) / Math.log(base);
    resultValue.textContent = formatMathValue(result);
    resultMeta.textContent = `log base ${base === Math.E ? 'e' : formatMathValue(base)} of ${formatMathValue(value)}`;
    resultNote.textContent = `${formatMathValue(base)} ^ ${formatMathValue(result)} = ${formatMathValue(value)}.`;
    setStatus('Logarithm calculated successfully.', 'success');
  } catch (error) {
    resultValue.textContent = '-';
    resultMeta.textContent = 'No calculation yet.';
    resultNote.textContent = 'The result is shown as log base b of the selected value.';
    setStatus(error.message || 'Unable to calculate the logarithm.', 'error');
  }
}

function resetTool() {
  valueInput.value = '100';
  baseInput.value = '10';
  baseInput.disabled = false;
  modeSelect.value = 'custom';
  resultValue.textContent = '-';
  resultMeta.textContent = 'No calculation yet.';
  resultNote.textContent = 'The result is shown as log base b of the selected value.';
  setStatus('Enter a value and base to calculate a logarithm.');
  syncMode('custom');
}

computeBtn.addEventListener('click', calculateLogarithm);
resetBtn.addEventListener('click', resetTool);

modeSelect.addEventListener('change', () => {
  syncMode(modeSelect.value);
  calculateLogarithm();
});

modeButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const baseValue = button.dataset.base;

    if (baseValue === 'e') {
      syncMode('natural');
    } else if (baseValue === '10') {
      syncMode('common');
    } else {
      syncMode('custom');
      baseInput.value = baseValue || '10';
    }

    calculateLogarithm();
  });
});

[valueInput, baseInput].forEach((input) => {
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      calculateLogarithm();
    }
  });
});

syncMode('custom');
calculateLogarithm();
