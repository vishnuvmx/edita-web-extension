const monthlyInvestmentInput = document.getElementById('monthlyInvestment');
const annualReturnInput = document.getElementById('annualReturn');
const investmentYearsInput = document.getElementById('investmentYears');
const calculateBtn = document.getElementById('calculateBtn');
const resetBtn = document.getElementById('resetBtn');
const investedAmountEl = document.getElementById('investedAmount');
const estimatedReturnsEl = document.getElementById('estimatedReturns');
const maturityValueEl = document.getElementById('maturityValue');
const chartBox = document.getElementById('chartBox');
const chartSvgWrap = document.getElementById('chartSvgWrap');
const chartTooltip = document.getElementById('chartTooltip');
const statusEl = document.getElementById('status');

function setStatus(message, tone = 'neutral') {
  statusEl.textContent = message;
  if (tone === 'success' || tone === 'error') {
    statusEl.dataset.tone = tone;
  } else {
    delete statusEl.dataset.tone;
  }
}

function toCurrency(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(value);
}

function toCompactCurrency(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    notation: 'compact',
    maximumFractionDigits: 1
  }).format(value);
}

function parsePositiveNumber(rawValue, fallback) {
  const numeric = Number.parseFloat(rawValue);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return fallback;
  }
  return numeric;
}

function calculateFutureValue(monthlyInvestment, annualReturn, years) {
  const months = Math.round(years * 12);
  const monthlyRate = annualReturn / 12 / 100;

  if (monthlyRate === 0) {
    return monthlyInvestment * months;
  }

  const compounded = (Math.pow(1 + monthlyRate, months) - 1) / monthlyRate;
  return monthlyInvestment * compounded * (1 + monthlyRate);
}

function buildYearlySeries(monthlyInvestment, annualReturn, years) {
  const maxYears = Math.max(1, Math.round(years));
  const series = [];

  for (let year = 1; year <= maxYears; year += 1) {
    const invested = monthlyInvestment * year * 12;
    const value = calculateFutureValue(monthlyInvestment, annualReturn, year);
    series.push({ year, invested, value });
  }

  return series;
}

