const categorySelect = document.getElementById('categorySelect');
const valueInput = document.getElementById('valueInput');
const fromUnit = document.getElementById('fromUnit');
const toUnit = document.getElementById('toUnit');
const convertBtn = document.getElementById('convertBtn');
const swapBtn = document.getElementById('swapBtn');
const copyBtn = document.getElementById('copyBtn');
const resetBtn = document.getElementById('resetBtn');
const primaryOutput = document.getElementById('primaryOutput');
const resultMeta = document.getElementById('resultMeta');
const fromValue = document.getElementById('fromValue');
const toValue = document.getElementById('toValue');
const categoryValue = document.getElementById('categoryValue');
const baseValue = document.getElementById('baseValue');
const statusEl = document.getElementById('status');

const UNIT_CATEGORIES = {
  length: {
    label: 'Length',
    base: 'm',
    units: [
      { value: 'm', label: 'Meter (m)', factor: 1 },
      { value: 'km', label: 'Kilometer (km)', factor: 1000 },
      { value: 'cm', label: 'Centimeter (cm)', factor: 0.01 },
      { value: 'mm', label: 'Millimeter (mm)', factor: 0.001 },
      { value: 'um', label: 'Micrometer (µm)', factor: 0.000001 },
      { value: 'mi', label: 'Mile (mi)', factor: 1609.344 },
      { value: 'yd', label: 'Yard (yd)', factor: 0.9144 },
      { value: 'ft', label: 'Foot (ft)', factor: 0.3048 },
      { value: 'in', label: 'Inch (in)', factor: 0.0254 },
      { value: 'nmi', label: 'Nautical Mile (nmi)', factor: 1852 },
    ],
  },
  mass: {
    label: 'Mass',
    base: 'g',
    units: [
      { value: 'g', label: 'Gram (g)', factor: 1 },
      { value: 'kg', label: 'Kilogram (kg)', factor: 1000 },
      { value: 'mg', label: 'Milligram (mg)', factor: 0.001 },
      { value: 't', label: 'Metric Ton (t)', factor: 1000000 },
      { value: 'lb', label: 'Pound (lb)', factor: 453.59237 },
      { value: 'oz', label: 'Ounce (oz)', factor: 28.349523125 },
    ],
  },
  speed: {
    label: 'Speed',
    base: 'm/s',
    units: [
      { value: 'mps', label: 'Meter / second (m/s)', factor: 1 },
      { value: 'kmh', label: 'Kilometer / hour (km/h)', factor: 1000 / 3600 },
      { value: 'mph', label: 'Mile / hour (mph)', factor: 1609.344 / 3600 },
      { value: 'fps', label: 'Foot / second (ft/s)', factor: 0.3048 },
      { value: 'knot', label: 'Knot', factor: 1852 / 3600 },
    ],
  },
  area: {
    label: 'Area',
    base: 'm2',
    units: [
      { value: 'm2', label: 'Square Meter (m²)', factor: 1 },
      { value: 'km2', label: 'Square Kilometer (km²)', factor: 1000000 },
      { value: 'cm2', label: 'Square Centimeter (cm²)', factor: 0.0001 },
      { value: 'mm2', label: 'Square Millimeter (mm²)', factor: 0.000001 },
      { value: 'ft2', label: 'Square Foot (ft²)', factor: 0.09290304 },
      { value: 'yd2', label: 'Square Yard (yd²)', factor: 0.83612736 },
      { value: 'acre', label: 'Acre', factor: 4046.8564224 },
      { value: 'ha', label: 'Hectare (ha)', factor: 10000 },
    ],
  },
  volume: {
    label: 'Volume',
    base: 'L',
    units: [
      { value: 'l', label: 'Liter (L)', factor: 1 },
      { value: 'ml', label: 'Milliliter (mL)', factor: 0.001 },
      { value: 'm3', label: 'Cubic Meter (m³)', factor: 1000 },
      { value: 'cm3', label: 'Cubic Centimeter (cm³)', factor: 0.001 },
      { value: 'ft3', label: 'Cubic Foot (ft³)', factor: 28.316846592 },
      { value: 'in3', label: 'Cubic Inch (in³)', factor: 0.016387064 },
      { value: 'gal', label: 'US Gallon', factor: 3.785411784 },
      { value: 'qt', label: 'US Quart', factor: 0.946352946 },
      { value: 'pt', label: 'US Pint', factor: 0.473176473 },
    ],
  },
  pressure: {
    label: 'Pressure',
    base: 'Pa',
    units: [
      { value: 'pa', label: 'Pascal (Pa)', factor: 1 },
      { value: 'kpa', label: 'Kilopascal (kPa)', factor: 1000 },
      { value: 'mpa', label: 'Megapascal (MPa)', factor: 1000000 },
      { value: 'bar', label: 'Bar', factor: 100000 },
      { value: 'psi', label: 'PSI', factor: 6894.757293168 },
      { value: 'atm', label: 'Atmosphere (atm)', factor: 101325 },
      { value: 'torr', label: 'Torr', factor: 133.3223684211 },
    ],
  },
  energy: {
    label: 'Energy',
    base: 'J',
    units: [
      { value: 'j', label: 'Joule (J)', factor: 1 },
      { value: 'kj', label: 'Kilojoule (kJ)', factor: 1000 },
      { value: 'cal', label: 'Calorie (cal)', factor: 4.184 },
      { value: 'kcal', label: 'Kilocalorie (kcal)', factor: 4184 },
      { value: 'wh', label: 'Watt-hour (Wh)', factor: 3600 },
      { value: 'kwh', label: 'Kilowatt-hour (kWh)', factor: 3600000 },
      { value: 'btu', label: 'BTU', factor: 1055.05585262 },
    ],
  },
  data: {
    label: 'Data',
    base: 'byte',
    units: [
      { value: 'b', label: 'Byte (B)', factor: 1 },
      { value: 'kb', label: 'Kilobyte (KB)', factor: 1000 },
      { value: 'kib', label: 'Kibibyte (KiB)', factor: 1024 },
      { value: 'mb', label: 'Megabyte (MB)', factor: 1000000 },
      { value: 'mib', label: 'Mebibyte (MiB)', factor: 1048576 },
      { value: 'gb', label: 'Gigabyte (GB)', factor: 1000000000 },
      { value: 'gib', label: 'Gibibyte (GiB)', factor: 1073741824 },
      { value: 'tb', label: 'Terabyte (TB)', factor: 1000000000000 },
      { value: 'tib', label: 'Tebibyte (TiB)', factor: 1099511627776 },
    ],
  },
  time: {
    label: 'Time',
    base: 's',
    units: [
      { value: 's', label: 'Second (s)', factor: 1 },
      { value: 'min', label: 'Minute (min)', factor: 60 },
      { value: 'h', label: 'Hour (h)', factor: 3600 },
      { value: 'd', label: 'Day (d)', factor: 86400 },
      { value: 'wk', label: 'Week (wk)', factor: 604800 },
    ],
  },
  force: {
    label: 'Force',
    base: 'N',
    units: [
      { value: 'n', label: 'Newton (N)', factor: 1 },
      { value: 'kn', label: 'Kilonewton (kN)', factor: 1000 },
      { value: 'dyn', label: 'Dyne (dyn)', factor: 0.00001 },
      { value: 'lbf', label: 'Pound-force (lbf)', factor: 4.4482216152605 },
    ],
  },
};

