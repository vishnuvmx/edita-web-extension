const markdownInput = document.getElementById('markdownInput');
const plainPreview = document.getElementById('plainPreview');
const downloadBtn = document.getElementById('downloadBtn');
const previewBtn = document.getElementById('previewBtn');
const copyPlainBtn = document.getElementById('copyPlainBtn');
const clearBtn = document.getElementById('clearBtn');
const removeCites = document.getElementById('removeCites');
const statusEl = document.getElementById('status');

const encoder = new TextEncoder();
const crcTable = new Uint32Array(256);

for (let i = 0; i < 256; i += 1) {
  let value = i;
  for (let j = 0; j < 8; j += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  crcTable[i] = value >>> 0;
}

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

function encodeUtf8(text) {
  return encoder.encode(text);
}

function concatBytes(chunks) {
  const total = chunks.reduce((sum, bytes) => sum + bytes.length, 0);
  const merged = new Uint8Array(total);
  let offset = 0;

  chunks.forEach((bytes) => {
    merged.set(bytes, offset);
    offset += bytes.length;
  });

  return merged;
}

function toLe16(value) {
  return Uint8Array.of(value & 0xff, (value >>> 8) & 0xff);
}

function toLe32(value) {
  return Uint8Array.of(
    value & 0xff,
    (value >>> 8) & 0xff,
    (value >>> 16) & 0xff,
    (value >>> 24) & 0xff
  );
}

function crc32(bytes) {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i += 1) {
    crc = crcTable[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function buildZip(entries) {
  const locals = [];
  const centrals = [];
  let localOffset = 0;

  entries.forEach((entry) => {
    const nameBytes = encodeUtf8(entry.name);
    const dataBytes = entry.data;
    const checksum = crc32(dataBytes);

    const localHeader = concatBytes([
      toLe32(0x04034b50),
      toLe16(20),
      toLe16(0),
      toLe16(0),
      toLe16(0),
      toLe16(0),
      toLe32(checksum),
      toLe32(dataBytes.length),
      toLe32(dataBytes.length),
      toLe16(nameBytes.length),
      toLe16(0),
      nameBytes,
      dataBytes,
    ]);

    const centralHeader = concatBytes([
      toLe32(0x02014b50),
      toLe16(20),
      toLe16(20),
      toLe16(0),
      toLe16(0),
      toLe16(0),
      toLe16(0),
      toLe32(checksum),
      toLe32(dataBytes.length),
      toLe32(dataBytes.length),
      toLe16(nameBytes.length),
      toLe16(0),
      toLe16(0),
      toLe16(0),
      toLe16(0),
      toLe32(0),
      toLe32(localOffset),
      nameBytes,
    ]);

    locals.push(localHeader);
    centrals.push(centralHeader);
    localOffset += localHeader.length;
  });

  const centralDirectory = concatBytes(centrals);
  const localData = concatBytes(locals);
  const endRecord = concatBytes([
    toLe32(0x06054b50),
    toLe16(0),
    toLe16(0),
    toLe16(entries.length),
    toLe16(entries.length),
    toLe32(centralDirectory.length),
    toLe32(localData.length),
    toLe16(0),
  ]);

  return concatBytes([localData, centralDirectory, endRecord]);
}

function escapeXml(text) {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function makeRun(text, style = {}) {
  const runProps = [];

  if (style.bold) {
    runProps.push('<w:b/>');
  }
  if (style.italic) {
    runProps.push('<w:i/>');
  }
  if (style.code) {
    runProps.push('<w:rFonts w:ascii="Courier New" w:hAnsi="Courier New"/>');
  }
  if (style.sizeHalfPoints) {
    runProps.push(`<w:sz w:val="${style.sizeHalfPoints}"/>`);
  }
  if (style.underline) {
    runProps.push('<w:u w:val="single"/>');
  }
  if (style.color) {
    runProps.push(`<w:color w:val="${style.color}"/>`);
  }

  const parts = text.split('\n');
  const body = [];

  parts.forEach((part, index) => {
    if (index > 0) {
      body.push('<w:br/>');
    }
    body.push(`<w:t xml:space="preserve">${escapeXml(part)}</w:t>`);
  });

  const propsXml = runProps.length ? `<w:rPr>${runProps.join('')}</w:rPr>` : '';
  return `<w:r>${propsXml}${body.join('')}</w:r>`;
}

function parseInlineRuns(text, baseStyle = {}) {
  const tokenRegex = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*|\[[^\]]+\]\([^\)]+\))/g;
  const runs = [];
  let cursor = 0;
  let match;

  while ((match = tokenRegex.exec(text)) !== null) {
    if (match.index > cursor) {
      runs.push(makeRun(text.slice(cursor, match.index), baseStyle));
    }

    const token = match[0];
    if (token.startsWith('**')) {
      runs.push(makeRun(token.slice(2, -2), { ...baseStyle, bold: true }));
    } else if (token.startsWith('`')) {
      runs.push(makeRun(token.slice(1, -1), { ...baseStyle, code: true }));
    } else if (token.startsWith('*')) {
      runs.push(makeRun(token.slice(1, -1), { ...baseStyle, italic: true }));
    } else if (token.startsWith('[')) {
      const linkMatch = token.match(/^\[([^\]]+)\]\(([^\)]+)\)$/);
      if (linkMatch) {
        const linkText = `${linkMatch[1]} (${linkMatch[2]})`;
        runs.push(makeRun(linkText, { ...baseStyle, underline: true, color: '2F5597' }));
      } else {
        runs.push(makeRun(token, baseStyle));
      }
    }

    cursor = tokenRegex.lastIndex;
  }

  if (cursor < text.length) {
    runs.push(makeRun(text.slice(cursor), baseStyle));
  }

  return runs.length ? runs : [makeRun('', baseStyle)];
}