function renderChart(series) {
  if (!series.length) {
    chartSvgWrap.innerHTML = '<div class="chart-empty">Enter values and calculate to see chart.</div>';
    chartTooltip.dataset.visible = 'false';
    chartTooltip.setAttribute('aria-hidden', 'true');
    return;
  }

  const width = 640;
  const height = 300;
  const paddingTop = 20;
  const paddingRight = 18;
  const paddingBottom = 40;
  const paddingLeft = 60;
  const plotWidth = width - paddingLeft - paddingRight;
  const plotHeight = height - paddingTop - paddingBottom;

  const maxValueBase = Math.max(
    ...series.map((point) => point.value),
    ...series.map((point) => point.invested)
  );
  const maxValue = maxValueBase * 1.08;

  const toX = (index) => {
    if (series.length === 1) {
      return paddingLeft + plotWidth / 2;
    }
    return paddingLeft + (index / (series.length - 1)) * plotWidth;
  };

  const toY = (value) => paddingTop + (1 - value / maxValue) * plotHeight;

  const chartPoints = series.map((point, index) => ({
    ...point,
    x: toX(index),
    investedY: toY(point.invested),
    valueY: toY(point.value)
  }));

  const investedPath = chartPoints
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.investedY.toFixed(2)}`)
    .join(' ');

  const maturityPath = chartPoints
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.valueY.toFixed(2)}`)
    .join(' ');

  const areaPath = [
    `M ${chartPoints[0].x.toFixed(2)} ${(height - paddingBottom).toFixed(2)}`,
    ...chartPoints.map((point) => `L ${point.x.toFixed(2)} ${point.valueY.toFixed(2)}`),
    `L ${chartPoints[chartPoints.length - 1].x.toFixed(2)} ${(height - paddingBottom).toFixed(2)}`,
    'Z'
  ].join(' ');

  const horizontalGuides = 5;
  let guides = '';
  for (let step = 0; step <= horizontalGuides; step += 1) {
    const y = paddingTop + (step / horizontalGuides) * plotHeight;
    const guideValue = maxValue * (1 - step / horizontalGuides);
    guides += `<line x1="${paddingLeft}" y1="${y.toFixed(2)}" x2="${(width - paddingRight).toFixed(2)}" y2="${y.toFixed(2)}" stroke="#dbeafe" stroke-width="1"></line>`;
    guides += `<text x="${paddingLeft - 8}" y="${(y + 4).toFixed(2)}" text-anchor="end" font-size="10" fill="#64748b">${toCompactCurrency(guideValue)}</text>`;
  }

  const tickCount = Math.min(5, chartPoints.length);
  const xTickIndexes = [];
  for (let tick = 0; tick < tickCount; tick += 1) {
    const ratio = tickCount === 1 ? 0 : tick / (tickCount - 1);
    const pointIndex = Math.round(ratio * (chartPoints.length - 1));
    if (!xTickIndexes.includes(pointIndex)) {
      xTickIndexes.push(pointIndex);
    }
  }

  const xTicks = xTickIndexes
    .map((index) => {
      const point = chartPoints[index];
      return `<text x="${point.x.toFixed(2)}" y="${height - 10}" text-anchor="middle" font-size="10" fill="#64748b">Y${point.year}</text>`;
    })
    .join('');

  const markerIndexes = [0, Math.floor((chartPoints.length - 1) / 2), chartPoints.length - 1]
    .filter((index, pos, all) => all.indexOf(index) === pos);

  const markerDots = markerIndexes
    .map((index) => {
      const point = chartPoints[index];
      return `
        <circle cx="${point.x.toFixed(2)}" cy="${point.investedY.toFixed(2)}" r="4" fill="#14b8a6" stroke="#ffffff" stroke-width="2"></circle>
        <circle cx="${point.x.toFixed(2)}" cy="${point.valueY.toFixed(2)}" r="4" fill="#047857" stroke="#ffffff" stroke-width="2"></circle>
      `;
    })
    .join('');

  chartSvgWrap.innerHTML = `
    <svg id="sipChartSvg" viewBox="0 0 ${width} ${height}" role="img" aria-label="SIP growth chart">
      <defs>
        <linearGradient id="growthArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#10b981" stop-opacity="0.26"></stop>
          <stop offset="100%" stop-color="#10b981" stop-opacity="0.03"></stop>
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="${width}" height="${height}" rx="10" ry="10" fill="#f8fafc"></rect>
      ${guides}
      <line x1="${paddingLeft}" y1="${(height - paddingBottom).toFixed(2)}" x2="${(width - paddingRight).toFixed(2)}" y2="${(height - paddingBottom).toFixed(2)}" stroke="#cbd5e1" stroke-width="1.2"></line>
      <line x1="${paddingLeft}" y1="${paddingTop}" x2="${paddingLeft}" y2="${(height - paddingBottom).toFixed(2)}" stroke="#cbd5e1" stroke-width="1.2"></line>
      <path d="${areaPath}" fill="url(#growthArea)"></path>
      <path d="${investedPath}" fill="none" stroke="#14b8a6" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"></path>
      <path d="${maturityPath}" fill="none" stroke="#047857" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"></path>
      ${markerDots}
      <line id="hoverLine" x1="${paddingLeft}" y1="${paddingTop}" x2="${paddingLeft}" y2="${(height - paddingBottom).toFixed(2)}" stroke="#0f172a" stroke-width="1" stroke-dasharray="4 4" opacity="0"></line>
      <circle id="hoverInvested" cx="${paddingLeft}" cy="${(height - paddingBottom).toFixed(2)}" r="5" fill="#14b8a6" stroke="#ffffff" stroke-width="2" opacity="0"></circle>
      <circle id="hoverValue" cx="${paddingLeft}" cy="${(height - paddingBottom).toFixed(2)}" r="5" fill="#047857" stroke="#ffffff" stroke-width="2" opacity="0"></circle>
      ${xTicks}
      <text x="${(paddingLeft + plotWidth / 2).toFixed(2)}" y="${height - 24}" text-anchor="middle" font-size="10" fill="#94a3b8">Investment duration (years)</text>
      <rect id="hoverArea" x="${paddingLeft}" y="${paddingTop}" width="${plotWidth}" height="${plotHeight}" fill="transparent" style="cursor: crosshair;"></rect>
    </svg>
  `;

  const svg = document.getElementById('sipChartSvg');
  const hoverArea = document.getElementById('hoverArea');
  const hoverLine = document.getElementById('hoverLine');
  const hoverInvested = document.getElementById('hoverInvested');
  const hoverValue = document.getElementById('hoverValue');

  function hideHover() {
    hoverLine.setAttribute('opacity', '0');
    hoverInvested.setAttribute('opacity', '0');
    hoverValue.setAttribute('opacity', '0');
    chartTooltip.dataset.visible = 'false';
    chartTooltip.setAttribute('aria-hidden', 'true');
  }

  function showHover(event) {
    const rect = svg.getBoundingClientRect();
    const xInSvg = ((event.clientX - rect.left) / rect.width) * width;
    const clampedX = Math.max(paddingLeft, Math.min(width - paddingRight, xInSvg));

    let closestIndex = 0;
    let minDistance = Number.POSITIVE_INFINITY;

    chartPoints.forEach((point, index) => {
      const distance = Math.abs(point.x - clampedX);
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = index;
      }
    });

    const activePoint = chartPoints[closestIndex];
    const estimatedReturn = activePoint.value - activePoint.invested;

    hoverLine.setAttribute('x1', activePoint.x.toFixed(2));
    hoverLine.setAttribute('x2', activePoint.x.toFixed(2));
    hoverLine.setAttribute('opacity', '1');

    hoverInvested.setAttribute('cx', activePoint.x.toFixed(2));
    hoverInvested.setAttribute('cy', activePoint.investedY.toFixed(2));
    hoverInvested.setAttribute('opacity', '1');

    hoverValue.setAttribute('cx', activePoint.x.toFixed(2));
    hoverValue.setAttribute('cy', activePoint.valueY.toFixed(2));
    hoverValue.setAttribute('opacity', '1');

    chartTooltip.innerHTML = `
      <strong>Year ${activePoint.year}</strong>
      <div>Invested: ${toCurrency(activePoint.invested)}</div>
      <div>Value: ${toCurrency(activePoint.value)}</div>
      <div>Returns: ${toCurrency(Math.max(0, estimatedReturn))}</div>
    `;

    const chartRect = chartBox.getBoundingClientRect();
    const tooltipWidth = chartTooltip.offsetWidth || 160;
    const tooltipHeight = chartTooltip.offsetHeight || 86;
    const left = Math.min(
      chartRect.width - tooltipWidth - 8,
      Math.max(8, event.clientX - chartRect.left + 12)
    );
    const top = Math.max(8, Math.min(chartRect.height - tooltipHeight - 8, event.clientY - chartRect.top - tooltipHeight - 8));

    chartTooltip.style.left = `${left}px`;
    chartTooltip.style.top = `${top}px`;
    chartTooltip.dataset.visible = 'true';
    chartTooltip.setAttribute('aria-hidden', 'false');
  }

  hideHover();
  hoverArea.addEventListener('mousemove', showHover);
  hoverArea.addEventListener('mouseleave', hideHover);
  hoverArea.addEventListener('touchstart', (event) => {
    if (event.touches && event.touches[0]) {
      showHover(event.touches[0]);
    }
  }, { passive: true });
  hoverArea.addEventListener('touchmove', (event) => {
    if (event.touches && event.touches[0]) {
      showHover(event.touches[0]);
    }
  }, { passive: true });
  hoverArea.addEventListener('touchend', hideHover, { passive: true });
}

