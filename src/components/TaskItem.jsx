import React from 'react';
import { Play, Pause, Trash2, Check, RotateCcw } from 'lucide-react';
import { formatDurationHuman } from '../lib/time';

export function TaskItem({ 
  task, 
  category, 
  totalDurationMs = 0, 
  sessionCount = 0,
  isActive = false, 
  isPaused = false,
  onToggleDone, 
  onStart, 
  onPause, 
  onResume,
  onDelete 
}) {
  const isDone = task.status === 'done';

  return (
    <div className={`task-card ${isActive ? (isPaused ? 'is-paused' : 'is-active') : ''} ${isDone ? 'is-done' : ''}`}>
      <div className="task-left">
        <button
          onClick={() => onToggleDone(task.id)}
          className="task-check-btn"
          title={isDone ? 'Kembalikan ke aktif' : 'Tandai selesai'}
        >
          <Check size={13} />
        </button>

        <div className="task-content">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
            <span
              className="badge"
              style={{
                backgroundColor: '#f1f5f9',
                color: '#475569',
                border: '1px solid #e2e8f0',
                fontSize: '0.72rem',
                padding: '2px 8px'
              }}
            >
              {category?.code || 'TASK'}
            </span>

            {isActive && (
              isPaused ? (
                <span style={{ fontSize: '0.75rem', color: '#d97706', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#f59e0b' }} />
                  Dijeda
                </span>
              ) : (
                <span style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span className="pulse-dot" style={{ width: 6, height: 6 }} />
                  Sedang berjalan
                </span>
              )
            )}
          </div>

          <div className="task-title" title={task.description}>
            {task.description}
          </div>

          <div className="task-meta">
            <span>{formatDurationHuman(totalDurationMs)}</span>
            {sessionCount > 0 && (
              <span>• {sessionCount} sesi</span>
            )}
          </div>
        </div>
      </div>

      <div className="task-actions">
        {!isDone ? (
          isActive ? (
            isPaused ? (
              <button
                onClick={() => onResume ? onResume(task.id) : onStart(task.id, task.categoryId)}
                className="action-icon-btn primary"
                title="Lanjutkan"
              >
                <Play size={15} fill="currentColor" />
              </button>
            ) : (
              <button
                onClick={() => onPause(task.id)}
                className="action-icon-btn primary"
                title="Pause sesi"
              >
                <Pause size={15} />
              </button>
            )
          ) : (
            <button
              onClick={() => onStart(task.id, task.categoryId)}
              className="action-icon-btn primary"
              title="Mulai / Lanjutkan"
            >
              <Play size={15} fill="currentColor" />
            </button>
          )
        ) : (
          <button
            onClick={() => onToggleDone(task.id)}
            className="action-icon-btn"
            title="Kembalikan ke aktif"
          >
            <RotateCcw size={14} />
          </button>
        )}

        <button
          onClick={() => {
            if (window.confirm(`Hapus tugas "${task.description}"?`)) {
              onDelete(task.id);
            }
          }}
          className="action-icon-btn"
          title="Hapus tugas"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
