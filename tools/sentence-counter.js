const textInput = document.getElementById('textInput');
const copyBtn = document.getElementById('copyBtn');
const clearBtn = document.getElementById('clearBtn');

function updateStats() {
  const text = textInput.value.trim();

  // Count sentences (. ! ?)
  const sentences = text ? (text.match(/[.!?]+/g) || []).length : 0;

  // Count words
  const words = text ? text.split(/\s+/).length : 0;

  // Average words per sentence
  const avgWords = sentences > 0 ? (words / sentences).toFixed(1) : 0;

  // Reading time (200 words per minute average)
  const readingTime = Math.ceil(words / 200) || 0;

  document.getElementById('sentenceCount').textContent = sentences;
  document.getElementById('wordCount').textContent = words;
  document.getElementById('avgWords').textContent = avgWords;
  document.getElementById('readingTime').textContent = readingTime;
}

function copyStats() {
  const stats = `Sentences: ${document.getElementById('sentenceCount').textContent}\nWords: ${document.getElementById('wordCount').textContent}\nAvg Words/Sentence: ${document.getElementById('avgWords').textContent}\nReading Time: ${document.getElementById('readingTime').textContent} min`;
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
