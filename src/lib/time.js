/**
 * Time & Date utilities with custom Day Cutoff support (default: 04:00 AM).
 * If a session runs between 00:00 and 03:59, it still belongs to the previous logical day.
 */

export const DEFAULT_CUTOFF_HOUR = 4; // 04:00 AM

/**
 * Get the logical date string (YYYY-MM-DD) for a given timestamp/Date,
 * taking into account the cutoff hour (e.g. 4 AM).
 */
export function getLogicalDateString(dateInput = new Date(), cutoffHour = DEFAULT_CUTOFF_HOUR) {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';

  // If before cutoff hour, shift back by 1 day
  if (d.getHours() < cutoffHour) {
    d.setDate(d.getDate() - 1);
  }

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get the start and end Date objects for a logical day string (YYYY-MM-DD).
 * For example '2026-10-05' with cutoff 4 -> 2026-10-05 04:00:00 to 2026-10-06 03:59:59.999
 */
export function getLogicalDayBounds(dateStr, cutoffHour = DEFAULT_CUTOFF_HOUR) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const start = new Date(y, m - 1, d, cutoffHour, 0, 0, 0);
  const end = new Date(y, m - 1, d + 1, cutoffHour, 0, 0, 0);
  return { start, end };
}

/**
 * Splits a single session [start, end] into segments divided at the cutoff hour (04:00 AM).
 * Returns array of { logicalDate: 'YYYY-MM-DD', durationMs, start, end }
 */
export function splitSessionByLogicalDay(sessionStart, sessionEnd, cutoffHour = DEFAULT_CUTOFF_HOUR) {
  const start = new Date(sessionStart).getTime();
  const end = sessionEnd ? new Date(sessionEnd).getTime() : Date.now();
  if (end <= start) return [];

  const segments = [];
  let cur = start;

  while (cur < end) {
    const curDate = new Date(cur);
    const logicalDateStr = getLogicalDateString(curDate, cutoffHour);
    const { end: nextCutoff } = getLogicalDayBounds(logicalDateStr, cutoffHour);
    const nextCutoffMs = nextCutoff.getTime();

    const segmentEnd = Math.min(end, nextCutoffMs);
    const durationMs = segmentEnd - cur;

    if (durationMs > 0) {
      segments.push({
        logicalDate: logicalDateStr,
        start: new Date(cur).toISOString(),
        end: new Date(segmentEnd).toISOString(),
        durationMs,
      });
    }

    cur = segmentEnd;
  }

  return segments;
}

/**
 * Format milliseconds to readable string:
 * - "2j 15m" or "45m" or "20d"
 */
export function formatDurationHuman(ms) {
  if (!ms || ms <= 0) return '0m';
  const totalSec = Math.floor(ms / 1000);
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;

  if (hours > 0) {
    if (minutes > 0) {
      return `${hours}j ${minutes}m`;
    }
    return `${hours}j`;
  }
  if (minutes > 0) {
    return `${minutes}m`;
  }
  return `${seconds}d`;
}

/**
 * Format milliseconds to digital timer: HH:MM:SS
 */
export function formatDurationTimer(ms) {
  if (!ms || ms <= 0) return '00:00:00';
  const totalSec = Math.floor(ms / 1000);
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;

  return [
    String(hours).padStart(2, '0'),
    String(minutes).padStart(2, '0'),
    String(seconds).padStart(2, '0')
  ].join(':');
}

/**
 * Format time HH:MM from ISO or Date
 */
export function formatTimeHHMM(dateInput) {
  if (!dateInput) return '--:--';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '--:--';
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

/**
 * Format Indonesian date label
 * e.g., "Senin, 5 Okt 2026"
 */
export function formatIndonesianDate(dateInput) {
  if (!dateInput) return '';
  const d = typeof dateInput === 'string' && dateInput.length === 10
    ? new Date(`${dateInput}T12:00:00`)
    : new Date(dateInput);

  if (isNaN(d.getTime())) return '';

  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

/**
 * Format Month name Indonesian
 * e.g., '2026-10' -> 'Oktober 2026'
 */
export function formatIndonesianMonth(yearMonthStr) {
  if (!yearMonthStr) return '';
  const [y, m] = yearMonthStr.split('-');
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const mIndex = parseInt(m, 10) - 1;
  return `${months[mIndex] || ''} ${y}`;
}

/**
 * Get current logical month (YYYY-MM)
 */
export function getCurrentLogicalMonth(cutoffHour = DEFAULT_CUTOFF_HOUR) {
  const logicalDate = getLogicalDateString(new Date(), cutoffHour);
  return logicalDate.slice(0, 7); // 'YYYY-MM'
}
