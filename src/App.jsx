import React, { useState, useEffect } from 'react';
import { Navigation } from './components/Navigation';
import { TrackerPage } from './pages/TrackerPage';
import { HistoryPage } from './pages/HistoryPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { QuickCategoryModal } from './components/QuickCategoryModal';
import { CheckinModal } from './components/CheckinModal';
import { ManualSessionModal } from './components/ManualSessionModal';

import {
  getCategories,
  saveCategories,
  addCategory,
  updateCategory,
  getTasks,
  saveTasks,
  addTask,
  toggleTaskDone,
  deleteTask,
  getSessions,
  saveSessions,
  startTaskSession,
  pauseActiveSession,
  resumeActiveSession,
  stopActiveSession,
  cancelActiveSession,
  saveManualSession,
  deleteSession,
  getDaysMap,
  saveDayCheckin,
  getSettings,
  saveSettings,
  getAiReports,
  saveAiReport,
  subscribeStore
} from './lib/storage';

import { getLogicalDateString } from './lib/time';
import { calculateDayBalance } from './lib/rest';

export function App() {
  const [activeTab, setActiveTab] = useState('tracker');

  // Reactive state
  const [categories, setCategories] = useState(getCategories());
  const [tasks, setTasks] = useState(getTasks());
  const [sessions, setSessions] = useState(getSessions());
  const [daysMap, setDaysMap] = useState(getDaysMap());
  const [settings, setSettings] = useState(getSettings());
  const [aiReports, setAiReports] = useState(getAiReports());

  // Modals state
  const [isQuickCatOpen, setIsQuickCatOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState(null);
  const [isCheckinOpen, setIsCheckinOpen] = useState(false);
  const [checkinTargetDate, setCheckinTargetDate] = useState('');
  const [isManualSessionOpen, setIsManualSessionOpen] = useState(false);
  const [sessionToEdit, setSessionToEdit] = useState(null);

  // Subscribe to storage changes
  useEffect(() => {
    return subscribeStore(() => {
      setCategories(getCategories());
      setTasks(getTasks());
      setSessions(getSessions());
      setDaysMap(getDaysMap());
      setSettings(getSettings());
      setAiReports(getAiReports());
    });
  }, []);

  const cutoffHour = settings.cutoffHour ?? 4;
  const currentLogicalDate = getLogicalDateString(new Date(), cutoffHour);
  const activeSession = sessions.find(s => s.end === null) || null;

  const catMap = {};
  categories.forEach(c => { catMap[c.id] = c; });

  const dayBalance = calculateDayBalance(
    currentLogicalDate,
    sessions,
    catMap,
    daysMap[currentLogicalDate],
    settings,
    cutoffHour
  );

  const routines = tasks.filter(t => t.type === 'routine');
  const activeTaskCount = tasks.filter(t => t.type !== 'routine' && t.status !== 'done').length;

  const handleAddTask = ({ categoryId, description, type = 'task', defaultMin, startImmediately }) => {
    const newTask = addTask({ categoryId, description, type, defaultMin });
    if (startImmediately) {
      startTaskSession(newTask.id, categoryId);
    }
  };

  const handleStartSession = (taskId, categoryId) => {
    startTaskSession(taskId, categoryId);
  };

  const handlePauseSession = () => {
    pauseActiveSession();
  };

  const handleResumeSession = () => {
    resumeActiveSession();
  };

  const handleCompleteSession = (taskId) => {
    const targetTask = tasks.find(t => t.id === taskId);
    stopActiveSession();
    if (targetTask && targetTask.type !== 'routine' && targetTask.status !== 'done') {
      toggleTaskDone(taskId);
    }
  };

  const handleCancelSession = () => {
    cancelActiveSession();
  };

  const handleToggleDone = (taskId) => {
    toggleTaskDone(taskId);
  };

  const handleDeleteTask = (taskId) => {
    deleteTask(taskId);
  };

  const handleOpenAddCategory = () => {
    setCategoryToEdit(null);
    setIsQuickCatOpen(true);
  };

  const handleOpenEditCategory = (cat) => {
    setCategoryToEdit(cat);
    setIsQuickCatOpen(true);
  };

  const handleSaveCategory = (catData) => {
    if (catData.id) {
      updateCategory(catData);
    } else {
      addCategory(catData);
    }
    setIsQuickCatOpen(false);
    setCategoryToEdit(null);
  };

  const handleOpenCheckin = (dateStr) => {
    setCheckinTargetDate(dateStr || currentLogicalDate);
    setIsCheckinOpen(true);
  };

  const handleAddRoutineSession = ({ taskId, categoryId, logicalDate, durationMin }) => {
    const [y, m, d] = logicalDate.split('-').map(Number);
    const end = new Date(y, m - 1, d, 20, 0, 0);
    const start = new Date(end.getTime() - durationMin * 60 * 1000);

    saveManualSession({
      taskId,
      categoryId,
      start: start.toISOString(),
      end: end.toISOString(),
      source: 'checkin'
    });
  };

  const handleOpenManualSession = (sess = null) => {
    setSessionToEdit(sess);
    setIsManualSessionOpen(true);
  };

  return (
    <div className="app-container">
      <Navigation
        activeTab={activeTab}
        setActiveTab={(tab) => {
          if (tab === 'checkin') {
            handleOpenCheckin(currentLogicalDate);
          } else {
            setActiveTab(tab);
          }
        }}
        activeTaskCount={activeTaskCount}
        isTimerRunning={Boolean(activeSession && !activeSession.isPaused)}
      />

      <main className="main-content">
        {activeTab === 'tracker' && (
          <TrackerPage
            tasks={tasks}
            categories={categories}
            sessions={sessions}
            activeSession={activeSession}
            onAddTask={handleAddTask}
            onToggleDone={handleToggleDone}
            onStartSession={handleStartSession}
            onPauseSession={handlePauseSession}
            onResumeSession={handleResumeSession}
            onCompleteSession={handleCompleteSession}
            onCancelSession={handleCancelSession}
            onDeleteTask={handleDeleteTask}
            onOpenQuickCategory={handleOpenAddCategory}
            onOpenManualSession={() => handleOpenManualSession()}
          />
        )}

        {activeTab === 'history' && (
          <HistoryPage
            sessions={sessions}
            tasks={tasks}
            categories={categories}
            daysMap={daysMap}
            settings={settings}
            onEditSession={(sess) => handleOpenManualSession(sess)}
            onDeleteSession={(sId) => deleteSession(sId)}
            onOpenCheckinForDate={(dateStr) => handleOpenCheckin(dateStr)}
            onOpenManualSession={() => handleOpenManualSession()}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsPage
            sessions={sessions}
            tasks={tasks}
            categories={categories}
            daysMap={daysMap}
            settings={settings}
            aiReports={aiReports}
            onSaveAiReport={saveAiReport}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsPage
            categories={categories}
            tasks={tasks}
            settings={settings}
            onSaveCategories={saveCategories}
            onSaveSettings={saveSettings}
            onAddTask={handleAddTask}
            onDeleteTask={handleDeleteTask}
            onOpenQuickCategory={handleOpenAddCategory}
            onOpenEditCategory={handleOpenEditCategory}
          />
        )}
      </main>

      {/* Quick Category Modal */}
      <QuickCategoryModal
        isOpen={isQuickCatOpen}
        categoryToEdit={categoryToEdit}
        onClose={() => {
          setIsQuickCatOpen(false);
          setCategoryToEdit(null);
        }}
        onSave={handleSaveCategory}
      />

      {/* Daily Check-in Modal */}
      <CheckinModal
        isOpen={isCheckinOpen}
        onClose={() => setIsCheckinOpen(false)}
        logicalDate={checkinTargetDate}
        daysMap={daysMap}
        routines={routines}
        categories={categories}
        sessions={sessions}
        settings={settings}
        onSaveCheckin={saveDayCheckin}
        onAddRoutineSession={handleAddRoutineSession}
      />

      {/* Manual Session Modal */}
      <ManualSessionModal
        isOpen={isManualSessionOpen}
        onClose={() => setIsManualSessionOpen(false)}
        sessionToEdit={sessionToEdit}
        tasks={tasks}
        categories={categories}
        existingSessions={sessions}
        onSaveSession={saveManualSession}
      />
    </div>
  );
}
export default App;