function setStatus(message, tone = 'neutral') {
  statusEl.textContent = message;
  if (tone === 'success' || tone === 'error') {
    statusEl.dataset.tone = tone;
  } else {
    delete statusEl.dataset.tone;
  }
}

function formatNumber(value) {
  if (!Number.isFinite(value)) {
    return '-';
  }
  const text =
    Math.abs(value) >= 1000000 || (Math.abs(value) > 0 && Math.abs(value) < 0.000001)
      ? value.toExponential(6)
      : value.toFixed(6);
  return text
    .replace(/\.0+([eE]|$)/, '$1')
    .replace(/(\.\d*?[1-9])0+([eE]|$)/, '$1$2')
    .replace(/\.0+$/, '');
}

function getCategory() {
  return UNIT_CATEGORIES[categorySelect.value] || UNIT_CATEGORIES.length;
}

function populateCategories() {
  categorySelect.innerHTML = '';
  Object.entries(UNIT_CATEGORIES).forEach(([key, category]) => {
    const option = document.createElement('option');
    option.value = key;
    option.textContent = category.label;
    categorySelect.appendChild(option);
  });
  categorySelect.value = 'length';
}

function populateUnits(preserveSelection = true) {
  const category = getCategory();
  const previousFrom = preserveSelection ? fromUnit.value : '';
  const previousTo = preserveSelection ? toUnit.value : '';

  fromUnit.innerHTML = '';
  toUnit.innerHTML = '';

  category.units.forEach((unit, index) => {
    const fromOption = document.createElement('option');
    fromOption.value = unit.value;
    fromOption.textContent = unit.label;
    fromUnit.appendChild(fromOption);

    const toOption = document.createElement('option');
    toOption.value = unit.value;
    toOption.textContent = unit.label;
    toUnit.appendChild(toOption);

    if (!preserveSelection && index === 0) {
      fromUnit.value = unit.value;
      toUnit.value = category.units[1] ? category.units[1].value : unit.value;
    }
  });

  if (preserveSelection && category.units.some((unit) => unit.value === previousFrom)) {
    fromUnit.value = previousFrom;
  } else {
    fromUnit.value = category.units[0]?.value || '';
  }

  if (preserveSelection && category.units.some((unit) => unit.value === previousTo)) {
    toUnit.value = previousTo;
  } else {
    toUnit.value = category.units[1]?.value || category.units[0]?.value || '';
  }
}

