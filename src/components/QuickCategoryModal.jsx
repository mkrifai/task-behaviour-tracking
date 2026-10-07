import React, { useState } from 'react';
import { X, Check, Tag } from 'lucide-react';
import { CATEGORY_GROUPS } from '../lib/defaults';

const PRESET_COLORS = [
  '#6366f1', // Indigo
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#f43f5e', // Rose
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#14b8a6', // Teal
  '#eab308', // Yellow
];

export function QuickCategoryModal({ isOpen, onClose, onSave, categoryToEdit = null }) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [group, setGroup] = useState('work');
  const [color, setColor] = useState(PRESET_COLORS[0]);

  React.useEffect(() => {
    if (categoryToEdit) {
      setCode(categoryToEdit.code || '');
      setName(categoryToEdit.name || '');
      setGroup(categoryToEdit.group || 'work');
      setColor(categoryToEdit.color || PRESET_COLORS[0]);
    } else {
      setCode('');
      setName('');
      setGroup('work');
      setColor(PRESET_COLORS[0]);
    }
  }, [categoryToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) return;

    onSave({
      ...(categoryToEdit ? { id: categoryToEdit.id, order: categoryToEdit.order } : {}),
      code: code.trim().toUpperCase(),
      name: name.trim(),
      group,
      color,
    });

    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Tag size={20} style={{ color: 'var(--accent-primary)' }} />
            <span>{categoryToEdit ? 'Edit Kategori' : 'Tambah Kategori Baru'}</span>
          </div>
          <button onClick={onClose} className="action-icon-btn">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              Singkatan / Kode (mis. CAH, DFI, URG)
            </label>
            <input
              type="text"
              required
              maxLength={8}
              placeholder="Contoh: DFI, CLIENT"
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              style={{ width: '100%', textTransform: 'uppercase', fontWeight: 700 }}
              autoFocus
            />
          </div>

          <div>
            <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              Nama Lengkap Kategori
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Proyek Desain Klien"
              value={name}
              onChange={e => setName(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              Kelompok Kategori
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {CATEGORY_GROUPS.map(g => (
                <button
                  type="button"
                  key={g.id}
                  onClick={() => setGroup(g.id)}
                  style={{
                    padding: '10px 8px',
                    borderRadius: 'var(--radius-sm)',
                    border: group === g.id ? `2px solid ${g.color}` : '1px solid var(--border-subtle)',
                    background: group === g.id ? `${g.color}22` : 'var(--bg-input)',
                    color: group === g.id ? 'var(--text-main)' : 'var(--text-muted)',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    textAlign: 'center'
                  }}
                >
                  {g.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              Warna Label
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {PRESET_COLORS.map(c => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setColor(c)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    backgroundColor: c,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    border: color === c ? '3px solid white' : 'none',
                    transform: color === c ? 'scale(1.15)' : 'scale(1)',
                    boxShadow: color === c ? '0 0 12px ' + c : 'none'
                  }}
                >
                  {color === c && <Check size={16} />}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button type="button" onClick={onClose} className="btn-secondary">
              Batal
            </button>
            <button type="submit" className="btn-primary">
              {categoryToEdit ? 'Simpan Perubahan' : 'Simpan Kategori'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
