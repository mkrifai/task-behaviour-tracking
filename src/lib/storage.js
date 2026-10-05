import { DEFAULT_CATEGORIES, DEFAULT_ROUTINES, DEFAULT_SETTINGS } from './defaults';

const STORAGE_KEYS = {
  CATEGORIES: 'tbt_categories_v1',
  TASKS: 'tbt_tasks_v1',
  SESSIONS: 'tbt_sessions_v1',
  DAYS: 'tbt_days_v1',
  AI_REPORTS: 'tbt_ai_reports_v1',
  SETTINGS: 'tbt_settings_v1',
  FIREBASE_CONFIG: 'tbt_firebase_cfg_v1'
};

// Simple pub-sub event dispatcher for instant React reactivity
const listeners = new Set();
export function subscribeStore(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
function notifyChange(type, data) {
  listeners.forEach(fn => {
    try {
      fn(type, data);
    } catch (e) {
      console.error(e);
    }
  });
}

// ----------------------------------------------------
// Categories
// ----------------------------------------------------
export function getCategories() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(DEFAULT_CATEGORIES));
      return DEFAULT_CATEGORIES;
    }
    return JSON.parse(raw);
  } catch (e) {
    return DEFAULT_CATEGORIES;
  }
}

export function saveCategories(categories) {
  localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  notifyChange('categories', categories);
}

export function addCategory(category) {
  const current = getCategories();
  const newCat = {
    id: 'cat-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    order: current.length + 1,
    ...category
  };
  saveCategories([...current, newCat]);
  return newCat;
}

// ----------------------------------------------------
// Tasks & Routines
// ----------------------------------------------------
export function getTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TASKS);
    if (!raw) {
      // Seed default routines
      const initialRoutines = DEFAULT_ROUTINES.map(r => ({
        ...r,
        type: 'routine',
        status: 'active',
        createdAt: new Date().toISOString()
      }));
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(initialRoutines));
      return initialRoutines;
    }
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

export function saveTasks(tasks) {
  localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  notifyChange('tasks', tasks);
}

export function addTask({ categoryId, description, type = 'task', defaultMin = 30 }) {
  const tasks = getTasks();
  const newTask = {
    id: 'tsk-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    categoryId,
    description: description.trim(),
    type, // 'task' | 'routine'
    status: 'active',
    defaultMin: type === 'routine' ? defaultMin : undefined,
    createdAt: new Date().toISOString()
  };
  saveTasks([newTask, ...tasks]);
  return newTask;
}

export function toggleTaskDone(taskId) {
  const tasks = getTasks();
  const target = tasks.find(t => t.id === taskId);
  if (!target) return;

  // Auto-pause if this task has an active running session
  const activeSess = getActiveSession();
  if (activeSess && activeSess.taskId === taskId) {
    stopActiveSession();
  }

  const updated = tasks.map(t => {
    if (t.id === taskId) {
      const isNowDone = t.status !== 'done';
      return {
        ...t,
        status: isNowDone ? 'done' : 'active',
        completedAt: isNowDone ? new Date().toISOString() : null
      };
    }
    return t;
  });
  saveTasks(updated);
}

export function deleteTask(taskId) {
  // If active, stop first
  const activeSess = getActiveSession();
  if (activeSess && activeSess.taskId === taskId) {
    stopActiveSession();
  }
  const tasks = getTasks().filter(t => t.id !== taskId);
  saveTasks(tasks);

  // Also remove associated sessions
  const sessions = getSessions().filter(s => s.taskId !== taskId);
  saveSessions(sessions);
}

// ----------------------------------------------------
// Sessions & Timer Engine
// ----------------------------------------------------
export function getSessions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SESSIONS);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function saveSessions(sessions) {
  localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
  notifyChange('sessions', sessions);
}

export function getActiveSession() {
  const sessions = getSessions();
  return sessions.find(s => s.end === null) || null;
}

/**
 * Starts a timer for a given task.
 * CRITICAL RULE: Automatically stops/pauses any currently running session first!
 */