function convertValue() {
  const category = getCategory();
  const rawValue = valueInput.value.trim();

  if (!rawValue) {
    primaryOutput.textContent = '-';
    resultMeta.textContent = 'Enter a value to convert.';
    fromValue.textContent = '-';
    toValue.textContent = '-';
    categoryValue.textContent = category.label;
    baseValue.textContent = '-';
    setStatus('Enter a value to convert.');
    return;
  }

  const numericValue = Number(rawValue);
  if (!Number.isFinite(numericValue)) {
    primaryOutput.textContent = '-';
    resultMeta.textContent = 'Value is not a valid number.';
    setStatus('Enter a valid number.', 'error');
    return;
  }

  const from = category.units.find((unit) => unit.value === fromUnit.value);
  const to = category.units.find((unit) => unit.value === toUnit.value);
  if (!from || !to) {
    setStatus('Choose a valid unit pair.', 'error');
    return;
  }

  const baseValueNumeric = numericValue * from.factor;
  const converted = baseValueNumeric / to.factor;

  primaryOutput.textContent = `${formatNumber(converted)} ${to.label}`;
  resultMeta.textContent = `${from.label} to ${to.label}`;
  fromValue.textContent = `${formatNumber(numericValue)} ${from.label}`;
  toValue.textContent = `${formatNumber(converted)} ${to.label}`;
  categoryValue.textContent = category.label;
  baseValue.textContent = `${formatNumber(baseValueNumeric)} ${category.base}`;
  setStatus('Unit converted successfully.', 'success');
}

async function copyResult() {
  const output = primaryOutput.textContent.trim();
  if (!output || output === '-') {
    setStatus('Convert a value first.', 'error');
    return;
  }

  try {
    await navigator.clipboard.writeText(output);
    setStatus('Result copied to clipboard.', 'success');
  } catch {
    setStatus('Press Ctrl+C to copy the result.', 'error');
  }
}

function swapUnits() {
  const currentFrom = fromUnit.value;
  fromUnit.value = toUnit.value;
  toUnit.value = currentFrom;
  convertValue();
}

function resetConverter() {
  categorySelect.value = 'length';
  populateUnits(false);
  valueInput.value = '';
  convertValue();
}

populateCategories();
populateUnits(false);
convertBtn.addEventListener('click', convertValue);
swapBtn.addEventListener('click', swapUnits);
copyBtn.addEventListener('click', copyResult);
resetBtn.addEventListener('click', resetConverter);
categorySelect.addEventListener('change', () => {
  populateUnits(false);
  convertValue();
});
valueInput.addEventListener('input', convertValue);
fromUnit.addEventListener('change', convertValue);
toUnit.addEventListener('change', convertValue);
setStatus('Choose a category, then convert between common SI and FPS-style units.');
