const textInput = document.getElementById('textInput');
const wordCountEl = document.getElementById('wordCount');
const charCountEl = document.getElementById('charCount');
const sentenceCountEl = document.getElementById('sentenceCount');
const paragraphCountEl = document.getElementById('paragraphCount');
const copyBtn = document.getElementById('copyBtn');
const clearBtn = document.getElementById('clearBtn');

function updateStats() {
  const text = textInput.value;
  
  // Word count
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  wordCountEl.textContent = words;
  
  // Character count
  charCountEl.textContent = text.length;
  
  // Sentence count
  const sentences = text.trim() ? (text.match(/[.!?]+/g) || []).length : 0;
  sentenceCountEl.textContent = sentences;
  
  // Paragraph count
  const paragraphs = text.trim() ? text.trim().split(/\n\n+/).length : 0;
  paragraphCountEl.textContent = paragraphs;
}

function copyStats() {
  const stats = `Words: ${wordCountEl.textContent}\nCharacters: ${charCountEl.textContent}\nSentences: ${sentenceCountEl.textContent}\nParagraphs: ${paragraphCountEl.textContent}`;
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
