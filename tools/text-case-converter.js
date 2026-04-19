const inputText = document.getElementById('inputText');
const outputArea = document.getElementById('outputArea');
const copyBtn = document.getElementById('copyBtn');
const caseButtons = document.querySelectorAll('[data-case]');

function convertCase(caseType) {
  const text = inputText.value;
  let result = text;

  switch (caseType) {
    case 'upper':
      result = text.toUpperCase();
      break;
    case 'lower':
      result = text.toLowerCase();
      break;
    case 'title':
      result = text.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
      break;
    case 'sentence':
      result = text.toLowerCase().replace(/[.!?]\s*([a-z])/g, (match, char) => match[0] + ' ' + char.toUpperCase());
      result = result.charAt(0).toUpperCase() + result.slice(1);
      break;
    case 'toggle':
      result = text.split('').map(char => char === char.toUpperCase() ? char.toLowerCase() : char.toUpperCase()).join('');
      break;
    case 'capitalize':
      result = text.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
      break;
  }

  outputArea.textContent = result;
}

function copyOutput() {
  navigator.clipboard.writeText(outputArea.textContent).then(() => {
    alert('Output copied to clipboard!');
  });
}

caseButtons.forEach((button) => {
  button.addEventListener('click', () => {
    convertCase(button.dataset.case);
  });
});

copyBtn.addEventListener('click', copyOutput);

