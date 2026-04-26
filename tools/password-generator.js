const passwordInput = document.getElementById('passwordInput');
const togglePassword = document.getElementById('togglePassword');
const generateBtn = document.getElementById('generateBtn');
const copyBtn = document.getElementById('copyBtn');
const clearBtn = document.getElementById('clearBtn');
const scoreValue = document.getElementById('scoreValue');
const scoreFill = document.getElementById('scoreFill');
const statusEl = document.getElementById('status');
const ruleList = document.getElementById('ruleList');

const ELEMENTS = ['H', 'He', 'Li', 'C', 'N', 'O', 'Na', 'Mg', 'Al', 'Si', 'P', 'S', 'Cl', 'K', 'Ca', 'Fe', 'Cu', 'Zn'];
const CITIES = [
  'Paris', 'Tokyo', 'London', 'Sydney', 'Dubai', 'Berlin', 'Toronto', 'Delhi', 'Seoul', 'Madrid',
  'Mumbai', 'Bengaluru', 'Chennai', 'Kolkata', 'Hyderabad', 'Pune', 'Ahmedabad', 'Jaipur',
  'Lucknow', 'Surat', 'Kochi', 'Goa', 'Amritsar', 'Varanasi', 'NewYork', 'LosAngeles', 'Chicago',
  'Houston', 'Phoenix', 'Boston', 'SanDiego', 'Seattle', 'Atlanta', 'Miami', 'MexicoCity',
  'SaoPaulo', 'BuenosAires', 'Lima', 'Bogota', 'Lisbon', 'Rome', 'Milan', 'Vienna', 'Prague',
  'Warsaw', 'Budapest', 'Amsterdam', 'Brussels', 'Copenhagen', 'Stockholm', 'Oslo', 'Helsinki',
  'Istanbul', 'Cairo', 'Nairobi', 'Johannesburg', 'Lagos', 'Riyadh', 'Doha', 'Muscat', 'Tehran',
  'Bangkok', 'Singapore', 'KualaLumpur', 'Jakarta', 'Manila', 'HongKong', 'Beijing', 'Shanghai',
  'Shenzhen', 'Taipei', 'Melbourne', 'Auckland'
];
const NAMES = [
  'Alex', 'Emma', 'Noah', 'Mia', 'Liam', 'Aria', 'Ethan', 'Zoe', 'Mason', 'Luna',
  'Ava', 'Sophia', 'Olivia', 'Amelia', 'Isabella', 'Harper', 'Charlotte', 'Elijah', 'James', 'Lucas',
  'Benjamin', 'Henry', 'Leo', 'Jack', 'Oscar', 'Aiden', 'Maya', 'Nora', 'Layla', 'Chloe',
  'Riya', 'Aarav', 'Vihaan', 'Anaya', 'Isha', 'Aditi', 'Kabir', 'Aditya', 'Neha', 'Priya',
  'Rahul', 'Arjun', 'Karan', 'Rohan', 'Ishan', 'Aryan', 'Ananya', 'Meera', 'Diya', 'Pooja',
  'Sneha', 'Nikhil', 'Saanvi', 'Tanvi', 'Aisha', 'Fatima', 'Sara', 'Ali', 'Omar', 'Yusuf',
  'Daniel', 'David', 'Michael', 'Joseph', 'Samuel', 'Anthony', 'Christopher', 'Sofia', 'Elena', 'Ariana'
];
const SYMBOLS = ['!', '@', '#', '$', '%', '&', '*', '+', '?'];

const normalizedCityTokens = CITIES.map((city) => city.toLowerCase());
const normalizedNameTokens = NAMES.map((name) => name.toLowerCase());

function extractLetterTokens(password) {
  const chunks = password.match(/[A-Za-z]+/g) || [];
  const tokens = [];

  chunks.forEach((chunk) => {
    const camelParts = chunk.match(/[A-Z]?[a-z]+|[A-Z]+(?![a-z])/g) || [chunk];
    camelParts.forEach((part) => {
      if (part.length >= 2) {
        tokens.push(part.toLowerCase());
      }
    });

    if (chunk.length >= 3) {
      tokens.push(chunk.toLowerCase());
    }
  });

  return Array.from(new Set(tokens));
}

function fuzzyIncludesToken(token, vocabulary, minTokenLength = 4) {
  if (!token || token.length < minTokenLength) {
    return false;
  }

  return vocabulary.some((word) => {
    if (word === token) {
      return true;
    }

    const minPrefix = Math.min(word.length, token.length);
    if (minPrefix < minTokenLength) {
      return false;
    }

    return word.startsWith(token) || token.startsWith(word);
  });
}

