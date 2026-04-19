const inputText = document.getElementById('inputText');
const outputText = document.getElementById('outputText');
const sortButtons = document.querySelectorAll('[data-sort]');
const copyBtn = document.getElementById('copyBtn');
const clearBtn = document.getElementById('clearBtn');

function sortText(sortType) {
  const lines = inputText.value.split('\n');
  let sorted = [...lines];

  switch (sortType) {
    case 'asc':
      sorted.sort((a, b) => a.localeCompare(b));
      break;
    case 'desc':
      sorted.sort((a, b) => b.localeCompare(a));
      break;
    case 'length':
      sorted.sort((a, b) => a.length - b.length);
      break;
    case 'reverse':
      sorted.reverse();
      break;
  }

  outputText.value = sorted.join('\n');
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

sortButtons.forEach((button) => {
  button.addEventListener('click', () => {
    sortText(button.dataset.sort);
  });
});

copyBtn.addEventListener('click', copyOutput);
clearBtn.addEventListener('click', clearText);
