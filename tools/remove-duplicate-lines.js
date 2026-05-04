const inputText = document.getElementById('inputText');
const outputText = document.getElementById('outputText');
const originalCount = document.getElementById('originalCount');
const uniqueCount = document.getElementById('uniqueCount');
const removeBtn = document.getElementById('removeBtn');
const clearBtn = document.getElementById('clearBtn');
const copyBtn = document.getElementById('copyBtn');

function removeDuplicates() {
  const lines = inputText.value.split('\n');
  const uniqueLines = [...new Set(lines)];

  originalCount.textContent = lines.length;
  uniqueCount.textContent = uniqueLines.length;
  outputText.value = uniqueLines.join('\n');
}

function copyOutput() {
  navigator.clipboard.writeText(outputText.value).then(() => {
    alert('Output copied to clipboard!');
  });
}

function clearText() {
  inputText.value = '';
  outputText.value = '';
  originalCount.textContent = '0';
  uniqueCount.textContent = '0';
}

inputText.addEventListener('input', () => {
  removeDuplicates();
});

removeBtn.addEventListener('click', removeDuplicates);
clearBtn.addEventListener('click', clearText);
copyBtn.addEventListener('click', copyOutput);
