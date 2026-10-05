import React, { useState, useEffect } from 'react';
import { X, Moon, Check, Heart } from 'lucide-react';
import { formatIndonesianDate, getLogicalDateString } from '../lib/time';
import confetti from 'canvas-confetti';

export function CheckinModal({ 
  isOpen, 
  onClose, 
  logicalDate, 
  daysMap, 
  routines, 
  categories, 
  sessions, 
  settings,
  onSaveCheckin,
  onAddRoutineSession 
}) {
  const cutoffHour = settings.cutoffHour ?? 4;
  const targetDate = logicalDate || getLogicalDateString(new Date(), cutoffHour);

  const existingRecord = daysMap[targetDate];
  const defaultNight = settings.sleepNightMin ?? 300;
  const defaultNap = settings.sleepNapMin ?? 35;

  const [nightHours, setNightHours] = useState(Math.floor(defaultNight / 60));
  const [nightMinutes, setNightMinutes] = useState(defaultNight % 60);
  const [napMinutes, setNapMinutes] = useState(defaultNap);
  const [selectedRoutines, setSelectedRoutines] = useState({});

  useEffect(() => {
    if (existingRecord) {
      const nMin = existingRecord.sleepNightMin ?? defaultNight;
      setNightHours(Math.floor(nMin / 60));
      setNightMinutes(nMin % 60);
      setNapMinutes(existingRecord.sleepNapMin ?? defaultNap);
    } else {
      setNightHours(Math.floor(defaultNight / 60));
      setNightMinutes(defaultNight % 60);
      setNapMinutes(defaultNap);
    }
  }, [existingRecord, defaultNight, defaultNap, targetDate]);

  if (!isOpen) return null;

  const catMap = {};
  categories.forEach(c => { catMap[c.id] = c; });

  const recordedRoutineIds = new Set();
  sessions.forEach(s => {
    if (!s.start) return;
    const sDate = getLogicalDateString(new Date(s.start), cutoffHour);
    if (sDate === targetDate) {
      recordedRoutineIds.add(s.taskId);
    }
  });

  const toggleRoutine = (rId, defaultMin) => {
    setSelectedRoutines(prev => ({
      ...prev,
      [rId]: prev[rId] ? undefined : (defaultMin || 30)
    }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    const totalNightMin = (nightHours * 60) + parseInt(nightMinutes, 10);

    Object.entries(selectedRoutines).forEach(([rId, minutes]) => {
      if (minutes) {
        const routine = routines.find(r => r.id === rId);
        if (routine) {
          onAddRoutineSession({
            taskId: rId,
            categoryId: routine.categoryId,
            logicalDate: targetDate,
            durationMin: minutes
          });
        }
      }
    });

    onSaveCheckin(targetDate, {
      sleepNightMin: totalNightMin,
      sleepNapMin: parseInt(napMinutes, 10),
      routinesRecorded: Object.keys(selectedRoutines)
    });

    confetti({
      particleCount: 60,
      spread: 60,
      origin: { y: 0.6 }
    });

    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="modal-title">Check-in Harian</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              {formatIndonesianDate(targetDate)}
            </div>
          </div>
          <button onClick={onClose} className="action-icon-btn">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Sleep Section */}
          <div style={{ background: 'var(--bg-base)', padding: '12px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Moon size={15} />
              <span>Tidur</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  Malam
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <input
                    type="number"
                    min="0"
                    max="14"
                    value={nightHours}
                    onChange={e => setNightHours(Math.max(0, parseInt(e.target.value) || 0))}
                    style={{ width: '48px', textAlign: 'center', padding: '6px 2px', fontSize: '0.85rem' }}
                  />
                  <span style={{ fontSize: '0.8rem' }}>j</span>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    step="5"
                    value={nightMinutes}
                    onChange={e => setNightMinutes(Math.max(0, parseInt(e.target.value) || 0))}
                    style={{ width: '48px', textAlign: 'center', padding: '6px 2px', fontSize: '0.85rem' }}
                  />
                  <span style={{ fontSize: '0.8rem' }}>m</span>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  Siang
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <input
                    type="number"
                    min="0"
                    max="180"
                    step="5"
                    value={napMinutes}
                    onChange={e => setNapMinutes(Math.max(0, parseInt(e.target.value) || 0))}
                    style={{ width: '56px', textAlign: 'center', padding: '6px 4px', fontSize: '0.85rem' }}
                  />
                  <span style={{ fontSize: '0.8rem' }}>menit</span>
                </div>
              </div>
            </div>
          </div>

          {/* Routines Confirmation Section */}
          {routines.length > 0 && (
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Heart size={15} />
                <span>Rutinitas</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {routines.map(routine => {
                  const cat = catMap[routine.categoryId];
                  const isAlreadyRecorded = recordedRoutineIds.has(routine.id);
                  const isCheckedNow = Boolean(selectedRoutines[routine.id]);

                  return (
                    <div
                      key={routine.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-sm)',
                        background: isAlreadyRecorded ? 'rgba(5, 150, 105, 0.04)' : 'var(--bg-base)',
                        border: isAlreadyRecorded ? '1px solid rgba(5, 150, 105, 0.2)' : '1px solid var(--border-subtle)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {isAlreadyRecorded ? (
                          <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                            <Check size={11} />
                          </div>
                        ) : (
                          <input
                            type="checkbox"
                            checked={isCheckedNow}
                            onChange={() => toggleRoutine(routine.id, routine.defaultMin)}
                            style={{ width: 16, height: 16, accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
                          />
                        )}

                        <div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-main)' }}>
                            {routine.description}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            [{cat?.code}] {isAlreadyRecorded ? 'Tercatat' : `~${routine.defaultMin || 30}m`}
                          </div>
                        </div>
                      </div>

                      {!isAlreadyRecorded && isCheckedNow && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                          <input
                            type="number"
                            min="5"
                            max="300"
                            step="5"
                            value={selectedRoutines[routine.id]}
                            onChange={e => setSelectedRoutines(prev => ({ ...prev, [routine.id]: parseInt(e.target.value) || 0 }))}
                            style={{ width: '48px', padding: '4px 2px', fontSize: '0.8rem', textAlign: 'center' }}
                          />
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>m</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
            <button type="button" onClick={onClose} className="btn-secondary">
              Tutup
            </button>
            <button type="submit" className="btn-success">
              <Check size={14} />
              <span>Simpan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
