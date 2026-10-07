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

  // 2. Determine day timeline: past, today, or future
  const todayLogicalDate = getLogicalDateString(new Date(), cutoffHour);
  const isToday = logicalDateStr === todayLogicalDate;
  const isFuture = logicalDateStr > todayLogicalDate;

  // If this date is in the future, it has not occurred yet.
  if (isFuture) {
    return {
      logicalDate: logicalDateStr,
      isToday: false,
      isFuture: true,
      checkedIn: false,
      workMs: 0,
      familyMs: 0,
      selfMs: 0,
      uncategorizedMs: 0,
      totalTrackedMs: 0,
      sleepMs: 0,
      sleepBreakdown: { nightMin: 0, napMin: 0 },
      softRestMs: 0,
      availableMsForDay: 0,
      segments: [],
    };
  }

  // 3. Sleep duration
  const nightMin = dayRecord?.sleepNightMin !== undefined
    ? dayRecord.sleepNightMin
    : (sleepSettings.sleepNightMin ?? 300);

  const napMin = dayRecord?.sleepNapMin !== undefined
    ? dayRecord.sleepNapMin
    : (sleepSettings.sleepNapMin ?? 35);

  const baseSleepMs = (nightMin + napMin) * 60 * 1000;

  // 4. Available hours and soft rest
  let availableMsForDay = DAY_MS;
  let sleepMs = baseSleepMs;

  if (isToday) {
    // Current time elapsed since cutoff hour (e.g. 04:00 AM)
    const now = Date.now();
    const [y, m, d] = logicalDateStr.split('-').map(Number);
    const dayStart = new Date(y, m - 1, d, cutoffHour, 0, 0, 0).getTime();
    availableMsForDay = Math.max(0, Math.min(DAY_MS, now - dayStart));

    // Cap sleep to not exceed available time elapsed today
    sleepMs = Math.min(availableMsForDay, baseSleepMs);
  }

  const softRestMs = Math.max(0, availableMsForDay - totalTrackedMs - sleepMs);

  return {
    logicalDate: logicalDateStr,
    isToday,
    isFuture: false,
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
