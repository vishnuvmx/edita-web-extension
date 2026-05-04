const imageInput = document.getElementById('imageInput');
const fileNameEl = document.getElementById('fileName');
const previewImage = document.getElementById('previewImage');
const emptyState = document.getElementById('emptyState');
const metaGrid = document.getElementById('metaGrid');
const formatSelect = document.getElementById('formatSelect');
const qualityInput = document.getElementById('qualityInput');
const stripBtn = document.getElementById('stripBtn');
const clearBtn = document.getElementById('clearBtn');
const statusEl = document.getElementById('status');

const state = {
  file: null,
  image: null,
  imageUrl: '',
  sensitiveMetadata: {
    iso: false,
    shutter: false,
    focal: false,
    focus: false,
    location: false,
  },
};

const textDecoder = new TextDecoder('utf-8', { fatal: false });

function resetSensitiveMetadata() {
  state.sensitiveMetadata = {
    iso: false,
    shutter: false,
    focal: false,
    focus: false,
    location: false,
  };
}

function hasSensitiveMetadata() {
  return Object.values(state.sensitiveMetadata).some(Boolean);
}

function flagSensitiveFromKeywordBlob(text) {
  const normalized = text.toLowerCase();
  if (normalized.includes('iso')) {
    state.sensitiveMetadata.iso = true;
  }
  if (normalized.includes('shutter') || normalized.includes('exposure')) {
    state.sensitiveMetadata.shutter = true;
  }
  if (normalized.includes('focal')) {
    state.sensitiveMetadata.focal = true;
  }
  if (normalized.includes('focus') || normalized.includes('subjectdistance')) {
    state.sensitiveMetadata.focus = true;
  }
  if (
    normalized.includes('gps') ||
    normalized.includes('latitude') ||
    normalized.includes('longitude') ||
    normalized.includes('location')
  ) {
    state.sensitiveMetadata.location = true;
  }
}

function readArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Failed to inspect file metadata.'));
    reader.readAsArrayBuffer(file);
  });
}

function getUint16(view, offset, littleEndian) {
  if (offset < 0 || offset + 2 > view.byteLength) {
    return null;
  }
  return view.getUint16(offset, littleEndian);
}

function getUint32(view, offset, littleEndian) {
  if (offset < 0 || offset + 4 > view.byteLength) {
    return null;
  }
  return view.getUint32(offset, littleEndian);
}

function applyExifTagSignal(tag, inGpsIfd) {
  if (tag === 0x8827) {
    state.sensitiveMetadata.iso = true;
  }
  if (tag === 0x829a || tag === 0x9201) {
    state.sensitiveMetadata.shutter = true;
  }
  if (tag === 0x920a) {
    state.sensitiveMetadata.focal = true;
  }
  if (tag === 0x9206) {
    state.sensitiveMetadata.focus = true;
  }

  if (tag === 0x8825 || inGpsIfd) {
    state.sensitiveMetadata.location = true;
  }
}

function parseExifIfd(view, tiffStart, ifdOffset, littleEndian, visited, inGpsIfd = false) {
  if (!Number.isFinite(ifdOffset) || ifdOffset <= 0 || visited.has(ifdOffset)) {
    return;
  }
  visited.add(ifdOffset);

  const ifdAbsolute = tiffStart + ifdOffset;
  const entryCount = getUint16(view, ifdAbsolute, littleEndian);
  if (!Number.isFinite(entryCount)) {
    return;
  }

  let exifSubIfdOffset = null;
  let gpsSubIfdOffset = null;

  for (let index = 0; index < entryCount; index += 1) {
    const entryOffset = ifdAbsolute + 2 + index * 12;
    const tag = getUint16(view, entryOffset, littleEndian);
    if (!Number.isFinite(tag)) {
      break;
    }

    applyExifTagSignal(tag, inGpsIfd);

    if (tag === 0x8769) {
      exifSubIfdOffset = getUint32(view, entryOffset + 8, littleEndian);
    }

    if (tag === 0x8825) {
      gpsSubIfdOffset = getUint32(view, entryOffset + 8, littleEndian);
    }
  }

  const nextIfdOffset = getUint32(view, ifdAbsolute + 2 + entryCount * 12, littleEndian);

  if (Number.isFinite(exifSubIfdOffset) && exifSubIfdOffset > 0) {
    parseExifIfd(view, tiffStart, exifSubIfdOffset, littleEndian, visited, false);
  }

  if (Number.isFinite(gpsSubIfdOffset) && gpsSubIfdOffset > 0) {
    parseExifIfd(view, tiffStart, gpsSubIfdOffset, littleEndian, visited, true);
  }

  if (Number.isFinite(nextIfdOffset) && nextIfdOffset > 0) {
    parseExifIfd(view, tiffStart, nextIfdOffset, littleEndian, visited, inGpsIfd);
  }
}

