import React, { useState } from 'react';
import { ActiveTimerHero } from '../components/ActiveTimerHero';
import { RoutineChips } from '../components/RoutineChips';
import { TaskForm } from '../components/TaskForm';
import { TaskItem } from '../components/TaskItem';
import { ChevronDown, ChevronRight, PlusCircle, Search } from 'lucide-react';

export function TrackerPage({
  tasks,
  categories,
  sessions,
  activeSession,
  onAddTask,
  onToggleDone,
  onStartSession,
  onPauseSession,
  onDeleteTask,
  onOpenQuickCategory,
  onOpenManualSession
}) {
  const [filterCatId, setFilterCatId] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDoneList, setShowDoneList] = useState(false);

  const catMap = {};
  categories.forEach(c => { catMap[c.id] = c; });

  const taskDurationMap = {};
  const taskSessionCountMap = {};

  sessions.forEach(sess => {
    const start = new Date(sess.start).getTime();
    const end = sess.end ? new Date(sess.end).getTime() : Date.now();
    const dur = Math.max(0, end - start);

    taskDurationMap[sess.taskId] = (taskDurationMap[sess.taskId] || 0) + dur;
    taskSessionCountMap[sess.taskId] = (taskSessionCountMap[sess.taskId] || 0) + 1;
  });

  const regularTasks = tasks.filter(t => t.type !== 'routine');
  const routines = tasks.filter(t => t.type === 'routine');

  // Filter tasks
  const filteredActiveTasks = regularTasks.filter(t => {
    if (t.status === 'done') return false;
    if (filterCatId !== 'ALL' && t.categoryId !== filterCatId) return false;
    if (searchQuery.trim() && !t.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const filteredDoneTasks = regularTasks.filter(t => {
    if (t.status !== 'done') return false;
    if (filterCatId !== 'ALL' && t.categoryId !== filterCatId) return false;
    if (searchQuery.trim() && !t.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const activeTask = activeSession ? tasks.find(t => t.id === activeSession.taskId) : null;
  const activeCategory = activeTask ? catMap[activeTask.categoryId] : null;

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto' }}>
      {/* 1. Active Timer */}
      {activeSession && activeTask && (
        <ActiveTimerHero
          activeSession={activeSession}
          task={activeTask}
          category={activeCategory}
          onPause={() => onPauseSession(activeSession.taskId)}
          onComplete={() => onToggleDone(activeSession.taskId)}
        />
      )}

      {/* 2. Rutinitas Cepat */}
      {routines.length > 0 && (
        <RoutineChips
          routines={routines}
          categories={categories}
          activeSession={activeSession}
          onStartRoutine={(rId, catId) => onStartSession(rId, catId)}
          onPauseRoutine={(rId) => onPauseSession(rId)}
        />
      )}

      {/* 3. Task Input Card */}
      <TaskForm
        categories={categories}
        onAddTask={onAddTask}
        onOpenQuickCategory={onOpenQuickCategory}
      />

      {/* 4. Filter Bar (Dropdown Filter + Search + Manual Session) */}
      <div 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          gap: '8px', 
          marginBottom: '14px',
          flexWrap: 'wrap'
        }}
      >
        {/* Dropdown Kategori (Pengganti deretan tombol) */}
        <div style={{ flex: '1', minWidth: '150px' }}>
          <select
            value={filterCatId}
            onChange={e => setFilterCatId(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              fontSize: '0.85rem',
              fontWeight: 500,
              backgroundColor: 'var(--bg-surface)'
            }}
          >
            <option value="ALL">
              Semua Kategori ({regularTasks.filter(t => t.status !== 'done').length})
            </option>
            {categories.map(c => {
              const count = regularTasks.filter(t => t.status !== 'done' && t.categoryId === c.id).length;
              return (
                <option key={c.id} value={c.id}>
                  [{c.code}] {c.name} {count > 0 ? `(${count})` : ''}
                </option>
              );
            })}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ position: 'relative', width: '130px' }}>
            <Search size={14} style={{ position: 'absolute', left: 9, top: 10, color: 'var(--text-dim)' }} />
            <input
              type="text"
              placeholder="Cari..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                paddingLeft: '28px',
                paddingRight: '10px',
                paddingTop: '6px',
                paddingBottom: '6px',
                fontSize: '0.85rem'
              }}
            />
          </div>

          <button
            onClick={onOpenManualSession}
            className="btn-secondary"
            style={{ padding: '6px 10px', fontSize: '0.82rem', whiteSpace: 'nowrap' }}
            title="Catat sesi manual"
          >
            <PlusCircle size={14} />
            <span>Manual</span>
          </button>
        </div>
      </div>

      {/* 5. Active Tasks List */}
      <div style={{ marginBottom: '20px' }}>
        {filteredActiveTasks.length === 0 ? (
          <div className="card-glass" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.88rem' }}>
            Belum ada tugas aktif
          </div>
        ) : (
          <div className="task-list">
            {filteredActiveTasks.map(task => (
              <TaskItem
                key={task.id}
                task={task}
                category={catMap[task.categoryId]}
                totalDurationMs={taskDurationMap[task.id] || 0}
                sessionCount={taskSessionCountMap[task.id] || 0}
                isActive={activeSession?.taskId === task.id}
                onToggleDone={onToggleDone}
                onStart={onStartSession}
                onPause={onPauseSession}
                onDelete={onDeleteTask}
              />
            ))}
          </div>
        )}
      </div>

      {/* 6. Completed Tasks (Strikethrough) Section */}
      {filteredDoneTasks.length > 0 && (
        <div style={{ paddingTop: '8px', borderTop: '1px solid var(--border-subtle)' }}>
          <button
            onClick={() => setShowDoneList(!showDoneList)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: 'var(--text-muted)',
              fontSize: '0.82rem',
              fontWeight: 500,
              padding: '6px 0',
              cursor: 'pointer'
            }}
          >
            {showDoneList ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
            <span>Tugas Selesai ({filteredDoneTasks.length})</span>
          </button>

          {showDoneList && (
            <div className="task-list" style={{ marginTop: '8px' }}>
              {filteredDoneTasks.map(task => (
                <TaskItem
                  key={task.id}
                  task={task}
                  category={catMap[task.categoryId]}
                  totalDurationMs={taskDurationMap[task.id] || 0}
                  sessionCount={taskSessionCountMap[task.id] || 0}
                  isActive={false}
                  onToggleDone={onToggleDone}
                  onStart={onStartSession}
                  onPause={onPauseSession}
                  onDelete={onDeleteTask}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