export function startTaskSession(taskId, categoryId) {
  // 1. Check if the task already has an active session
  const active = getActiveSession();
  if (active) {
    if (active.taskId === taskId) {
      // Already running for this task
      return active;
    }
    // Auto-pause the previous active session!
    stopActiveSession();
  }

  // 2. Create new active session
  const sessions = getSessions();
  const newSession = {
    id: 'ses-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    taskId,
    categoryId,
    start: new Date().toISOString(),
    end: null,
    source: 'timer'
  };

  saveSessions([newSession, ...sessions]);
  return newSession;
}

/**
 * Stops / Pauses the currently active session
 */
export function stopActiveSession() {
  const sessions = getSessions();
  const now = new Date().toISOString();
  let updated = false;

  const newSessions = sessions.map(s => {
    if (s.end === null) {
      updated = true;
      return { ...s, end: now };
    }
    return s;
  });

  if (updated) {
    saveSessions(newSessions);
  }
}

/**
 * Add or edit a manual session
 */
export function saveManualSession({ id, taskId, categoryId, start, end, source = 'manual' }) {
  const sessions = getSessions();
  if (id) {
    // Edit
    const updated = sessions.map(s => (s.id === id ? { ...s, taskId, categoryId, start, end } : s));
    saveSessions(updated);
  } else {
    // Create
    const newSession = {
      id: 'ses-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      taskId,
      categoryId,
      start,
      end,
      source
    };
    saveSessions([newSession, ...sessions]);
  }
}

export function deleteSession(sessionId) {
  const sessions = getSessions().filter(s => s.id !== sessionId);
  saveSessions(sessions);
}

// ----------------------------------------------------
// Days & Daily Check-in
// ----------------------------------------------------
export function getDaysMap() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DAYS);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

export function saveDayCheckin(logicalDateStr, { sleepNightMin, sleepNapMin, routinesRecorded = [] }) {
  const days = getDaysMap();
  days[logicalDateStr] = {
    checkedIn: true,
    sleepNightMin,
    sleepNapMin,
    routinesRecorded,
    updatedAt: new Date().toISOString()
  };
  localStorage.setItem(STORAGE_KEYS.DAYS, JSON.stringify(days));
  notifyChange('days', days);
}

// ----------------------------------------------------
// Settings
// ----------------------------------------------------
export function getSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch (e) {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings) {
  const merged = { ...getSettings(), ...settings };
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(merged));
  notifyChange('settings', merged);
}

// ----------------------------------------------------
// AI Reports Cache
// ----------------------------------------------------
export function getAiReports() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.AI_REPORTS);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

export function saveAiReport(yearMonth, { content, statsSnapshot }) {
  const reports = getAiReports();
  reports[yearMonth] = {
    content,
    statsSnapshot,
    generatedAt: new Date().toISOString()
  };
  localStorage.setItem(STORAGE_KEYS.AI_REPORTS, JSON.stringify(reports));
  notifyChange('aiReports', reports);
}

// ----------------------------------------------------
// Full Data Backup & Restore (JSON)
// ----------------------------------------------------
export function exportAllDataJson() {
  return JSON.stringify({
    categories: getCategories(),
    tasks: getTasks(),
    sessions: getSessions(),
    days: getDaysMap(),
    settings: getSettings(),
    aiReports: getAiReports(),
    exportedAt: new Date().toISOString(),
    version: 1
  }, null, 2);
}

export function importAllDataJson(jsonString) {
  const data = JSON.parse(jsonString);
  if (data.categories) localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(data.categories));
  if (data.tasks) localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(data.tasks));
  if (data.sessions) localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(data.sessions));
  if (data.days) localStorage.setItem(STORAGE_KEYS.DAYS, JSON.stringify(data.days));
  if (data.settings) localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(data.settings));
  if (data.aiReports) localStorage.setItem(STORAGE_KEYS.AI_REPORTS, JSON.stringify(data.aiReports));
  notifyChange('all', data);
}
