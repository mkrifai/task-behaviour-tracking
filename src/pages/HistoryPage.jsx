import React from 'react';
import { 
  formatIndonesianDate, 
  formatTimeHHMM, 
  formatDurationHuman,
  splitSessionByLogicalDay
} from '../lib/time';
import { calculateDayBalance } from '../lib/rest';
import { Clock, Edit2, Trash2, Plus, CalendarCheck } from 'lucide-react';

export function HistoryPage({
  sessions,
  tasks,
  categories,
  daysMap,
  settings,
  onEditSession,
  onDeleteSession,
  onOpenCheckinForDate,
  onOpenManualSession
}) {
  const cutoffHour = settings.cutoffHour ?? 4;
  const catMap = {};
  categories.forEach(c => { catMap[c.id] = c; });

  const taskMap = {};
  tasks.forEach(t => { taskMap[t.id] = t; });

  const sessionsByDay = {};

  sessions.forEach(sess => {
    if (!sess.start) return;
    const segments = splitSessionByLogicalDay(sess.start, sess.end, cutoffHour);
    segments.forEach(seg => {
      const d = seg.logicalDate;
      if (!sessionsByDay[d]) {
        sessionsByDay[d] = [];
      }
      sessionsByDay[d].push({
        ...sess,
        segmentDurationMs: seg.durationMs,
        segmentStart: seg.start,
        segmentEnd: seg.end
      });
    });
  });

  const sortedDates = Object.keys(sessionsByDay).sort((a, b) => b.localeCompare(a));

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
          Riwayat Aktivitas
        </h1>

        <button
          onClick={() => onOpenManualSession()}
          className="btn-primary"
          style={{ padding: '6px 12px', fontSize: '0.82rem' }}
        >
          <Plus size={14} />
          <span>Sesi Manual</span>
        </button>
      </div>

      {sortedDates.length === 0 ? (
        <div className="card-glass" style={{ padding: '36px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.88rem' }}>
          Belum ada sesi yang terekam
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {sortedDates.map(dateStr => {
            const daySessions = sessionsByDay[dateStr];
            const dayRecord = daysMap[dateStr];
            const balance = calculateDayBalance(dateStr, sessions, catMap, dayRecord, settings, cutoffHour);

            return (
              <div key={dateStr} className="card-elevated" style={{ padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', paddingBottom: '10px', borderBottom: '1px solid var(--border-subtle)', marginBottom: '10px' }}>
                  <div>
                    <div style={{ fontSize: '0.96rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      {formatIndonesianDate(dateStr)}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      <span>Kerja: <strong style={{ color: 'var(--text-main)' }}>{formatDurationHuman(balance.workMs)}</strong></span>
                      <span>•</span>
                      <span>Keluarga: <strong style={{ color: 'var(--text-main)' }}>{formatDurationHuman(balance.familyMs)}</strong></span>
                      <span>•</span>
                      <span>Diri Sendiri: <strong style={{ color: 'var(--text-main)' }}>{formatDurationHuman(balance.selfMs)}</strong></span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {dayRecord?.checkedIn ? (
                      <span className="badge" style={{ backgroundColor: 'rgba(5, 150, 105, 0.08)', color: 'var(--accent-emerald)', fontSize: '0.72rem' }}>
                        ✓ Check-in
                      </span>
                    ) : (
                      <button
                        onClick={() => onOpenCheckinForDate(dateStr)}
                        className="badge"
                        style={{ backgroundColor: 'var(--bg-surface-elevated)', color: 'var(--text-main)', border: '1px solid var(--border-subtle)', cursor: 'pointer', fontSize: '0.72rem' }}
                      >
                        <CalendarCheck size={11} />
                        <span>Check-in</span>
                      </button>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {daySessions.map((sess, idx) => {
                    const task = taskMap[sess.taskId];
                    const cat = catMap[sess.categoryId];
                    const start = new Date(sess.start);
                    const end = sess.end ? new Date(sess.end) : null;
                    const durationMs = sess.segmentDurationMs || (end ? end.getTime() - start.getTime() : 0);

                    return (
                      <div
                        key={sess.id + '-' + idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'var(--bg-base)',
                          border: '1px solid var(--border-subtle)',
                          gap: '10px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                          <span
                            className="badge"
                            style={{
                              backgroundColor: 'var(--bg-surface)',
                              color: 'var(--text-main)',
                              border: '1px solid var(--border-subtle)',
                              fontSize: '0.7rem',
                              padding: '2px 6px',
                              flexShrink: 0
                            }}
                          >
                            {cat?.code || 'TASK'}
                          </span>

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '0.88rem', fontWeight: 500, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {task ? task.description : 'Sesi Terhapus'}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                              {formatTimeHHMM(start)} — {end ? formatTimeHHMM(end) : 'Berjalan'}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)' }}>
                            {formatDurationHuman(durationMs)}
                          </div>

                          <button
                            onClick={() => onEditSession(sess)}
                            className="action-icon-btn"
                            title="Edit"
                            style={{ width: 28, height: 28 }}
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm('Hapus sesi ini?')) {
                                onDeleteSession(sess.id);
                              }
                            }}
                            className="action-icon-btn"
                            title="Hapus"
                            style={{ width: 28, height: 28 }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
