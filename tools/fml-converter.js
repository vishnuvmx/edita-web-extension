const malayalamInput = document.getElementById('malayalamInput');
const fmlOutput = document.getElementById('fmlOutput');
const convertBtn = document.getElementById('convertBtn');
const copyBtn = document.getElementById('copyBtn');
const clearBtn = document.getElementById('clearBtn');
const statusEl = document.getElementById('status');

function autoResizeTextarea(element) {
  element.style.height = 'auto';
  element.style.height = `${Math.max(120, element.scrollHeight)}px`;
}

const MLTT_MAP = {
  'ം': 'w',
  'ഃ': 'x',
  'അ': 'A',
  'ആ': 'B',
  'ഇ': 'C',
  'ഈ': 'Cu',
  'ഉ': 'D',
  'ഊ': 'Du',
  'ഋ': 'E',
  'ഌ': 'p',
  'എ': 'F',
  'ഏ': 'G',
  'ഐ': 'sF',
  'ഒ': 'H',
  'ഓ': 'Hm',
  'ഔ': 'Hu',
  'ക': 'I',
  'ഖ': 'J',
  'ഗ': 'K',
  'ഘ': 'L',
  'ങ': 'M',
  'ച': 'N',
  'ഛ': 'O',
  'ജ': 'P',
  'ഝ': 'Q',
  'ഞ': 'R',
  'ട': 'S',
  'ഠ': 'T',
  'ഡ': 'U',
  'ഢ': 'V',
  'ണ': 'W',
  'ത': 'X',
  'ഥ': 'Y',
  'ദ': 'Z',
  'ധ': '[',
  'ന': '\\',
  'പ': ']',
  'ഫ': '^',
  'ബ': '_',
  'ഭ': '`',
  'മ': 'a',
  'യ': 'b',
  'ര': 'c',
  'റ': 'd',
  'ല': 'e',
  'ള': 'f',
  'ഴ': 'g',
  'വ': 'h',
  'ശ': 'i',
  'ഷ': 'j',
  'സ': 'k',
  'ഹ': 'l',
  'ാ': 'm',
  'ി': 'n',
  'ീ': 'o',
  'ു': 'p',
  'ൂ': 'q',
  'ൃ': 'r',
  'െ': 's',
  'േ': 't',
  'ൈ': 'ss',
  'ൊ': 'sm',
  'ോ': 'tm',
  'ൌ': 'su',
  '്‌': 'v',
  '്': 'v',
  'ൗ': 'u',
  '്യേ': 'ty',
  '്യെ': 'sy',
  'ക്ക': '\u00A1',
  'ക്ല': '\u00A2',
  'ക്ഷ': '\u00A3',
  'ഗ്ഗ': '\u00A4',
  'ഗ്ല': '\u00A5',
  'ങ്ക': '\u00A6',
  'ങ്ങ': '\u00A7',
  'ച്ച': '\u00A8',
  'ഞ്ച': '\u00A9',
  'ഞ്ഞ': '\u00AA',
  'ട്ട': '\u00AB',
  'ണ്‍': '\u00AC',
  'ണ്ട': '\u00EF',
  'ണ്ണ': '\u00AE',
  'ത്ത': '\u00AF',
  'ത്ഥ': '\u00B0',
  'ദ്ദ': '\u00B1',
  'ദ്ധ': '\u00B2',
  'ന്‍': '\u00B3',
  'ൻ': '\u00B3',
  'ന്ത': '\u00B4',
  'ന്ദ': '\u00B5',
  'ന്ന': '\u00B6',
  'ന്മ': '\u00B7',
  'പ്പ': '\u00B8',
  'പ്ല': '\u00B9',
  'ബ്ബ': '\u00BA',
  'ബ്ല': '\u00BB',
  'മ്പ': '\u00BC',
  'മ്മ': '\u00BD',
  'മ്ല': '\u0178',
  'യ്യ': '\u00BF',
  'ർ‌': '\u00C0',
  'ർ‍': '\u00C0',
  'ർ': '\u00C0',
  'ര്‍': '\u00C0',
  'റ്റ': '\u00E4',
  'ല്‍': '\u00C2',
  'ൽ': '\u00C2',
  'ല്ല': '\u00C3',
  'ള്‍': '\u00C4',
  'ൾ': '\u00C4',
  'ള്ള': '\u00C5',
  'വ്വ': '\u00C6',
  'ശ്ല': '\u00C7',
  'ശ്ശ': '\u00C8',
  'സ്ല': '\u00C9',
  'സ്സ': '\u00CA',
  'ഹ്ല': '\u00CB',
  'സ്റ്റ': '\u00CC',
  'ഡ്ഡ': '\u00CD',
  'ക്ട': '\u00CE',
  'ബ്ധ': '\u00CF',
  'ബ്ദ': '\u00D0',
  'ച്ഛ': '\u00D1',
  'ഹ്മ': '\u00D2',
  'ഹ്ന': '\u00D3',
  'ന്ധ': '\u00D4',
  'ത്സ': '\u00D5',
  'ജ്ജ': '\u00D6',
  'ണ്മ': '\u00D7',
  'സ്ഥ': '\u00D8',
  'ന്ഥ': '\u00D9',
  'ജ്ഞ': '\u00DA',
  'ത്ഭ': '\u00DB',
  'ഗ്മ': '\u00DC',
  'ശ്ച': '\u00DD',
  'ണ്ഡ': '\u00DE',
  'ത്മ': '\u00DF',
  'ക്ത': '\u00E0',
  'ഗ്ന': '\u00E1',
  'ന്റ': '\u00E2',
  'ഷ്ട': '\u00E3',
  '്യ': 'y',
  '്വ': 'z',
  '്ര': '{',
  '-': '\u00FE'
};

