const textInput = document.getElementById('textInput');
const copyBtn = document.getElementById('copyBtn');
const clearBtn = document.getElementById('clearBtn');

function updateStats() {
  const text = textInput.value;

  document.getElementById('totalCount').textContent = text.length;
  document.getElementById('spaceCount').textContent = (text.match(/ /g) || []).length;
  document.getElementById('letterCount').textContent = (text.match(/[a-zA-Z]/g) || []).length;
  document.getElementById('digitCount').textContent = (text.match(/\d/g) || []).length;

  const letters = (text.match(/[a-zA-Z]/g) || []).length;
  const digits = (text.match(/\d/g) || []).length;
  const spaces = (text.match(/ /g) || []).length;
  const symbols = text.length - letters - digits - spaces;

  document.getElementById('symbolCount').textContent = Math.max(0, symbols);
  document.getElementById('lineCount').textContent = text.trim() ? text.split('\n').length : 0;
}

function copyStats() {
  const stats = `Total Characters: ${document.getElementById('totalCount').textContent}\nSpaces: ${document.getElementById('spaceCount').textContent}\nLetters: ${document.getElementById('letterCount').textContent}\nDigits: ${document.getElementById('digitCount').textContent}\nSymbols: ${document.getElementById('symbolCount').textContent}\nLines: ${document.getElementById('lineCount').textContent}`;
  navigator.clipboard.writeText(stats).then(() => {
    alert('Statistics copied to clipboard!');
  });
}

function clearText() {
  textInput.value = '';
  updateStats();
}

textInput.addEventListener('input', updateStats);
copyBtn.addEventListener('click', copyStats);
clearBtn.addEventListener('click', clearText);

updateStats();
