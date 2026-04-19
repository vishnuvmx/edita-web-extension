const inputText = document.getElementById('inputText');
const outputText = document.getElementById('outputText');
const cleanButtons = document.querySelectorAll('[data-clean]');
const copyBtn = document.getElementById('copyBtn');
const clearBtn = document.getElementById('clearBtn');

function cleanText(cleanType) {
  let text = inputText.value;
  let result = text;

  switch (cleanType) {
    case 'trim':
      result = text.split('\n').map(line => line.trim()).join('\n');
      break;
    case 'blank':
      result = text.split('\n').filter(line => line.trim() !== '').join('\n');
      break;
    case 'extra':
      result = text.replace(/\s+/g, ' ').trim();
      break;
    case 'special':
      result = text.replace(/[^\w\s.!?,;:\-'\"]/g, '');
      break;
    case 'numbers':
      result = text.replace(/\d+/g, '');
      break;
    case 'newlines':
      result = text.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
      break;
  }

  outputText.value = result;
}

function copyOutput() {
  navigator.clipboard.writeText(outputText.value).then(() => {
    alert('Output copied to clipboard!');
  });
}

function clearText() {
  inputText.value = '';
  outputText.value = '';
}

cleanButtons.forEach((button) => {
  button.addEventListener('click', () => {
    cleanText(button.dataset.clean);
  });
});

copyBtn.addEventListener('click', copyOutput);
clearBtn.addEventListener('click', clearText);
