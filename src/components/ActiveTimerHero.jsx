import React, { useState, useEffect } from 'react';
import { Pause, Check, Clock } from 'lucide-react';
import { formatDurationTimer, formatDurationHuman, formatTimeHHMM } from '../lib/time';
import confetti from 'canvas-confetti';

export function ActiveTimerHero({ activeSession, task, category, onPause, onComplete }) {
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    if (!activeSession || !activeSession.start) return;

    const startTs = new Date(activeSession.start).getTime();
    const update = () => {
      setElapsedMs(Math.max(0, Date.now() - startTs));
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [activeSession]);

  if (!activeSession || !task) return null;

  const handleComplete = () => {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 }
    });
    onComplete();
  };

  return (
    <div className="active-timer-hero">
      <div className="timer-header">
        <div className="timer-badge-group">
          <span className="pulse-dot" />
          <span 
            className="badge" 
            style={{ 
              backgroundColor: '#f1f5f9', 
              color: '#334155',
              border: '1px solid #e2e8f0',
              fontWeight: 600
            }}
          >
            {category?.code || 'TASK'}
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Mulai {formatTimeHHMM(activeSession.start)}
          </span>
        </div>

        <div className="timer-actions">
          <button 
            onClick={onPause}
            className="btn-secondary"
            style={{ padding: '6px 12px', fontSize: '0.82rem' }}
            title="Pause timer sementara"
          >
            <Pause size={14} />
            <span>Pause</span>
          </button>

          {task.type !== 'routine' && (
            <button 
              onClick={handleComplete}
              className="btn-success"
              style={{ padding: '6px 14px', fontSize: '0.82rem' }}
              title="Selesaikan tugas"
            >
              <Check size={14} />
              <span>Selesai</span>
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div className="timer-task-title">
          {task.description}
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          <div className="timer-digits" style={{ fontSize: '2.2rem' }}>
            {formatDurationTimer(elapsedMs)}
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            ({formatDurationHuman(elapsedMs)})
          </span>
        </div>
      </div>
    </div>
  );
}
