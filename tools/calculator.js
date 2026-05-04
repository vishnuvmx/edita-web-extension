const expressionInput = document.getElementById('expressionInput');
const resultValue = document.getElementById('resultValue');
const resultMeta = document.getElementById('resultMeta');
const statusEl = document.getElementById('status');
const deleteBtn = document.getElementById('deleteBtn');
const clearBtn = document.getElementById('clearBtn');
const evaluateBtn = document.getElementById('evaluateBtn');
const tabButtons = Array.from(document.querySelectorAll('.tab-btn'));
const modeButtons = Array.from(document.querySelectorAll('.mode-btn'));
const exampleButtons = Array.from(document.querySelectorAll('[data-example]'));
const pads = {
  basic: document.getElementById('padBasic'),
  math: document.getElementById('padMath'),
  advanced: document.getElementById('padAdvanced'),
};
const padButtons = Array.from(document.querySelectorAll('.pad-btn'));

let lastAnswer = 0;
let angleMode = 'deg';

const MAX_EXPRESSION_LENGTH = 220;

function setStatus(message, tone = 'neutral') {
  statusEl.textContent = message;
  if (tone === 'success' || tone === 'error') {
    statusEl.dataset.tone = tone;
  } else {
    delete statusEl.dataset.tone;
  }
}

function formatResult(value) {
  if (!Number.isFinite(value)) {
    throw new Error('Result is not a finite number.');
  }

  if (Number.isInteger(value)) {
    return String(value);
  }

  return Number(value.toPrecision(12)).toString();
}

function toRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

function toDegrees(radians) {
  return (radians * 180) / Math.PI;
}

function applyAngleToInput(value) {
  return angleMode === 'deg' ? toRadians(value) : value;
}

function applyAngleToOutput(value) {
  return angleMode === 'deg' ? toDegrees(value) : value;
}

function factorial(number) {
  if (!Number.isFinite(number) || number < 0 || !Number.isInteger(number)) {
    throw new Error('Factorial needs a non-negative integer.');
  }

  let value = 1;
  for (let i = 2; i <= number; i += 1) {
    value *= i;
  }
  return value;
}

function combinations(n, r) {
  if (!Number.isInteger(n) || !Number.isInteger(r) || n < 0 || r < 0 || r > n) {
    throw new Error('nCr needs integers where n >= r >= 0.');
  }
  return factorial(n) / (factorial(r) * factorial(n - r));
}

function permutations(n, r) {
  if (!Number.isInteger(n) || !Number.isInteger(r) || n < 0 || r < 0 || r > n) {
    throw new Error('nPr needs integers where n >= r >= 0.');
  }
  return factorial(n) / factorial(n - r);
}

function gcd(...values) {
  if (!values.length) {
    throw new Error('gcd needs at least one value.');
  }

  const ints = values.map((value) => {
    if (!Number.isInteger(value)) {
      throw new Error('gcd works with integers only.');
    }
    return Math.abs(value);
  });

  return ints.reduce((accumulator, current) => {
    let a = accumulator;
    let b = current;
    while (b !== 0) {
      const temp = b;
      b = a % b;
      a = temp;
    }
    return a;
  });
}

function lcm(...values) {
  if (!values.length) {
    throw new Error('lcm needs at least one value.');
  }

  const ints = values.map((value) => {
    if (!Number.isInteger(value)) {
      throw new Error('lcm works with integers only.');
    }
    return Math.abs(value);
  });

  return ints.reduce((accumulator, current) => {
    if (accumulator === 0 || current === 0) {
      return 0;
    }
    return Math.abs((accumulator * current) / gcd(accumulator, current));
  });
}

function randomBetween(minValue = 0, maxValue = 1) {
  const min = Number(minValue);
  const max = Number(maxValue);
  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    throw new Error('rand needs valid numbers.');
  }
  if (max < min) {
    throw new Error('rand max value should be >= min value.');
  }
  return Math.random() * (max - min) + min;
}

