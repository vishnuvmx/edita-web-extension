const localZoneEl = document.getElementById('localZone');
const localTimeEl = document.getElementById('localTime');
const localOffsetEl = document.getElementById('localOffset');
const timezoneListEl = document.getElementById('timezoneList');
const matchRowsEl = document.getElementById('matchRows');
const statusEl = document.getElementById('status');

const LOCATIONS = [
  { label: 'India - New Delhi', zone: 'Asia/Kolkata' },
  { label: 'United Kingdom - London', zone: 'Europe/London' },
  { label: 'United Arab Emirates - Dubai', zone: 'Asia/Dubai' },
  { label: 'Japan - Tokyo', zone: 'Asia/Tokyo' },
  { label: 'Singapore - Singapore', zone: 'Asia/Singapore' },
  { label: 'Australia - Sydney', zone: 'Australia/Sydney' },
  { label: 'Germany - Berlin', zone: 'Europe/Berlin' },
  { label: 'South Africa - Johannesburg', zone: 'Africa/Johannesburg' },
  { label: 'United States - New York', zone: 'America/New_York' },
  { label: 'United States - Los Angeles', zone: 'America/Los_Angeles' },
  { label: 'Canada - Toronto', zone: 'America/Toronto' },
  { label: 'Brazil - Sao Paulo', zone: 'America/Sao_Paulo' }
];

function setStatus(message, tone = 'neutral') {
  statusEl.textContent = message;
  if (tone === 'success' || tone === 'error') {
    statusEl.dataset.tone = tone;
  } else {
    delete statusEl.dataset.tone;
  }
}

function toGmtLabel(timeZone) {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    timeZoneName: 'shortOffset',
    hour: '2-digit',
    minute: '2-digit'
  });

  const parts = formatter.formatToParts(now);
  const zonePart = parts.find((part) => part.type === 'timeZoneName');
  if (!zonePart || !zonePart.value) {
    return 'GMT+00:00';
  }

  const raw = zonePart.value.replace('UTC', 'GMT');
  if (raw === 'GMT') {
    return 'GMT+00:00';
  }

  const match = raw.match(/^GMT([+-])(\d{1,2})(?::(\d{2}))?$/);
  if (!match) {
    return raw;
  }

  const sign = match[1];
  const hour = String(match[2]).padStart(2, '0');
  const minute = String(match[3] || '00').padStart(2, '0');
  return `GMT${sign}${hour}:${minute}`;
}

function gmtLabelToMinutes(label) {
  const match = label.match(/^GMT([+-])(\d{2}):(\d{2})$/);
  if (!match) {
    return 0;
  }
  const sign = match[1] === '+' ? 1 : -1;
  const hours = Number.parseInt(match[2], 10);
  const minutes = Number.parseInt(match[3], 10);
  return sign * ((hours * 60) + minutes);
}

function formatDifference(targetMinutes, localMinutes) {
  const diff = targetMinutes - localMinutes;
  if (diff === 0) {
    return 'Same time';
  }

  const abs = Math.abs(diff);
  const hours = Math.floor(abs / 60);
  const minutes = abs % 60;
  const prefix = diff > 0 ? '+' : '-';
  return `${prefix}${hours}h ${String(minutes).padStart(2, '0')}m`;
}

function formatTimeForZone(timeZone) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    weekday: 'short'
  }).format(new Date());
}

function createLocationCheckbox(location, checked = false) {
  const label = document.createElement('label');
  label.className = 'timezone-item';

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.value = location.zone;
  checkbox.dataset.label = location.label;
  checkbox.checked = checked;

  const text = document.createElement('span');
  text.textContent = `${location.label} (${location.zone})`;

  label.appendChild(checkbox);
  label.appendChild(text);
  return label;
}

function renderLocationList() {
  timezoneListEl.innerHTML = '';

  LOCATIONS.forEach((location, index) => {
    const row = createLocationCheckbox(location, index < 4);
    timezoneListEl.appendChild(row);
  });

  timezoneListEl.addEventListener('change', updateMatches);
}

function updateLocalCard(localZone) {
  const localTime = formatTimeForZone(localZone);
  const localOffset = toGmtLabel(localZone);

  localZoneEl.textContent = `Time Zone: ${localZone}`;
  localTimeEl.textContent = `Current Time: ${localTime}`;
  localOffsetEl.textContent = `GMT Offset: ${localOffset}`;
}

function getSelectedLocations() {
  const checkboxes = timezoneListEl.querySelectorAll('input[type="checkbox"]:checked');
  return Array.from(checkboxes).map((checkbox) => ({
    zone: checkbox.value,
    label: checkbox.dataset.label || checkbox.value
  }));
}

function updateMatches() {
  const localZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const localOffset = toGmtLabel(localZone);
  const localMinutes = gmtLabelToMinutes(localOffset);

  updateLocalCard(localZone);

  const selected = getSelectedLocations();
  matchRowsEl.innerHTML = '';

  if (selected.length === 0) {
    const emptyRow = document.createElement('tr');
    emptyRow.innerHTML = '<td colspan="4">Select at least one location to compare times.</td>';
    matchRowsEl.appendChild(emptyRow);
    setStatus('No location selected.', 'error');
    return;
  }

  selected.forEach((item) => {
    const offsetLabel = toGmtLabel(item.zone);
    const offsetMinutes = gmtLabelToMinutes(offsetLabel);
    const timeText = formatTimeForZone(item.zone);
    const difference = formatDifference(offsetMinutes, localMinutes);

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${item.label}</td>
      <td>${timeText}</td>
      <td><span class="tag">${offsetLabel}</span></td>
      <td>${difference}</td>
    `;
    matchRowsEl.appendChild(row);
  });

  setStatus('Times are synced to your current local timezone.', 'success');
}

renderLocationList();
updateMatches();
setInterval(updateMatches, 1000);
