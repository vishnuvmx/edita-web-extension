const jsonInput = document.getElementById('jsonInput');
const jsonOutput = document.getElementById('jsonOutput');
const formatBtn = document.getElementById('formatBtn');
const minifyBtn = document.getElementById('minifyBtn');
const copyBtn = document.getElementById('copyBtn');
const clearBtn = document.getElementById('clearBtn');
const statusEl = document.getElementById('status');

function setStatus(message, tone = 'neutral') {
  statusEl.textContent = message;
  if (tone === 'success' || tone === 'error') {
    statusEl.dataset.tone = tone;
  } else {
    delete statusEl.dataset.tone;
  }
}

function getSourceJson() {
  const source = jsonInput.value.trim();
  if (!source) {
    throw new Error('Enter JSON to format or minify.');
  }
  return source;
}

function parseSource() {
  const source = getSourceJson();
  try {
    return JSON.parse(source);
  } catch {
    throw new Error('Invalid JSON. Check commas, quotes, and brackets.');
  }
}

function formatJson() {
  try {
    const parsed = parseSource();
    jsonOutput.value = JSON.stringify(parsed, null, 2);
    setStatus('JSON formatted successfully.', 'success');
  } catch (error) {
    jsonOutput.value = '';
    setStatus(error.message || 'Unable to format JSON.', 'error');
  }
}

function minifyJson() {
  try {
    const parsed = parseSource();
    jsonOutput.value = JSON.stringify(parsed);
    setStatus('JSON minified successfully.', 'success');
  } catch (error) {
    jsonOutput.value = '';
    setStatus(error.message || 'Unable to minify JSON.', 'error');
  }
}

async function copyOutput() {
  const output = jsonOutput.value.trim();
  if (!output) {
    setStatus('Nothing to copy. Format or minify first.', 'error');
    return;
  }

  try {
    await navigator.clipboard.writeText(output);
    setStatus('Output copied to clipboard.', 'success');
  } catch {
    jsonOutput.focus();
    jsonOutput.select();
    setStatus('Press Ctrl+C to copy output.', 'error');
  }
}

function clearAll() {
  jsonInput.value = '';
  jsonOutput.value = '';
  setStatus('Cleared input and output.');
}

formatBtn.addEventListener('click', formatJson);
minifyBtn.addEventListener('click', minifyJson);
copyBtn.addEventListener('click', copyOutput);
clearBtn.addEventListener('click', clearAll);

jsonInput.addEventListener('keydown', (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
    event.preventDefault();
    formatJson();
  }
});

setStatus('Paste JSON and choose Format or Minify.');
