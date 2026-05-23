'use client';
import { useState, useEffect } from 'react';
import { getGuests, saveGuests } from '@/lib/store';
import { Guest, GuestSide, RSVPStatus, DietaryRestriction, Accommodation, WeddingDay } from '@/lib/types';

const RSVP_STATUSES: RSVPStatus[] = ['Confirmed', 'Pending', 'Declined'];
const DIETARY: DietaryRestriction[] = ['None', 'Vegetarian', 'Vegan', 'Gluten-Free', 'Kosher', 'Halal', 'Nut Allergy', 'Dairy-Free', 'Other'];
const ACCOMMODATIONS: Accommodation[] = ['Hotel', 'Airbnb', 'Family Home', 'Other', 'Local — No Stay'];
const DAYS: WeddingDay[] = ['Aug 31 — Welcome Dinner', 'Sep 1 — Wedding Day', 'Sep 2 — Pool Party', 'Sep 3 — Checkout'];
const SIDES: { value: GuestSide; label: string }[] = [
  { value: 'J', label: "Jeff's Side" },
  { value: 'N', label: "Nat's Side" },
  { value: 'Both', label: 'Both' },
];

const RSVP_STYLE: Record<RSVPStatus, { bg: string; color: string }> = {
  'Confirmed': { bg: '#D4EDDA', color: '#276237' },
  'Pending': { bg: '#FFF3CD', color: '#856404' },
  'Declined': { bg: '#F8D7DA', color: '#721C24' },
};

const SIDE_STYLE: Record<GuestSide, { bg: string; color: string; label: string }> = {
  'J': { bg: '#E8EFF8', color: '#1A3A6B', label: 'J' },
  'N': { bg: '#F8E8EF', color: '#6B1A3A', label: 'N' },
  'Both': { bg: '#EEF0E8', color: '#3A4A1A', label: 'J+N' },
};

function genId() { return Math.random().toString(36).slice(2, 10); }

const EMPTY: Omit<Guest, 'id'> = {
  firstName: '', lastName: '', email: '', phone: '',
  side: 'J', rsvp: 'Pending', dietary: 'None', dietaryNotes: '',
  accommodation: 'Other', accommodationNotes: '',
  days: ['Sep 1 — Wedding Day'], plusOne: '', notes: '', group: '',
};

