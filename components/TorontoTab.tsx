'use client';
import { useState, useEffect } from 'react';
import { getTorontoBudget, saveTorontoBudget, getTorontoChecklist, saveTorontoChecklist } from '@/lib/store';
import { TorontoBudgetItem, TorontoChecklistItem, PayStatus, ChecklistPriority } from '@/lib/types';

const CATEGORIES = ['Church', 'Dinner Venue', 'Catering', 'Photography', 'Flowers & Decor', 'Attire', 'Music', 'Transportation', 'Invitations', 'Other'];
const PAYERS = ['Us', "Jeff's Dad", "FIL's Dad", 'Shared'];
const STATUSES: PayStatus[] = ['Pending', 'Deposit Paid', 'Paid'];
const PRIORITIES: ChecklistPriority[] = ['High', 'Medium', 'Low'];
const CHECKLIST_CATS = ['Venue', 'Catering', 'Attire', 'Photography', 'Logistics', 'Invitations', 'Legal', 'Other'];

const STATUS_STYLE: Record<PayStatus, { bg: string; color: string }> = {
  'Paid': { bg: '#D4EDDA', color: '#276237' },
  'Pending': { bg: '#FFF3CD', color: '#856404' },
  'Deposit Paid': { bg: '#D1ECF1', color: '#0C5460' },
};

const PRIORITY_STYLE: Record<ChecklistPriority, { bg: string; color: string }> = {
  'High': { bg: '#F8D7DA', color: '#721C24' },
  'Medium': { bg: '#FFF3CD', color: '#856404' },
  'Low': { bg: '#D4EDDA', color: '#276237' },
};

function genId() { return Math.random().toString(36).slice(2, 10); }
function fmt(n: number) { return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(n); }

const EMPTY_BUDGET: Omit<TorontoBudgetItem, 'id'> = { category: 'Church', description: '', vendor: '', totalAmount: 0, paidBy: 'Us', status: 'Pending', notes: '' };
const EMPTY_TASK: Omit<TorontoChecklistItem, 'id'> = { task: '', category: 'Logistics', priority: 'Medium', done: false, dueDate: '', notes: '' };

