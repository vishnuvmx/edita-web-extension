const patternInput = document.getElementById('patternInput');
const sampleInput = document.getElementById('sampleInput');
const testBtn = document.getElementById('testBtn');
const copyBtn = document.getElementById('copyBtn');
const clearBtn = document.getElementById('clearBtn');
const fillExampleBtn = document.getElementById('fillExampleBtn');
const summaryEl = document.getElementById('summary');
const resultsEl = document.getElementById('results');
const statusEl = document.getElementById('status');

let lastMatches = [];

function setStatus(message, tone = 'neutral') {
  statusEl.textContent = message;
  if (tone === 'success' || tone === 'error') {
    statusEl.dataset.tone = tone;
  } else {
    delete statusEl.dataset.tone;
  }
}

function getFlags() {
  return Array.from(document.querySelectorAll('.flag-chip input:checked'))
    .map((checkbox) => checkbox.value)
    .join('');
}

function collectMatches(regex, text) {
  const matches = [];
  if (regex.global || regex.sticky) {
    const loopRegex = new RegExp(regex.source, regex.flags);
    let match;
    while ((match = loopRegex.exec(text)) !== null) {
      matches.push(match);
      if (match[0] === '') {
        loopRegex.lastIndex += 1;
      }
    }
    return matches;
  }

  const match = regex.exec(text);
  if (match) {
    matches.push(match);
  }
  return matches;
}

function clearResults(message = 'Enter a pattern to start testing.') {
  summaryEl.innerHTML = message;
  resultsEl.innerHTML = '';
  lastMatches = [];
}

function renderMatch(match, index) {
  const card = document.createElement('div');
  card.className = 'match-card';

  const head = document.createElement('div');
  head.className = 'match-head';

  const title = document.createElement('div');
  title.className = 'match-title';
  title.textContent = `Match ${index + 1}`;

  const meta = document.createElement('div');
  meta.className = 'match-index';
  meta.textContent = `Index ${match.index ?? 0} | Length ${match[0].length}`;

  const text = document.createElement('div');
  text.className = 'match-text';
  text.textContent = match[0];

  const groups = document.createElement('div');
  groups.className = 'groups';

  if (match.length > 1) {
    for (let groupIndex = 1; groupIndex < match.length; groupIndex += 1) {
      const group = document.createElement('div');
      group.className = 'group-pill';
      group.textContent = `Group ${groupIndex}: ${match[groupIndex] ?? ''}`;
      groups.appendChild(group);
    }
  } else {
    const group = document.createElement('div');
    group.className = 'group-pill';
    group.textContent = 'No capture groups';
    groups.appendChild(group);
  }

  head.appendChild(title);
  head.appendChild(meta);
  card.appendChild(head);
  card.appendChild(text);
  card.appendChild(groups);
  return card;
}

function testRegex() {
  const pattern = patternInput.value;
  const sample = sampleInput.value;

  if (!pattern.trim()) {
    clearResults('Enter a regex pattern to test.');
    setStatus('Enter a regex pattern.', 'error');
    return;
  }

  let regex;
  try {
    regex = new RegExp(pattern, getFlags());
  } catch (error) {
    clearResults('Fix the pattern syntax and try again.');
    setStatus(error.message || 'Invalid regex pattern.', 'error');
    return;
  }

  const matches = collectMatches(regex, sample);
  lastMatches = matches;
  resultsEl.innerHTML = '';
  summaryEl.innerHTML = `<strong>${matches.length}</strong> match${matches.length === 1 ? '' : 'es'} found with flags <strong>${regex.flags || '(none)'}</strong>.`;

  if (!matches.length) {
    const empty = document.createElement('div');
    empty.className = 'match-card';
    empty.textContent = 'No matches found for the current sample text.';
    resultsEl.appendChild(empty);
    setStatus('No matches found.');
    return;
  }

  matches.forEach((match, index) => {
    resultsEl.appendChild(renderMatch(match, index));
  });
  setStatus('Regex test completed successfully.', 'success');
}

async function copyMatches() {
  if (!lastMatches.length) {
    setStatus('Run a test first.', 'error');
    return;
  }

  const output = lastMatches.map((match) => match[0]).join('\n');
  try {
    await navigator.clipboard.writeText(output);
    setStatus('Matches copied to clipboard.', 'success');
  } catch {
    setStatus('Press Ctrl+C to copy the matches.', 'error');
  }
}

function clearAll() {
  patternInput.value = '';
  sampleInput.value = '';
  document.querySelectorAll('.flag-chip input').forEach((checkbox, index) => {
    checkbox.checked = checkbox.value === 'g' || index === 0;
  });
  clearResults();
  setStatus('Cleared regex inputs.');
}

function fillExample() {
  patternInput.value = '\\b\\w+@\\w+\\.com\\b';
  sampleInput.value = 'Contact a@site.com or b@test.com for help.';
  document.querySelectorAll('.flag-chip input').forEach((checkbox) => {
    checkbox.checked = checkbox.value === 'g' || checkbox.value === 'i';
  });
  testRegex();
}

testBtn.addEventListener('click', testRegex);
copyBtn.addEventListener('click', copyMatches);
clearBtn.addEventListener('click', clearAll);
fillExampleBtn.addEventListener('click', fillExample);
patternInput.addEventListener('keydown', (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
    event.preventDefault();
    testRegex();
  }
});
clearResults();
setStatus('Enter a pattern and sample text, then test the regex.');
