import { splitSessionByLogicalDay, getLogicalDateString } from './time';

export const DAY_MS = 24 * 60 * 60 * 1000;

export const DEFAULT_SLEEP_SETTINGS = {
  sleepNightMin: 300, // 5 hours
  sleepNapMin: 35,    // 35 minutes
};

/**
 * Calculate the 24-hour breakdown for a specific logical date.
 *
 * @param {string} logicalDateStr - 'YYYY-MM-DD'
 * @param {Array} sessions - Array of all session objects
 * @param {Object} categoryMap - Map of categoryId -> Category object (with group: 'work'|'family'|'self')
 * @param {Object} dayRecord - Optional day record for override sleep or checkin status
 * @param {Object} sleepSettings - Default sleep settings { sleepNightMin, sleepNapMin }
 * @param {number} cutoffHour - Cutoff hour (default: 4)
 */
export function calculateDayBalance(
  logicalDateStr,
  sessions = [],
  categoryMap = {},
  dayRecord = null,
  sleepSettings = DEFAULT_SLEEP_SETTINGS,
  cutoffHour = 4
) {
  // 1. Filter and split sessions that intersect this logical day
  let workMs = 0;
  let familyMs = 0;
  let selfMs = 0;
  let uncategorizedMs = 0;
  const daySegments = [];

  sessions.forEach(sess => {
    if (!sess.start) return;
    const segments = splitSessionByLogicalDay(sess.start, sess.end, cutoffHour);
    segments.forEach(seg => {
      if (seg.logicalDate === logicalDateStr) {
        daySegments.push({ ...seg, taskId: sess.taskId, categoryId: sess.categoryId });

        const cat = categoryMap[sess.categoryId];
        const group = cat ? cat.group : 'work';

        if (group === 'family') {
          familyMs += seg.durationMs;
        } else if (group === 'self') {
          selfMs += seg.durationMs;
        } else if (group === 'work') {
          workMs += seg.durationMs;
        } else {
          uncategorizedMs += seg.durationMs;
        }
      }
    });
  });

  const totalTrackedMs = workMs + familyMs + selfMs + uncategorizedMs;

  // 2. Sleep duration (from day record if checked in, else default)
  const nightMin = dayRecord?.sleepNightMin !== undefined
    ? dayRecord.sleepNightMin
    : (sleepSettings.sleepNightMin ?? 300);

  const napMin = dayRecord?.sleepNapMin !== undefined
    ? dayRecord.sleepNapMin
    : (sleepSettings.sleepNapMin ?? 35);

  const sleepMs = (nightMin + napMin) * 60 * 1000;

  // 3. Soft Rest calculation (24h - tracked - sleep)
  const todayLogicalDate = getLogicalDateString(new Date(), cutoffHour);
  const isToday = logicalDateStr === todayLogicalDate;

  // For today, total day elapsed so far from cutoff:
  let availableMsForDay = DAY_MS;
  if (isToday) {
    // Current time elapsed since cutoff hour
    const now = Date.now();
    const [y, m, d] = logicalDateStr.split('-').map(Number);
    const dayStart = new Date(y, m - 1, d, cutoffHour, 0, 0, 0).getTime();
    availableMsForDay = Math.max(0, Math.min(DAY_MS, now - dayStart));
  }

  const softRestMs = Math.max(0, availableMsForDay - totalTrackedMs - (isToday ? (sleepMs * (availableMsForDay / DAY_MS)) : sleepMs));

  return {
    logicalDate: logicalDateStr,
    isToday,
    checkedIn: Boolean(dayRecord?.checkedIn),
    workMs,
    familyMs,
    selfMs,
    uncategorizedMs,
    totalTrackedMs,
    sleepMs,
    sleepBreakdown: { nightMin, napMin },
    softRestMs: Math.round(softRestMs),
    availableMsForDay,
    segments: daySegments,
  };
}