function parseMarkdownBlocks(markdown) {
  const lines = markdown.replaceAll('\r\n', '\n').replaceAll('\r', '\n').split('\n');
  const blocks = [];

  function isSpecialLine(line) {
    return (
      /^\s*```/.test(line) ||
      /^\s{0,3}#{1,6}\s+/.test(line) ||
      /^\s*>\s?/.test(line) ||
      /^\s*[-*+]\s+/.test(line) ||
      /^\s*\d+\.\s+/.test(line)
    );
  }

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];

    if (/^\s*$/.test(line)) {
      continue;
    }

    if (/^\s*```/.test(line)) {
      const codeLines = [];
      i += 1;
      while (i < lines.length && !/^\s*```/.test(lines[i])) {
        codeLines.push(lines[i]);
        i += 1;
      }
      blocks.push({ type: 'code', text: codeLines.join('\n') });
      continue;
    }

    const headingMatch = line.match(/^\s{0,3}(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      blocks.push({ type: 'heading', level: headingMatch[1].length, text: headingMatch[2].trim() });
      continue;
    }

    const blockquoteMatch = line.match(/^\s*>\s?(.*)$/);
    if (blockquoteMatch) {
      const quoteLines = [blockquoteMatch[1]];
      while (i + 1 < lines.length && /^\s*>\s?/.test(lines[i + 1])) {
        i += 1;
        quoteLines.push(lines[i].replace(/^\s*>\s?/, ''));
      }
      blocks.push({ type: 'blockquote', text: quoteLines.join('\n') });
      continue;
    }

    const unorderedMatch = line.match(/^(\s*)[-*+]\s+(.+)$/);
    if (unorderedMatch) {
      const depth = Math.floor(unorderedMatch[1].length / 2);
      blocks.push({ type: 'list', ordered: false, depth, text: unorderedMatch[2] });
      continue;
    }

    const orderedMatch = line.match(/^(\s*)(\d+)\.\s+(.+)$/);
    if (orderedMatch) {
      const depth = Math.floor(orderedMatch[1].length / 2);
      blocks.push({
        type: 'list',
        ordered: true,
        depth,
        index: orderedMatch[2],
        text: orderedMatch[3],
      });
      continue;
    }

    const paragraphLines = [line.trim()];
    while (i + 1 < lines.length && !/^\s*$/.test(lines[i + 1]) && !isSpecialLine(lines[i + 1])) {
      i += 1;
      paragraphLines.push(lines[i].trim());
    }
    blocks.push({ type: 'paragraph', text: paragraphLines.join(' ') });
  }

  return blocks;
}

function toWordParagraph(block) {
  if (block.type === 'heading') {
    const sizeMap = { 1: 42, 2: 34, 3: 30, 4: 26, 5: 24, 6: 22 };
    const runs = parseInlineRuns(block.text, {
      bold: true,
      sizeHalfPoints: sizeMap[block.level] || 24,
    });
    return `<w:p><w:pPr><w:spacing w:after="180"/></w:pPr>${runs.join('')}</w:p>`;
  }

  if (block.type === 'code') {
    const codeText = block.text || '';
    const codeRun = makeRun(codeText, { code: true });
    return `<w:p><w:pPr><w:ind w:left="360"/></w:pPr>${codeRun}</w:p>`;
  }

  if (block.type === 'blockquote') {
    const runs = parseInlineRuns(block.text, { italic: true, color: '4B5563' });
    return `<w:p><w:pPr><w:ind w:left="280"/><w:spacing w:after="120"/></w:pPr>${runs.join('')}</w:p>`;
  }

  if (block.type === 'list') {
    const prefix = `${'  '.repeat(block.depth)}${block.ordered ? `${block.index}.` : '•'} `;
    const runs = parseInlineRuns(prefix + block.text);
    return `<w:p>${runs.join('')}</w:p>`;
  }

  const runs = parseInlineRuns(block.text);
  return `<w:p><w:pPr><w:spacing w:after="120"/></w:pPr>${runs.join('')}</w:p>`;
}

function buildDocumentXml(markdown) {
  const blocks = parseMarkdownBlocks(markdown);
  const paragraphs = blocks.map(toWordParagraph);

  if (!paragraphs.length) {
    paragraphs.push('<w:p><w:r><w:t xml:space="preserve"></w:t></w:r></w:p>');
  }

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:wp14="http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:w10="urn:schemas-microsoft-com:office:word" xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml" xmlns:wpg="http://schemas.microsoft.com/office/word/2010/wordprocessingGroup" xmlns:wpi="http://schemas.microsoft.com/office/word/2010/wordprocessingInk" xmlns:wne="http://schemas.microsoft.com/office/word/2006/wordml" xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape" mc:Ignorable="w14 wp14">
  <w:body>
    ${paragraphs.join('')}
    <w:sectPr>
      <w:pgSz w:w="12240" w:h="15840"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="708" w:footer="708" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>`;
}

function buildDocxBlob(markdown) {
  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

  const packageRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

  const documentXml = buildDocumentXml(markdown);

  const zipBytes = buildZip([
    { name: '[Content_Types].xml', data: encodeUtf8(contentTypes) },
    { name: '_rels/.rels', data: encodeUtf8(packageRels) },
    { name: 'word/document.xml', data: encodeUtf8(documentXml) },
  ]);

  return new Blob([zipBytes], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
}

function stripMarkdown(text) {
  return text
    .replaceAll(/```[\s\S]*?```/g, (match) => match.replaceAll('```', '').trim())
    .replaceAll(/^\s{0,3}#{1,6}\s+/gm, '')
    .replaceAll(/^\s*>\s?/gm, '')
    .replaceAll(/^\s*[-*+]\s+/gm, '• ')
    .replaceAll(/^\s*\d+\.\s+/gm, '')
    .replaceAll(/\*\*([^*]+)\*\*/g, '$1')
    .replaceAll(/\*([^*]+)\*/g, '$1')
    .replaceAll(/`([^`]+)`/g, '$1')
    .replaceAll(/\[([^\]]+)\]\(([^\)]+)\)/g, '$1 ($2)');
}

function refreshPreview() {
  const source = getPreparedMarkdown();
  if (!source) {
    plainPreview.value = '';
    setStatus('Paste Markdown to preview and export.', 'error');
    return;
  }

  plainPreview.value = stripMarkdown(source);
  setStatus('Preview updated.', 'success');
}

function downloadDocx() {
  const source = getPreparedMarkdown();
  if (!source) {
    setStatus('Paste Markdown before downloading.', 'error');
    return;
  }

  try {
    const blob = buildDocxBlob(source);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'markdown-to-word.docx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    plainPreview.value = stripMarkdown(source);
    setStatus('Word file downloaded successfully.', 'success');
  } catch {
    setStatus('Could not build .docx file from the Markdown input.', 'error');
  }
}

async function copyPlainText() {
  const prepared = getPreparedMarkdown();
  const text = plainPreview.value.trim() || stripMarkdown(prepared);
  if (!text) {
    setStatus('Nothing to copy yet.', 'error');
    return;
  }

  try {
    await navigator.clipboard.writeText(text);
    setStatus('Plain text copied to clipboard.', 'success');
  } catch {
    plainPreview.focus();
    plainPreview.select();
    setStatus('Press Ctrl+C to copy the preview.', 'error');
  }
}

function clearAll() {
  markdownInput.value = '';
  plainPreview.value = '';
  setStatus('Cleared input and preview.');
}

downloadBtn.addEventListener('click', downloadDocx);
previewBtn.addEventListener('click', refreshPreview);
copyPlainBtn.addEventListener('click', copyPlainText);
clearBtn.addEventListener('click', clearAll);

markdownInput.addEventListener('keydown', (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
    event.preventDefault();
    downloadDocx();
  }
});

setStatus('Paste Markdown and export it as Word (.docx).');
