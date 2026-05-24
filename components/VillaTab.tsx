'use client';
import { useState, useEffect } from 'react';
import { getVillaRooms, saveVillaRooms, syncVillaRooms } from '@/lib/store';
import { VillaRoom, VillaLocation, PayStatus } from '@/lib/types';

const PAY_STATUSES: PayStatus[] = ['Pending', 'Deposit Paid', 'Paid'];

const PAY_STYLE: Record<PayStatus, { bg: string; color: string }> = {
  'Paid': { bg: '#D4EDDA', color: '#276237' },
  'Deposit Paid': { bg: '#FFF3CD', color: '#856404' },
  'Pending': { bg: '#F8D7DA', color: '#721C24' },
};

const ROOM_TYPES = ['1 Bedroom', '2 Bedroom Suite', '3 Bedroom Suite'];

function genId() { return Math.random().toString(36).slice(2, 10); }

const EMPTY_ROOM: Omit<VillaRoom, 'id'> = {
  roomName: '', location: 'Main Villa', roomType: '1 Bedroom',
  guests: '', guestCount: 2, costEUR: 1560.55,
  amountPaidEUR: 0, payStatus: 'Pending', includedInVenue: false, notes: '',
};

export default function VillaTab() {
  const [rooms, setRooms] = useState<VillaRoom[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<VillaRoom | null>(null);
  const [form, setForm] = useState<Omit<VillaRoom, 'id'>>(EMPTY_ROOM);
  const [filterLocation, setFilterLocation] = useState<VillaLocation | 'All'>('All');

  useEffect(() => {
    const local = getVillaRooms();
    setRooms(local);
    syncVillaRooms(local).then(fresh => setRooms(fresh));
  }, []);

  function save(updated: VillaRoom[]) { setRooms(updated); saveVillaRooms(updated); }

  function handleSubmit() {
    if (!form.roomName || !form.guests) return;
    if (editing) {
      save(rooms.map(r => r.id === editing.id ? { ...form, id: editing.id } : r));
    } else {
      save([...rooms, { ...form, id: genId() }]);
    }
    setForm(EMPTY_ROOM); setEditing(null); setShowForm(false);
  }

  function startEdit(r: VillaRoom) { setEditing(r); setForm({ ...r }); setShowForm(true); }
  function deleteRoom(id: string) { if (confirm('Remove this room?')) save(rooms.filter(r => r.id !== id)); }

  function cyclePayStatus(id: string) {
    const order: PayStatus[] = ['Pending', 'Deposit Paid', 'Paid'];
    save(rooms.map(r => {
      if (r.id !== id) return r;
      const next = order[(order.indexOf(r.payStatus) + 1) % order.length];
      const amountPaidEUR = next === 'Paid' ? r.costEUR : next === 'Pending' ? 0 : r.amountPaidEUR;
      return { ...r, payStatus: next, amountPaidEUR };
    }));
  }

  const filtered = filterLocation === 'All' ? rooms : rooms.filter(r => r.location === filterLocation);
  const mainRooms = filtered.filter(r => r.location === 'Main Villa');
  const secondRooms = filtered.filter(r => r.location === 'Second Villa');

  const totalCost = rooms.reduce((s, r) => s + r.costEUR, 0);
  const coveredByVenue = rooms.filter(r => r.includedInVenue).reduce((s, r) => s + r.costEUR, 0);
  const totalPaid = rooms.reduce((s, r) => s + r.amountPaidEUR, 0);
  const totalOwed = totalCost - totalPaid;
  const totalGuests = rooms.reduce((s, r) => s + r.guestCount, 0);

  const card = { background: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid var(--light-gray)' };
  const inputStyle: React.CSSProperties = { width: '100%', padding: '0.6rem 0.8rem', border: '1px solid var(--light-gray)', borderRadius: '8px', fontSize: '0.85rem', fontFamily: 'Jost, sans-serif', background: 'var(--warm-white)', color: 'var(--charcoal)', outline: 'none' };
  const labelStyle: React.CSSProperties = { fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: 'var(--mid-gray)', display: 'block', marginBottom: '0.3rem', fontFamily: 'Jost' };

  function RoomCard({ r }: { r: VillaRoom }) {
    const ps = PAY_STYLE[r.payStatus];
    const paidPct = r.costEUR > 0 ? Math.min(100, (r.amountPaidEUR / r.costEUR) * 100) : 0;
    return (
      <div style={{ ...card, padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '180px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span className="font-display" style={{ fontSize: '1.05rem', fontWeight: 500 }}>{r.roomName}</span>
              <span style={{ background: 'var(--light-gray)', color: 'var(--mid-gray)', borderRadius: '4px', padding: '0.1rem 0.45rem', fontSize: '0.63rem', fontFamily: 'Jost' }}>{r.roomType}</span>
              {r.includedInVenue && <span style={{ background: '#D4EDDA', color: '#276237', borderRadius: '4px', padding: '0.1rem 0.45rem', fontSize: '0.63rem', fontFamily: 'Jost' }}>Venue ✓</span>}
            </div>
            <div style={{ fontSize: '0.88rem', color: 'var(--charcoal)', marginBottom: '0.2rem' }}>
              👤 {r.guests} <span style={{ color: 'var(--mid-gray)', fontSize: '0.78rem' }}>({r.guestCount} {r.guestCount === 1 ? 'guest' : 'guests'})</span>
            </div>
            {r.notes && <div style={{ fontSize: '0.75rem', color: 'var(--mid-gray)', fontFamily: 'Jost', marginTop: '0.2rem' }}>{r.notes}</div>}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem', minWidth: '140px' }}>
            <div style={{ textAlign: 'right' }}>
              <span className="font-display" style={{ fontSize: '1.2rem', fontWeight: 400 }}>€{r.costEUR.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <span style={{ ...ps, borderRadius: '4px', padding: '0.2rem 0.6rem', fontSize: '0.68rem', fontFamily: 'Jost' }}>{r.payStatus}</span>
            {r.amountPaidEUR > 0 && r.amountPaidEUR < r.costEUR && (
              <div style={{ fontSize: '0.72rem', color: 'var(--mid-gray)', fontFamily: 'Jost', textAlign: 'right' }}>
                €{r.amountPaidEUR.toLocaleString()} paid
              </div>
            )}
            <div style={{ width: '120px', height: '4px', background: 'var(--light-gray)', borderRadius: '2px' }}>
              <div style={{ width: `${paidPct}%`, height: '100%', background: paidPct === 100 ? 'var(--deep-sage)' : 'var(--champagne)', borderRadius: '2px', transition: 'width 0.3s' }} />
            </div>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <button
                onClick={() => cyclePayStatus(r.id)}
                style={{ padding: '0.3rem 0.7rem', border: 'none', borderRadius: '6px', cursor: 'pointer', background: ps.bg, color: ps.color, fontSize: '0.7rem', fontFamily: 'Jost', fontWeight: 500 }}
              >
                {r.payStatus === 'Paid' ? '✓ Paid' : r.payStatus === 'Deposit Paid' ? '½ Deposit Paid' : '$ Pending'}
              </button>
              <button onClick={() => startEdit(r)} style={{ padding: '0.3rem 0.6rem', border: '1px solid var(--light-gray)', borderRadius: '6px', cursor: 'pointer', background: 'white', fontSize: '0.7rem' }}>✎ Edit</button>
              <button onClick={() => deleteRoom(r.id)} style={{ padding: '0.3rem 0.5rem', border: '1px solid var(--light-gray)', borderRadius: '6px', cursor: 'pointer', background: 'white', color: 'var(--dusty-rose)', fontSize: '0.7rem' }}>✕</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
    return (
      <div style={{ marginBottom: '0.75rem', marginTop: '1.5rem', paddingBottom: '0.5rem', borderBottom: '2px solid var(--light-gray)' }}>
        <h3 className="font-display" style={{ fontSize: '1.4rem', fontWeight: 300, color: 'var(--charcoal)' }}>{title}</h3>
        {subtitle && <p className="font-sans-clean" style={{ fontSize: '0.72rem', color: 'var(--mid-gray)', marginTop: '0.15rem', letterSpacing: '0.08em' }}>{subtitle}</p>}
      </div>
    );
  }

  return (
    <div>
      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Total Rooms', value: rooms.length.toString(), color: 'var(--charcoal)' },
          { label: 'Total Guests', value: totalGuests.toString(), color: 'var(--charcoal)' },
          { label: 'Total Cost', value: `€${totalCost.toLocaleString('en-US', { maximumFractionDigits: 0 })}`, color: 'var(--deep-champagne)' },
          { label: 'Covered by Venue', value: `€${coveredByVenue.toLocaleString('en-US', { maximumFractionDigits: 0 })}`, color: 'var(--deep-sage)' },
          { label: 'Total Paid', value: `€${totalPaid.toLocaleString('en-US', { maximumFractionDigits: 0 })}`, color: 'var(--deep-sage)' },
          { label: 'Still Owed', value: `€${Math.max(0, totalOwed).toLocaleString('en-US', { maximumFractionDigits: 0 })}`, color: 'var(--dusty-rose)' },
        ].map(s => (
          <div key={s.label} style={{ ...card, padding: '1rem' }}>
            <p className="font-sans-clean" style={{ fontSize: '0.62rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--mid-gray)', marginBottom: '0.4rem' }}>{s.label}</p>
            <p className="font-display" style={{ fontSize: '1.5rem', fontWeight: 300, color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {(['All', 'Main Villa', 'Second Villa'] as const).map(loc => (
            <button key={loc} onClick={() => setFilterLocation(loc)} style={{
              padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--light-gray)',
              background: filterLocation === loc ? 'var(--charcoal)' : 'white',
              color: filterLocation === loc ? 'white' : 'var(--charcoal)',
              cursor: 'pointer', fontFamily: 'Jost', fontSize: '0.78rem',
            }}>{loc}</button>
          ))}
        </div>
        <button onClick={() => { setForm(EMPTY_ROOM); setEditing(null); setShowForm(true); }} style={{ padding: '0.65rem 1.5rem', background: 'var(--charcoal)', color: 'var(--cream)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'Jost', fontSize: '0.8rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>+ Add Room</button>
      </div>

      {/* Edit / Add Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, overflowY: 'auto', padding: '5rem 1rem 2rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '2rem', width: '100%', maxWidth: '560px', margin: 'auto', flexShrink: 0 }}>
            <h2 className="font-display" style={{ fontSize: '1.5rem', marginBottom: '1.5rem', fontWeight: 400 }}>{editing ? 'Edit Room' : 'Add Room'}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={labelStyle}>Room / Suite Name *</label>
                <input style={inputStyle} value={form.roomName} onChange={e => setForm(f => ({ ...f, roomName: e.target.value }))} placeholder="e.g. Canova Suite" />
              </div>
              <div>
                <label style={labelStyle}>Villa</label>
                <select style={inputStyle} value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value as VillaLocation }))}>
                  <option value="Main Villa">Main Villa</option>
                  <option value="Second Villa">Second Villa</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Room Type</label>
                <select style={inputStyle} value={form.roomType} onChange={e => setForm(f => ({ ...f, roomType: e.target.value }))}>
                  {ROOM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={labelStyle}>Guests *</label>
                <input style={inputStyle} value={form.guests} onChange={e => setForm(f => ({ ...f, guests: e.target.value }))} placeholder="e.g. Tony & Rena" />
              </div>
              <div>
                <label style={labelStyle}>Guest Count</label>
                <input style={inputStyle} type="number" min="1" value={form.guestCount} onChange={e => setForm(f => ({ ...f, guestCount: Number(e.target.value) }))} />
              </div>
              <div>
                <label style={labelStyle}>Room Cost (€)</label>
                <input style={inputStyle} type="number" step="0.01" value={form.costEUR} onChange={e => setForm(f => ({ ...f, costEUR: Number(e.target.value) }))} />
              </div>
              <div>
                <label style={labelStyle}>Amount Paid (€)</label>
                <input style={inputStyle} type="number" step="0.01" value={form.amountPaidEUR} onChange={e => setForm(f => ({ ...f, amountPaidEUR: Number(e.target.value) }))} />
              </div>
              <div>
                <label style={labelStyle}>Payment Status</label>
                <select style={inputStyle} value={form.payStatus} onChange={e => setForm(f => ({ ...f, payStatus: e.target.value as PayStatus }))}>
                  {PAY_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div style={{ gridColumn: '1/-1', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input type="checkbox" id="venue-incl" checked={form.includedInVenue} onChange={e => setForm(f => ({ ...f, includedInVenue: e.target.checked }))} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                <label htmlFor="venue-incl" className="font-sans-clean" style={{ fontSize: '0.8rem', cursor: 'pointer' }}>Included in venue cost (covered by Tony)</label>
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={labelStyle}>Notes</label>
                <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: '60px' }} value={form.notes || ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Room details, special requests..." />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
              <button onClick={() => { setShowForm(false); setEditing(null); }} style={{ padding: '0.65rem 1.25rem', background: 'var(--light-gray)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'Jost', fontSize: '0.8rem' }}>Cancel</button>
              <button onClick={handleSubmit} style={{ padding: '0.65rem 1.5rem', background: 'var(--charcoal)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'Jost', fontSize: '0.8rem' }}>
                {editing ? 'Save Changes' : 'Add Room'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Room Lists */}
      {(filterLocation === 'All' || filterLocation === 'Main Villa') && mainRooms.length > 0 && (
        <>
          <SectionHeader title="Main Villa" subtitle={`Villa Valentini Bonaparte — ${mainRooms.length} rooms · ${mainRooms.reduce((s, r) => s + r.guestCount, 0)} guests · €${mainRooms.reduce((s, r) => s + r.costEUR, 0).toLocaleString('en-US', { maximumFractionDigits: 0 })} total`} />
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {mainRooms.map(r => <RoomCard key={r.id} r={r} />)}
          </div>
        </>
      )}

      {(filterLocation === 'All' || filterLocation === 'Second Villa') && secondRooms.length > 0 && (
        <>
          <SectionHeader title="Second Villa" subtitle={`La Scuderia — ${secondRooms.length} suites · ${secondRooms.reduce((s, r) => s + r.guestCount, 0)} guests · €${secondRooms.reduce((s, r) => s + r.costEUR, 0).toLocaleString('en-US', { maximumFractionDigits: 0 })} total`} />
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {secondRooms.map(r => <RoomCard key={r.id} r={r} />)}
          </div>
        </>
      )}

      {filtered.length === 0 && (
        <div style={{ ...card, textAlign: 'center', padding: '3rem' }}>
          <p className="font-display" style={{ fontSize: '1.5rem', fontStyle: 'italic', color: 'var(--mid-gray)' }}>No rooms found</p>
        </div>
      )}
    </div>
  );
}
