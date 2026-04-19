const valueInput = document.getElementById('valueInput');
const inputBase = document.getElementById('inputBase');
const outputBase = document.getElementById('outputBase');
const convertBtn = document.getElementById('convertBtn');
const swapBtn = document.getElementById('swapBtn');
const copyBtn = document.getElementById('copyBtn');
const resetBtn = document.getElementById('resetBtn');
const primaryOutput = document.getElementById('primaryOutput');
const binaryOutput = document.getElementById('binaryOutput');
const decimalOutput = document.getElementById('decimalOutput');
const hexOutput = document.getElementById('hexOutput');
const octalOutput = document.getElementById('octalOutput');
const statusEl = document.getElementById('status');
const dropdownWrappers = Array.from(document.querySelectorAll('.base-select-wrap'));

const BASE_LABELS = {
  2: 'Binary',
  8: 'Octal',
  10: 'Decimal',
  16: 'Hexadecimal'
};

function setStatus(message, tone = 'neutral') {
  statusEl.textContent = message;
  if (tone === 'success' || tone === 'error') {
    statusEl.dataset.tone = tone;
  } else {
    delete statusEl.dataset.tone;
  }
}

function cleanInput(value) {
  return value.trim().replace(/[_\s]/g, '');
}

function normalizeBase(value) {
  const base = Number.parseInt(value, 10);
  return [2, 8, 10, 16].includes(base) ? base : 10;
}

function parseBaseValue(value, base) {
  const cleaned = cleanInput(value).toLowerCase();
  if (!cleaned) {
    throw new Error('Enter a value to convert.');
  }

  let sign = 1n;
  let digits = cleaned;
  if (digits.startsWith('-')) {
    sign = -1n;
    digits = digits.slice(1);
  } else if (digits.startsWith('+')) {
    digits = digits.slice(1);
  }

  if (!digits) {
    throw new Error('Enter a valid number.');
  }

  const prefixes = {
    2: /^0b/i,
    8: /^0o/i,
    10: /^0d/i,
    16: /^0x/i
  };

  digits = digits.replace(prefixes[base], '');
  if (!digits) {
    throw new Error('Enter a valid number.');
  }

  const validDigits = {
    2: /^[01]+$/,
    8: /^[0-7]+$/,
    10: /^[0-9]+$/,
    16: /^[0-9a-f]+$/
  };

  if (!validDigits[base].test(digits)) {
    throw new Error(`Invalid ${BASE_LABELS[base].toLowerCase()} value.`);
  }

  let result = 0n;
  const bigBase = BigInt(base);

  for (const char of digits) {
    const digit = BigInt(parseInt(char, base));
    result = result * bigBase + digit;
  }

  return result * sign;
}

function formatBase(value, base) {
  const absolute = value < 0n ? -value : value;
  const text = absolute.toString(base);
  return value < 0n ? `-${text}` : text;
}

function formatHex(value) {
  return formatBase(value, 16).toUpperCase();
}

function renderAllBases(value) {
  binaryOutput.textContent = `${formatBase(value, 2)}₂`;
  decimalOutput.textContent = formatBase(value, 10);
  hexOutput.textContent = `${formatHex(value)}₁₆`;
  octalOutput.textContent = `${formatBase(value, 8)}₈`;
}

function closeAllDropdowns() {
  dropdownWrappers.forEach((wrapper) => {
    const trigger = wrapper.querySelector('.base-select-trigger');
    wrapper.dataset.open = 'false';
    if (trigger) {
      trigger.setAttribute('aria-expanded', 'false');
    }
  });
}

function syncDropdownUI(wrapper) {
  const select = wrapper.querySelector('select');
  const valueEl = wrapper.querySelector('.base-select-value');
  const options = wrapper.querySelectorAll('.base-select-option');
  const selectedOption = options.length
    ? Array.from(options).find((option) => option.dataset.value === select.value)
    : null;

  if (valueEl) {
    valueEl.textContent = selectedOption ? selectedOption.textContent : BASE_LABELS[normalizeBase(select.value)];
  }

  options.forEach((option) => {
    const isSelected = option.dataset.value === select.value;
    option.dataset.selected = isSelected ? 'true' : 'false';
    option.setAttribute('aria-selected', isSelected ? 'true' : 'false');
  });
}

