import React, { useState } from 'react';
import { 
  Tag, 
  Heart, 
  Clock, 
  Download, 
  Upload, 
  Trash2, 
  Plus, 
  Check, 
  ShieldCheck,
  Edit2
} from 'lucide-react';
import { exportAllDataJson, importAllDataJson } from '../lib/storage';

export function SettingsPage({
  categories,
  tasks,
  settings,
  onSaveCategories,
  onSaveSettings,
  onAddTask,
  onDeleteTask,
  onOpenQuickCategory,
  onOpenEditCategory
}) {
  const [cutoffHour, setCutoffHour] = useState(settings.cutoffHour ?? 4);
  const [sleepNightHours, setSleepNightHours] = useState(Math.floor((settings.sleepNightMin ?? 300) / 60));
  const [sleepNightMins, setSleepNightMins] = useState((settings.sleepNightMin ?? 300) % 60);
  const [sleepNapMins, setSleepNapMins] = useState(settings.sleepNapMin ?? 35);
  const [geminiApiKey, setGeminiApiKey] = useState(settings.geminiApiKey || '');

  const [newRoutineDesc, setNewRoutineDesc] = useState('');
  const [newRoutineCatId, setNewRoutineCatId] = useState(categories[0]?.id || '');
  const [newRoutineMinutes, setNewRoutineMinutes] = useState(30);

  const routines = tasks.filter(t => t.type === 'routine');
  const catMap = {};
  categories.forEach(c => { catMap[c.id] = c; });

  const handleSavePreferences = (e) => {
    e.preventDefault();
    const totalNightMin = (sleepNightHours * 60) + parseInt(sleepNightMins, 10);
    onSaveSettings({
      cutoffHour: parseInt(cutoffHour, 10),
      sleepNightMin: totalNightMin,
      sleepNapMin: parseInt(sleepNapMins, 10),
      geminiApiKey: geminiApiKey.trim()
    });
    alert('Pengaturan disimpan!');
  };

  const handleAddRoutine = (e) => {
    e.preventDefault();
    if (!newRoutineDesc.trim() || !newRoutineCatId) return;

    onAddTask({
      categoryId: newRoutineCatId,
      description: newRoutineDesc.trim(),
      type: 'routine',
      defaultMin: parseInt(newRoutineMinutes, 10) || 30
    });

    setNewRoutineDesc('');
  };

  const handleDeleteCategory = (catId) => {
    if (categories.length <= 1) {
      alert('Minimal harus ada 1 kategori.');
      return;
    }
    if (window.confirm('Hapus kategori ini?')) {
      onSaveCategories(categories.filter(c => c.id !== catId));
    }
  };

  const handleExportBackup = () => {
    const jsonStr = exportAllDataJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `HabitPulse_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        importAllDataJson(event.target.result);
        alert('Data berhasil dipulihkan!');
        window.location.reload();
      } catch (err) {
        alert('Gagal membaca file cadangan.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', letterSpacing: '-0.02em', marginBottom: '18px' }}>
        Pengaturan
      </h1>

      {/* 1. Kategori */}
      <div className="card-elevated" style={{ padding: '16px 18px', marginBottom: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <h2 style={{ fontSize: '0.96rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Tag size={16} />
            <span>Kategori ({categories.length})</span>
          </h2>

          <button onClick={onOpenQuickCategory} className="btn-primary" style={{ padding: '5px 12px', fontSize: '0.78rem' }}>
            <Plus size={13} />
            <span>Kategori</span>
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px' }}>
          {categories.map(cat => (
            <div
              key={cat.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--bg-base)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                <span
                  style={{
                    width: 9,
                    height: 9,
                    borderRadius: '50%',
                    backgroundColor: cat.color,
                    flexShrink: 0
                  }}
                />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    [{cat.code}] {cat.name}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {cat.group === 'family' ? 'Keluarga' : cat.group === 'self' ? 'Diri Sendiri' : 'Kerja'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <button
                  onClick={() => onOpenEditCategory?.(cat)}
                  className="action-icon-btn"
                  title="Edit Kategori"
                  style={{ width: 28, height: 28 }}
                >
                  <Edit2 size={13} />
                </button>
                <button
                  onClick={() => handleDeleteCategory(cat.id)}
                  className="action-icon-btn"
                  title="Hapus"
                  style={{ width: 28, height: 28 }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Rutinitas */}
      <div className="card-elevated" style={{ padding: '16px 18px', marginBottom: '18px' }}>
        <h2 style={{ fontSize: '0.96rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
          <Heart size={16} />
          <span>Rutinitas</span>
        </h2>

        <form onSubmit={handleAddRoutine} style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
          <input
            type="text"
            placeholder="Nama rutinitas..."
            value={newRoutineDesc}
            onChange={e => setNewRoutineDesc(e.target.value)}
            style={{ flex: 2, minWidth: '150px', fontSize: '0.85rem', padding: '7px 10px' }}
            required
          />

          <select
            value={newRoutineCatId}
            onChange={e => setNewRoutineCatId(e.target.value)}
            style={{ flex: 1, minWidth: '100px', fontSize: '0.85rem', padding: '7px 10px' }}
          >
            {categories.map(c => (
              <option key={c.id} value={c.id}>
                [{c.code}]
              </option>
            ))}
          </select>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <input
              type="number"
              min="5"
              max="240"
              step="5"
              value={newRoutineMinutes}
              onChange={e => setNewRoutineMinutes(e.target.value)}
              style={{ width: '55px', fontSize: '0.85rem', textAlign: 'center', padding: '7px 4px' }}
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>m</span>
          </div>

          <button type="submit" className="btn-primary" style={{ padding: '7px 12px', fontSize: '0.8rem' }}>
            <Plus size={13} />
            <span>Tambah</span>
          </button>
        </form>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {routines.map(rt => {
            const cat = catMap[rt.categoryId];
            return (
              <div
                key={rt.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--bg-base)',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    {rt.description}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    [{cat?.code}] ~{rt.defaultMin || 30} menit
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (window.confirm(`Hapus "${rt.description}"?`)) {
                      onDeleteTask(rt.id);
                    }
                  }}
                  className="action-icon-btn"
                  title="Hapus"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Batas Hari & Tidur */}
      <div className="card-elevated" style={{ padding: '16px 18px', marginBottom: '18px' }}>
        <h2 style={{ fontSize: '0.96rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
          <Clock size={16} />
          <span>Waktu & Istirahat</span>
        </h2>

        <form onSubmit={handleSavePreferences} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                Batas Pergantian Hari (Cutoff)
              </label>
              <select
                value={cutoffHour}
                onChange={e => setCutoffHour(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', fontSize: '0.85rem' }}
              >
                <option value="0">00:00 (Tengah Malam)</option>
                <option value="3">03:00 Pagi</option>
                <option value="4">04:00 Pagi</option>
                <option value="5">05:00 Pagi</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                Default Tidur Malam
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <input
                  type="number"
                  min="0"
                  max="12"
                  value={sleepNightHours}
                  onChange={e => setSleepNightHours(Math.max(0, parseInt(e.target.value) || 0))}
                  style={{ width: '50px', textAlign: 'center', padding: '8px 4px', fontSize: '0.85rem' }}
                />
                <span style={{ fontSize: '0.78rem' }}>j</span>
                <input
                  type="number"
                  min="0"
                  max="59"
                  step="5"
                  value={sleepNightMins}
                  onChange={e => setSleepNightMins(Math.max(0, parseInt(e.target.value) || 0))}
                  style={{ width: '50px', textAlign: 'center', padding: '8px 4px', fontSize: '0.85rem' }}
                />
                <span style={{ fontSize: '0.78rem' }}>m</span>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                Default Tidur Siang
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <input
                  type="number"
                  min="0"
                  max="180"
                  step="5"
                  value={sleepNapMins}
                  onChange={e => setSleepNapMins(Math.max(0, parseInt(e.target.value) || 0))}
                  style={{ width: '60px', textAlign: 'center', padding: '8px 4px', fontSize: '0.85rem' }}
                />
                <span style={{ fontSize: '0.78rem' }}>menit</span>
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              Google Gemini API Key
            </label>
            <input
              type="password"
              placeholder="API Key..."
              value={geminiApiKey}
              onChange={e => setGeminiApiKey(e.target.value)}
              style={{ width: '100%', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', padding: '8px 10px' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn-primary" style={{ padding: '7px 16px', fontSize: '0.82rem' }}>
              <Check size={14} />
              <span>Simpan</span>
            </button>
          </div>
        </form>
      </div>

      {/* 4. Cadangan Data */}
      <div className="card-elevated" style={{ padding: '16px 18px' }}>
        <h2 style={{ fontSize: '0.96rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
          <ShieldCheck size={16} />
          <span>Cadangan Data (JSON)</span>
        </h2>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          <button onClick={handleExportBackup} className="btn-secondary" style={{ padding: '7px 12px', fontSize: '0.82rem' }}>
            <Download size={13} />
            <span>Download Cadangan</span>
          </button>

          <label className="btn-secondary" style={{ cursor: 'pointer', padding: '7px 12px', fontSize: '0.82rem' }}>
            <Upload size={13} />
            <span>Pulihkan File</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportBackup}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      </div>
    </div>
  );
}