function looksLikePersonalName(token) {
  if (!token || token.length < 3 || token.length > 14) {
    return false;
  }

  if (!/[aeiou]/.test(token)) {
    return false;
  }

  if (/^(.)\1+$/.test(token)) {
    return false;
  }

  return !ELEMENTS.some((element) => token === element.toLowerCase());
}

function setStatus(message, tone = 'neutral') {
  statusEl.textContent = message;
  if (tone === 'success' || tone === 'error') {
    statusEl.dataset.tone = tone;
  } else {
    delete statusEl.dataset.tone;
  }
}

function randomItem(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function randomDigits(length) {
  let output = '';
  for (let index = 0; index < length; index += 1) {
    output += String(Math.floor(Math.random() * 10));
  }
  return output;
}

function randomLetters(length) {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  let output = '';
  for (let index = 0; index < length; index += 1) {
    output += chars[Math.floor(Math.random() * chars.length)];
  }
  return output;
}

function evaluatePassword(password) {
  const normalized = password.toLowerCase();
  const letterTokens = extractLetterTokens(password);

  const hasElement = ELEMENTS.some((element) => normalized.includes(element.toLowerCase()));
  const hasCity = letterTokens.some((token) => fuzzyIncludesToken(token, normalizedCityTokens, 4));
  const hasKnownName = letterTokens.some((token) => fuzzyIncludesToken(token, normalizedNameTokens, 3));
  const hasHeuristicName = letterTokens.some((token) => looksLikePersonalName(token) && !fuzzyIncludesToken(token, normalizedCityTokens, 4));
  const hasName = hasKnownName || hasHeuristicName;
  const digitCount = (password.match(/\d/g) || []).length;

  const results = {
    length: password.length >= 14,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    digit: digitCount >= 2,
    symbol: /[^A-Za-z0-9\s]/.test(password),
    element: hasElement,
    city: hasCity,
    name: hasName,
    noSpace: !/\s/.test(password)
  };

  const score = [
    results.length,
    results.upper,
    results.lower,
    results.digit,
    results.symbol,
    results.element,
    results.city,
    results.name
  ].filter(Boolean).length;

  const isStrong = score === 8 && results.noSpace;

  return { results, score, isStrong };
}

function updateRuleUI(results) {
  const ruleItems = ruleList.querySelectorAll('.rule-item[data-rule]');
  ruleItems.forEach((item) => {
    const ruleKey = item.dataset.rule;
    if (results[ruleKey]) {
      item.classList.add('pass');
    } else {
      item.classList.remove('pass');
    }
  });
}

function updateStrength() {
  const password = passwordInput.value;
  const evaluation = evaluatePassword(password);
  const percent = Math.round((evaluation.score / 8) * 100);

  scoreValue.textContent = `${evaluation.score} / 8`;
  scoreFill.style.width = `${percent}%`;
  updateRuleUI(evaluation.results);

  copyBtn.disabled = !evaluation.isStrong;

  if (!password) {
    setStatus('Start typing to validate your password against all rules.');
    return;
  }

  if (!evaluation.results.noSpace) {
    setStatus('Spaces are not allowed in this password game.', 'error');
    return;
  }

  if (evaluation.isStrong) {
    setStatus('Strong password unlocked. You can copy it now.', 'success');
  } else {
    setStatus('Keep going. All 8 rules must pass before copy is enabled.');
  }
}

function generateStrongPassword() {
  const name = randomItem(NAMES);
  const city = randomItem(CITIES);
  const element = randomItem(ELEMENTS);
  const symbol = randomItem(SYMBOLS);

  // Ensures every rule passes while still looking human-readable.
  const candidate = `${name}${randomDigits(2)}${symbol}${city}${element}${randomLetters(3)}`;

  passwordInput.value = candidate;
  updateStrength();
  setStatus('Generated a strong password candidate.', 'success');
}

function copyStrongPassword() {
  const password = passwordInput.value;
  const evaluation = evaluatePassword(password);

  if (!evaluation.isStrong) {
    setStatus('Copy is locked until all strong rules are satisfied.', 'error');
    return;
  }

  navigator.clipboard.writeText(password).then(() => {
    setStatus('Strong password copied to clipboard.', 'success');
  }).catch(() => {
    setStatus('Could not copy password. Please copy manually.', 'error');
  });
}

function clearPassword() {
  passwordInput.value = '';
  updateStrength();
}

togglePassword.addEventListener('click', () => {
  const isHidden = passwordInput.type === 'password';
  passwordInput.type = isHidden ? 'text' : 'password';
  togglePassword.textContent = isHidden ? '🙈' : '👁';
});

passwordInput.addEventListener('input', updateStrength);
generateBtn.addEventListener('click', generateStrongPassword);
copyBtn.addEventListener('click', copyStrongPassword);
clearBtn.addEventListener('click', clearPassword);

updateStrength();
