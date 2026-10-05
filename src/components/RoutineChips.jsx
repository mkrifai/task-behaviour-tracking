import React from 'react';
import { Play, Pause } from 'lucide-react';

export function RoutineChips({ 
  routines = [], 
  categories = [], 
  activeSession, 
  onStartRoutine, 
  onPauseRoutine
}) {
  const catMap = {};
  categories.forEach(c => { catMap[c.id] = c; });

  return (
    <div className="routines-section">
      <div className="routine-chips-scroll">
        {routines.map(routine => {
          const cat = catMap[routine.categoryId];
          const isCurrentActive = activeSession && activeSession.taskId === routine.id;

          return (
            <button
              key={routine.id}
              onClick={() => {
                if (isCurrentActive) {
                  onPauseRoutine(routine.id);
                } else {
                  onStartRoutine(routine.id, routine.categoryId);
                }
              }}
              className={`routine-chip ${isCurrentActive ? 'is-active' : ''}`}
            >
              <span 
                style={{ 
                  width: 7, 
                  height: 7, 
                  borderRadius: '50%', 
                  backgroundColor: cat?.color || '#cbd5e1' 
                }} 
              />
              <span>{routine.description}</span>
              {isCurrentActive ? (
                <Pause size={12} style={{ color: 'var(--accent-emerald)', marginLeft: '2px' }} />
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
