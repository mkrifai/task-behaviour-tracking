import React from 'react';
import { Play, Pause } from 'lucide-react';

export function RoutineChips({ 
  routines = [], 
  categories = [], 
  activeSession, 
  onStartRoutine, 
  onPauseRoutine,
  onResumeRoutine
}) {
  const catMap = {};
  categories.forEach(c => { catMap[c.id] = c; });

  return (
    <div className="routines-section">
      <div className="routine-chips-scroll">
        {routines.map(routine => {
          const cat = catMap[routine.categoryId];
          const isCurrentActive = activeSession && activeSession.taskId === routine.id;
          const isPaused = isCurrentActive && activeSession.isPaused;

          return (
            <button
              key={routine.id}
              onClick={() => {
                if (isCurrentActive) {
                  if (isPaused) {
                    onResumeRoutine ? onResumeRoutine(routine.id) : onStartRoutine(routine.id, routine.categoryId);
                  } else {
                    onPauseRoutine(routine.id);
                  }
                } else {
                  onStartRoutine(routine.id, routine.categoryId);
                }
              }}
              className={`routine-chip ${isCurrentActive ? (isPaused ? 'is-paused' : 'is-active') : ''}`}
            >
              <span 
                style={{ 
                  width: 7, 
                  height: 7, 
                  borderRadius: '50%', 
                  backgroundColor: isPaused ? '#f59e0b' : (cat?.color || '#cbd5e1') 
                }} 
              />
              <span>{routine.description}</span>
              {isCurrentActive ? (
                isPaused ? (
                  <Play size={11} style={{ color: '#f59e0b', marginLeft: '2px' }} fill="#f59e0b" />
                ) : (
                  <Pause size={12} style={{ color: 'var(--accent-emerald)', marginLeft: '2px' }} />
                )
              ) : (
                <Play size={11} style={{ color: 'var(--text-dim)', marginLeft: '2px' }} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
