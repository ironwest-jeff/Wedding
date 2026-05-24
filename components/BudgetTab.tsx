'use client';
import { useState, useEffect } from 'react';
import { getBudgetItems, saveBudgetItems, syncBudgetItems, getBudgetSettings, saveBudgetSettings, syncBudgetSettings } from '@/lib/store';
import { BudgetItem, Payment, WeddingDay, Payer, PayStatus, BudgetSettings } from '@/lib/types';

const DAY_ORDER: WeddingDay[] = ['All Days', 'Aug 31 — Welcome Dinner', 'Sep 1 — Wedding Day', 'Sep 2 — Pool Party', 'Sep 3 — Checkout', 'N/A'];
const DAY_LABELS: Record<WeddingDay, string> = {
  'All Days': '🗓 All Days',
  'Aug 31 — Welcome Dinner': '🍕 Welcome Dinner — Aug 31',
  'Sep 1 — Wedding Day': '💍 Wedding Day — Sep 1',
  'Sep 2 — Pool Party': '🏊 Pool Party — Sep 2',
  'Sep 3 — Checkout': '🚗 Checkout — Sep 3',
  'N/A': 'N/A',
};
const DAYS: WeddingDay[] = ['Aug 31 — Welcome Dinner', 'Sep 1 — Wedding Day', 'Sep 2 — Pool Party', 'Sep 3 — Checkout', 'All Days', 'N/A'];
const PAYERS: Payer[] = ['Nat/Jeff', 'Mike', 'Tony', 'Shared', 'Vendor'];
const PAYMENT_PAYERS = ['Jeff', 'Nat', 'Mike', 'Tony', 'Shared', 'Other'];
const STATUSES: PayStatus[] = ['Pending', 'Deposit Paid', 'Paid'];
const CATEGORIES = ['Venue', 'Catering & Bar', 'Photography', 'Music & DJ', 'Flowers & Decor', 'Attire', 'Hair & Makeup', 'Transportation', 'Accommodation', 'Invitations & Stationery', 'Favors & Gifts', 'Officiant', 'Rings', 'Entertainment', 'Other'];

const PAYER_COLORS: Record<Payer, string> = {
  'Nat/Jeff': 'var(--sage)', 'Mike': 'var(--champagne)', 'Tony': 'var(--dusty-rose)',
  'Shared': 'var(--mid-gray)', 'Vendor': '#9B8EA0',
};
const DAY_COLORS: Record<WeddingDay, string> = {
  'Aug 31 — Welcome Dinner': '#C9897A', 'Sep 1 — Wedding Day': '#C9A96E',
  'Sep 2 — Pool Party': '#8B9E88', 'Sep 3 — Checkout': '#9B8EA0',
  'All Days': '#6B6B6B', 'N/A': '#AAAAAA',
};
const STATUS_STYLE: Record<PayStatus, { bg: string; color: string }> = {
  'Paid': { bg: '#D4EDDA', color: '#276237' },
  'Pending': { bg: '#FFF3CD', color: '#856404' },
  'Deposit Paid': { bg: '#D1ECF1', color: '#0C5460' },
};