function syncAllDropdownUIs() {
  dropdownWrappers.forEach(syncDropdownUI);
}

function initCustomDropdowns() {
  dropdownWrappers.forEach((wrapper) => {
    const select = wrapper.querySelector('select');
    const trigger = wrapper.querySelector('.base-select-trigger');
    const options = wrapper.querySelectorAll('.base-select-option');

    if (!select || !trigger || !options.length) {
      return;
    }

    wrapper.dataset.open = 'false';
    syncDropdownUI(wrapper);

    trigger.addEventListener('click', (event) => {
      event.preventDefault();
      const shouldOpen = wrapper.dataset.open !== 'true';
      closeAllDropdowns();
      if (shouldOpen) {
        wrapper.dataset.open = 'true';
        trigger.setAttribute('aria-expanded', 'true');
      }
    });

    trigger.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        const shouldOpen = wrapper.dataset.open !== 'true';
        closeAllDropdowns();
        if (shouldOpen) {
          wrapper.dataset.open = 'true';
          trigger.setAttribute('aria-expanded', 'true');
        }
      }

      if (event.key === 'Escape') {
        closeAllDropdowns();
      }
    });

    options.forEach((option) => {
      option.addEventListener('click', () => {
        const nextValue = option.dataset.value;
        if (!nextValue || select.value === nextValue) {
          closeAllDropdowns();
          return;
        }

        select.value = nextValue;
        syncDropdownUI(wrapper);
        closeAllDropdowns();
        select.dispatchEvent(new Event('change', { bubbles: true }));
      });
    });
  });

  document.addEventListener('click', (event) => {
    const clickedInsideDropdown = dropdownWrappers.some((wrapper) => wrapper.contains(event.target));
    if (!clickedInsideDropdown) {
      closeAllDropdowns();
    }
  });
}

function convertValue() {
  try {
    const fromBase = normalizeBase(inputBase.value);
    const toBase = normalizeBase(outputBase.value);
    const parsed = parseBaseValue(valueInput.value, fromBase);
    const converted = formatBase(parsed, toBase);

    primaryOutput.textContent = toBase === 16 ? formatHex(parsed) : converted;

    renderAllBases(parsed);
    setStatus(`Converted ${BASE_LABELS[fromBase]} to ${BASE_LABELS[toBase]}.`, 'success');
  } catch (error) {
    primaryOutput.textContent = '-';
    binaryOutput.textContent = '-';
    decimalOutput.textContent = '-';
    hexOutput.textContent = '-';
    octalOutput.textContent = '-';
    setStatus(error.message || 'Unable to convert value.', 'error');
  }
}

async function copyResult() {
  const text = primaryOutput.textContent.trim();
  if (!text || text === '-') {
    setStatus('Convert a value first.', 'error');
    return;
  }

  try {
    await navigator.clipboard.writeText(text);
    setStatus('Result copied to clipboard.', 'success');
  } catch {
    primaryOutput.focus();
    setStatus('Press Ctrl+C to copy.', 'error');
  }
}

function swapBases() {
  const currentInput = inputBase.value;
  inputBase.value = outputBase.value;
  outputBase.value = currentInput;
  syncAllDropdownUIs();
  convertValue();
}

function resetConverter() {
  valueInput.value = '';
  inputBase.value = '10';
  outputBase.value = '16';
  primaryOutput.textContent = '-';
  binaryOutput.textContent = '-';
  decimalOutput.textContent = '-';
  hexOutput.textContent = '-';
  octalOutput.textContent = '-';
  syncAllDropdownUIs();
  setStatus('Enter a value and convert between bases.');
}

convertBtn.addEventListener('click', convertValue);
swapBtn.addEventListener('click', swapBases);
copyBtn.addEventListener('click', copyResult);
resetBtn.addEventListener('click', resetConverter);

valueInput.addEventListener('input', convertValue);
inputBase.addEventListener('change', () => {
  syncAllDropdownUIs();
  convertValue();
});
outputBase.addEventListener('change', () => {
  syncAllDropdownUIs();
  convertValue();
});

valueInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    convertValue();
  }
});

initCustomDropdowns();
resetConverter();