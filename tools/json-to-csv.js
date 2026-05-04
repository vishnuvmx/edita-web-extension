const jsonInput = document.getElementById('jsonInput');
const delimiterSelect = document.getElementById('delimiterSelect');
const csvOutput = document.getElementById('csvOutput');
const convertBtn = document.getElementById('convertBtn');
const copyBtn = document.getElementById('copyBtn');
const downloadBtn = document.getElementById('downloadBtn');
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

function getDelimiter() {
  return { comma: ',', tab: '\t', semicolon: ';' }[delimiterSelect.value] || ',';
}

function escapeCsv(value, delimiter) {
  const text = String(value ?? '');
  if (/["\r\n]/.test(text) || text.includes(delimiter)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function toCellValue(value) {
  if (value == null) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return value;
}

function parseRows(source) {
  if (Array.isArray(source)) return source;
  if (source && typeof source === 'object') return [source];
  throw new Error('JSON must be an object or array of objects.');
}

function buildHeaders(rows) {
  const headers = [];
  const seen = new Set();
  rows.forEach((row) => {
    if (row && typeof row === 'object' && !Array.isArray(row)) {
      Object.keys(row).forEach((key) => {
        if (!seen.has(key)) {
          seen.add(key);
          headers.push(key);
        }
      });
    }
  });
  return headers.length ? headers : ['value'];
}

function convertJson() {
  try {
    const source = jsonInput.value.trim();
    if (!source) throw new Error('Paste JSON data first.');
    const parsed = JSON.parse(source);
    const rows = parseRows(parsed);
    if (!rows.length) throw new Error('JSON array is empty.');

    const delimiter = getDelimiter();
    const headers = buildHeaders(rows);
    const lines = [headers.map((header) => escapeCsv(header, delimiter)).join(delimiter)];

    rows.forEach((row) => {
      if (row && typeof row === 'object' && !Array.isArray(row)) {
        lines.push(
          headers.map((header) => escapeCsv(toCellValue(row[header]), delimiter)).join(delimiter)
        );
      } else {
        lines.push(escapeCsv(toCellValue(row), delimiter));
      }
    });

    csvOutput.value = lines.join('\n');
    setStatus(`Converted ${rows.length} row${rows.length === 1 ? '' : 's'} to CSV.`, 'success');
  } catch (error) {
    csvOutput.value = '';
    setStatus(error.message || 'Unable to convert JSON.', 'error');
  }
}

async function copyCsv() {
  const output = csvOutput.value.trim();
  if (!output) {
    setStatus('Convert JSON first.', 'error');
    return;
  }
  try {
    await navigator.clipboard.writeText(output);
    setStatus('CSV copied to clipboard.', 'success');
  } catch {
    csvOutput.focus();
    csvOutput.select();
    setStatus('Press Ctrl+C to copy the CSV.', 'error');
  }
}

function downloadCsv() {
  const output = csvOutput.value.trim();
  if (!output) {
    setStatus('Convert JSON first.', 'error');
    return;
  }
  const blob = new Blob([output], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'converted.csv';
  link.click();
  URL.revokeObjectURL(url);
  setStatus('CSV file downloaded.', 'success');
}

function clearAll() {
  jsonInput.value = '';
  csvOutput.value = '';
  setStatus('Cleared input and output.');
}

convertBtn.addEventListener('click', convertJson);
copyBtn.addEventListener('click', copyCsv);
downloadBtn.addEventListener('click', downloadCsv);
clearBtn.addEventListener('click', clearAll);
setStatus('Paste JSON objects or arrays to convert them to CSV.');