function updateResults() {
  const monthlyInvestment = parsePositiveNumber(monthlyInvestmentInput.value, 5000);
  const annualReturn = parsePositiveNumber(annualReturnInput.value, 12);
  const years = parsePositiveNumber(investmentYearsInput.value, 10);

  monthlyInvestmentInput.value = String(Math.round(monthlyInvestment));
  annualReturnInput.value = String(Number(annualReturn.toFixed(2)));
  investmentYearsInput.value = String(Math.round(years));

  const totalMonths = Math.round(years) * 12;
  const investedAmount = monthlyInvestment * totalMonths;
  const maturityValue = calculateFutureValue(monthlyInvestment, annualReturn, Math.round(years));
  const estimatedReturns = maturityValue - investedAmount;

  investedAmountEl.textContent = toCurrency(investedAmount);
  estimatedReturnsEl.textContent = toCurrency(Math.max(0, estimatedReturns));
  maturityValueEl.textContent = toCurrency(maturityValue);

  renderChart(buildYearlySeries(monthlyInvestment, annualReturn, Math.round(years)));
  setStatus('SIP estimate updated.', 'success');
}

function resetCalculator() {
  monthlyInvestmentInput.value = '5000';
  annualReturnInput.value = '12';
  investmentYearsInput.value = '10';
  updateResults();
  setStatus('Defaults restored.', 'success');
}

calculateBtn.addEventListener('click', updateResults);
resetBtn.addEventListener('click', resetCalculator);

[monthlyInvestmentInput, annualReturnInput, investmentYearsInput].forEach((input) => {
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      updateResults();
    }
  });
});

updateResults();