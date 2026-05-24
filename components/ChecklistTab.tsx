'use client';
import { useState, useEffect } from 'react';
import { getChecklist, saveChecklist, syncChecklist } from '@/lib/store';
import { ChecklistItem, ChecklistCategory, ChecklistPriority } from '@/lib/types';

const CATEGORIES: ChecklistCategory[] = ['Venue', 'Catering', 'Music', 'Flowers', 'Attire', 'Photography', 'Logistics', 'Invitations', 'Legal', 'Other'];
const PRIORITIES: ChecklistPriority[] = ['High', 'Medium', 'Low'];

const PRIORITY_STYLE: Record<ChecklistPriority, { bg: string; color: string; dot: string }> = {
  'High': { bg: '#F8D7DA', color: '#721C24', dot: '#DC3545' },
  'Medium': { bg: '#FFF3CD', color: '#856404', dot: '#FFC107' },
  'Low': { bg: '#D4EDDA', color: '#276237', dot: '#28A745' },
};

function genId() { return Math.random().toString(36).slice(2, 10); }

const EMPTY: Omit<ChecklistItem, 'id'> = {
  task: '', category: 'Logistics', priority: 'Medium', done: false, dueDate: '', notes: '', assignedTo: '',
};

export default function ChecklistTab() {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ChecklistItem | null>(null);
  const [form, setForm] = useState<Omit<ChecklistItem, 'id'>>(EMPTY);
  const [filterCat, setFilterCat] = useState<ChecklistCategory | 'All'>('All');
  const [filterPri, setFilterPri] = useState<ChecklistPriority | 'All'>('All');
  const [showDone, setShowDone] = useState(false);

  useEffect(() => {
    const local = getChecklist();
    setItems(local);
    syncChecklist(local).then(fresh => setItems(fresh));
  }, []);

  function save(updated: ChecklistItem[]) { setItems(updated); saveChecklist(updated); }

  function handleSubmit() {
    if (!form.task) return;
    if (editing) {
      save(items.map(i => i.id === editing.id ? { ...form, id: editing.id } : i));
    } else {
      save([...items, { ...form, id: genId() }]);
    }
    setForm(EMPTY); setEditing(null); setShowForm(false);
  }

  function toggle(id: string) { save(items.map(i => i.id === id ? { ...i, done: !i.done } : i)); }
  function deleteItem(id: string) { if (confirm('Remove?')) save(items.filter(i => i.id !== id)); }
  function startEdit(item: ChecklistItem) { setEditing(item); setForm({ ...item }); setShowForm(true); }

  const filtered = items
    .filter(i => filterCat === 'All' || i.category === filterCat)
    .filter(i => filterPri === 'All' || i.priority === filterPri)
    .filter(i => showDone || !i.done)
    .sort((a, b) => {
      const po = { High: 0, Medium: 1, Low: 2 };
      return po[a.priority] - po[b.priority];
    });

  const done = items.filter(i => i.done).length;
  const pct = items.length > 0 ? Math.round((done / items.length) * 100) : 0;

  const card = { background: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid var(--light-gray)' };
  const inputStyle: React.CSSProperties = { width: '100%', padding: '0.6rem 0.8rem', border: '1px solid var(--light-gray)', borderRadius: '8px', fontSize: '0.85rem', fontFamily: 'Jost, sans-serif', background: 'var(--warm-white)', color: 'var(--charcoal)', outline: 'none' };

  // Group by category for display
  const byCategory: Record<string, ChecklistItem[]> = {};
  filtered.forEach(i => {
    if (!byCategory[i.category]) byCategory[i.category] = [];
    byCategory[i.category].push(i);
  });

  return (
    <div>
      {/* Progress */}
      <div style={{ ...card, marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <h2 className="font-display" style={{ fontSize: '1.3rem', fontWeight: 400 }}>Wedding Checklist</h2>
          <span className="font-sans-clean" style={{ fontSize: '0.8rem', color: 'var(--mid-gray)' }}>{done} / {items.length} complete</span>
        </div>
        <div style={{ height: '8px', background: 'var(--light-gray)', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: `linear-gradient(90deg, var(--sage), var(--champagne))`, borderRadius: '4px', transition: 'width 0.5s' }} />
        </div>
        <p className="font-sans-clean" style={{ fontSize: '0.72rem', color: 'var(--mid-gray)', marginTop: '0.4rem' }}>{pct}% complete</p>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <select style={{ ...inputStyle, width: 'auto', padding: '0.5rem 0.8rem' }} value={filterCat} onChange={e => setFilterCat(e.target.value as any)}>
            <option value="All">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select style={{ ...inputStyle, width: 'auto', padding: '0.5rem 0.8rem' }} value={filterPri} onChange={e => setFilterPri(e.target.value as any)}>
            <option value="All">All Priorities</option>
            {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <button onClick={() => setShowDone(!showDone)} style={{ padding: '0.5rem 1rem', border: '1px solid var(--light-gray)', borderRadius: '8px', background: showDone ? 'var(--charcoal)' : 'white', color: showDone ? 'white' : 'var(--charcoal)', cursor: 'pointer', fontFamily: 'Jost', fontSize: '0.78rem' }}>
            {showDone ? 'Hide Done' : 'Show Done'}
          </button>
        </div>
        <button onClick={() => { setForm(EMPTY); setEditing(null); setShowForm(true); }} style={{ padding: '0.65rem 1.5rem', background: 'var(--charcoal)', color: 'var(--cream)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'Jost', fontSize: '0.8rem', letterSpacing: '0.1em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>+ Add Task</button>
      </div>

      {/* Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, overflowY: 'auto', padding: '5rem 1rem 2rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '2rem', width: '100%', maxWidth: '480px', margin: 'auto', flexShrink: 0 }}>
            <h2 className="font-display" style={{ fontSize: '1.5rem', marginBottom: '1.5rem', fontWeight: 400 }}>{editing ? 'Edit Task' : 'Add Task'}</h2>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              <div>
                <label className="font-sans-clean" style={{ fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--mid-gray)', display: 'block', marginBottom: '0.3rem' }}>Task *</label>
                <input style={inputStyle} value={form.task} onChange={e => setForm(f => ({ ...f, task: e.target.value }))} placeholder="What needs to be done?" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className="font-sans-clean" style={{ fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--mid-gray)', display: 'block', marginBottom: '0.3rem' }}>Category</label>
                  <select style={inputStyle} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as ChecklistCategory }))}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="font-sans-clean" style={{ fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--mid-gray)', display: 'block', marginBottom: '0.3rem' }}>Priority</label>
                  <select style={inputStyle} value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as ChecklistPriority }))}>
                    {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="font-sans-clean" style={{ fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--mid-gray)', display: 'block', marginBottom: '0.3rem' }}>Due Date</label>
                  <input style={inputStyle} type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
                </div>
                <div>
                  <label className="font-sans-clean" style={{ fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--mid-gray)', display: 'block', marginBottom: '0.3rem' }}>Assigned To</label>
                  <input style={inputStyle} value={form.assignedTo} onChange={e => setForm(f => ({ ...f, assignedTo: e.target.value }))} placeholder="Jeff / Nat / Both..." />
                </div>
              </div>
              <div>
                <label className="font-sans-clean" style={{ fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--mid-gray)', display: 'block', marginBottom: '0.3rem' }}>Notes</label>
                <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: '60px' }} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
              <button onClick={() => { setShowForm(false); setEditing(null); }} style={{ padding: '0.65rem 1.25rem', background: 'var(--light-gray)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'Jost', fontSize: '0.8rem' }}>Cancel</button>
              <button onClick={handleSubmit} style={{ padding: '0.65rem 1.5rem', background: 'var(--charcoal)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'Jost', fontSize: '0.8rem' }}>
                {editing ? 'Save' : 'Add Task'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tasks by Category */}
      {Object.keys(byCategory).length === 0 ? (
        <div style={{ ...card, textAlign: 'center', padding: '3rem' }}>
          <p className="font-display" style={{ fontSize: '1.5rem', fontStyle: 'italic', color: 'var(--mid-gray)' }}>All clear — or add your first task!</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {Object.entries(byCategory).map(([cat, catItems]) => (
            <div key={cat} style={card}>
              <h3 className="font-sans-clean" style={{ fontSize: '0.7rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--mid-gray)', marginBottom: '0.75rem' }}>{cat}</h3>
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                {catItems.map(item => (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.6rem 0', borderBottom: '1px solid var(--light-gray)' }}>
                    <button onClick={() => toggle(item.id)} style={{ width: '20px', height: '20px', borderRadius: '50%', border: `2px solid ${item.done ? 'var(--deep-sage)' : 'var(--light-gray)'}`, background: item.done ? 'var(--deep-sage)' : 'white', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '1px' }}>
                      {item.done && <span style={{ color: 'white', fontSize: '0.6rem' }}>✓</span>}
                    </button>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.88rem', textDecoration: item.done ? 'line-through' : 'none', color: item.done ? 'var(--mid-gray)' : 'var(--charcoal)' }}>{item.task}</span>
                        <span style={{ ...PRIORITY_STYLE[item.priority], borderRadius: '3px', padding: '0.1rem 0.4rem', fontSize: '0.62rem', fontFamily: 'Jost' }}>{item.priority}</span>
                        {item.assignedTo && <span style={{ background: 'var(--light-gray)', borderRadius: '3px', padding: '0.1rem 0.4rem', fontSize: '0.62rem', fontFamily: 'Jost', color: 'var(--charcoal)' }}>{item.assignedTo}</span>}
                        {item.dueDate && <span style={{ fontSize: '0.68rem', color: 'var(--mid-gray)', fontFamily: 'Jost' }}>Due {new Date(item.dueDate + 'T00:00:00').toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })}</span>}
                      </div>
                      {item.notes && <p style={{ fontSize: '0.75rem', color: 'var(--mid-gray)', marginTop: '0.2rem' }}>{item.notes}</p>}
                    </div>
                    <div style={{ display: 'flex', gap: '0.3rem', flexShrink: 0 }}>
                      <button onClick={() => startEdit(item)} style={{ padding: '0.25rem 0.4rem', border: '1px solid var(--light-gray)', borderRadius: '5px', cursor: 'pointer', background: 'white', fontSize: '0.65rem' }}>✎</button>
                      <button onClick={() => deleteItem(item.id)} style={{ padding: '0.25rem 0.4rem', border: '1px solid var(--light-gray)', borderRadius: '5px', cursor: 'pointer', background: 'white', color: 'var(--dusty-rose)', fontSize: '0.65rem' }}>✕</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