function sanitizeExpression(expression) {
  const raw = expression.trim();
  if (!raw) {
    throw new Error('Enter an expression to calculate.');
  }

  if (raw.length > MAX_EXPRESSION_LENGTH) {
    throw new Error(`Expression is too long. Keep it under ${MAX_EXPRESSION_LENGTH} characters.`);
  }

  if (!/^[0-9+\-*/%^().,\sA-Za-z_]+$/.test(raw)) {
    throw new Error('Expression contains unsupported characters.');
  }

  return raw;
}

function tokenize(expression) {
  const tokens = [];
  let index = 0;

  while (index < expression.length) {
    const char = expression[index];

    if (/\s/.test(char)) {
      index += 1;
      continue;
    }

    if (/[0-9.]/.test(char)) {
      let value = char;
      let dotCount = char === '.' ? 1 : 0;
      index += 1;

      while (index < expression.length && /[0-9.]/.test(expression[index])) {
        if (expression[index] === '.') {
          dotCount += 1;
          if (dotCount > 1) {
            throw new Error('Invalid number format.');
          }
        }
        value += expression[index];
        index += 1;
      }

      if (value === '.') {
        throw new Error('Invalid number format.');
      }

      tokens.push({ type: 'number', value: Number(value) });
      continue;
    }

    if (/[A-Za-z_]/.test(char)) {
      let value = char;
      index += 1;
      while (index < expression.length && /[A-Za-z0-9_]/.test(expression[index])) {
        value += expression[index];
        index += 1;
      }
      tokens.push({ type: 'identifier', value });
      continue;
    }

    if ('+-*/%^(),'.includes(char)) {
      tokens.push({ type: 'symbol', value: char });
      index += 1;
      continue;
    }

    throw new Error('Expression contains unsupported characters.');
  }

  return tokens;
}

