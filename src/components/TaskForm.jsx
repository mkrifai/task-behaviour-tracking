import React, { useState } from 'react';
import { Plus, Play, Tag } from 'lucide-react';

export function TaskForm({ categories, onAddTask, onOpenQuickCategory }) {
  const [description, setDescription] = useState('');
  const [selectedCatId, setSelectedCatId] = useState(categories[0]?.id || '');
  const [startImmediately, setStartImmediately] = useState(true);

  React.useEffect(() => {
    if (!selectedCatId && categories.length > 0) {
      setSelectedCatId(categories[0].id);
    }
  }, [categories, selectedCatId]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!description.trim() || !selectedCatId) return;

    onAddTask({
      categoryId: selectedCatId,
      description: description.trim(),
      startImmediately
    });

    setDescription('');
  };

  return (
    <div className="card-glass" style={{ padding: '16px 20px', marginBottom: '22px' }}>
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input
            type="text"
            placeholder="Apa tugas yang ingin kamu catat sekarang?..."
            value={description}
            onChange={e => setDescription(e.target.value)}
            style={{
              width: '100%',
              fontSize: '0.98rem',
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)'
            }}
            required
          />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <select
                value={selectedCatId}
                onChange={e => setSelectedCatId(e.target.value)}
                style={{
                  padding: '7px 12px',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  color: 'var(--text-main)'
                }}
              >
                {categories.map(c => (
                  <option key={c.id} value={c.id}>
                    [{c.code}] {c.name}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={onOpenQuickCategory}
                className="action-icon-btn"
                title="Tambah Kategori Baru"
                style={{ width: 30, height: 30 }}
              >
                <Tag size={14} />
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                <input
                  type="checkbox"
                  checked={startImmediately}
                  onChange={e => setStartImmediately(e.target.checked)}
                  style={{ width: '15px', height: '15px', accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
                />
                <span>Langsung Mulai</span>
              </label>

              <button type="submit" className="btn-primary" style={{ padding: '7px 16px', fontSize: '0.85rem' }}>
                {startImmediately ? <Play size={14} fill="white" /> : <Plus size={14} />}
                <span>{startImmediately ? 'Mulai' : 'Tambah'}</span>
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
