import React, { useState, useEffect } from 'react';
import { X, Clock, AlertTriangle, Calendar, Check } from 'lucide-react';
import { getLogicalDateString, formatTimeHHMM } from '../lib/time';

export function ManualSessionModal({ 
  isOpen, 
  onClose, 
  sessionToEdit = null, 
  tasks = [], 
  categories = [], 
  existingSessions = [], 
  onSaveSession 
}) {
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [collisionWarning, setCollisionWarning] = useState('');

  useEffect(() => {
    if (sessionToEdit) {
      setSelectedTaskId(sessionToEdit.taskId);
      const s = new Date(sessionToEdit.start);
      const e = sessionToEdit.end ? new Date(sessionToEdit.end) : new Date();
      setDateStr(s.toISOString().slice(0, 10));
      setStartTime(formatTimeHHMM(s));
      setEndTime(formatTimeHHMM(e));
    } else {
      setSelectedTaskId(tasks[0]?.id || '');
      const now = new Date();
      setDateStr(now.toISOString().slice(0, 10));
      // Default: 1 hour ago to now
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      setStartTime(formatTimeHHMM(oneHourAgo));
      setEndTime(formatTimeHHMM(now));
    }
    setCollisionWarning('');
  }, [sessionToEdit, tasks, isOpen]);

  if (!isOpen) return null;

  // Collision detection check
  const checkCollisions = (startIso, endIso) => {
    const sTime = new Date(startIso).getTime();
    const eTime = new Date(endIso).getTime();

    const colliding = existingSessions.find(sess => {
      if (sessionToEdit && sess.id === sessionToEdit.id) return false;
      if (!sess.start || !sess.end) return false;
      const otherStart = new Date(sess.start).getTime();
      const otherEnd = new Date(sess.end).getTime();

      // Overlap condition: start < otherEnd && end > otherStart
      return sTime < otherEnd && eTime > otherStart;
    });

    if (colliding) {
      const taskName = tasks.find(t => t.id === colliding.taskId)?.description || 'Sesi lain';
      setCollisionWarning(`Perhatian: Jam ini bertabrakan dengan "${taskName}" (${formatTimeHHMM(colliding.start)} - ${formatTimeHHMM(colliding.end)}). Sesi tetap bisa disimpan jika memang sengaja.`);
    } else {
      setCollisionWarning('');
    }
  };

  const handleTimeChange = (newDate, newStart, newEnd) => {
    if (newDate && newStart && newEnd) {
      const startIso = `${newDate}T${newStart}:00`;
      const endIso = `${newDate}T${newEnd}:00`;
      checkCollisions(startIso, endIso);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedTaskId || !dateStr || !startTime || !endTime) return;

    let startIso = `${dateStr}T${startTime}:00`;
    let endIso = `${dateStr}T${endTime}:00`;

    const startTs = new Date(startIso).getTime();
    let endTs = new Date(endIso).getTime();

    // If end is before start, it might have crossed midnight!
    if (endTs <= startTs) {
      // Advance end date by 1 day
      const [y, m, d] = dateStr.split('-').map(Number);
      const nextDay = new Date(y, m - 1, d + 1);
      const nextDayStr = nextDay.toISOString().slice(0, 10);
      endIso = `${nextDayStr}T${endTime}:00`;
      endTs = new Date(endIso).getTime();
    }

    const task = tasks.find(t => t.id === selectedTaskId);

    onSaveSession({
      id: sessionToEdit ? sessionToEdit.id : undefined,
      taskId: selectedTaskId,
      categoryId: task ? task.categoryId : categories[0]?.id,
      start: new Date(startIso).toISOString(),
      end: new Date(endIso).toISOString(),
      source: 'manual'
    });

    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={20} style={{ color: 'var(--accent-primary)' }} />
            <span>{sessionToEdit ? 'Edit Jam Sesi' : 'Tambah Sesi Manual'}</span>
          </div>
          <button onClick={onClose} className="action-icon-btn">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              Pilih Tugas / Aktivitas
            </label>
            <select
              value={selectedTaskId}
              onChange={e => setSelectedTaskId(e.target.value)}
              style={{ width: '100%', padding: '10px 14px' }}
              required
            >
              {tasks.map(t => (
                <option key={t.id} value={t.id}>
                  {t.type === 'routine' ? '★ [Rutinitas] ' : ''}{t.description}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              Tanggal Pengerjaan
            </label>
            <input
              type="date"
              value={dateStr}
              onChange={e => {
                setDateStr(e.target.value);
                handleTimeChange(e.target.value, startTime, endTime);
              }}
              style={{ width: '100%' }}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Jam Mulai
              </label>
              <input
                type="time"
                value={startTime}
                onChange={e => {
                  setStartTime(e.target.value);
                  handleTimeChange(dateStr, e.target.value, endTime);
                }}
                style={{ width: '100%' }}
                required
              />
            </div>

            <div>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Jam Selesai
              </label>
              <input
                type="time"
                value={endTime}
                onChange={e => {
                  setEndTime(e.target.value);
                  handleTimeChange(dateStr, startTime, e.target.value);
                }}
                style={{ width: '100%' }}
                required
              />
            </div>
          </div>

          {collisionWarning && (
            <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <AlertTriangle size={16} style={{ color: 'var(--accent-amber)', flexShrink: 0, marginTop: '2px' }} />
              <div style={{ fontSize: '0.78rem', color: '#fcd34d' }}>
                {collisionWarning}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button type="button" onClick={onClose} className="btn-secondary">
              Batal
            </button>
            <button type="submit" className="btn-primary">
              <Check size={16} />
              <span>Simpan Sesi</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
