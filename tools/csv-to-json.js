const csvInput = document.getElementById('csvInput');
const delimiterSelect = document.getElementById('delimiterSelect');
const jsonOutput = document.getElementById('jsonOutput');
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

function normalizeHeaders(headers) {
  const seen = new Map();
  return headers.map((header, index) => {
    const base = header && header.trim() ? header.trim() : `column${index + 1}`;
    const count = (seen.get(base) || 0) + 1;
    seen.set(base, count);
    return count === 1 ? base : `${base}_${count}`;
  });
}

function parseCsv(text, delimiter) {
  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        cell += '"';
        index += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        cell += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === delimiter) {
      row.push(cell);
      cell = '';
    } else if (char === '\r') {
      if (next === '\n') {
        index += 1;
      }
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else if (char === '\n') {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }

  row.push(cell);
  rows.push(row);

  while (rows.length && rows[rows.length - 1].every((value) => value.trim() === '')) {
    rows.pop();
  }

  return rows;
}

function convertCsv() {
  try {
    const source = csvInput.value.trim();
    if (!source) {
      throw new Error('Paste CSV data first.');
    }

    const rows = parseCsv(source, getDelimiter());
    if (rows.length < 2) {
      throw new Error('CSV needs a header row and at least one data row.');
    }

    const headers = normalizeHeaders(rows[0]);
    const data = rows.slice(1).map((row) => {
      const record = {};
      headers.forEach((header, index) => {
        record[header] = row[index] !== undefined ? row[index] : '';
      });
      if (row.length > headers.length) {
        for (let index = headers.length; index < row.length; index += 1) {
          record[`column${index + 1}`] = row[index];
        }
      }
      return record;
    });

    jsonOutput.value = JSON.stringify(data, null, 2);
    setStatus(`Converted ${data.length} row${data.length === 1 ? '' : 's'} to JSON.`, 'success');
  } catch (error) {
    jsonOutput.value = '';
    setStatus(error.message || 'Unable to convert CSV.', 'error');
  }
}

async function copyJson() {
  const output = jsonOutput.value.trim();
  if (!output) {
    setStatus('Convert CSV first.', 'error');
    return;
  }

  try {
    await navigator.clipboard.writeText(output);
    setStatus('JSON copied to clipboard.', 'success');
  } catch {
    jsonOutput.focus();
    jsonOutput.select();
    setStatus('Press Ctrl+C to copy the JSON.', 'error');
  }
}

function downloadJson() {
  const output = jsonOutput.value.trim();
  if (!output) {
    setStatus('Convert CSV first.', 'error');
    return;
  }

  const blob = new Blob([output], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'converted.json';
  link.click();
  URL.revokeObjectURL(url);
  setStatus('JSON file downloaded.', 'success');
}

function clearAll() {
  csvInput.value = '';
  jsonOutput.value = '';
  setStatus('Cleared input and output.');
}

convertBtn.addEventListener('click', convertCsv);
copyBtn.addEventListener('click', copyJson);
downloadBtn.addEventListener('click', downloadJson);
clearBtn.addEventListener('click', clearAll);
setStatus('Paste CSV with headers to convert it to JSON.');