function setStatus(message, tone = 'neutral') {
  statusEl.textContent = message;
  if (tone === 'success' || tone === 'error') {
    statusEl.dataset.tone = tone;
  } else {
    delete statusEl.dataset.tone;
  }
}

function convertMalayalamToFml(text) {
  if (!text) {
    return '';
  }

  let index = 0;
  let modeFlag = 0;
  let output = '';

  while (index < text.length) {
    let matched = false;

    for (let size = 3; size > 0; size -= 1) {
      const token = text.substring(index, index + size);
      const mapped = MLTT_MAP[token];

      if (!mapped) {
        continue;
      }

      if (token === 'ൈ') {
        if (modeFlag === 1) {
          modeFlag = 0;
          output = output.substring(0, output.length - 2) + mapped + output[output.length - 2] + output[output.length - 1];
        } else {
          output = output.substring(0, output.length - 1) + mapped + output[output.length - 1];
        }
      } else if (token === 'ോ' || token === 'ൊ' || token === 'ൌ') {
        if (modeFlag === 1) {
          modeFlag = 0;
          output = output.substring(0, output.length - 2) + mapped[0] + output[output.length - 2] + output[output.length - 1] + mapped[1];
        } else {
          output = output.substring(0, output.length - 1) + mapped[0] + output[output.length - 1] + mapped[1];
        }
      } else if (token === '്യേ' || token === '്യെ') {
        modeFlag = 0;
        output = output.substring(0, output.length - 1) + mapped[0] + output[output.length - 1] + mapped[1];
      } else if (token === 'െ' || token === 'േ' || token === '്ര') {
        if (modeFlag === 1) {
          output = output.substring(0, output.length - 2) + mapped[0] + output[output.length - 2] + output[output.length - 1];
          modeFlag = 0;
        } else {
          output = output.substring(0, output.length - 1) + mapped[0] + output[output.length - 1];
        }

        if (token === '്ര') {
          modeFlag = 1;
        }
      } else {
        modeFlag = 0;
        output += mapped;
      }

      index += size;
      matched = true;
      break;
    }

    if (!matched) {
      output += text[index];
      index += 1;
      modeFlag = 0;
    }
  }

  return output;
}

function convertText() {
  const source = malayalamInput.value;

  if (!source.trim()) {
    fmlOutput.value = '';
    setStatus('Enter Malayalam Unicode text to convert.', 'error');
    return;
  }

  const converted = convertMalayalamToFml(source);
  fmlOutput.value = converted;
  autoResizeTextarea(fmlOutput);
  setStatus('Converted Malayalam Unicode text to ML TT keyboard code.', 'success');
}

async function copyOutput() {
  if (!fmlOutput.value.trim()) {
    setStatus('No converted output to copy.', 'error');
    return;
  }

  try {
    await navigator.clipboard.writeText(fmlOutput.value);
    setStatus('Output copied to clipboard.', 'success');
  } catch {
    fmlOutput.focus();
    fmlOutput.select();
    setStatus('Press Ctrl+C to copy output.', 'error');
  }
}

function clearAll() {
  malayalamInput.value = '';
  fmlOutput.value = '';
  autoResizeTextarea(malayalamInput);
  autoResizeTextarea(fmlOutput);
  setStatus('Cleared input and output.');
}

convertBtn.addEventListener('click', convertText);
copyBtn.addEventListener('click', copyOutput);
clearBtn.addEventListener('click', clearAll);

malayalamInput.addEventListener('input', () => {
  autoResizeTextarea(malayalamInput);

  if (malayalamInput.value.trim()) {
    fmlOutput.value = convertMalayalamToFml(malayalamInput.value);
    autoResizeTextarea(fmlOutput);
    setStatus('');
    return;
  }

  if (!malayalamInput.value.trim()) {
    fmlOutput.value = '';
    autoResizeTextarea(fmlOutput);
    setStatus('');
  }
});

autoResizeTextarea(malayalamInput);
autoResizeTextarea(fmlOutput);
