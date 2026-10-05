import React from 'react';
import { formatDurationHuman } from '../lib/time';
import { DAY_MS } from '../lib/rest';
import { Moon, Heart, Briefcase, Sparkles, Coffee } from 'lucide-react';

export function DayBalanceBar({ balance, onOpenCheckin }) {
  if (!balance) return null;

  const {
    workMs,
    familyMs,
    selfMs,
    sleepMs,
    softRestMs,
    availableMsForDay,
    isToday,
    checkedIn
  } = balance;

  const totalBaseMs = isToday ? Math.max(availableMsForDay, 1) : DAY_MS;

  const getPct = (ms) => Math.max(0, Math.min(100, (ms / totalBaseMs) * 100));

  const pctWork = getPct(workMs);
  const pctFamily = getPct(familyMs);
  const pctSelf = getPct(selfMs);
  const pctSleep = getPct(sleepMs * (isToday ? (availableMsForDay / DAY_MS) : 1));
  const pctRest = Math.max(0, 100 - (pctWork + pctFamily + pctSelf + pctSleep));

  return (
    <div className="day-balance-widget">
      <div className="balance-header">
        <div className="balance-title">
          <Coffee size={18} style={{ color: 'var(--accent-amber)' }} />
          <span>Keseimbangan 24 Jam ({isToday ? 'Hari Ini' : 'Tanggal ' + balance.logicalDate})</span>
        </div>
        <div>
          {checkedIn ? (
            <span className="badge" style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
              ✓ Check-in Selesai
            </span>
          ) : (
            <button
              onClick={onOpenCheckin}
              className="badge"
              style={{ backgroundColor: 'rgba(99, 102, 241, 0.2)', color: '#a5b4fc', cursor: 'pointer' }}
            >
              + Check-in Malam
            </button>
          )}
        </div>
      </div>

      <div className="balance-bar-container">
        {pctWork > 0 && (
          <div 
            className="balance-segment" 
            style={{ width: `${pctWork}%`, backgroundColor: 'var(--group-work)' }}
            title={`Kerja / Produktif: ${formatDurationHuman(workMs)}`}
          />
        )}
        {pctFamily > 0 && (
          <div 
            className="balance-segment" 
            style={{ width: `${pctFamily}%`, backgroundColor: 'var(--group-family)' }}
            title={`Keluarga: ${formatDurationHuman(familyMs)}`}
          />
        )}
        {pctSelf > 0 && (
          <div 
            className="balance-segment" 
            style={{ width: `${pctSelf}%`, backgroundColor: 'var(--group-self)' }}
            title={`Diri Sendiri: ${formatDurationHuman(selfMs)}`}
          />
        )}
        {pctSleep > 0 && (
          <div 
            className="balance-segment" 
            style={{ width: `${pctSleep}%`, backgroundColor: 'var(--group-sleep)' }}
            title={`Tidur: ${formatDurationHuman(sleepMs)}`}
          />
        )}
        {pctRest > 0 && (
          <div 
            className="balance-segment" 
            style={{ width: `${pctRest}%`, backgroundColor: 'var(--group-rest)' }}
            title={`Istirahat Soft: ${formatDurationHuman(softRestMs)}`}
          />
        )}
      </div>

      <div className="balance-legend">
        <div className="legend-item">
          <span className="legend-dot" style={{ backgroundColor: 'var(--group-work)' }} />
          <span>Kerja: <strong>{formatDurationHuman(workMs)}</strong></span>
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ backgroundColor: 'var(--group-family)' }} />
          <span>Keluarga: <strong>{formatDurationHuman(familyMs)}</strong></span>
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ backgroundColor: 'var(--group-self)' }} />
          <span>Diri Sendiri: <strong>{formatDurationHuman(selfMs)}</strong></span>
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ backgroundColor: 'var(--group-sleep)' }} />
          <span>Tidur: <strong>{formatDurationHuman(sleepMs)}</strong></span>
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ backgroundColor: 'var(--group-rest)' }} />
          <span>Istirahat: <strong>{formatDurationHuman(softRestMs)}</strong></span>
        </div>
      </div>
    </div>
  );
}
