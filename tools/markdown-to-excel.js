const markdownInput = document.getElementById('markdownInput');
const csvOutput = document.getElementById('csvOutput');
const convertBtn = document.getElementById('convertBtn');
const downloadBtn = document.getElementById('downloadBtn');
const copyCsvBtn = document.getElementById('copyCsvBtn');
const clearBtn = document.getElementById('clearBtn');
const removeCites = document.getElementById('removeCites');
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

function stripCiteTokens(text) {
  return text
    .replaceAll(/\[\s*cite\s*:\s*\{?\s*\d+\s*\}?\s*\]/gi, '')
    .replaceAll(/\[\s*cite\s*:\s*\{?\s*\d+\s*(?:,\s*\d+\s*)+\}?\s*\]/gi, '')
    .replaceAll(/\s{2,}/g, ' ')
    .replaceAll(/\n[ \t]+/g, '\n');
}

function getPreparedMarkdown() {
  const source = markdownInput.value.trim();
  if (!source) {
    return '';
  }

  if (removeCites && removeCites.checked) {
    return stripCiteTokens(source).trim();
  }

  return source;
}

function splitMarkdownRow(row) {
  const trimmed = row.trim();
  const core = trimmed.replace(/^\|/, '').replace(/\|$/, '');
  return core.split('|').map((cell) => cell.trim());
}

function isSeparatorCell(cell) {
  return /^:?-{3,}:?$/.test(cell.trim());
}

function normalizeRow(cells, expectedLength) {
  const normalized = cells.slice(0, expectedLength);
  while (normalized.length < expectedLength) {
    normalized.push('');
  }
  return normalized;
}

function findMarkdownTables(text) {
  const lines = text.replaceAll('\r\n', '\n').replaceAll('\r', '\n').split('\n');
  const tables = [];

  for (let i = 0; i < lines.length - 1; i += 1) {
    const headerLine = lines[i];
    const separatorLine = lines[i + 1];

    if (!headerLine.includes('|') || !separatorLine.includes('|')) {
      continue;
    }

    const headers = splitMarkdownRow(headerLine);
    const separators = splitMarkdownRow(separatorLine);

    if (!headers.length || !separators.length || headers.length !== separators.length) {
      continue;
    }

    if (!separators.every(isSeparatorCell)) {
      continue;
    }

    const rows = [];
    let rowIndex = i + 2;

    while (rowIndex < lines.length) {
      const rowLine = lines[rowIndex];
      if (!rowLine.trim() || !rowLine.includes('|')) {
        break;
      }

      const cells = splitMarkdownRow(rowLine);
      rows.push(normalizeRow(cells, headers.length));
      rowIndex += 1;
    }

    tables.push({ headers, rows });
    i = rowIndex - 1;
  }

  return tables;
}

function stripMarkdownLine(line) {
  return line
    .replaceAll(/\*\*([^*]+)\*\*/g, '$1')
    .replaceAll(/\*([^*]+)\*/g, '$1')
    .replaceAll(/`([^`]+)`/g, '$1')
    .replaceAll(/\[([^\]]+)\]\(([^\)]+)\)/g, '$1 ($2)')
    .replaceAll(/^\s{0,3}#{1,6}\s+/, '')
    .replaceAll(/^\s*>\s?/, '')
    .replaceAll(/^\s*[-*+]\s+/, '')
    .replaceAll(/^\s*\d+\.\s+/, '');
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

function escapeHtml(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function buildExcelHtml(headers, rows) {
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

function convertMarkdown() {
  const source = getPreparedMarkdown();
  if (!source) {
    csvOutput.value = '';
    lastHeaders = [];
    lastRows = [];
    setStatus('Paste Markdown data to convert.', 'error');
    return;
  }

  const tables = findMarkdownTables(source);

  if (tables.length > 0) {
    const first = tables[0];
    lastHeaders = first.headers;
    lastRows = first.rows;
    csvOutput.value = buildCsv(lastHeaders, lastRows);
    setStatus(`Converted table with ${lastRows.length} row(s) and ${lastHeaders.length} column(s).`, 'success');
    return;
  }

  const lines = source
    .split(/\r?\n/)
    .map((line) => stripMarkdownLine(line).trim())
    .filter((line) => line.length > 0);

  if (!lines.length) {
    csvOutput.value = '';
    lastHeaders = [];
    lastRows = [];
    setStatus('No table or usable lines found in Markdown input.', 'error');
    return;
  }

  lastHeaders = ['Text'];
  lastRows = lines.map((line) => [line]);
  csvOutput.value = buildCsv(lastHeaders, lastRows);
  setStatus('No Markdown table found. Exported non-empty lines as a single Text column.', 'success');
}

function downloadExcel() {
  if (!lastHeaders.length) {
    setStatus('Convert Markdown first, then download Excel.', 'error');
    return;
  }

  const excelHtml = buildExcelHtml(lastHeaders, lastRows);
  const blob = new Blob([excelHtml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = 'markdown-to-excel.xls';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  setStatus('Excel file downloaded successfully.', 'success');
}

async function copyCsv() {
  const csv = csvOutput.value.trim();
  if (!csv) {
    setStatus('No CSV output to copy.', 'error');
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
  markdownInput.value = '';
  csvOutput.value = '';
  lastHeaders = [];
  lastRows = [];
  setStatus('Cleared input and output.');
}

convertBtn.addEventListener('click', convertMarkdown);
downloadBtn.addEventListener('click', downloadExcel);
copyCsvBtn.addEventListener('click', copyCsv);
clearBtn.addEventListener('click', clearAll);

markdownInput.addEventListener('keydown', (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
    event.preventDefault();
    convertMarkdown();
  }
});

setStatus('Paste Markdown with a table to export it to Excel.');