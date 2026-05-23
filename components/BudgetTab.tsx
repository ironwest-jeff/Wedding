'use client';
import { useState, useEffect } from 'react';
import { getBudgetItems, saveBudgetItems } from '@/lib/store';
import { BudgetItem, WeddingDay, Payer, PayStatus } from '@/lib/types';

const DAYS: WeddingDay[] = ['Aug 31 — Welcome Dinner', 'Sep 1 — Wedding Day', 'Sep 2 — Pool Party', 'Sep 3 — Checkout', 'All Days', 'N/A'];
const PAYERS: Payer[] = ['Us', "Jeff's Dad", "FIL's Dad", 'Shared', 'Vendor'];
const STATUSES: PayStatus[] = ['Pending', 'Deposit Paid', 'Paid'];
const CATEGORIES = ['Venue', 'Catering & Bar', 'Photography', 'Music & DJ', 'Flowers & Decor', 'Attire', 'Hair & Makeup', 'Transportation', 'Accommodation', 'Invitations & Stationery', 'Favors & Gifts', 'Officiant', 'Rings', 'Entertainment', 'Other'];

const PAYER_COLORS: Record<Payer, string> = {
  'Us': 'var(--sage)',
  "Jeff's Dad": 'var(--champagne)',
  "FIL's Dad": 'var(--dusty-rose)',
  'Shared': 'var(--mid-gray)',
  'Vendor': '#9B8EA0',
};

const DAY_COLORS: Record<WeddingDay, string> = {
  'Aug 31 — Welcome Dinner': '#C9897A',
  'Sep 1 — Wedding Day': '#C9A96E',
  'Sep 2 — Pool Party': '#8B9E88',
  'Sep 3 — Checkout': '#9B8EA0',
  'All Days': '#6B6B6B',
  'N/A': '#AAAAAA',
};

const STATUS_STYLE: Record<PayStatus, { bg: string; color: string }> = {
  'Paid': { bg: '#D4EDDA', color: '#276237' },
  'Pending': { bg: '#FFF3CD', color: '#856404' },
  'Deposit Paid': { bg: '#D1ECF1', color: '#0C5460' },
};

function fmt(n: number) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}

function genId() { return Math.random().toString(36).slice(2, 10); }

const EMPTY: Omit<BudgetItem, 'id'> = {
  category: 'Venue', description: '', vendor: '', day: 'Sep 1 — Wedding Day',
  totalAmount: 0, paidBy: 'Us', status: 'Pending', notes: '', dueDate: '',
};

