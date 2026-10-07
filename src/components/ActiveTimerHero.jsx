import React, { useState, useEffect } from 'react';
import { Pause, Play, Check, X, Clock } from 'lucide-react';
import { formatDurationTimer, formatDurationHuman, formatTimeHHMM } from '../lib/time';
import confetti from 'canvas-confetti';

export function ActiveTimerHero({ 
  activeSession, 
  task, 
  category, 
  onPause, 
  onResume,
  onComplete, 
  onCancel 
}) {
  const [elapsedMs, setElapsedMs] = useState(0);
  const isPaused = Boolean(activeSession?.isPaused);

  useEffect(() => {
    if (!activeSession) return;

    const baseAccumulated = activeSession.accumulatedMs || 0;

    if (activeSession.isPaused) {
      setElapsedMs(baseAccumulated);
      return;
    }

    const resumeTs = activeSession.lastResumeTime 
      ? new Date(activeSession.lastResumeTime).getTime() 
      : new Date(activeSession.start).getTime();

    const update = () => {
      const currentSpan = Math.max(0, Date.now() - resumeTs);
      setElapsedMs(baseAccumulated + currentSpan);
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [activeSession?.isPaused, activeSession?.accumulatedMs, activeSession?.lastResumeTime, activeSession?.start]);

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
    <div className={`active-timer-hero ${isPaused ? 'is-paused' : ''}`}>
      <div className="timer-header">
        <div className="timer-badge-group">
          {isPaused ? (
            <span 
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: '#f59e0b',
                boxShadow: '0 0 6px #f59e0b',
                flexShrink: 0
              }}
            />
          ) : (
            <span className="pulse-dot" />
          )}

          <span 
            className="badge" 
            style={{ 
              backgroundColor: category?.color ? `${category.color}15` : '#f1f5f9', 
              color: category?.color || '#334155',
              border: `1px solid ${category?.color || '#e2e8f0'}`,
              fontWeight: 600
            }}
          >
            {category?.code || 'TASK'}
          </span>

          <span style={{ fontSize: '0.8rem', color: isPaused ? '#d97706' : 'var(--text-muted)', fontWeight: isPaused ? 600 : 400 }}>
            {isPaused ? 'Dijeda (Paused)' : `Mulai ${formatTimeHHMM(activeSession.start)}`}
          </span>
        </div>

        <div className="timer-actions">
          {isPaused ? (
            <button 
              onClick={onResume}
              className="btn-primary"
              style={{ padding: '6px 14px', fontSize: '0.82rem' }}
              title="Lanjutkan timer"
            >
              <Play size={14} fill="currentColor" />
              <span>Lanjutkan</span>
            </button>
          ) : (
            <button 
              onClick={onPause}
              className="btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.82rem' }}
              title="Pause timer sementara"
            >
              <Pause size={14} />
              <span>Pause</span>
            </button>
          )}

          <button 
            onClick={handleComplete}
            className="btn-success"
            style={{ padding: '6px 14px', fontSize: '0.82rem' }}
            title="Selesaikan dan simpan ke riwayat"
          >
            <Check size={14} />
            <span>Selesai</span>
          </button>

          {onCancel && (
            <button
              onClick={() => {
                if (window.confirm('Batalkan sesi ini tanpa menyimpan ke riwayat?')) {
                  onCancel();
                }
              }}
              className="action-icon-btn"
              title="Batalkan sesi"
              style={{ width: 28, height: 28 }}
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div className="timer-task-title">
          {task.description}
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          <div className="timer-digits" style={{ fontSize: '2.2rem', color: isPaused ? '#f59e0b' : undefined }}>
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