function fmt(n: number) { return '€' + Math.round(n).toLocaleString('en-US'); }
function fmtD(n: number) { return '€' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function fmtDate(d: string) { return d ? new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''; }
function genId() { return Math.random().toString(36).slice(2, 10); }
function todayStr() { return new Date().toISOString().slice(0, 10); }

const EMPTY: Omit<BudgetItem, 'id'> = {
  category: 'Venue', description: '', vendor: '', day: 'Sep 1 — Wedding Day',
  totalAmount: 0, paidBy: 'Nat/Jeff', status: 'Pending', notes: '', dueDate: '', payments: [],
};
const EMPTY_PAY = { amount: '', paidBy: 'Jeff', date: todayStr(), note: '', isCash: false };

export default function BudgetTab() {
  const [items, setItems]             = useState<BudgetItem[]>([]);
  const [mainGuestCount, setMainGuest] = useState(106);
  const [poolGuestCount, setPoolGuest] = useState(60);
  const [jeffNatTarget, setJNTarget]  = useState(18000);
  const [mikeTarget, setMikeTarget]   = useState(10000);
  const [showForm, setShowForm]       = useState(false);
  const [editing, setEditing]         = useState<BudgetItem | null>(null);
  const [form, setForm]               = useState<Omit<BudgetItem, 'id'>>(EMPTY);
  const [filterDay, setFilterDay]     = useState<WeddingDay | 'All'>('All');
  const [filterPayer, setFilterPayer] = useState<Payer | 'All'>('All');
  const [filterStatus, setFilterStatus] = useState<PayStatus | 'All'>('All');
  const [hideAmounts, setHideAmounts] = useState(false);
  const [expandedId, setExpandedId]   = useState<string | null>(null);
  const [taxOpenId, setTaxOpenId]     = useState<string | null>(null);
  const [payingItemId, setPayingItemId] = useState<string | null>(null);
  const [payForm, setPayForm]         = useState(EMPTY_PAY);

  const mask = (n: number) => hideAmounts ? '••••••' : fmt(n);

  useEffect(() => {
    const local = getBudgetItems();
    setItems(local);
    syncBudgetItems(local).then(fresh => setItems(fresh));

    const s = getBudgetSettings();
    setMainGuest(s.mainGuestCount);
    setPoolGuest(s.poolGuestCount);
    setJNTarget(s.jeffNatTarget);
    setMikeTarget(s.mikeTarget);
    syncBudgetSettings(s).then(fresh => {
      setMainGuest(fresh.mainGuestCount);
      setPoolGuest(fresh.poolGuestCount);
      setJNTarget(fresh.jeffNatTarget);
      setMikeTarget(fresh.mikeTarget);
    });
  }, []);

  function persistSettings(updates: Partial<BudgetSettings>) {
    const s: BudgetSettings = { mainGuestCount, poolGuestCount, jeffNatTarget: jeffNatTarget, mikeTarget, ...updates };
    saveBudgetSettings(s);
  }

  function effectiveAmount(item: BudgetItem): number {
    if (item.isVariable && item.perPersonRate) {
      const count = item.variableGuestType === 'pool' ? poolGuestCount : mainGuestCount;
      const tax = item.variableTaxRate ?? 0;
      return Math.round(item.perPersonRate * (1 + tax / 100) * count);
    }
    return item.totalAmount;
  }

  function save(updated: BudgetItem[]) { setItems(updated); saveBudgetItems(updated); }

  function handleSubmit() {
    if (!form.description) return;
    const isVar = !!(form.isVariable && form.perPersonRate && form.perPersonRate > 0);
    if (!isVar && form.totalAmount <= 0) return;

    const computedTotal = isVar
      ? Math.round((form.perPersonRate ?? 0) * (1 + (form.variableTaxRate ?? 0) / 100) * (form.variableGuestType === 'pool' ? poolGuestCount : mainGuestCount))
      : form.totalAmount;

    const itemToSave = { ...form, totalAmount: computedTotal };

    if (editing) {
      save(items.map(i => i.id === editing.id ? { ...itemToSave, id: editing.id, payments: i.payments ?? [] } : i));
    } else {
      save([...items, { ...itemToSave, id: genId(), payments: [] }]);
    }
    setForm(EMPTY); setEditing(null); setShowForm(false);
  }

  function deleteItem(id: string) {
    if (confirm('Remove this budget item?')) save(items.filter(i => i.id !== id));
  }

  function startEdit(item: BudgetItem) {
    setEditing(item);
    setForm({ ...item, payments: item.payments ?? [] });
    setShowForm(true);
  }

  function openPayment(itemId: string, isCash: boolean) {
    setExpandedId(itemId);
    setPayingItemId(itemId);
    setPayForm({ ...EMPTY_PAY, isCash, date: todayStr() });
  }

  function addPayment(itemId: string) {
    const amount = parseFloat(payForm.amount);
    if (!amount || amount <= 0) return;
    const p: Payment = { id: genId(), amount, paidBy: payForm.paidBy, date: payForm.date, note: payForm.note, isCash: payForm.isCash };
    save(items.map(i => i.id === itemId ? { ...i, payments: [...(i.payments ?? []), p] } : i));
    setPayingItemId(null);
    setPayForm(EMPTY_PAY);
  }

  function removePayment(itemId: string, payId: string) {
    save(items.map(i => i.id === itemId ? { ...i, payments: (i.payments ?? []).filter(p => p.id !== payId) } : i));
  }

  function updateTaxRate(itemId: string, val: string) {
    const r = val === '' ? undefined : parseFloat(val);
    save(items.map(i => i.id === itemId ? { ...i, taxRate: r } : i));
  }

  // ── Summaries ──────────────────────────────────────────────────────────────
  const totalBudget    = items.reduce((s, i) => s + effectiveAmount(i), 0);
  const totalPaid      = items.reduce((s, i) => s + (i.payments ?? []).reduce((ps, p) => ps + p.amount, 0), 0);
  const totalCash      = items.reduce((s, i) => s + (i.payments ?? []).filter(p => p.isCash).reduce((ps, p) => ps + p.amount, 0), 0);
  const totalRemaining = Math.max(0, totalBudget - totalPaid);

  const actualJeffNat = items.reduce((s, i) => s + (i.payments ?? []).filter(p => p.paidBy === 'Jeff' || p.paidBy === 'Nat').reduce((ps, p) => ps + p.amount, 0), 0);
  const actualMike    = items.reduce((s, i) => s + (i.payments ?? []).filter(p => p.paidBy === 'Mike').reduce((ps, p) => ps + p.amount, 0), 0);
  const actualOther   = items.reduce((s, i) => s + (i.payments ?? []).filter(p => p.paidBy === 'Other' || p.paidBy === 'Shared').reduce((ps, p) => ps + p.amount, 0), 0);
  const actualTony    = items.reduce((s, i) => s + (i.payments ?? []).filter(p => p.paidBy === 'Tony').reduce((ps, p) => ps + p.amount, 0), 0);
  // Tony's target = whatever is left after Jeff/Nat target, Mike target, and any Other/Shared payments
  const tonyTarget    = Math.max(0, totalBudget - jeffNatTarget - mikeTarget - actualOther);

  // ── Filtering & grouping by day ────────────────────────────────────────────
  const filtered = items
    .filter(i => filterDay === 'All' || i.day === filterDay)
    .filter(i => filterPayer === 'All' || i.paidBy === filterPayer)
    .filter(i => filterStatus === 'All' || i.status === filterStatus);

  const byDay: Record<WeddingDay, BudgetItem[]> = {} as Record<WeddingDay, BudgetItem[]>;
  DAY_ORDER.forEach(d => { byDay[d] = []; });
  filtered.forEach(i => { if (byDay[i.day]) byDay[i.day].push(i); });
  DAY_ORDER.forEach(d => { byDay[d].sort((a, b) => effectiveAmount(b) - effectiveAmount(a)); });
  const activeDays = DAY_ORDER.filter(d => byDay[d].length > 0);

  // ── Shared styles ──────────────────────────────────────────────────────────
  const card: React.CSSProperties = { background: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid var(--light-gray)' };
  const inputStyle: React.CSSProperties = { width: '100%', padding: '0.6rem 0.8rem', border: '1px solid var(--light-gray)', borderRadius: '8px', fontSize: '0.85rem', fontFamily: 'Jost, sans-serif', background: 'var(--warm-white)', color: 'var(--charcoal)', outline: 'none' };
  const miniInput: React.CSSProperties = { padding: '0.35rem 0.5rem', border: '1px solid var(--light-gray)', borderRadius: '6px', fontSize: '0.78rem', fontFamily: 'Jost', background: 'var(--warm-white)', color: 'var(--charcoal)', outline: 'none' };
  const labelSm: React.CSSProperties = { display: 'block', fontSize: '0.62rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--mid-gray)', marginBottom: '0.25rem', fontFamily: 'Jost' };
  const actionBtn: React.CSSProperties = { padding: '0.25rem 0.5rem', border: '1px solid var(--light-gray)', borderRadius: '5px', cursor: 'pointer', background: 'white', fontSize: '0.68rem', fontFamily: 'Jost', color: 'var(--charcoal)', whiteSpace: 'nowrap' };

  // Form preview for variable item
  const formIsVar = !!(form.isVariable && form.perPersonRate && form.perPersonRate > 0);
  const formPreview = formIsVar
    ? Math.round((form.perPersonRate ?? 0) * (1 + (form.variableTaxRate ?? 0) / 100) * (form.variableGuestType === 'pool' ? poolGuestCount : mainGuestCount))
    : 0;

  return (
    <div>
      {/* Hide/Show toggle */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.5rem' }}>
        <button onClick={() => setHideAmounts(h => !h)} className="font-sans-clean"
          style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'none', border: '1px solid var(--light-gray)', borderRadius: '6px', padding: '0.3rem 0.65rem', cursor: 'pointer', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--mid-gray)' }}>
          {hideAmounts ? '👁 Show' : '🙈 Hide'}
        </button>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Total Budget',  value: mask(totalBudget),    accent: 'var(--charcoal)' },
          { label: 'Total Paid',    value: mask(totalPaid),       accent: 'var(--deep-sage)' },
          { label: 'Remaining',     value: mask(totalRemaining),  accent: 'var(--dusty-rose)' },
          { label: '💵 Cash Paid',  value: mask(totalCash),       accent: 'var(--deep-champagne)' },
        ].map(s => (
          <div key={s.label} style={{ ...card, padding: '1.25rem' }}>
            <p className="font-sans-clean" style={{ fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--mid-gray)', marginBottom: '0.5rem' }}>{s.label}</p>
            <p className="font-display" style={{ fontSize: '1.8rem', fontWeight: 400, color: s.accent }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Guest count settings */}
      <div style={{ ...card, marginBottom: '1.5rem', padding: '1rem 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
          <span className="font-sans-clean" style={{ fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--mid-gray)', flexShrink: 0 }}>Guest Counts</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label className="font-sans-clean" style={{ fontSize: '0.72rem', color: 'var(--charcoal)', whiteSpace: 'nowrap' }}>Welcome + Wedding (main)</label>
            <input type="number" min="1" value={mainGuestCount}
              onChange={e => { const v = parseInt(e.target.value) || 1; setMainGuest(v); persistSettings({ mainGuestCount: v }); }}
              style={{ ...miniInput, width: 60, textAlign: 'center' }} />
            <span className="font-sans-clean" style={{ fontSize: '0.7rem', color: 'var(--mid-gray)' }}>guests</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label className="font-sans-clean" style={{ fontSize: '0.72rem', color: 'var(--charcoal)', whiteSpace: 'nowrap' }}>Pool Party</label>
            <input type="number" min="1" value={poolGuestCount}
              onChange={e => { const v = parseInt(e.target.value) || 1; setPoolGuest(v); persistSettings({ poolGuestCount: v }); }}
              style={{ ...miniInput, width: 60, textAlign: 'center' }} />
            <span className="font-sans-clean" style={{ fontSize: '0.7rem', color: 'var(--mid-gray)' }}>guests</span>
          </div>
        </div>
      </div>

      {/* Contribution dashboard */}
      <div style={{ ...card, marginBottom: '1.5rem' }}>
        <h2 className="font-display" style={{ fontSize: '1.3rem', marginBottom: '1rem', fontWeight: 400 }}>Contribution Dashboard</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>

          {/* Other — no fixed target, reduces Tony's balance */}
          {actualOther > 0 && (
            <div style={{ background: 'var(--cream)', borderRadius: '10px', padding: '1rem', border: '1px dashed #C8BFC8' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <span className="font-sans-clean" style={{ fontSize: '0.75rem', fontWeight: 500, color: '#9B8EA0' }}>Other / Shared</span>
                <span className="font-sans-clean" style={{ fontSize: '0.6rem', color: 'var(--mid-gray)', fontStyle: 'italic' }}>no fixed amount</span>
              </div>
              <div className="font-display" style={{ fontSize: '1.3rem', marginBottom: '0.15rem' }}>{mask(actualOther)}</div>
              <div className="font-sans-clean" style={{ fontSize: '0.68rem', color: 'var(--mid-gray)' }}>
                paid · reduces Tony&apos;s balance
              </div>
            </div>
          )}

          {/* Jeff & Nat, Mike — editable targets */}
          {[
            { key: 'jn',   label: 'Jeff & Nat', target: jeffNatTarget, actual: actualJeffNat, color: 'var(--sage)' },
            { key: 'mike', label: 'Mike',        target: mikeTarget,    actual: actualMike,    color: 'var(--champagne)' },
          ].map(({ key, label, target, actual, color }) => {
            const pct = target > 0 ? Math.min(100, (actual / target) * 100) : 0;
            return (
              <div key={key} style={{ background: 'var(--cream)', borderRadius: '10px', padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <span className="font-sans-clean" style={{ fontSize: '0.75rem', fontWeight: 500, color }}>{label}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--mid-gray)', fontFamily: 'Jost' }}>€</span>
                    <input
                      type="number" min="0" step="1000"
                      value={key === 'jn' ? jeffNatTarget : mikeTarget}
                      onChange={e => {
                        const v = parseInt(e.target.value) || 0;
                        if (key === 'jn') { setJNTarget(v); persistSettings({ jeffNatTarget: v }); }
                        else              { setMikeTarget(v); persistSettings({ mikeTarget: v }); }
                      }}
                      style={{ ...miniInput, width: 80, textAlign: 'right' }}
                    />
                  </div>
                </div>
                <div className="font-display" style={{ fontSize: '1.3rem', marginBottom: '0.15rem' }}>{mask(actual)}</div>
                <div className="font-sans-clean" style={{ fontSize: '0.68rem', color: 'var(--mid-gray)' }}>
                  paid · {mask(Math.max(0, target - actual))} remaining
                </div>
                <div style={{ marginTop: '0.5rem', height: '4px', background: 'var(--light-gray)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '2px', transition: 'width 0.5s' }} />
                </div>
              </div>
            );
          })}

          {/* Tony — auto (remainder after Jeff/Nat + Mike targets + Other paid) */}
          {(() => {
            const pct = tonyTarget > 0 ? Math.min(100, (actualTony / tonyTarget) * 100) : 0;
            return (
              <div style={{ background: 'var(--cream)', borderRadius: '10px', padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <span className="font-sans-clean" style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--dusty-rose)' }}>Tony</span>
                  <span className="font-sans-clean" style={{ fontSize: '0.78rem', color: 'var(--mid-gray)' }}>
                    {hideAmounts ? '••••••' : fmt(tonyTarget)} <span style={{ fontSize: '0.6rem' }}>(auto)</span>
                  </span>
                </div>
                <div className="font-display" style={{ fontSize: '1.3rem', marginBottom: '0.15rem' }}>{mask(actualTony)}</div>
                <div className="font-sans-clean" style={{ fontSize: '0.68rem', color: 'var(--mid-gray)' }}>
                  paid · {mask(Math.max(0, tonyTarget - actualTony))} remaining
                </div>
                <div style={{ marginTop: '0.5rem', height: '4px', background: 'var(--light-gray)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: 'var(--dusty-rose)', borderRadius: '2px', transition: 'width 0.5s' }} />
                </div>
              </div>
            );
          })()}

        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
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
        </div>
        <button onClick={() => { setForm(EMPTY); setEditing(null); setShowForm(true); }}
          style={{ padding: '0.65rem 1.5rem', background: 'var(--charcoal)', color: 'var(--cream)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'Jost', fontSize: '0.8rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          + Add Item
        </button>
      </div>

      {/* Add / Edit modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, overflowY: 'auto', padding: '2rem 1rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '2rem', width: '100%', maxWidth: '580px', margin: 'auto', flexShrink: 0 }}>
            <h2 className="font-display" style={{ fontSize: '1.5rem', marginBottom: '1.5rem', fontWeight: 400 }}>{editing ? 'Edit Item' : 'Add Budget Item'}</h2>
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
                <label className="font-sans-clean" style={{ fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--mid-gray)', display: 'block', marginBottom: '0.3rem' }}>Responsible Payer</label>
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

              {/* Variable pricing toggle */}
              <div style={{ gridColumn: '1/-1', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0' }}>
                <input type="checkbox" id="varCheck" checked={!!form.isVariable}
                  onChange={e => setForm(f => ({ ...f, isVariable: e.target.checked }))}
                  style={{ width: 16, height: 16, cursor: 'pointer' }} />
                <label htmlFor="varCheck" className="font-sans-clean" style={{ fontSize: '0.78rem', color: 'var(--charcoal)', cursor: 'pointer' }}>
                  Per-person pricing (amount computed from rate × guest count)
                </label>
              </div>

              {form.isVariable ? (
                <>
                  <div>
                    <label className="font-sans-clean" style={{ fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--mid-gray)', display: 'block', marginBottom: '0.3rem' }}>Per-person Rate (€) *</label>
                    <input style={inputStyle} type="number" min="0" step="0.01"
                      value={form.perPersonRate ?? ''}
                      onChange={e => setForm(f => ({ ...f, perPersonRate: parseFloat(e.target.value) || undefined }))}
                      placeholder="e.g. 140" />
                  </div>
                  <div>
                    <label className="font-sans-clean" style={{ fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--mid-gray)', display: 'block', marginBottom: '0.3rem' }}>Tax Rate (%)</label>
                    <input style={inputStyle} type="number" min="0" max="100" step="0.5"
                      value={form.variableTaxRate ?? ''}
                      onChange={e => setForm(f => ({ ...f, variableTaxRate: parseFloat(e.target.value) || undefined }))}
                      placeholder="e.g. 10" />
                  </div>
                  <div style={{ gridColumn: '1/-1' }}>
                    <label className="font-sans-clean" style={{ fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--mid-gray)', display: 'block', marginBottom: '0.3rem' }}>Guest Pool</label>
                    <select style={{ ...inputStyle, width: 'auto' }}
                      value={form.variableGuestType ?? 'main'}
                      onChange={e => setForm(f => ({ ...f, variableGuestType: e.target.value as 'main' | 'pool' }))}>
                      <option value="main">Main — Welcome + Wedding ({mainGuestCount} guests)</option>
                      <option value="pool">Pool Party ({poolGuestCount} guests)</option>
                    </select>
                  </div>
                  {formIsVar && (
                    <div style={{ gridColumn: '1/-1', background: '#F0FFF4', border: '1px solid #C6F6D5', borderRadius: 8, padding: '0.6rem 0.85rem', fontSize: '0.78rem', fontFamily: 'Jost' }}>
                      <span style={{ color: 'var(--mid-gray)' }}>Computed total: </span>
                      <strong style={{ color: '#276237' }}>{fmt(formPreview)}</strong>
                      <span style={{ color: 'var(--mid-gray)', marginLeft: '0.4rem' }}>
                        ({form.variableGuestType === 'pool' ? poolGuestCount : mainGuestCount} guests × €{form.perPersonRate}{form.variableTaxRate ? ` + ${form.variableTaxRate}% tax` : ''})
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <div>
                  <label className="font-sans-clean" style={{ fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--mid-gray)', display: 'block', marginBottom: '0.3rem' }}>Total Amount (€) *</label>
                  <input style={inputStyle} type="number" value={form.totalAmount || ''} onChange={e => setForm(f => ({ ...f, totalAmount: parseFloat(e.target.value) || 0 }))} placeholder="0" />
                </div>
              )}

              <div style={{ gridColumn: '1/-1' }}>
                <label className="font-sans-clean" style={{ fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--mid-gray)', display: 'block', marginBottom: '0.3rem' }}>Notes</label>
                <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: '60px' }} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
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

      {/* Items grouped by day */}
      {activeDays.length === 0 ? (
        <div style={{ ...card, textAlign: 'center', padding: '3rem' }}>
          <p className="font-display" style={{ fontSize: '1.5rem', fontStyle: 'italic', color: 'var(--mid-gray)' }}>No items yet — add your first budget item!</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {activeDays.map(day => {
            const dayItems = byDay[day];
            const dayTotal = dayItems.reduce((s, i) => s + effectiveAmount(i), 0);
            const dayPaid  = dayItems.reduce((s, i) => s + (i.payments ?? []).reduce((ps, p) => ps + p.amount, 0), 0);
            const dayPct   = dayTotal > 0 ? Math.min(100, (dayPaid / dayTotal) * 100) : 0;
            const accentColor = DAY_COLORS[day];

            return (
              <div key={day} style={{ ...card, borderLeft: `4px solid ${accentColor}` }}>
                {/* Day header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--light-gray)' }}>
                  <h3 className="font-sans-clean" style={{ fontSize: '0.72rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: accentColor, fontWeight: 600 }}>{DAY_LABELS[day]}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '0.65rem', color: 'var(--mid-gray)', fontFamily: 'Jost' }}>{mask(dayPaid)} paid</span>
                    <span className="font-display" style={{ fontSize: '1rem' }}>{mask(dayTotal)}</span>
                  </div>
                </div>

                {dayItems.map((item, idx) => {
                  const eff       = effectiveAmount(item);
                  const pmts      = item.payments ?? [];
                  const amtPaid   = pmts.reduce((s, p) => s + p.amount, 0);
                  const remaining = Math.max(0, eff - amtPaid);
                  const pct       = eff > 0 ? Math.min(100, (amtPaid / eff) * 100) : 0;
                  const isExp     = expandedId === item.id;
                  const isTax     = taxOpenId === item.id;
                  const isPaying  = payingItemId === item.id;
                  const taxRate   = item.taxRate;
                  const subtotal  = taxRate ? eff / (1 + taxRate / 100) : null;
                  const taxAmt    = subtotal ? eff - subtotal : null;

                  return (
                    <div key={item.id} style={{ borderBottom: idx < dayItems.length - 1 ? '1px solid var(--light-gray)' : 'none', paddingBottom: idx < dayItems.length - 1 ? '0.85rem' : 0, marginBottom: idx < dayItems.length - 1 ? '0.85rem' : 0 }}>

                      {/* Main row */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: 200 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.2rem' }}>
                            <span style={{ fontSize: '0.92rem', fontWeight: 500 }}>{item.description}</span>
                            <span style={{ ...STATUS_STYLE[item.status], fontSize: '0.6rem', borderRadius: 3, padding: '0.1rem 0.4rem', fontFamily: 'Jost' }}>{item.status}</span>
                            <span style={{ background: '#F5F5F5', color: 'var(--mid-gray)', fontSize: '0.6rem', borderRadius: 3, padding: '0.1rem 0.4rem', fontFamily: 'Jost' }}>{item.category}</span>
                          </div>

                          {/* Variable formula badge */}
                          {item.isVariable && item.perPersonRate && (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', background: '#FFF8E7', color: '#856404', borderRadius: 3, padding: '0.1rem 0.4rem', fontSize: '0.6rem', fontFamily: 'Jost', marginBottom: '0.2rem' }}>
                              €{item.perPersonRate}/pp{item.variableTaxRate ? ` + ${item.variableTaxRate}% tax` : ''} × {item.variableGuestType === 'pool' ? poolGuestCount : mainGuestCount} guests
                            </div>
                          )}

                          <div style={{ fontSize: '0.72rem', color: 'var(--mid-gray)', fontFamily: 'Jost', marginBottom: '0.35rem' }}>
                            <span style={{ color: PAYER_COLORS[item.paidBy], fontWeight: 500 }}>{item.paidBy}</span>
                            {item.vendor ? ` · ${item.vendor}` : ''}
                            {item.dueDate ? ` · Due ${fmtDate(item.dueDate)}` : ''}
                          </div>
                          {/* Payment progress */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: 160, height: 5, background: 'var(--light-gray)', borderRadius: 3, overflow: 'hidden', flexShrink: 0 }}>
                              <div style={{ width: `${pct}%`, height: '100%', background: pct >= 100 ? '#28a745' : 'var(--champagne)', borderRadius: 3, transition: 'width 0.3s' }} />
                            </div>
                            <span style={{ fontSize: '0.65rem', color: 'var(--mid-gray)', fontFamily: 'Jost', whiteSpace: 'nowrap' }}>
                              {mask(amtPaid)} paid{amtPaid > 0 && remaining > 0 ? ` · ${mask(remaining)} left` : ''}
                            </span>
                          </div>
                          {item.notes && <div style={{ fontSize: '0.7rem', color: 'var(--mid-gray)', marginTop: '0.2rem', fontStyle: 'italic' }}>{item.notes}</div>}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem', flexShrink: 0 }}>
                          <span className="font-display" style={{ fontSize: '1.15rem' }}>{mask(eff)}</span>
                          <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                            <button onClick={() => openPayment(item.id, false)} style={{ ...actionBtn, background: '#EDF7F0', color: '#276237', border: 'none' }}>+ Payment</button>
                            <button onClick={() => openPayment(item.id, true)}  style={{ ...actionBtn, background: '#FFF8E7', color: '#856404', border: 'none' }}>💵 Cash</button>
                            {!item.isVariable && (
                              <button onClick={() => setTaxOpenId(isTax ? null : item.id)} style={{ ...actionBtn, background: isTax ? 'var(--light-gray)' : 'white' }}>
                                Tax {isTax ? '▲' : '▼'}
                              </button>
                            )}
                            <button onClick={() => setExpandedId(isExp ? null : item.id)} style={actionBtn}>
                              {isExp ? '▲' : '▼'}{pmts.length > 0 ? ` ${pmts.length}` : ''}
                            </button>
                            <button onClick={() => startEdit(item)} style={actionBtn}>✎</button>
                            <button onClick={() => deleteItem(item.id)} style={{ ...actionBtn, color: 'var(--dusty-rose)' }}>✕</button>
                          </div>
                        </div>
                      </div>

                      {/* Tax breakdown (non-variable items only) */}
                      {isTax && !item.isVariable && (
                        <div style={{ marginTop: '0.5rem', padding: '0.6rem 0.75rem', background: '#FFFBF0', border: '1px solid #F0E6C0', borderRadius: 8, fontSize: '0.78rem', fontFamily: 'Jost' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                            <span style={{ color: 'var(--mid-gray)', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Tax Rate</span>
                            <input type="number" value={item.taxRate ?? ''} min="0" max="100" step="0.5"
                              onChange={e => updateTaxRate(item.id, e.target.value)}
                              placeholder="0" style={{ ...miniInput, width: 58 }} />
                            <span style={{ color: 'var(--mid-gray)' }}>%</span>
                            {taxRate && subtotal && taxAmt ? (
                              <span style={{ color: 'var(--charcoal)' }}>
                                Subtotal: <strong>{fmtD(subtotal)}</strong>
                                <span style={{ color: 'var(--mid-gray)', margin: '0 0.35rem' }}>+</span>
                                Tax ({taxRate}%): <strong>{fmtD(taxAmt)}</strong>
                                <span style={{ color: 'var(--mid-gray)', margin: '0 0.35rem' }}>=</span>
                                Total: <strong>{fmt(eff)}</strong>
                              </span>
                            ) : (
                              <span style={{ color: 'var(--mid-gray)', fontSize: '0.72rem' }}>Enter a rate to see breakdown</span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Payment history */}
                      {isExp && (
                        <div style={{ marginTop: '0.5rem', padding: '0.6rem 0.75rem', background: 'var(--cream)', borderRadius: 8 }}>
                          {pmts.length === 0 ? (
                            <p style={{ fontSize: '0.72rem', color: 'var(--mid-gray)', fontFamily: 'Jost', textAlign: 'center', padding: '0.25rem 0' }}>No payments logged yet</p>
                          ) : (
                            <div>
                              {pmts.map(p => (
                                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.3rem 0', borderBottom: '1px solid var(--light-gray)', fontSize: '0.78rem', fontFamily: 'Jost' }}>
                                  {p.isCash && <span title="Cash payment">💵</span>}
                                  <span style={{ fontWeight: 600, color: 'var(--deep-sage)' }}>{fmt(p.amount)}</span>
                                  <span style={{ color: 'var(--mid-gray)' }}>—</span>
                                  <span>{p.paidBy}</span>
                                  {p.date && <span style={{ color: 'var(--mid-gray)', fontSize: '0.7rem' }}>{fmtDate(p.date)}</span>}
                                  {p.note && <span style={{ color: 'var(--mid-gray)', fontStyle: 'italic', fontSize: '0.72rem' }}>{p.note}</span>}
                                  <button onClick={() => removePayment(item.id, p.id)}
                                    style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dusty-rose)', fontSize: '0.7rem', padding: '0.1rem 0.3rem' }}>✕</button>
                                </div>
                              ))}
                              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', paddingTop: '0.3rem', fontSize: '0.72rem', fontFamily: 'Jost', color: 'var(--mid-gray)' }}>
                                <span>Total paid: <strong style={{ color: 'var(--deep-sage)' }}>{fmt(amtPaid)}</strong></span>
                                {pmts.some(p => p.isCash) && <span>Cash: <strong>{fmt(pmts.filter(p => p.isCash).reduce((s, p) => s + p.amount, 0))}</strong></span>}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Inline payment form */}
                      {isPaying && (
                        <div style={{ marginTop: '0.5rem', padding: '0.75rem', background: 'white', border: '1px solid var(--light-gray)', borderRadius: 8 }}>
                          {payForm.isCash && (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: '#FFF8E7', color: '#856404', borderRadius: 4, padding: '0.15rem 0.5rem', fontSize: '0.68rem', fontFamily: 'Jost', marginBottom: '0.5rem' }}>
                              💵 Cash Payment
                            </div>
                          )}
                          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                            <div>
                              <label style={labelSm}>Amount (€)</label>
                              <input type="number" step="0.01" value={payForm.amount} autoFocus
                                onChange={e => setPayForm(f => ({ ...f, amount: e.target.value }))}
                                placeholder="0" style={{ ...miniInput, width: 90 }} />
                            </div>
                            <div>
                              <label style={labelSm}>Paid By</label>
                              <select value={payForm.paidBy} onChange={e => setPayForm(f => ({ ...f, paidBy: e.target.value }))} style={miniInput}>
                                {PAYMENT_PAYERS.map(p => <option key={p} value={p}>{p}</option>)}
                              </select>
                            </div>
                            <div>
                              <label style={labelSm}>Date</label>
                              <input type="date" value={payForm.date} onChange={e => setPayForm(f => ({ ...f, date: e.target.value }))} style={miniInput} />
                            </div>
                            <div style={{ flex: 1, minWidth: 120 }}>
                              <label style={labelSm}>Note (optional)</label>
                              <input value={payForm.note} onChange={e => setPayForm(f => ({ ...f, note: e.target.value }))}
                                placeholder="Deposit, final..." style={{ ...miniInput, width: '100%', boxSizing: 'border-box' }} />
                            </div>
                            <div style={{ display: 'flex', gap: '0.4rem' }}>
                              <button onClick={() => addPayment(item.id)}
                                style={{ padding: '0.38rem 0.85rem', background: 'var(--charcoal)', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontFamily: 'Jost', fontSize: '0.75rem' }}>Add</button>
                              <button onClick={() => setPayingItemId(null)}
                                style={{ padding: '0.38rem 0.65rem', background: 'var(--light-gray)', border: 'none', borderRadius: 6, cursor: 'pointer', fontFamily: 'Jost', fontSize: '0.75rem' }}>Cancel</button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Day totals bar */}
                <div style={{ marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid var(--light-gray)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ flex: 1, height: 4, background: 'var(--light-gray)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ width: `${dayPct}%`, height: '100%', background: accentColor, borderRadius: 2, transition: 'width 0.5s' }} />
                  </div>
                  <span style={{ fontSize: '0.65rem', color: 'var(--mid-gray)', fontFamily: 'Jost', whiteSpace: 'nowrap' }}>
                    {mask(dayPaid)} of {mask(dayTotal)} paid
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
