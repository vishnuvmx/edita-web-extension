const expressionInput = document.getElementById('expressionInput');
const lowerLimitInput = document.getElementById('lowerLimitInput');
const upperLimitInput = document.getElementById('upperLimitInput');
const stepsInput = document.getElementById('stepsInput');
const computeBtn = document.getElementById('computeBtn');
const resetBtn = document.getElementById('resetBtn');
const resultValue = document.getElementById('resultValue');
const resultMeta = document.getElementById('resultMeta');
const statusEl = document.getElementById('status');
const exampleButtons = Array.from(document.querySelectorAll('[data-example]'));

const { evaluateMathExpression, formatMathValue } = window.MathExpressionUtils;

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

function evaluateAt(expression, xValue) {
  return evaluateMathExpression(expression, xValue);
}

function integrateFunction(expression, lowerLimit, upperLimit, steps) {
  const direction = upperLimit >= lowerLimit ? 1 : -1;
  const start = direction === 1 ? lowerLimit : upperLimit;
  const end = direction === 1 ? upperLimit : lowerLimit;
  let segments = Math.max(2, Math.trunc(Math.abs(steps)));

  if (segments % 2 !== 0) {
    segments += 1;
  }

  const stepWidth = (end - start) / segments;
  let sum = evaluateAt(expression, start) + evaluateAt(expression, end);

  for (let index = 1; index < segments; index += 1) {
    const xValue = start + stepWidth * index;
    const factor = index % 2 === 0 ? 2 : 4;
    sum += factor * evaluateAt(expression, xValue);
  }

  return (direction * sum * stepWidth) / 3;
}

function updateResult(value, expression, lowerLimit, upperLimit, steps) {
  const formatted = formatMathValue(value);
  resultValue.textContent = formatted;
  resultMeta.textContent = `∫ ${expression} dx from ${formatMathValue(lowerLimit)} to ${formatMathValue(upperLimit)} with ${steps} Simpson steps.`;
}

function calculateIntegral() {
  try {
    const expression = expressionInput.value.trim();
    const lowerLimit = readNumber(lowerLimitInput, 'lower limit');
    const upperLimit = readNumber(upperLimitInput, 'upper limit');
    const steps = readNumber(stepsInput, 'steps');

    if (steps < 2) {
      throw new Error('Use at least 2 steps.');
    }

    const value = integrateFunction(expression, lowerLimit, upperLimit, steps);
    updateResult(value, expression, lowerLimit, upperLimit, Math.max(2, Math.trunc(Math.abs(steps))));
    setStatus('Integral calculated successfully.', 'success');
  } catch (error) {
    resultValue.textContent = '-';
    resultMeta.textContent = 'No calculation yet.';
    setStatus(error.message || 'Unable to calculate the integral.', 'error');
  }
}

function resetTool() {
  expressionInput.value = '';
  lowerLimitInput.value = '0';
  upperLimitInput.value = '3';
  stepsInput.value = '600';
  resultValue.textContent = '-';
  resultMeta.textContent = 'No calculation yet.';
  setStatus('Enter a function and limits to get the area under the curve.');
}

computeBtn.addEventListener('click', calculateIntegral);
resetBtn.addEventListener('click', resetTool);

exampleButtons.forEach((button) => {
  button.addEventListener('click', () => {
    expressionInput.value = button.dataset.example || '';
    calculateIntegral();
  });
});

[expressionInput, lowerLimitInput, upperLimitInput, stepsInput].forEach((input) => {
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      calculateIntegral();
    }
  });
});