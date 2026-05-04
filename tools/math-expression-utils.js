(function initMathExpressionUtils(global) {
  if (global.MathExpressionUtils) {
    return;
  }

  const MAX_EXPRESSION_LENGTH = 240;
  const ALLOWED_PATTERN = /^[0-9+\-*/%^().,\sA-Za-z_]+$/;

  function sanitizeExpression(expression) {
    const cleaned = String(expression ?? '').trim();

    if (!cleaned) {
      throw new Error('Enter a function first.');
    }

    if (cleaned.length > MAX_EXPRESSION_LENGTH) {
      throw new Error(`Expression is too long. Keep it under ${MAX_EXPRESSION_LENGTH} characters.`);
    }

    if (!ALLOWED_PATTERN.test(cleaned)) {
      throw new Error('Expression contains unsupported characters.');
    }

    return cleaned;
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

  function evaluateMathExpression(expression, xValue = 0) {
    const cleaned = sanitizeExpression(expression);
    const tokens = tokenize(cleaned);
    let position = 0;

    const log10 = Math.log10 ? Math.log10 : (value) => Math.log(value) / Math.LN10;

    const constants = {
      x: xValue,
      pi: Math.PI,
      e: Math.E,
    };

    const functions = {
      sin: (args) => {
        ensureArgCount('sin', args, 1);
        return Math.sin(args[0]);
      },
      cos: (args) => {
        ensureArgCount('cos', args, 1);
        return Math.cos(args[0]);
      },
      tan: (args) => {
        ensureArgCount('tan', args, 1);
        return Math.tan(args[0]);
      },
      asin: (args) => {
        ensureArgCount('asin', args, 1);
        return Math.asin(args[0]);
      },
      acos: (args) => {
        ensureArgCount('acos', args, 1);
        return Math.acos(args[0]);
      },
      atan: (args) => {
        ensureArgCount('atan', args, 1);
        return Math.atan(args[0]);
      },
      sinh: (args) => {
        ensureArgCount('sinh', args, 1);
        return Math.sinh(args[0]);
      },
      cosh: (args) => {
        ensureArgCount('cosh', args, 1);
        return Math.cosh(args[0]);
      },
      tanh: (args) => {
        ensureArgCount('tanh', args, 1);
        return Math.tanh(args[0]);
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
        return log10(args[0]);
      },
      log10: (args) => {
        ensureArgCount('log10', args, 1);
        return log10(args[0]);
      },
      pow: (args) => {
        ensureArgCount('pow', args, 2);
        return Math.pow(args[0], args[1]);
      },
      min: (args) => {
        ensureArgCountAtLeast('min', args, 1);
        return Math.min(...args);
      },
      max: (args) => {
        ensureArgCountAtLeast('max', args, 1);
        return Math.max(...args);
      },
      sign: (args) => {
        ensureArgCount('sign', args, 1);
        return Math.sign(args[0]);
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
      throw new Error('The result is not a finite number.');
    }

    return value;
  }

  function formatMathValue(value) {
    if (!Number.isFinite(value)) {
      throw new Error('The result is not a finite number.');
    }

    if (Number.isInteger(value)) {
      return String(value);
    }

    return Number(value.toPrecision(12)).toString();
  }

  global.MathExpressionUtils = {
    evaluateMathExpression,
    formatMathValue,
  };
})(window);
