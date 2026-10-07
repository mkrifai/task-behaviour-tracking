import { splitSessionByLogicalDay, getLogicalDateString } from './time';
import { calculateDayBalance, DAY_MS } from './rest';

/**
 * Generate comprehensive monthly statistics for a given month 'YYYY-MM'
 */
export function generateMonthlyReport({
  yearMonth, // 'YYYY-MM'
  sessions = [],
  tasks = [],
  categories = [],
  daysMap = {},
  settings = {}
}) {
  const [yearStr, monthStr] = yearMonth.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);

  const cutoffHour = settings.cutoffHour ?? 4;
  const numDaysInMonth = new Date(year, month, 0).getDate();

  // Lookup maps
  const catMap = {};
  categories.forEach(c => { catMap[c.id] = c; });

  const taskMap = {};
  tasks.forEach(t => { taskMap[t.id] = t; });

  // 1. Filter sessions that touch this month
  const categoryTotals = {}; // catId -> { ms: 0, sessionCount: 0 }
  categories.forEach(c => {
    categoryTotals[c.id] = { id: c.id, code: c.code, name: c.name, color: c.color, group: c.group, ms: 0, sessionCount: 0 };
  });

  const dailyBreakdowns = []; // day 1..numDaysInMonth
  const todayLogicalDate = getLogicalDateString(new Date(), cutoffHour);

  let totalTrackedMonthMs = 0;
  let totalSleepMonthMs = 0;
  let totalSoftRestMonthMs = 0;
  let workMonthMs = 0;
  let familyMonthMs = 0;
  let selfMonthMs = 0;

  let activeDaysCount = 0;
  let checkinDaysCount = 0;

  // Process day by day
  for (let d = 1; d <= numDaysInMonth; d++) {
    const dayStr = `${yearStr}-${monthStr.padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dayRecord = daysMap[dayStr] || null;

    if (dayRecord && dayRecord.checkedIn) {
      checkinDaysCount++;
    }

    const dayBalance = calculateDayBalance(
      dayStr,
      sessions,
      catMap,
      dayRecord,
      settings,
      cutoffHour
    );

    if (dayBalance.totalTrackedMs > 0 || dayRecord?.checkedIn) {
      activeDaysCount++;
    }

    // Accumulate category totals
    dayBalance.segments.forEach(seg => {
      const catId = seg.categoryId;
      if (categoryTotals[catId]) {
        categoryTotals[catId].ms += seg.durationMs;
        categoryTotals[catId].sessionCount++;
      } else {
        const matchingCat = categories.find(c => c.id === catId);
        const taskOfSeg = taskMap[seg.taskId];
        const resolvedName = matchingCat?.name || taskOfSeg?.description || 'Aktivitas Khusus';
        const resolvedCode = matchingCat?.code || (resolvedName.length >= 3 ? resolvedName.slice(0, 3).toUpperCase() : 'AKT');
        categoryTotals[catId] = {
          id: catId,
          code: resolvedCode,
          name: resolvedName,
          color: matchingCat?.color || '#6366f1',
          group: matchingCat?.group || 'work',
          ms: seg.durationMs,
          sessionCount: 1
        };
      }
    });

    // Only accumulate non-future days
    if (!dayBalance.isFuture) {
      totalTrackedMonthMs += dayBalance.totalTrackedMs;
      totalSleepMonthMs += dayBalance.sleepMs;
      totalSoftRestMonthMs += dayBalance.softRestMs;
      workMonthMs += dayBalance.workMs;
      familyMonthMs += dayBalance.familyMs;
      selfMonthMs += dayBalance.selfMs;
    }

    dailyBreakdowns.push(dayBalance);
  }

  // 2. Average 24h composition (normalize strictly based on elapsed days)
  const isCurrentMonth = todayLogicalDate.startsWith(yearMonth);
  const currentDayNum = isCurrentMonth ? parseInt(todayLogicalDate.split('-')[2], 10) : numDaysInMonth;
  const daysEvaluated = Math.max(1, isCurrentMonth ? currentDayNum : numDaysInMonth);

  const avgDayComposition = {
    workHours: (workMonthMs / daysEvaluated) / (3600 * 1000),
    familyHours: (familyMonthMs / daysEvaluated) / (3600 * 1000),
    selfHours: (selfMonthMs / daysEvaluated) / (3600 * 1000),
    sleepHours: (totalSleepMonthMs / daysEvaluated) / (3600 * 1000),
    softRestHours: (totalSoftRestMonthMs / daysEvaluated) / (3600 * 1000),
  };

  // 3. Category rankings: allCategories (includes 0h) and rankedCategories (>0h)
  const allCategories = Object.values(categoryTotals)
    .sort((a, b) => b.ms - a.ms)
    .map(c => ({
      ...c,
      percentage: totalTrackedMonthMs > 0 ? ((c.ms / totalTrackedMonthMs) * 100).toFixed(1) : '0.0',
      hours: (c.ms / (3600 * 1000)).toFixed(1)
    }));

  const rankedCategories = allCategories.filter(c => c.ms > 0);

  // 4. Tasks completed in this month
  const tasksCompletedThisMonth = tasks.filter(t => {
    if (t.status !== 'done' || !t.completedAt) return false;
    const completedLogical = getLogicalDateString(new Date(t.completedAt), cutoffHour);
    return completedLogical.startsWith(yearMonth);
  });

  // 5. Fragmentation / context switching analysis
  // Find which tasks had the most sessions in this month
  const taskSessionCounts = {};
  sessions.forEach(s => {
    if (!s.start) return;
    const sDate = getLogicalDateString(new Date(s.start), cutoffHour);
    if (sDate.startsWith(yearMonth)) {
      taskSessionCounts[s.taskId] = (taskSessionCounts[s.taskId] || 0) + 1;
    }
  });

  const fragmentedTasks = Object.entries(taskSessionCounts)
    .map(([taskId, count]) => {
      const task = taskMap[taskId];
      return {
        taskId,
        description: task ? task.description : 'Tugas terhapus',
        categoryId: task?.categoryId,
        category: task ? catMap[task.categoryId] : null,
        sessionCount: count,
        type: task?.type || 'task'
      };
    })
    .filter(t => t.type === 'task') // only regular tasks
    .sort((a, b) => b.sessionCount - a.sessionCount)
    .slice(0, 5);

  // 6. Complete month sessions
  const monthSessions = sessions
    .filter(s => {
      if (!s.start) return false;
      const lDate = getLogicalDateString(new Date(s.start), cutoffHour);
      return lDate.startsWith(yearMonth);
    })
    .map(s => {
      const task = taskMap[s.taskId];
      const cat = catMap[s.categoryId] || categories.find(c => c.id === s.categoryId);
      const startTs = new Date(s.start).getTime();
      const endTs = s.end ? new Date(s.end).getTime() : startTs;
      const durMs = Math.max(0, endTs - startTs);
      return {
        ...s,
        taskDescription: task?.description || 'Aktivitas Mandiri',
        taskType: task?.type || 'task',
        taskStatus: task?.status || 'active',
        categoryCode: cat?.code || (task?.description ? task.description.slice(0, 3).toUpperCase() : 'TGS'),
        categoryName: cat?.name || 'Kategori Tugas',
        categoryColor: cat?.color || '#6366f1',
        categoryGroup: cat?.group || 'work',
        durationMs: durMs
      };
    })
    .sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime());

  return {
    yearMonth,
    numDaysInMonth,
    daysEvaluated,
    isCurrentMonth,
    totalTrackedMonthMs,
    totalSleepMonthMs,
    totalSoftRestMonthMs,
    workMonthMs,
    familyMonthMs,
    selfMonthMs,
    avgDayComposition,
    rankedCategories,
    allCategories,
    dailyBreakdowns,
    monthSessions,
    activeDaysCount,
    checkinDaysCount,
    tasksCompletedCount: tasksCompletedThisMonth.length,
    fragmentedTasks
  };
}

/**
 * Calculate month-over-month differences
 */
export function compareWithPreviousMonth(currentReport, prevReport) {
  if (!prevReport) return null;

  const hoursDiff = (currMs, prevMs) => {
    const diff = (currMs - prevMs) / (3600 * 1000);
    return (diff >= 0 ? '+' : '') + diff.toFixed(1) + 'j';
  };

  const percentDiff = (curr, prev) => {
    if (!prev || prev === 0) return '+100%';
    const pct = ((curr - prev) / prev) * 100;
    return (pct >= 0 ? '+' : '') + pct.toFixed(1) + '%';
  };

  return {
    trackedDiffHours: hoursDiff(currentReport.totalTrackedMonthMs, prevReport.totalTrackedMonthMs),
    workDiffHours: hoursDiff(currentReport.workMonthMs, prevReport.workMonthMs),
    familyDiffHours: hoursDiff(currentReport.familyMonthMs, prevReport.familyMonthMs),
    selfDiffHours: hoursDiff(currentReport.selfMonthMs, prevReport.selfMonthMs),
    sleepDiffHours: hoursDiff(currentReport.totalSleepMonthMs, prevReport.totalSleepMonthMs),
    tasksCompletedDiff: currentReport.tasksCompletedCount - prevReport.tasksCompletedCount
  };
}