function inspectExifTiff(view, tiffStart) {
  if (tiffStart < 0 || tiffStart + 8 > view.byteLength) {
    return;
  }

  const byte0 = view.getUint8(tiffStart);
  const byte1 = view.getUint8(tiffStart + 1);
  const littleEndian = byte0 === 0x49 && byte1 === 0x49;
  const bigEndian = byte0 === 0x4d && byte1 === 0x4d;

  if (!littleEndian && !bigEndian) {
    return;
  }

  const endianness = littleEndian;
  const magic = getUint16(view, tiffStart + 2, endianness);
  const ifd0Offset = getUint32(view, tiffStart + 4, endianness);

  if (magic !== 42 || !Number.isFinite(ifd0Offset)) {
    return;
  }

  parseExifIfd(view, tiffStart, ifd0Offset, endianness, new Set(), false);
}

function inspectJpegSensitiveMetadata(buffer) {
  const bytes = new Uint8Array(buffer);
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) {
    return;
  }

  let offset = 2;
  while (offset + 4 <= bytes.length) {
    if (bytes[offset] !== 0xff) {
      break;
    }

    const marker = bytes[offset + 1];
    if (marker === 0xda || marker === 0xd9) {
      break;
    }

    const segmentLength = (bytes[offset + 2] << 8) | bytes[offset + 3];
    if (!Number.isFinite(segmentLength) || segmentLength < 2) {
      break;
    }

    const segmentStart = offset + 4;
    const segmentEnd = offset + 2 + segmentLength;
    if (segmentEnd > bytes.length) {
      break;
    }

    if (
      marker === 0xe1 &&
      segmentLength > 8 &&
      bytes[segmentStart] === 0x45 &&
      bytes[segmentStart + 1] === 0x78 &&
      bytes[segmentStart + 2] === 0x69 &&
      bytes[segmentStart + 3] === 0x66 &&
      bytes[segmentStart + 4] === 0x00 &&
      bytes[segmentStart + 5] === 0x00
    ) {
      inspectExifTiff(new DataView(buffer), segmentStart + 6);
    }

    offset = segmentEnd;
  }
}

function inspectPngSensitiveMetadata(buffer) {
  const bytes = new Uint8Array(buffer);
  const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

  if (bytes.length < 8 || !pngSignature.every((value, index) => bytes[index] === value)) {
    return;
  }

  let offset = 8;
  while (offset + 12 <= bytes.length) {
    const length =
      ((bytes[offset] << 24) |
        (bytes[offset + 1] << 16) |
        (bytes[offset + 2] << 8) |
        bytes[offset + 3]) >>>
      0;

    const typeOffset = offset + 4;
    const dataOffset = offset + 8;
    const crcOffset = dataOffset + length;
    const nextChunk = crcOffset + 4;

    if (nextChunk > bytes.length) {
      break;
    }

    const chunkType = String.fromCharCode(
      bytes[typeOffset],
      bytes[typeOffset + 1],
      bytes[typeOffset + 2],
      bytes[typeOffset + 3]
    );

    if (chunkType === 'eXIf') {
      inspectExifTiff(new DataView(buffer, dataOffset, length), 0);
    }

    if (chunkType === 'tEXt' || chunkType === 'iTXt') {
      const text = textDecoder.decode(bytes.subarray(dataOffset, dataOffset + length));
      flagSensitiveFromKeywordBlob(text);
    }

    if (chunkType === 'IEND') {
      break;
    }

    offset = nextChunk;
  }
}

function inspectSensitiveMetadata(buffer, file) {
  resetSensitiveMetadata();
  const type = (file.type || '').toLowerCase();
  const lowerName = (file.name || '').toLowerCase();

  if (type.includes('jpeg') || lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg')) {
    inspectJpegSensitiveMetadata(buffer);
    return;
  }

  if (type.includes('png') || lowerName.endsWith('.png')) {
    inspectPngSensitiveMetadata(buffer);
  }
}

function setStatus(message, tone = 'neutral') {
  statusEl.textContent = message;
  if (tone === 'success' || tone === 'error') {
    statusEl.dataset.tone = tone;
  } else {
    delete statusEl.dataset.tone;
  }
}