function evaluateExpression(expression) {
  const cleaned = sanitizeExpression(expression);
  const tokens = tokenize(cleaned);
  let position = 0;

  const constants = {
    pi: Math.PI,
    e: Math.E,
    ans: lastAnswer,
  };

  const functions = {
    sin: (args) => {
      ensureArgCount('sin', args, 1);
      return Math.sin(applyAngleToInput(args[0]));
    },
    cos: (args) => {
      ensureArgCount('cos', args, 1);
      return Math.cos(applyAngleToInput(args[0]));
    },
    tan: (args) => {
      ensureArgCount('tan', args, 1);
      return Math.tan(applyAngleToInput(args[0]));
    },
    asin: (args) => {
      ensureArgCount('asin', args, 1);
      return applyAngleToOutput(Math.asin(args[0]));
    },
    acos: (args) => {
      ensureArgCount('acos', args, 1);
      return applyAngleToOutput(Math.acos(args[0]));
    },
    atan: (args) => {
      ensureArgCount('atan', args, 1);
      return applyAngleToOutput(Math.atan(args[0]));
    },
    sqrt: (args) => {
      ensureArgCount('sqrt', args, 1);
      return Math.sqrt(args[0]);
    },
    cbrt: (args) => {
      ensureArgCount('cbrt', args, 1);
      return Math.cbrt(args[0]);
    },
    abs: (args) => {
      ensureArgCount('abs', args, 1);
      return Math.abs(args[0]);
    },
    floor: (args) => {
      ensureArgCount('floor', args, 1);
      return Math.floor(args[0]);
    },
    ceil: (args) => {
      ensureArgCount('ceil', args, 1);
      return Math.ceil(args[0]);
    },
    round: (args) => {
      ensureArgCount('round', args, 1);
      return Math.round(args[0]);
    },
    exp: (args) => {
      ensureArgCount('exp', args, 1);
      return Math.exp(args[0]);
    },
    ln: (args) => {
      ensureArgCount('ln', args, 1);
      return Math.log(args[0]);
    },
    log: (args) => {
      ensureArgCount('log', args, 1);
      return Math.log10(args[0]);
    },
    min: (args) => {
      ensureArgCountAtLeast('min', args, 1);
      return Math.min(...args);
    },
    max: (args) => {
      ensureArgCountAtLeast('max', args, 1);
      return Math.max(...args);
    },
    pow: (args) => {
      ensureArgCount('pow', args, 2);
      return Math.pow(args[0], args[1]);
    },
    fact: (args) => {
      ensureArgCount('fact', args, 1);
      return factorial(args[0]);
    },
    npr: (args) => {
      ensureArgCount('nPr', args, 2);
      return permutations(args[0], args[1]);
    },
    ncr: (args) => {
      ensureArgCount('nCr', args, 2);
      return combinations(args[0], args[1]);
    },
    gcd: (args) => {
      ensureArgCountAtLeast('gcd', args, 1);
      return gcd(...args);
    },
    lcm: (args) => {
      ensureArgCountAtLeast('lcm', args, 1);
      return lcm(...args);
    },
    rand: (args) => {
      if (args.length === 0) {
        return randomBetween();
      }
      if (args.length === 1) {
        return randomBetween(0, args[0]);
      }
      ensureArgCount('rand', args, 2);
      return randomBetween(args[0], args[1]);
    },
  };

  function ensureArgCount(name, args, expectedCount) {
    if (args.length !== expectedCount) {
      throw new Error(`${name} expects ${expectedCount} argument(s).`);
    }
  }

  function ensureArgCountAtLeast(name, args, minCount) {
    if (args.length < minCount) {
      throw new Error(`${name} expects at least ${minCount} argument(s).`);
    }
  }

  function current() {
    return tokens[position] || null;
  }

  function consumeSymbol(symbol) {
    const token = current();
    if (token && token.type === 'symbol' && token.value === symbol) {
      position += 1;
      return true;
    }
    return false;
  }

  function expectSymbol(symbol) {
    if (!consumeSymbol(symbol)) {
      throw new Error(`Expected '${symbol}'.`);
    }
  }

  function parseExpression() {
    return parseAddSub();
  }

  function parseAddSub() {
    let value = parseMulDiv();
    while (true) {
      if (consumeSymbol('+')) {
        value += parseMulDiv();
      } else if (consumeSymbol('-')) {
        value -= parseMulDiv();
      } else {
        break;
      }
    }
    return value;
  }

  function parseMulDiv() {
    let value = parsePower();
    while (true) {
      if (consumeSymbol('*')) {
        value *= parsePower();
      } else if (consumeSymbol('/')) {
        value /= parsePower();
      } else if (consumeSymbol('%')) {
        value %= parsePower();
      } else {
        break;
      }
    }
    return value;
  }

  function parsePower() {
    let value = parseUnary();
    if (consumeSymbol('^')) {
      value = Math.pow(value, parsePower());
    }
    return value;
  }

  function parseUnary() {
    if (consumeSymbol('+')) {
      return parseUnary();
    }
    if (consumeSymbol('-')) {
      return -parseUnary();
    }
    return parsePrimary();
  }

  function parseArguments() {
    const args = [];

    if (consumeSymbol(')')) {
      return args;
    }

    while (true) {
      args.push(parseExpression());
      if (consumeSymbol(')')) {
        break;
      }
      expectSymbol(',');
    }

    return args;
  }

  function parsePrimary() {
    const token = current();
    if (!token) {
      throw new Error('Unexpected end of expression.');
    }

    if (token.type === 'number') {
      position += 1;
      return token.value;
    }

    if (token.type === 'symbol' && token.value === '(') {
      position += 1;
      const value = parseExpression();
      expectSymbol(')');
      return value;
    }

    if (token.type === 'identifier') {
      position += 1;
      const name = token.value.toLowerCase();

      if (consumeSymbol('(')) {
        const args = parseArguments();
        const fn = functions[name];
        if (!fn) {
          throw new Error(`Unknown function '${token.value}'.`);
        }
        return fn(args);
      }

      if (Object.prototype.hasOwnProperty.call(constants, name)) {
        return constants[name];
      }

      throw new Error(`Unknown symbol '${token.value}'.`);
    }

    throw new Error('Invalid expression. Check syntax and parentheses.');
  }

  const value = parseExpression();
  if (position !== tokens.length) {
    throw new Error('Invalid expression. Check syntax and parentheses.');
  }

  if (!Number.isFinite(value) || Number.isNaN(value)) {
    throw new Error('Unable to calculate expression.');
  }

  return value;
}

