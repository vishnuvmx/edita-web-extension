const expressionInput = document.getElementById('expressionInput');
const pointInput = document.getElementById('pointInput');
const orderInput = document.getElementById('orderInput');
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

function firstDerivative(expression, point, epsilon) {
  const forward = evaluateAt(expression, point + epsilon);
  const backward = evaluateAt(expression, point - epsilon);
  return (forward - backward) / (2 * epsilon);
}

function secondDerivative(expression, point, epsilon) {
  const forward = evaluateAt(expression, point + epsilon);
  const center = evaluateAt(expression, point);
  const backward = evaluateAt(expression, point - epsilon);
  return (forward - (2 * center) + backward) / (epsilon * epsilon);
}

function nthDerivative(expression, point, order, epsilon) {
  if (order === 1) {
    return firstDerivative(expression, point, epsilon);
  }

  if (order === 2) {
    return secondDerivative(expression, point, epsilon);
  }

  const forward = nthDerivative(expression, point + epsilon, order - 1, epsilon);
  const backward = nthDerivative(expression, point - epsilon, order - 1, epsilon);
  return (forward - backward) / (2 * epsilon);
}

function derivativeLabel(order) {
  if (order === 2) {
    return "f''(x)";
  }

  if (order === 3) {
    return "f'''(x)";
  }

  return "f'(x)";
}

function updateResult(value, expression, point, order) {
  resultValue.textContent = formatMathValue(value);
  resultMeta.textContent = `${derivativeLabel(order)} for ${expression} at x = ${formatMathValue(point)}.`;
}

function calculateDerivative() {
  try {
    const expression = expressionInput.value.trim();
    const point = readNumber(pointInput, 'point');
    const order = Math.max(1, Math.min(3, Number.parseInt(orderInput.value, 10) || 1));
    const epsilon = 0.0001;

    const value = nthDerivative(expression, point, order, epsilon);
    updateResult(value, expression, point, order);
    setStatus('Derivative calculated successfully.', 'success');
  } catch (error) {
    resultValue.textContent = '-';
    resultMeta.textContent = 'No calculation yet.';
    setStatus(error.message || 'Unable to calculate the derivative.', 'error');
  }
}

function resetTool() {
  expressionInput.value = '';
  pointInput.value = '2';
  orderInput.value = '1';
  resultValue.textContent = '-';
  resultMeta.textContent = 'No calculation yet.';
  setStatus('Enter a function and point to estimate the derivative.');
}

computeBtn.addEventListener('click', calculateDerivative);
resetBtn.addEventListener('click', resetTool);
orderInput.addEventListener('change', calculateDerivative);

exampleButtons.forEach((button) => {
  button.addEventListener('click', () => {
    expressionInput.value = button.dataset.example || '';
    calculateDerivative();
  });
});

[expressionInput, pointInput, orderInput].forEach((input) => {
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      calculateDerivative();
    }
  });
});