export default function TorontoTab() {
  const [budgetItems, setBudgetItems] = useState<TorontoBudgetItem[]>([]);
  const [checklist, setChecklist] = useState<TorontoChecklistItem[]>([]);
  const [view, setView] = useState<'budget' | 'checklist'>('budget');
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState<TorontoBudgetItem | null>(null);
  const [editingTask, setEditingTask] = useState<TorontoChecklistItem | null>(null);
  const [budgetForm, setBudgetForm] = useState<Omit<TorontoBudgetItem, 'id'>>(EMPTY_BUDGET);
  const [taskForm, setTaskForm] = useState<Omit<TorontoChecklistItem, 'id'>>(EMPTY_TASK);

  useEffect(() => { setBudgetItems(getTorontoBudget()); setChecklist(getTorontoChecklist()); }, []);

  function saveBudget(updated: TorontoBudgetItem[]) { setBudgetItems(updated); saveTorontoBudget(updated); }
  function saveCheck(updated: TorontoChecklistItem[]) { setChecklist(updated); saveTorontoChecklist(updated); }

  function submitBudget() {
    if (!budgetForm.description || budgetForm.totalAmount <= 0) return;
    if (editingBudget) {
      saveBudget(budgetItems.map(i => i.id === editingBudget.id ? { ...budgetForm, id: editingBudget.id } : i));
    } else {
      saveBudget([...budgetItems, { ...budgetForm, id: genId() }]);
    }
    setBudgetForm(EMPTY_BUDGET); setEditingBudget(null); setShowBudgetForm(false);
  }

  function submitTask() {
    if (!taskForm.task) return;
    if (editingTask) {
      saveCheck(checklist.map(i => i.id === editingTask.id ? { ...taskForm, id: editingTask.id } : i));
    } else {
      saveCheck([...checklist, { ...taskForm, id: genId() }]);
    }
    setTaskForm(EMPTY_TASK); setEditingTask(null); setShowTaskForm(false);
  }

  const totalBudget = budgetItems.reduce((s, i) => s + i.totalAmount, 0);
  const paid = budgetItems.filter(i => i.status === 'Paid').reduce((s, i) => s + i.totalAmount, 0);
  const doneTasks = checklist.filter(i => i.done).length;
  const pct = checklist.length > 0 ? Math.round((doneTasks / checklist.length) * 100) : 0;

  const card = { background: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid var(--light-gray)' };
  const inputStyle: React.CSSProperties = { width: '100%', padding: '0.6rem 0.8rem', border: '1px solid var(--light-gray)', borderRadius: '8px', fontSize: '0.85rem', fontFamily: 'Jost, sans-serif', background: 'var(--warm-white)', color: 'var(--charcoal)', outline: 'none' };

  return (
    <div>
      {/* Header */}
      <div style={{ ...card, marginBottom: '1.5rem', background: 'var(--charcoal)', color: 'var(--cream)', border: 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <p className="font-sans-clean" style={{ fontSize: '0.65rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--champagne)', marginBottom: '0.3rem' }}>⛪ Toronto Wedding</p>
            <h2 className="font-display" style={{ fontSize: '1.8rem', fontWeight: 300 }}>Church Ceremony <span style={{ fontStyle: 'italic', color: 'var(--blush)' }}>& Dinner</span></h2>
            <p className="font-sans-clean" style={{ fontSize: '0.78rem', color: 'var(--mid-gray)', marginTop: '0.3rem' }}>~32 guests · Church followed by dinner</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="font-display" style={{ fontSize: '2rem', color: 'var(--champagne)' }}>{fmt(totalBudget)}</div>
            <p className="font-sans-clean" style={{ fontSize: '0.7rem', color: 'var(--mid-gray)' }}>{fmt(paid)} paid · {fmt(totalBudget - paid)} remaining</p>
          </div>
        </div>
      </div>

      {/* Sub-nav */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {(['budget', 'checklist'] as const).map(v => (
          <button key={v} onClick={() => setView(v)} style={{
            padding: '0.6rem 1.25rem', border: '1px solid var(--light-gray)', borderRadius: '8px', cursor: 'pointer',
            background: view === v ? 'var(--charcoal)' : 'white', color: view === v ? 'white' : 'var(--charcoal)',
            fontFamily: 'Jost', fontSize: '0.78rem', letterSpacing: '0.1em', textTransform: 'capitalize',
          }}>{v === 'budget' ? '💰 Budget' : '✓ Checklist'}</button>
        ))}
      </div>

      {view === 'budget' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, auto)', gap: '0.75rem' }}>
              {[{ label: 'Total', val: fmt(totalBudget), color: 'var(--charcoal)' }, { label: 'Paid', val: fmt(paid), color: 'var(--deep-sage)' }, { label: 'Remaining', val: fmt(totalBudget - paid), color: 'var(--dusty-rose)' }].map(s => (
                <div key={s.label} style={{ ...card, padding: '0.75rem 1rem' }}>
                  <p className="font-sans-clean" style={{ fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--mid-gray)' }}>{s.label}</p>
                  <p className="font-display" style={{ fontSize: '1.2rem', color: s.color }}>{s.val}</p>
                </div>
              ))}
            </div>
            <button onClick={() => { setBudgetForm(EMPTY_BUDGET); setEditingBudget(null); setShowBudgetForm(true); }} style={{ padding: '0.65rem 1.25rem', background: 'var(--charcoal)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'Jost', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>+ Add Item</button>
          </div>

          {/* Budget Form Modal */}
          {showBudgetForm && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
              <div style={{ background: 'white', borderRadius: '16px', padding: '2rem', width: '100%', maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto' }}>
                <h2 className="font-display" style={{ fontSize: '1.4rem', marginBottom: '1.25rem', fontWeight: 400 }}>{editingBudget ? 'Edit' : 'Add'} Toronto Budget Item</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div style={{ gridColumn: '1/-1' }}>
                    <label className="font-sans-clean" style={{ fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--mid-gray)', display: 'block', marginBottom: '0.3rem' }}>Description *</label>
                    <input style={inputStyle} value={budgetForm.description} onChange={e => setBudgetForm(f => ({ ...f, description: e.target.value }))} />
                  </div>
                  <div>
                    <label className="font-sans-clean" style={{ fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--mid-gray)', display: 'block', marginBottom: '0.3rem' }}>Category</label>
                    <select style={inputStyle} value={budgetForm.category} onChange={e => setBudgetForm(f => ({ ...f, category: e.target.value }))}>
                      {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="font-sans-clean" style={{ fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--mid-gray)', display: 'block', marginBottom: '0.3rem' }}>Vendor</label>
                    <input style={inputStyle} value={budgetForm.vendor} onChange={e => setBudgetForm(f => ({ ...f, vendor: e.target.value }))} />
                  </div>
                  <div>
                    <label className="font-sans-clean" style={{ fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--mid-gray)', display: 'block', marginBottom: '0.3rem' }}>Amount (CAD) *</label>
                    <input style={inputStyle} type="number" value={budgetForm.totalAmount || ''} onChange={e => setBudgetForm(f => ({ ...f, totalAmount: parseFloat(e.target.value) || 0 }))} />
                  </div>
                  <div>
                    <label className="font-sans-clean" style={{ fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--mid-gray)', display: 'block', marginBottom: '0.3rem' }}>Paid By</label>
                    <select style={inputStyle} value={budgetForm.paidBy} onChange={e => setBudgetForm(f => ({ ...f, paidBy: e.target.value }))}>
                      {PAYERS.map(p => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="font-sans-clean" style={{ fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--mid-gray)', display: 'block', marginBottom: '0.3rem' }}>Status</label>
                    <select style={inputStyle} value={budgetForm.status} onChange={e => setBudgetForm(f => ({ ...f, status: e.target.value as PayStatus }))}>
                      {STATUSES.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div style={{ gridColumn: '1/-1' }}>
                    <label className="font-sans-clean" style={{ fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--mid-gray)', display: 'block', marginBottom: '0.3rem' }}>Notes</label>
                    <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: '60px' }} value={budgetForm.notes} onChange={e => setBudgetForm(f => ({ ...f, notes: e.target.value }))} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                  <button onClick={() => setShowBudgetForm(false)} style={{ padding: '0.65rem 1.25rem', background: 'var(--light-gray)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'Jost', fontSize: '0.8rem' }}>Cancel</button>
                  <button onClick={submitBudget} style={{ padding: '0.65rem 1.25rem', background: 'var(--charcoal)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'Jost', fontSize: '0.8rem' }}>Save</button>
                </div>
              </div>
            </div>
          )}

          <div style={{ ...card, overflowX: 'auto' }}>
            {budgetItems.length === 0 ? (
              <p className="font-display" style={{ textAlign: 'center', padding: '2rem', color: 'var(--mid-gray)', fontStyle: 'italic' }}>Add your Toronto wedding expenses</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--light-gray)' }}>
                    {['Category', 'Description', 'Vendor', 'Amount', 'Paid By', 'Status', ''].map(h => (
                      <th key={h} className="font-sans-clean" style={{ padding: '0.75rem 0.5rem', textAlign: 'left', fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--mid-gray)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {budgetItems.map((item, idx) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--light-gray)', background: idx % 2 === 0 ? 'white' : 'var(--warm-white)' }}>
                      <td style={{ padding: '0.75rem 0.5rem', color: 'var(--mid-gray)' }}>{item.category}</td>
                      <td style={{ padding: '0.75rem 0.5rem', fontWeight: 500 }}>{item.description}{item.notes && <div style={{ fontSize: '0.7rem', color: 'var(--mid-gray)' }}>{item.notes}</div>}</td>
                      <td style={{ padding: '0.75rem 0.5rem', color: 'var(--mid-gray)' }}>{item.vendor || '—'}</td>
                      <td style={{ padding: '0.75rem 0.5rem', fontFamily: 'Jost', fontWeight: 600 }}>{fmt(item.totalAmount)}</td>
                      <td style={{ padding: '0.75rem 0.5rem', fontFamily: 'Jost', fontSize: '0.78rem' }}>{item.paidBy}</td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <span style={{ ...STATUS_STYLE[item.status], borderRadius: '4px', padding: '0.2rem 0.6rem', fontSize: '0.68rem', fontFamily: 'Jost' }}>{item.status}</span>
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <div style={{ display: 'flex', gap: '0.3rem' }}>
                          <button onClick={() => { setEditingBudget(item); setBudgetForm({ ...item }); setShowBudgetForm(true); }} style={{ padding: '0.25rem 0.4rem', border: '1px solid var(--light-gray)', borderRadius: '5px', cursor: 'pointer', background: 'white', fontSize: '0.65rem' }}>✎</button>
                          <button onClick={() => { if (confirm('Remove?')) saveBudget(budgetItems.filter(i => i.id !== item.id)); }} style={{ padding: '0.25rem 0.4rem', border: '1px solid var(--light-gray)', borderRadius: '5px', cursor: 'pointer', background: 'white', color: 'var(--dusty-rose)', fontSize: '0.65rem' }}>✕</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: '2px solid var(--charcoal)' }}>
                    <td colSpan={3} className="font-sans-clean" style={{ padding: '0.75rem 0.5rem', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Total</td>
                    <td className="font-display" style={{ padding: '0.75rem 0.5rem', fontSize: '1rem', fontWeight: 600 }}>{fmt(totalBudget)}</td>
                    <td colSpan={3} />
                  </tr>
                </tfoot>
              </table>
            )}
          </div>
        </>
      )}

      {view === 'checklist' && (
        <>
          <div style={{ ...card, marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
              <span className="font-sans-clean" style={{ fontSize: '0.75rem', color: 'var(--mid-gray)' }}>{doneTasks} / {checklist.length} tasks complete</span>
              <button onClick={() => { setTaskForm(EMPTY_TASK); setEditingTask(null); setShowTaskForm(true); }} style={{ padding: '0.5rem 1.25rem', background: 'var(--charcoal)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'Jost', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>+ Add Task</button>
            </div>
            <div style={{ height: '6px', background: 'var(--light-gray)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, var(--sage), var(--champagne))', transition: 'width 0.5s' }} />
            </div>
          </div>

          {showTaskForm && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
              <div style={{ background: 'white', borderRadius: '16px', padding: '2rem', width: '100%', maxWidth: '420px', maxHeight: '90vh', overflowY: 'auto' }}>
                <h2 className="font-display" style={{ fontSize: '1.4rem', marginBottom: '1.25rem', fontWeight: 400 }}>{editingTask ? 'Edit' : 'Add'} Task</h2>
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  <input style={inputStyle} placeholder="Task *" value={taskForm.task} onChange={e => setTaskForm(f => ({ ...f, task: e.target.value }))} />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <select style={inputStyle} value={taskForm.category} onChange={e => setTaskForm(f => ({ ...f, category: e.target.value }))}>
                      {CHECKLIST_CATS.map(c => <option key={c}>{c}</option>)}
                    </select>
                    <select style={inputStyle} value={taskForm.priority} onChange={e => setTaskForm(f => ({ ...f, priority: e.target.value as ChecklistPriority }))}>
                      {PRIORITIES.map(p => <option key={p}>{p}</option>)}
                    </select>
                    <input style={inputStyle} type="date" value={taskForm.dueDate} onChange={e => setTaskForm(f => ({ ...f, dueDate: e.target.value }))} />
                  </div>
                  <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: '60px' }} placeholder="Notes..." value={taskForm.notes} onChange={e => setTaskForm(f => ({ ...f, notes: e.target.value }))} />
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem', justifyContent: 'flex-end' }}>
                  <button onClick={() => setShowTaskForm(false)} style={{ padding: '0.65rem 1.25rem', background: 'var(--light-gray)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'Jost', fontSize: '0.8rem' }}>Cancel</button>
                  <button onClick={submitTask} style={{ padding: '0.65rem 1.25rem', background: 'var(--charcoal)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'Jost', fontSize: '0.8rem' }}>Save</button>
                </div>
              </div>
            </div>
          )}

          {checklist.length === 0 ? (
            <div style={{ ...card, textAlign: 'center', padding: '2rem' }}>
              <p className="font-display" style={{ color: 'var(--mid-gray)', fontStyle: 'italic' }}>No tasks yet — add your Toronto wedding to-dos</p>
            </div>
          ) : (
            <div style={card}>
              {checklist.map(item => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.7rem 0', borderBottom: '1px solid var(--light-gray)' }}>
                  <button onClick={() => saveCheck(checklist.map(i => i.id === item.id ? { ...i, done: !i.done } : i))} style={{ width: '20px', height: '20px', borderRadius: '50%', border: `2px solid ${item.done ? 'var(--deep-sage)' : 'var(--light-gray)'}`, background: item.done ? 'var(--deep-sage)' : 'white', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '1px' }}>
                    {item.done && <span style={{ color: 'white', fontSize: '0.6rem' }}>✓</span>}
                  </button>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.88rem', textDecoration: item.done ? 'line-through' : 'none', color: item.done ? 'var(--mid-gray)' : 'var(--charcoal)' }}>{item.task}</span>
                      <span style={{ ...PRIORITY_STYLE[item.priority], borderRadius: '3px', padding: '0.1rem 0.4rem', fontSize: '0.62rem', fontFamily: 'Jost' }}>{item.priority}</span>
                      <span style={{ background: 'var(--light-gray)', borderRadius: '3px', padding: '0.1rem 0.4rem', fontSize: '0.62rem', fontFamily: 'Jost' }}>{item.category}</span>
                      {item.dueDate && <span style={{ fontSize: '0.68rem', color: 'var(--mid-gray)', fontFamily: 'Jost' }}>Due {new Date(item.dueDate + 'T00:00:00').toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })}</span>}
                    </div>
                    {item.notes && <p style={{ fontSize: '0.75rem', color: 'var(--mid-gray)', marginTop: '0.2rem' }}>{item.notes}</p>}
                  </div>
                  <div style={{ display: 'flex', gap: '0.3rem', flexShrink: 0 }}>
                    <button onClick={() => { setEditingTask(item); setTaskForm({ ...item }); setShowTaskForm(true); }} style={{ padding: '0.25rem 0.4rem', border: '1px solid var(--light-gray)', borderRadius: '5px', cursor: 'pointer', background: 'white', fontSize: '0.65rem' }}>✎</button>
                    <button onClick={() => { if (confirm('Remove?')) saveCheck(checklist.filter(i => i.id !== item.id)); }} style={{ padding: '0.25rem 0.4rem', border: '1px solid var(--light-gray)', borderRadius: '5px', cursor: 'pointer', background: 'white', color: 'var(--dusty-rose)', fontSize: '0.65rem' }}>✕</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