function insertAtCursor(text) {
  const start = expressionInput.selectionStart ?? expressionInput.value.length;
  const end = expressionInput.selectionEnd ?? expressionInput.value.length;
  const previous = expressionInput.value;

  expressionInput.value = `${previous.slice(0, start)}${text}${previous.slice(end)}`;

  const nextPos = start + text.length;
  expressionInput.focus();
  expressionInput.setSelectionRange(nextPos, nextPos);
}

function removeAtCursor() {
  const start = expressionInput.selectionStart ?? expressionInput.value.length;
  const end = expressionInput.selectionEnd ?? expressionInput.value.length;

  if (start !== end) {
    const previous = expressionInput.value;
    expressionInput.value = `${previous.slice(0, start)}${previous.slice(end)}`;
    expressionInput.focus();
    expressionInput.setSelectionRange(start, start);
    return;
  }

  if (start === 0) {
    return;
  }

  const previous = expressionInput.value;
  const nextPos = start - 1;
  expressionInput.value = `${previous.slice(0, nextPos)}${previous.slice(end)}`;
  expressionInput.focus();
  expressionInput.setSelectionRange(nextPos, nextPos);
}

function switchTab(tabName) {
  tabButtons.forEach((button) => {
    const isCurrent = button.dataset.tab === tabName;
    button.dataset.active = isCurrent ? 'true' : 'false';
    button.setAttribute('aria-selected', isCurrent ? 'true' : 'false');
  });

  Object.entries(pads).forEach(([name, panel]) => {
    panel.dataset.active = name === tabName ? 'true' : 'false';
  });
}

function switchAngleMode(mode) {
  angleMode = mode === 'rad' ? 'rad' : 'deg';

  modeButtons.forEach((button) => {
    const isActive = button.dataset.mode === angleMode;
    button.dataset.active = isActive ? 'true' : 'false';
  });

  setStatus(`Angle mode set to ${angleMode.toUpperCase()}.`, 'success');
}

function updateResultMeta() {
  resultMeta.textContent = `Last answer: ${formatResult(lastAnswer)}`;
}

function calculate() {
  try {
    const value = evaluateExpression(expressionInput.value);
    const formatted = formatResult(value);
    resultValue.textContent = formatted;
    lastAnswer = value;
    updateResultMeta();
    setStatus('Calculated successfully. Use ans to reuse this result.', 'success');
  } catch (error) {
    setStatus(error.message || 'Calculation failed.', 'error');
  }
}

function clearAll() {
  expressionInput.value = '';
  resultValue.textContent = '0';
  setStatus('Cleared input. Last answer is still available as ans.');
  expressionInput.focus();
}

tabButtons.forEach((button) => {
  button.addEventListener('click', () => {
    switchTab(button.dataset.tab);
    if (button.dataset.tab === 'basic') {
      setStatus('Basic mode: numbers and arithmetic operators.', 'success');
    } else if (button.dataset.tab === 'math') {
      setStatus(`Math mode: trig uses ${angleMode.toUpperCase()} mode.`, 'success');
    } else {
      setStatus('Advanced mode: factorial, combinations, gcd/lcm, and rand.', 'success');
    }
  });
});

modeButtons.forEach((button) => {
  button.addEventListener('click', () => {
    switchAngleMode(button.dataset.mode);
  });
});

exampleButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const example = button.dataset.example;
    if (!example) {
      return;
    }
    expressionInput.value = example;
    expressionInput.focus();
    expressionInput.setSelectionRange(example.length, example.length);
    calculate();
  });
});

padButtons.forEach((button) => {
  button.addEventListener('click', () => {
    if (button.dataset.evaluate === 'true') {
      calculate();
      return;
    }

    if (button.dataset.backspace === 'true') {
      removeAtCursor();
      return;
    }

    const value = button.dataset.insert;
    if (typeof value === 'string') {
      insertAtCursor(value);
    }
  });
});

evaluateBtn.addEventListener('click', calculate);
clearBtn.addEventListener('click', clearAll);
deleteBtn.addEventListener('click', () => {
  removeAtCursor();
  expressionInput.focus();
});

expressionInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    calculate();
  }

  if (event.key === 'Escape') {
    event.preventDefault();
    clearAll();
  }
});

switchTab('basic');
switchAngleMode('deg');
updateResultMeta();
setStatus('Pick a mode, type an expression, then press Enter or Calculate.');
expressionInput.focus();