function bytesToReadable(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 KB';
  }
  const kb = bytes / 1024;
  if (kb < 1024) {
    return `${kb.toFixed(1)} KB`;
  }
  return `${(kb / 1024).toFixed(2)} MB`;
}

function updateMetaRows(rows) {
  metaGrid.innerHTML = '';
  rows.forEach((line) => {
    const row = document.createElement('div');
    row.className = 'meta-row';
    row.textContent = line;
    metaGrid.appendChild(row);
  });
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const image = new Image();
      image.onload = () => resolve({ image, url: reader.result });
      image.onerror = () => reject(new Error('Could not read image.'));
      image.src = reader.result;
    };

    reader.onerror = () => reject(new Error('Failed to read selected file.'));
    reader.readAsDataURL(file);
  });
}

async function onSelectImage() {
  const file = imageInput.files && imageInput.files[0];

  if (!file) {
    return;
  }

  try {
    const [loadResult, binaryBuffer] = await Promise.all([loadImage(file), readArrayBuffer(file)]);
    const { image, url } = loadResult;

    if (state.imageUrl) {
      URL.revokeObjectURL(state.imageUrl);
    }

    state.file = file;
    state.image = image;
    state.imageUrl = url;

    fileNameEl.textContent = file.name;
    previewImage.src = state.imageUrl;
    previewImage.style.display = 'block';
    emptyState.style.display = 'none';

    updateMetaRows([
      `Name: ${file.name}`,
      `Type: ${file.type || 'Unknown'}`,
      `Size: ${bytesToReadable(file.size)}`,
      `Dimensions: ${image.naturalWidth} x ${image.naturalHeight} px`,
      `Last Modified: ${new Date(file.lastModified).toLocaleString()}`,
    ]);

    inspectSensitiveMetadata(binaryBuffer, file);

    if (hasSensitiveMetadata()) {
      setStatus(
        'Sensitive camera/location metadata detected. Export will strip it without exposing values.',
        'success'
      );
    } else {
      setStatus('Image loaded. You can now export a cleaned copy.', 'success');
    }
  } catch (error) {
    setStatus(error.message || 'Could not load image.', 'error');
  }
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Failed to build output file.'));
          return;
        }
        resolve(blob);
      },
      type,
      quality
    );
  });
}

function extensionFromType(type) {
  if (type === 'image/png') {
    return 'png';
  }
  if (type === 'image/webp') {
    return 'webp';
  }
  return 'jpg';
}

async function stripAndDownload() {
  if (!state.image || !state.file) {
    setStatus('Select an image first.', 'error');
    return;
  }

  const type = formatSelect.value;
  const quality = Math.min(1, Math.max(0.1, (Number.parseInt(qualityInput.value, 10) || 92) / 100));

  const canvas = document.createElement('canvas');
  canvas.width = state.image.naturalWidth;
  canvas.height = state.image.naturalHeight;

  const context = canvas.getContext('2d');
  context.drawImage(state.image, 0, 0);

  try {
    const blob = await canvasToBlob(canvas, type, type === 'image/png' ? undefined : quality);
    const outputUrl = URL.createObjectURL(blob);

    const anchor = document.createElement('a');
    const baseName = state.file.name.replace(/\.[^.]+$/, '');
    anchor.href = outputUrl;
    anchor.download = `${baseName}-clean.${extensionFromType(type)}`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    URL.revokeObjectURL(outputUrl);
    setStatus(
      'Cleaned image downloaded. ISO, shutter, focal/focus, and location metadata are removed when present.',
      'success'
    );
  } catch (error) {
    setStatus(error.message || 'Could not export clean image.', 'error');
  }
}

function clearAll() {
  state.file = null;
  state.image = null;
  resetSensitiveMetadata();

  if (state.imageUrl) {
    URL.revokeObjectURL(state.imageUrl);
    state.imageUrl = '';
  }

  imageInput.value = '';
  fileNameEl.textContent = 'No file selected';
  previewImage.removeAttribute('src');
  previewImage.style.display = 'none';
  emptyState.style.display = 'block';

  updateMetaRows(['Name: -', 'Type: -', 'Size: -', 'Dimensions: -', 'Last Modified: -']);

  setStatus('Cleared. Select another image to continue.');
}

imageInput.addEventListener('change', onSelectImage);
stripBtn.addEventListener('click', stripAndDownload);
clearBtn.addEventListener('click', clearAll);

setStatus('Upload an image to start metadata stripping.');
