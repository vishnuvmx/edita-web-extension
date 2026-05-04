const jsonInput = document.getElementById('jsonInput');
const csvOutput = document.getElementById('csvOutput');
const convertBtn = document.getElementById('convertBtn');
const downloadBtn = document.getElementById('downloadBtn');
const copyCsvBtn = document.getElementById('copyCsvBtn');
const clearBtn = document.getElementById('clearBtn');
const statusEl = document.getElementById('status');

let lastHeaders = [];
let lastRows = [];

function setStatus(message, tone = 'neutral') {
  statusEl.textContent = message;
  if (tone === 'success' || tone === 'error') {
    statusEl.dataset.tone = tone;
  } else {
    delete statusEl.dataset.tone;
  }
}

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function flattenObject(source, prefix = '', target = {}) {
  Object.keys(source).forEach((key) => {
    const value = source[key];
    const nextKey = prefix ? `${prefix}.${key}` : key;

    if (Array.isArray(value)) {
      if (value.every((item) => typeof item !== 'object' || item === null)) {
        target[nextKey] = value.join('; ');
      } else {
        target[nextKey] = JSON.stringify(value);
      }
      return;
    }

    if (isPlainObject(value)) {
      flattenObject(value, nextKey, target);
      return;
    }

    if (value === null || value === undefined) {
      target[nextKey] = '';
    } else {
      target[nextKey] = String(value);
    }
  });

  return target;
}

function parseInputJson() {
  const raw = jsonInput.value.trim();
  if (!raw) {
    throw new Error('Paste JSON data to convert.');
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('Invalid JSON. Check commas, quotes, and brackets.');
  }

  if (Array.isArray(parsed)) {
    if (!parsed.length) {
      throw new Error('JSON array is empty. Add at least one object.');
    }

    if (!parsed.every((item) => isPlainObject(item))) {
      throw new Error('Use an array of objects for conversion.');
    }

    return parsed;
  }

  if (isPlainObject(parsed)) {
    return [parsed];
  }

  throw new Error('JSON must be an object or an array of objects.');
}

function buildTableData(records) {
  const flatRows = records.map((record) => flattenObject(record));
  const headers = [];

  flatRows.forEach((row) => {
    Object.keys(row).forEach((key) => {
      if (!headers.includes(key)) {
        headers.push(key);
      }
    });
  });

  return {
    headers,
    rows: flatRows.map((row) => headers.map((header) => (row[header] ?? '').toString())),
  };
}

function csvEscape(value) {
  const text = value ?? '';
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function buildCsv(headers, rows) {
  const csvLines = [headers.map(csvEscape).join(',')];
  rows.forEach((row) => {
    csvLines.push(row.map(csvEscape).join(','));
  });
  return csvLines.join('\n');
}

function buildExcelHtml(headers, rows) {
  const escapeHtml = (text) =>
    text
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;');

  const headCells = headers.map((header) => `<th>${escapeHtml(header)}</th>`).join('');
  const bodyRows = rows
    .map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`)
    .join('');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  table { border-collapse: collapse; font-family: Calibri, Arial, sans-serif; font-size: 12pt; }
  th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; }
  th { background: #e2f7ef; }
</style>
</head>
<body>
<table>
<thead><tr>${headCells}</tr></thead>
<tbody>${bodyRows}</tbody>
</table>
</body>
</html>`;
}

function convertJson() {
  try {
    const records = parseInputJson();
    const tableData = buildTableData(records);

    if (!tableData.headers.length) {
      throw new Error('No usable keys found in the JSON objects.');
    }

    lastHeaders = tableData.headers;
    lastRows = tableData.rows;

    csvOutput.value = buildCsv(lastHeaders, lastRows);
    setStatus(
      `Converted ${lastRows.length} row(s) with ${lastHeaders.length} column(s).`,
      'success'
    );
  } catch (error) {
    lastHeaders = [];
    lastRows = [];
    csvOutput.value = '';
    setStatus(error.message || 'Unable to convert JSON.', 'error');
  }
}

function downloadExcel() {
  if (!lastHeaders.length || !lastRows.length) {
    setStatus('Convert JSON first, then download Excel.', 'error');
    return;
  }

  const excelHtml = buildExcelHtml(lastHeaders, lastRows);
  const blob = new Blob([excelHtml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = 'json-to-excel.xls';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  setStatus('Excel file downloaded successfully.', 'success');
}

async function copyCsv() {
  const csv = csvOutput.value.trim();
  if (!csv) {
    setStatus('No CSV output to copy. Convert JSON first.', 'error');
    return;
  }

  try {
    await navigator.clipboard.writeText(csv);
    setStatus('CSV copied to clipboard.', 'success');
  } catch {
    csvOutput.focus();
    csvOutput.select();
    setStatus('Press Ctrl+C to copy CSV.', 'error');
  }
}

function clearAll() {
  jsonInput.value = '';
  csvOutput.value = '';
  lastHeaders = [];
  lastRows = [];
  setStatus('Cleared input and output.');
}

convertBtn.addEventListener('click', convertJson);
downloadBtn.addEventListener('click', downloadExcel);
copyCsvBtn.addEventListener('click', copyCsv);
clearBtn.addEventListener('click', clearAll);

jsonInput.addEventListener('keydown', (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
    event.preventDefault();
    convertJson();
  }
});

setStatus('Paste JSON and click Convert to Table.');