export default function GuestListTab() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Guest | null>(null);
  const [form, setForm] = useState<Omit<Guest, 'id'>>(EMPTY);
  const [filterRsvp, setFilterRsvp] = useState<RSVPStatus | 'All'>('All');
  const [filterSide, setFilterSide] = useState<GuestSide | 'All'>('All');
  const [filterDay, setFilterDay] = useState<WeddingDay | 'All'>('All');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => { setGuests(getGuests()); }, []);

  function save(updated: Guest[]) { setGuests(updated); saveGuests(updated); }

  function handleSubmit() {
    if (!form.firstName) return;
    if (editing) {
      save(guests.map(g => g.id === editing.id ? { ...form, id: editing.id } : g));
    } else {
      save([...guests, { ...form, id: genId() }]);
    }
    setForm(EMPTY); setEditing(null); setShowForm(false);
  }

  function deleteGuest(id: string) {
    if (confirm('Remove this guest?')) save(guests.filter(g => g.id !== id));
  }

  function startEdit(g: Guest) { setEditing(g); setForm({ ...g }); setShowForm(true); }

  function toggleDay(day: WeddingDay) {
    setForm(f => ({ ...f, days: f.days.includes(day) ? f.days.filter(d => d !== day) : [...f.days, day] }));
  }

  const filtered = guests
    .filter(g => filterRsvp === 'All' || g.rsvp === filterRsvp)
    .filter(g => filterSide === 'All' || g.side === filterSide)
    .filter(g => filterDay === 'All' || g.days.includes(filterDay))
    .filter(g => !search || `${g.firstName} ${g.lastName} ${g.group}`.toLowerCase().includes(search.toLowerCase()));

  const total = guests.length;
  const confirmed = guests.filter(g => g.rsvp === 'Confirmed').length;
  const pending = guests.filter(g => g.rsvp === 'Pending').length;
  const jeffCount = guests.filter(g => g.side === 'J').length;
  const natCount = guests.filter(g => g.side === 'N').length;

  const card = { background: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid var(--light-gray)' };
  const inputStyle: React.CSSProperties = { width: '100%', padding: '0.6rem 0.8rem', border: '1px solid var(--light-gray)', borderRadius: '8px', fontSize: '0.85rem', fontFamily: 'Jost, sans-serif', background: 'var(--warm-white)', color: 'var(--charcoal)', outline: 'none' };

  return (
    <div>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Total Groups', value: total, color: 'var(--charcoal)' },
          { label: 'Confirmed', value: confirmed, color: 'var(--deep-sage)' },
          { label: 'Pending', value: pending, color: 'var(--champagne)' },
          { label: "Jeff's Side", value: jeffCount, color: '#1A3A6B' },
          { label: "Nat's Side", value: natCount, color: '#6B1A3A' },
          { label: 'Declined', value: guests.filter(g => g.rsvp === 'Declined').length, color: 'var(--dusty-rose)' },
        ].map(s => (
          <div key={s.label} style={{ ...card, padding: '1rem' }}>
            <p className="font-sans-clean" style={{ fontSize: '0.62rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--mid-gray)', marginBottom: '0.4rem' }}>{s.label}</p>
            <p className="font-display" style={{ fontSize: '2rem', fontWeight: 300, color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters + Add */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', flex: 1 }}>
          <input style={{ ...inputStyle, maxWidth: '200px' }} placeholder="Search guests..." value={search} onChange={e => setSearch(e.target.value)} />
          <select style={{ ...inputStyle, width: 'auto' }} value={filterSide} onChange={e => setFilterSide(e.target.value as any)}>
            <option value="All">All Sides</option>
            {SIDES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <select style={{ ...inputStyle, width: 'auto' }} value={filterRsvp} onChange={e => setFilterRsvp(e.target.value as any)}>
            <option value="All">All RSVPs</option>
            {RSVP_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select style={{ ...inputStyle, width: 'auto' }} value={filterDay} onChange={e => setFilterDay(e.target.value as any)}>
            <option value="All">All Days</option>
            {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <button onClick={() => { setForm(EMPTY); setEditing(null); setShowForm(true); }} style={{ padding: '0.65rem 1.5rem', background: 'var(--charcoal)', color: 'var(--cream)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'Jost', fontSize: '0.8rem', letterSpacing: '0.1em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>+ Add Guest</button>
      </div>

      {/* Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '2rem', width: '100%', maxWidth: '580px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 className="font-display" style={{ fontSize: '1.5rem', marginBottom: '1.5rem', fontWeight: 400 }}>{editing ? 'Edit Guest' : 'Add Guest'}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label className="font-sans-clean" style={{ fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--mid-gray)', display: 'block', marginBottom: '0.3rem' }}>First Name / Full Name *</label>
                <input style={inputStyle} value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} />
              </div>
              <div>
                <label className="font-sans-clean" style={{ fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--mid-gray)', display: 'block', marginBottom: '0.3rem' }}>Last Name</label>
                <input style={inputStyle} value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} />
              </div>
              <div>
                <label className="font-sans-clean" style={{ fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--mid-gray)', display: 'block', marginBottom: '0.3rem' }}>Email</label>
                <input style={inputStyle} type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div>
                <label className="font-sans-clean" style={{ fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--mid-gray)', display: 'block', marginBottom: '0.3rem' }}>Side</label>
                <select style={inputStyle} value={form.side} onChange={e => setForm(f => ({ ...f, side: e.target.value as GuestSide }))}>
                  {SIDES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <div>
                <label className="font-sans-clean" style={{ fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--mid-gray)', display: 'block', marginBottom: '0.3rem' }}>RSVP</label>
                <select style={inputStyle} value={form.rsvp} onChange={e => setForm(f => ({ ...f, rsvp: e.target.value as RSVPStatus }))}>
                  {RSVP_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="font-sans-clean" style={{ fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--mid-gray)', display: 'block', marginBottom: '0.3rem' }}>Group / Family</label>
                <input style={inputStyle} value={form.group} onChange={e => setForm(f => ({ ...f, group: e.target.value }))} placeholder="e.g. Smith Family" />
              </div>
              <div>
                <label className="font-sans-clean" style={{ fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--mid-gray)', display: 'block', marginBottom: '0.3rem' }}>Phone</label>
                <input style={inputStyle} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
              <div>
                <label className="font-sans-clean" style={{ fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--mid-gray)', display: 'block', marginBottom: '0.3rem' }}>Dietary</label>
                <select style={inputStyle} value={form.dietary} onChange={e => setForm(f => ({ ...f, dietary: e.target.value as DietaryRestriction }))}>
                  {DIETARY.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="font-sans-clean" style={{ fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--mid-gray)', display: 'block', marginBottom: '0.3rem' }}>Dietary Notes</label>
                <input style={inputStyle} value={form.dietaryNotes} onChange={e => setForm(f => ({ ...f, dietaryNotes: e.target.value }))} placeholder="Specifics..." />
              </div>
              <div>
                <label className="font-sans-clean" style={{ fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--mid-gray)', display: 'block', marginBottom: '0.3rem' }}>Accommodation</label>
                <select style={inputStyle} value={form.accommodation} onChange={e => setForm(f => ({ ...f, accommodation: e.target.value as Accommodation }))}>
                  {ACCOMMODATIONS.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div>
                <label className="font-sans-clean" style={{ fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--mid-gray)', display: 'block', marginBottom: '0.3rem' }}>Accommodation Notes</label>
                <input style={inputStyle} value={form.accommodationNotes} onChange={e => setForm(f => ({ ...f, accommodationNotes: e.target.value }))} placeholder="Hotel name, room..." />
              </div>
              <div>
                <label className="font-sans-clean" style={{ fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--mid-gray)', display: 'block', marginBottom: '0.3rem' }}>Plus One Name</label>
                <input style={inputStyle} value={form.plusOne} onChange={e => setForm(f => ({ ...f, plusOne: e.target.value }))} placeholder="Partner / guest name" />
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label className="font-sans-clean" style={{ fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--mid-gray)', display: 'block', marginBottom: '0.5rem' }}>Attending Days</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {DAYS.map(d => (
                    <button key={d} type="button" onClick={() => toggleDay(d)} style={{
                      padding: '0.4rem 0.8rem', borderRadius: '6px', border: '1px solid var(--light-gray)',
                      background: form.days.includes(d) ? 'var(--charcoal)' : 'white',
                      color: form.days.includes(d) ? 'white' : 'var(--charcoal)',
                      cursor: 'pointer', fontSize: '0.75rem', fontFamily: 'Jost',
                    }}>{d.split('—')[0].trim()}</button>
                  ))}
                </div>
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label className="font-sans-clean" style={{ fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--mid-gray)', display: 'block', marginBottom: '0.3rem' }}>Notes</label>
                <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: '60px' }} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Any special notes..." />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
              <button onClick={() => { setShowForm(false); setEditing(null); }} style={{ padding: '0.65rem 1.25rem', background: 'var(--light-gray)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'Jost', fontSize: '0.8rem' }}>Cancel</button>
              <button onClick={handleSubmit} style={{ padding: '0.65rem 1.5rem', background: 'var(--charcoal)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'Jost', fontSize: '0.8rem' }}>
                {editing ? 'Save Changes' : 'Add Guest'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Guest Cards */}
      {filtered.length === 0 ? (
        <div style={{ ...card, textAlign: 'center', padding: '3rem' }}>
          <p className="font-display" style={{ fontSize: '1.5rem', fontStyle: 'italic', color: 'var(--mid-gray)' }}>No guests found</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {filtered.map(g => {
            const sideStyle = SIDE_STYLE[g.side || 'J'];
            const initials = g.firstName[0] + (g.lastName?.[0] || '');
            return (
              <div key={g.id} style={{ ...card, padding: '0' }}>
                <div
                  style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', cursor: 'pointer' }}
                  onClick={() => setExpandedId(expandedId === g.id ? null : g.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'var(--light-gray)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Cormorant Garamond', fontSize: '1rem', color: 'var(--mid-gray)', flexShrink: 0 }}>
                      {initials}
                    </div>
                    <div>
                      <div style={{ fontWeight: 500, fontSize: '0.95rem' }}>{g.firstName} {g.lastName}
                        {g.plusOne && <span style={{ fontSize: '0.75rem', color: 'var(--mid-gray)', marginLeft: '0.5rem' }}>+ {g.plusOne}</span>}
                      </div>
                      {g.email && <div style={{ fontSize: '0.72rem', color: 'var(--mid-gray)', fontFamily: 'Jost' }}>{g.email}</div>}
                    </div>
                    <span style={{ background: sideStyle.bg, color: sideStyle.color, borderRadius: '4px', padding: '0.2rem 0.5rem', fontSize: '0.65rem', fontFamily: 'Jost', fontWeight: 600, letterSpacing: '0.05em' }}>{sideStyle.label}</span>
                    <span style={{ ...RSVP_STYLE[g.rsvp], borderRadius: '4px', padding: '0.2rem 0.6rem', fontSize: '0.68rem', fontFamily: 'Jost' }}>{g.rsvp}</span>
                    {g.dietary !== 'None' && <span style={{ background: '#E8F4F8', color: '#0C5460', borderRadius: '4px', padding: '0.2rem 0.6rem', fontSize: '0.68rem', fontFamily: 'Jost' }}>{g.dietary}</span>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      {g.days.map(d => (
                        <span key={d} style={{ background: 'var(--charcoal)', color: 'white', borderRadius: '3px', padding: '0.15rem 0.4rem', fontSize: '0.62rem', fontFamily: 'Jost' }}>
                          {d.split(' ')[0]} {d.split(' ')[1]}
                        </span>
                      ))}
                    </div>
                    <button onClick={e => { e.stopPropagation(); startEdit(g); }} style={{ padding: '0.3rem 0.5rem', border: '1px solid var(--light-gray)', borderRadius: '6px', cursor: 'pointer', background: 'white', fontSize: '0.7rem' }}>✎</button>
                    <button onClick={e => { e.stopPropagation(); deleteGuest(g.id); }} style={{ padding: '0.3rem 0.5rem', border: '1px solid var(--light-gray)', borderRadius: '6px', cursor: 'pointer', background: 'white', color: 'var(--dusty-rose)', fontSize: '0.7rem' }}>✕</button>
                    <span style={{ color: 'var(--mid-gray)', fontSize: '0.7rem' }}>{expandedId === g.id ? '▲' : '▼'}</span>
                  </div>
                </div>
                {expandedId === g.id && (
                  <div style={{ borderTop: '1px solid var(--light-gray)', padding: '1rem 1.25rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', background: 'var(--warm-white)', borderRadius: '0 0 12px 12px' }}>
                    {[
                      { label: 'Email', val: g.email || '—' },
                      { label: 'Phone', val: g.phone || '—' },
                      { label: 'Side', val: g.side === 'J' ? "Jeff's Side" : g.side === 'N' ? "Nat's Side" : 'Both' },
                      { label: 'Accommodation', val: `${g.accommodation}${g.accommodationNotes ? ` — ${g.accommodationNotes}` : ''}` },
                      { label: 'Dietary', val: `${g.dietary}${g.dietaryNotes ? `: ${g.dietaryNotes}` : ''}` },
                      { label: 'Days Attending', val: g.days.join(', ') || '—' },
                      ...(g.group ? [{ label: 'Group', val: g.group }] : []),
                      ...(g.notes ? [{ label: 'Notes', val: g.notes }] : []),
                    ].map(({ label, val }) => (
                      <div key={label}>
                        <p className="font-sans-clean" style={{ fontSize: '0.62rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--mid-gray)', marginBottom: '0.2rem' }}>{label}</p>
                        <p style={{ fontSize: '0.82rem' }}>{val}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
