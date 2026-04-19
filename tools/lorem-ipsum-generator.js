const loremSentences = [
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
  'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
  'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
  'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
  'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
  'Curabitur pretium tincidunt lacus, nulla gravida orci a odio.',
  'Nullam varius, turpis et commodo pharetra, est eros bibendum elit, nec luctus magna felis sollicitudin mauris.',
  'Integer in mauris eu nibh euismod gravida.'
];
const loremWords = loremSentences
  .join(' ')
  .replace(/[^a-zA-Z\s]/g, '')
  .toLowerCase()
  .split(/\s+/)
  .filter(Boolean);
const generateBtn = document.getElementById('generateBtn');
const clearBtn = document.getElementById('clearBtn');
const copyBtn = document.getElementById('copyBtn');
const dropdownWrappers = Array.from(document.querySelectorAll('.base-select-wrap'));

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
    valueEl.textContent = selectedOption ? selectedOption.textContent : select.value;
  }

  options.forEach((option) => {
    const isSelected = option.dataset.value === select.value;
    option.dataset.selected = isSelected ? 'true' : 'false';
    option.setAttribute('aria-selected', isSelected ? 'true' : 'false');
  });
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

function normalizeCount(value, fallback = 5) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }
  return parsed;
}

function cycleTake(list, count, start = 0) {
  const result = [];
  for (let i = 0; i < count; i += 1) {
    result.push(list[(start + i) % list.length]);
  }
  return result;
}

function generateLorem() {
  const type = document.getElementById('loremType').value;
  const count = normalizeCount(document.getElementById('loremCount').value, 5);
  const loremOutput = document.getElementById('loremOutput');

  if (type === 'words') {
    const words = cycleTake(loremWords, count);
    loremOutput.value = words.join(' ');
  } else if (type === 'sentences') {
    const sentences = cycleTake(loremSentences, count);
    loremOutput.value = sentences.join(' ');
  } else if (type === 'paragraphs') {
    const paragraphs = [];
    const sentencesPerParagraph = 4;

    for (let p = 0; p < count; p += 1) {
      const startIndex = (p * sentencesPerParagraph) % loremSentences.length;
      const paragraphSentences = cycleTake(loremSentences, sentencesPerParagraph, startIndex);
      paragraphs.push(paragraphSentences.join(' '));
    }

    loremOutput.value = paragraphs.join('\n\n');
  }
}

function copyOutput() {
  const loremOutput = document.getElementById('loremOutput');
  navigator.clipboard.writeText(loremOutput.value).then(() => {
    alert('Output copied to clipboard!');
  });
}

function clearOutput() {
  document.getElementById('loremOutput').value = '';
}

generateBtn.addEventListener('click', generateLorem);
clearBtn.addEventListener('click', clearOutput);
copyBtn.addEventListener('click', copyOutput);

initCustomDropdowns();