export default function BudgetTab() {
  const [items, setItems] = useState<BudgetItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<BudgetItem | null>(null);
  const [form, setForm] = useState<Omit<BudgetItem, 'id'>>(EMPTY);
  const [filterDay, setFilterDay] = useState<WeddingDay | 'All'>('All');
  const [filterPayer, setFilterPayer] = useState<Payer | 'All'>('All');
  const [filterStatus, setFilterStatus] = useState<PayStatus | 'All'>('All');
  const [sortBy, setSortBy] = useState<'amount' | 'category' | 'day'>('category');

  useEffect(() => { setItems(getBudgetItems()); }, []);

  function save(updated: BudgetItem[]) {
    setItems(updated);
    saveBudgetItems(updated);
  }

  function handleSubmit() {
    if (!form.description || form.totalAmount <= 0) return;
    if (editing) {
      save(items.map(i => i.id === editing.id ? { ...form, id: editing.id } : i));
    } else {
      save([...items, { ...form, id: genId() }]);
    }
    setForm(EMPTY);
    setEditing(null);
    setShowForm(false);
  }

  function deleteItem(id: string) {
    if (confirm('Remove this budget item?')) save(items.filter(i => i.id !== id));
  }

  function togglePaid(id: string) {
    save(items.map(i => i.id === id ? { ...i, status: i.status === 'Paid' ? 'Pending' : 'Paid' } : i));
  }

  function startEdit(item: BudgetItem) {
    setEditing(item);
    setForm({ ...item });
    setShowForm(true);
  }

  // Filtered + sorted items
  const filtered = items
    .filter(i => filterDay === 'All' || i.day === filterDay)
    .filter(i => filterPayer === 'All' || i.paidBy === filterPayer)
    .filter(i => filterStatus === 'All' || i.status === filterStatus)
    .sort((a, b) => {
      if (sortBy === 'amount') return b.totalAmount - a.totalAmount;
      if (sortBy === 'day') return DAYS.indexOf(a.day) - DAYS.indexOf(b.day);
      return a.category.localeCompare(b.category);
    });

  // Summaries
  const totalBudget = items.reduce((s, i) => s + i.totalAmount, 0);
  const totalPaid = items.filter(i => i.status === 'Paid').reduce((s, i) => s + i.totalAmount, 0);
  const totalPending = totalBudget - totalPaid;

  const payerTotals = PAYERS.map(p => ({
    payer: p,
    total: items.filter(i => i.paidBy === p).reduce((s, i) => s + i.totalAmount, 0),
    paid: items.filter(i => i.paidBy === p && i.status === 'Paid').reduce((s, i) => s + i.totalAmount, 0),
  })).filter(p => p.total > 0);

  const dayTotals = DAYS.map(d => ({
    day: d,
    total: items.filter(i => i.day === d).reduce((s, i) => s + i.totalAmount, 0),
  })).filter(d => d.total > 0);

  const card = {
    background: 'white',
    borderRadius: '12px',
    padding: '1.5rem',
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
    border: '1px solid var(--light-gray)',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.6rem 0.8rem',
    border: '1px solid var(--light-gray)',
    borderRadius: '8px',
    fontSize: '0.85rem',
    fontFamily: 'Jost, sans-serif',
    background: 'var(--warm-white)',
    color: 'var(--charcoal)',
    outline: 'none',
  };

  return (
    <div>
      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Total Budget', value: fmt(totalBudget), accent: 'var(--charcoal)' },
          { label: 'Paid', value: fmt(totalPaid), accent: 'var(--deep-sage)' },
          { label: 'Remaining', value: fmt(totalPending), accent: 'var(--dusty-rose)' },
          { label: 'Items', value: items.length.toString(), accent: 'var(--champagne)' },
        ].map(s => (
          <div key={s.label} style={{ ...card, padding: '1.25rem' }}>
            <p className="font-sans-clean" style={{ fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--mid-gray)', marginBottom: '0.5rem' }}>{s.label}</p>
            <p className="font-display" style={{ fontSize: '1.8rem', fontWeight: 400, color: s.accent }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Payer Dashboard */}
      {payerTotals.length > 0 && (
        <div style={{ ...card, marginBottom: '1.5rem' }}>
          <h2 className="font-display" style={{ fontSize: '1.3rem', marginBottom: '1rem', fontWeight: 400 }}>Contribution Dashboard</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            {payerTotals.map(p => {
              const pct = p.total > 0 ? (p.paid / p.total) * 100 : 0;
              return (
                <div key={p.payer} style={{ background: 'var(--cream)', borderRadius: '10px', padding: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span className="font-sans-clean" style={{ fontSize: '0.75rem', fontWeight: 500, color: PAYER_COLORS[p.payer as Payer] }}>{p.payer}</span>
                    <span className="font-sans-clean" style={{ fontSize: '0.65rem', color: 'var(--mid-gray)' }}>{pct.toFixed(0)}%</span>
                  </div>
                  <div className="font-display" style={{ fontSize: '1.3rem', marginBottom: '0.25rem' }}>{fmt(p.total)}</div>
                  <div className="font-sans-clean" style={{ fontSize: '0.7rem', color: 'var(--mid-gray)' }}>
                    {fmt(p.paid)} paid · {fmt(p.total - p.paid)} remaining
                  </div>
                  <div style={{ marginTop: '0.6rem', height: '4px', background: 'var(--light-gray)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: PAYER_COLORS[p.payer as Payer], borderRadius: '2px', transition: 'width 0.5s' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* By Day */}
      {dayTotals.length > 0 && (
        <div style={{ ...card, marginBottom: '1.5rem' }}>
          <h2 className="font-display" style={{ fontSize: '1.3rem', marginBottom: '1rem', fontWeight: 400 }}>Cost by Day</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
            {dayTotals.map(d => (
              <div key={d.day} style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                background: 'var(--cream)', borderRadius: '8px', padding: '0.6rem 1rem',
                borderLeft: `3px solid ${DAY_COLORS[d.day]}`
              }}>
                <span className="font-sans-clean" style={{ fontSize: '0.75rem', color: DAY_COLORS[d.day], fontWeight: 500 }}>{d.day}</span>
                <span className="font-display" style={{ fontSize: '1rem' }}>{fmt(d.total)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {/* Day filter */}
          <select value={filterDay} onChange={e => setFilterDay(e.target.value as any)} style={{ ...inputStyle, width: 'auto', padding: '0.5rem 0.8rem' }}>
            <option value="All">All Days</option>
            {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <select value={filterPayer} onChange={e => setFilterPayer(e.target.value as any)} style={{ ...inputStyle, width: 'auto', padding: '0.5rem 0.8rem' }}>
            <option value="All">All Payers</option>
            {PAYERS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)} style={{ ...inputStyle, width: 'auto', padding: '0.5rem 0.8rem' }}>
            <option value="All">All Statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} style={{ ...inputStyle, width: 'auto', padding: '0.5rem 0.8rem' }}>
            <option value="category">Sort: Category</option>
            <option value="amount">Sort: Amount</option>
            <option value="day">Sort: Day</option>
          </select>
        </div>
        <button
          onClick={() => { setForm(EMPTY); setEditing(null); setShowForm(true); }}
          style={{ padding: '0.65rem 1.5rem', background: 'var(--charcoal)', color: 'var(--cream)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'Jost, sans-serif', fontSize: '0.8rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}
        >
          + Add Item
        </button>
      </div>

      {/* Modal Form */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '2rem', width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 className="font-display" style={{ fontSize: '1.5rem', marginBottom: '1.5rem', fontWeight: 400 }}>
              {editing ? 'Edit Item' : 'Add Budget Item'}
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div style={{ gridColumn: '1/-1' }}>
                <label className="font-sans-clean" style={{ fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--mid-gray)', display: 'block', marginBottom: '0.3rem' }}>Description *</label>
                <input style={inputStyle} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="e.g. Venue Rental" />
              </div>
              <div>
                <label className="font-sans-clean" style={{ fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--mid-gray)', display: 'block', marginBottom: '0.3rem' }}>Category</label>
                <select style={inputStyle} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="font-sans-clean" style={{ fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--mid-gray)', display: 'block', marginBottom: '0.3rem' }}>Vendor</label>
                <input style={inputStyle} value={form.vendor} onChange={e => setForm(f => ({ ...f, vendor: e.target.value }))} placeholder="Vendor name" />
              </div>
              <div>
                <label className="font-sans-clean" style={{ fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--mid-gray)', display: 'block', marginBottom: '0.3rem' }}>Day</label>
                <select style={inputStyle} value={form.day} onChange={e => setForm(f => ({ ...f, day: e.target.value as WeddingDay }))}>
                  {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="font-sans-clean" style={{ fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--mid-gray)', display: 'block', marginBottom: '0.3rem' }}>Amount (EUR) *</label>
                <input style={inputStyle} type="number" value={form.totalAmount || ''} onChange={e => setForm(f => ({ ...f, totalAmount: parseFloat(e.target.value) || 0 }))} placeholder="0" />
              </div>
              <div>
                <label className="font-sans-clean" style={{ fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--mid-gray)', display: 'block', marginBottom: '0.3rem' }}>Paid By</label>
                <select style={inputStyle} value={form.paidBy} onChange={e => setForm(f => ({ ...f, paidBy: e.target.value as Payer }))}>
                  {PAYERS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="font-sans-clean" style={{ fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--mid-gray)', display: 'block', marginBottom: '0.3rem' }}>Status</label>
                <select style={inputStyle} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as PayStatus }))}>
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="font-sans-clean" style={{ fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--mid-gray)', display: 'block', marginBottom: '0.3rem' }}>Due Date</label>
                <input style={inputStyle} type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label className="font-sans-clean" style={{ fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--mid-gray)', display: 'block', marginBottom: '0.3rem' }}>Notes</label>
                <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: '60px' }} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Any notes..." />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
              <button onClick={() => { setShowForm(false); setEditing(null); }} style={{ padding: '0.65rem 1.25rem', background: 'var(--light-gray)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'Jost', fontSize: '0.8rem' }}>Cancel</button>
              <button onClick={handleSubmit} style={{ padding: '0.65rem 1.5rem', background: 'var(--charcoal)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'Jost', fontSize: '0.8rem' }}>
                {editing ? 'Save Changes' : 'Add Item'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Budget Table */}
      <div style={{ ...card, overflowX: 'auto' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--mid-gray)' }}>
            <p className="font-display" style={{ fontSize: '1.5rem', fontStyle: 'italic', marginBottom: '0.5rem' }}>No items yet</p>
            <p className="font-sans-clean" style={{ fontSize: '0.8rem' }}>Add your first budget item above</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--light-gray)' }}>
                {['Category', 'Description', 'Vendor', 'Day', 'Amount', 'Paid By', 'Status', 'Due', ''].map(h => (
                  <th key={h} className="font-sans-clean" style={{ padding: '0.75rem 0.5rem', textAlign: 'left', fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--mid-gray)', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, idx) => (
                <tr key={item.id} style={{ borderBottom: '1px solid var(--light-gray)', background: idx % 2 === 0 ? 'white' : 'var(--warm-white)', opacity: item.status === 'Paid' ? 0.75 : 1 }}>
                  <td style={{ padding: '0.75rem 0.5rem', color: 'var(--mid-gray)', whiteSpace: 'nowrap' }}>{item.category}</td>
                  <td style={{ padding: '0.75rem 0.5rem', fontWeight: 500, maxWidth: '180px' }}>
                    <div>{item.description}</div>
                    {item.notes && <div style={{ fontSize: '0.7rem', color: 'var(--mid-gray)', marginTop: '0.15rem' }}>{item.notes}</div>}
                  </td>
                  <td style={{ padding: '0.75rem 0.5rem', color: 'var(--mid-gray)', whiteSpace: 'nowrap' }}>{item.vendor || '—'}</td>
                  <td style={{ padding: '0.75rem 0.5rem' }}>
                    <span style={{
                      background: DAY_COLORS[item.day] + '22',
                      color: DAY_COLORS[item.day],
                      borderRadius: '4px', padding: '0.2rem 0.5rem',
                      fontSize: '0.68rem', fontFamily: 'Jost', fontWeight: 500, whiteSpace: 'nowrap'
                    }}>{item.day.split('—')[0].trim()}</span>
                  </td>
                  <td style={{ padding: '0.75rem 0.5rem', fontFamily: 'Jost', fontWeight: 600, whiteSpace: 'nowrap' }}>{fmt(item.totalAmount)}</td>
                  <td style={{ padding: '0.75rem 0.5rem' }}>
                    <span style={{ color: PAYER_COLORS[item.paidBy], fontFamily: 'Jost', fontSize: '0.78rem', fontWeight: 500, whiteSpace: 'nowrap' }}>{item.paidBy}</span>
                  </td>
                  <td style={{ padding: '0.75rem 0.5rem' }}>
                    <span style={{
                      ...STATUS_STYLE[item.status],
                      borderRadius: '4px', padding: '0.2rem 0.6rem',
                      fontSize: '0.68rem', fontFamily: 'Jost', whiteSpace: 'nowrap'
                    }}>{item.status}</span>
                  </td>
                  <td style={{ padding: '0.75rem 0.5rem', color: 'var(--mid-gray)', whiteSpace: 'nowrap', fontSize: '0.75rem' }}>
                    {item.dueDate ? new Date(item.dueDate + 'T00:00:00').toLocaleDateString('en-CA', { month: 'short', day: 'numeric' }) : '—'}
                  </td>
                  <td style={{ padding: '0.75rem 0.5rem', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      <button onClick={() => togglePaid(item.id)} title="Toggle Paid" style={{ padding: '0.3rem 0.5rem', border: '1px solid var(--light-gray)', borderRadius: '6px', cursor: 'pointer', background: item.status === 'Paid' ? 'var(--deep-sage)' : 'white', color: item.status === 'Paid' ? 'white' : 'var(--charcoal)', fontSize: '0.7rem' }}>✓</button>
                      <button onClick={() => startEdit(item)} style={{ padding: '0.3rem 0.5rem', border: '1px solid var(--light-gray)', borderRadius: '6px', cursor: 'pointer', background: 'white', fontSize: '0.7rem' }}>✎</button>
                      <button onClick={() => deleteItem(item.id)} style={{ padding: '0.3rem 0.5rem', border: '1px solid var(--light-gray)', borderRadius: '6px', cursor: 'pointer', background: 'white', color: 'var(--dusty-rose)', fontSize: '0.7rem' }}>✕</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: '2px solid var(--charcoal)' }}>
                <td colSpan={4} className="font-sans-clean" style={{ padding: '0.75rem 0.5rem', fontWeight: 600, fontSize: '0.8rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  Total ({filtered.length} items)
                </td>
                <td className="font-display" style={{ padding: '0.75rem 0.5rem', fontSize: '1rem', fontWeight: 600 }}>
                  {fmt(filtered.reduce((s, i) => s + i.totalAmount, 0))}
                </td>
                <td colSpan={4} />
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  );
}
