'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { getWeddingId } from '@/lib/store';
import { Wedding, WeddingEvent } from '@/lib/types';

function genId() { return Math.random().toString(36).slice(2, 10); }

const DRESSCODES = ['', 'Black Tie', 'Black Tie Optional', 'Cocktail Attire', 'Smart Casual', 'Garden Party', 'Beach Casual', 'Formal'];

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.65rem 0.85rem',
  border: '1.5px solid var(--light-gray)',
  borderRadius: 8, fontSize: '0.85rem',
  outline: 'none', color: 'var(--charcoal)',
  background: 'white', fontFamily: 'Jost, sans-serif',
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  display: 'block', fontFamily: 'Jost, sans-serif',
  fontSize: '0.58rem', letterSpacing: '0.15em',
  textTransform: 'uppercase', color: 'var(--mid-gray)',
  marginBottom: '0.35rem',
};

const card: React.CSSProperties = {
  background: 'white', borderRadius: 12, padding: '1.5rem',
  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
  border: '1px solid var(--light-gray)',
  marginBottom: '1.5rem',
};

const sectionTitle: React.CSSProperties = {
  fontFamily: 'Jost, sans-serif',
  fontSize: '0.6rem', letterSpacing: '0.2em',
  textTransform: 'uppercase', color: 'var(--mid-gray)',
  marginBottom: '1.25rem',
};

function SaveBtn({ saving, onClick }: { saving: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={saving}
      style={{
        padding: '0.55rem 1.25rem',
        background: saving ? 'var(--mid-gray)' : 'var(--charcoal)',
        color: 'white', border: 'none', borderRadius: 8,
        fontFamily: 'Jost, sans-serif',
        fontSize: '0.7rem', letterSpacing: '0.12em',
        textTransform: 'uppercase', cursor: saving ? 'default' : 'pointer',
      }}
    >
      {saving ? 'Saving…' : 'Save'}
    </button>
  );
}

// ── Event Form (inline) ──────────────────────────────────────────────

const EMPTY_EVENT: Omit<WeddingEvent, 'id'> = {
  name: '', date: '', time: '', description: '', dresscode: '',
};

function EventForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: WeddingEvent;
  onSave: (e: WeddingEvent) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<Omit<WeddingEvent, 'id'>>(
    initial ? { name: initial.name, date: initial.date, time: initial.time ?? '', description: initial.description ?? '', dresscode: initial.dresscode ?? '' }
            : { ...EMPTY_EVENT }
  );

  function set(field: string, val: string) { setForm(f => ({ ...f, [field]: val })); }

  return (
    <div style={{ background: 'var(--cream)', borderRadius: 10, padding: '1.25rem', border: '1px solid var(--light-gray)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
        <div style={{ gridColumn: '1/-1' }}>
          <label style={labelStyle}>Event Name *</label>
          <input style={inputStyle} value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Welcome Dinner, Wedding Ceremony, Pool Party" />
        </div>
        <div>
          <label style={labelStyle}>Date</label>
          <input style={inputStyle} type="date" value={form.date} onChange={e => set('date', e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>Time</label>
          <input style={inputStyle} value={form.time} onChange={e => set('time', e.target.value)} placeholder="e.g. 7:00 PM" />
        </div>
        <div style={{ gridColumn: '1/-1' }}>
          <label style={labelStyle}>Description (shown to guests)</label>
          <input style={inputStyle} value={form.description} onChange={e => set('description', e.target.value)} placeholder="e.g. Join us for a relaxed evening at the villa" />
        </div>
        <div style={{ gridColumn: '1/-1' }}>
          <label style={labelStyle}>Dress Code</label>
          <select style={inputStyle} value={form.dresscode} onChange={e => set('dresscode', e.target.value)}>
            {DRESSCODES.map(d => <option key={d} value={d}>{d || '— None specified —'}</option>)}
          </select>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
        <button onClick={onCancel} style={{ padding: '0.5rem 1rem', background: 'none', border: '1px solid var(--light-gray)', borderRadius: 8, cursor: 'pointer', fontFamily: 'Jost, sans-serif', fontSize: '0.75rem', color: 'var(--charcoal)' }}>
          Cancel
        </button>
        <button
          onClick={() => { if (!form.name.trim()) return; onSave({ ...form, id: initial?.id ?? genId() }); }}
          style={{ padding: '0.5rem 1.25rem', background: 'var(--charcoal)', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: 'Jost, sans-serif', fontSize: '0.75rem' }}
        >
          {initial ? 'Update Event' : 'Add Event'}
        </button>
      </div>
    </div>
  );
}

// ── Main Tab ─────────────────────────────────────────────────────────

export default function GuestSiteTab() {
  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [loading, setLoading] = useState(true);

  // Welcome message
  const [welcome, setWelcome] = useState('');
  const [savingWelcome, setSavingWelcome] = useState(false);

  // Events
  const [events, setEvents] = useState<WeddingEvent[]>([]);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [editingEvent, setEditingEvent] = useState<WeddingEvent | null>(null);
  const [savingEvents, setSavingEvents] = useState(false);

  // Meal choices
  const [mealChoices, setMealChoices] = useState<string[]>([]);
  const [mealInput, setMealInput] = useState('');
  const [savingMeals, setSavingMeals] = useState(false);

  useEffect(() => {
    const weddingId = getWeddingId();
    if (!weddingId) return;
    supabase.from('weddings').select('*').eq('id', weddingId).single()
      .then(({ data }) => {
        if (data) {
          const w = data as Wedding;
          setWedding(w);
          setWelcome(w.welcome_message || '');
          setEvents(w.events || []);
          setMealChoices(w.meal_choices || []);
        }
        setLoading(false);
      });
  }, []);

  async function pushUpdate(fields: Partial<Wedding>) {
    if (!wedding) return;
    await supabase.from('weddings').update(fields).eq('id', wedding.id);
    setWedding(w => w ? { ...w, ...fields } : w);
  }

  async function saveWelcome() {
    setSavingWelcome(true);
    await pushUpdate({ welcome_message: welcome });
    setSavingWelcome(false);
  }

  async function saveEvents(updated: WeddingEvent[]) {
    setSavingEvents(true);
    await pushUpdate({ events: updated as unknown as WeddingEvent[] });
    setEvents(updated);
    setSavingEvents(false);
  }

  function addEvent(e: WeddingEvent) {
    const updated = [...events, e].sort((a, b) => a.date.localeCompare(b.date));
    saveEvents(updated);
    setShowAddEvent(false);
  }

  function updateEvent(e: WeddingEvent) {
    const updated = events.map(ev => ev.id === e.id ? e : ev).sort((a, b) => a.date.localeCompare(b.date));
    saveEvents(updated);
    setEditingEvent(null);
  }

  function deleteEvent(id: string) {
    if (!confirm('Remove this event?')) return;
    saveEvents(events.filter(e => e.id !== id));
  }

  function addMeal() {
    const val = mealInput.trim();
    if (!val || mealChoices.includes(val)) return;
    const updated = [...mealChoices, val];
    setMealChoices(updated);
    setMealInput('');
  }

  function removeMeal(m: string) {
    setMealChoices(prev => prev.filter(x => x !== m));
  }

  async function saveMeals() {
    setSavingMeals(true);
    await pushUpdate({ meal_choices: mealChoices });
    setSavingMeals(false);
  }

  function fmtDate(d: string) {
    if (!d) return '';
    return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }

  const siteUrl = wedding?.slug
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/${wedding.slug}`
    : '';

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '3rem' }}>
      <p className="font-sans-clean" style={{ color: 'var(--mid-gray)', fontSize: '0.75rem', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Loading…</p>
    </div>
  );

  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>

      {/* ── Preview Link ────────────────────────────────────────────── */}
      {siteUrl && (
        <div style={{ ...card, background: 'var(--charcoal)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <p className="font-sans-clean" style={{ fontSize: '0.58rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: '0.3rem' }}>
              Your wedding page is live at
            </p>
            <p className="font-sans-clean" style={{ fontSize: '0.85rem', color: 'var(--champagne)', wordBreak: 'break-all' }}>
              {siteUrl}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
            <button
              onClick={() => navigator.clipboard.writeText(siteUrl)}
              className="font-sans-clean"
              style={{ padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, cursor: 'pointer', fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}
            >
              Copy Link
            </button>
            <a
              href={siteUrl} target="_blank" rel="noreferrer"
              className="font-sans-clean"
              style={{ padding: '0.5rem 1rem', background: 'white', color: 'var(--charcoal)', borderRadius: 8, cursor: 'pointer', fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', textDecoration: 'none', fontWeight: 600 }}
            >
              Preview ↗
            </a>
          </div>
        </div>
      )}

      {/* ── Welcome Message ──────────────────────────────────────────── */}
      <div style={card}>
        <p style={sectionTitle}>Welcome Message</p>
        <p className="font-sans-clean" style={{ fontSize: '0.72rem', color: 'var(--mid-gray)', marginBottom: '0.85rem' }}>
          Shown on your wedding page below the hero. Write something personal for your guests.
        </p>
        <textarea
          value={welcome}
          onChange={e => setWelcome(e.target.value)}
          style={{ ...inputStyle, resize: 'vertical', minHeight: 100, marginBottom: '0.85rem' }}
          placeholder="We are so excited to celebrate this special day with you. Your presence means the world to us…"
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <SaveBtn saving={savingWelcome} onClick={saveWelcome} />
        </div>
      </div>

      {/* ── Events ───────────────────────────────────────────────────── */}
      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <p style={{ ...sectionTitle, marginBottom: 0 }}>Events & Schedule</p>
          {!showAddEvent && (
            <button
              onClick={() => { setShowAddEvent(true); setEditingEvent(null); }}
              className="font-sans-clean"
              style={{ padding: '0.45rem 1rem', background: 'var(--charcoal)', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}
            >
              + Add Event
            </button>
          )}
        </div>

        <p className="font-sans-clean" style={{ fontSize: '0.72rem', color: 'var(--mid-gray)', marginBottom: '1rem' }}>
          Each event appears as a card on your wedding page. Guests see the name, date, time, dress code, and description.
        </p>

        {/* Event list */}
        {events.length === 0 && !showAddEvent && (
          <div style={{ textAlign: 'center', padding: '2rem', background: 'var(--cream)', borderRadius: 10 }}>
            <p className="font-display" style={{ fontSize: '1.2rem', fontStyle: 'italic', color: 'var(--mid-gray)', marginBottom: '0.5rem' }}>No events yet</p>
            <p className="font-sans-clean" style={{ fontSize: '0.72rem', color: 'var(--mid-gray)' }}>Add your Welcome Dinner, Ceremony, Pool Party and more.</p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {events.map(ev => (
            editingEvent?.id === ev.id ? (
              <EventForm key={ev.id} initial={ev} onSave={updateEvent} onCancel={() => setEditingEvent(null)} />
            ) : (
              <div key={ev.id} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', padding: '1rem 1.1rem', background: 'var(--cream)', borderRadius: 10, border: '1px solid var(--light-gray)' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                    <span style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: '1.1rem', fontWeight: 400, color: 'var(--charcoal)' }}>{ev.name}</span>
                    {ev.dresscode && (
                      <span className="font-sans-clean" style={{ fontSize: '0.62rem', background: 'var(--light-gray)', color: 'var(--mid-gray)', padding: '0.15rem 0.5rem', borderRadius: 4, letterSpacing: '0.08em' }}>{ev.dresscode}</span>
                    )}
                  </div>
                  <p className="font-sans-clean" style={{ fontSize: '0.75rem', color: 'var(--mid-gray)' }}>
                    {fmtDate(ev.date)}{ev.time ? ` · ${ev.time}` : ''}
                    {ev.description ? ` — ${ev.description}` : ''}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                  <button onClick={() => { setEditingEvent(ev); setShowAddEvent(false); }} style={{ padding: '0.3rem 0.6rem', border: '1px solid var(--light-gray)', borderRadius: 6, cursor: 'pointer', background: 'white', fontSize: '0.7rem' }}>✎</button>
                  <button onClick={() => deleteEvent(ev.id)} style={{ padding: '0.3rem 0.6rem', border: '1px solid var(--light-gray)', borderRadius: 6, cursor: 'pointer', background: 'white', color: 'var(--dusty-rose)', fontSize: '0.7rem' }}>✕</button>
                </div>
              </div>
            )
          ))}

          {showAddEvent && (
            <EventForm onSave={addEvent} onCancel={() => setShowAddEvent(false)} />
          )}
        </div>

        {savingEvents && (
          <p className="font-sans-clean" style={{ fontSize: '0.68rem', color: 'var(--mid-gray)', marginTop: '0.75rem', textAlign: 'right' }}>Saving…</p>
        )}
      </div>

      {/* ── Meal Choices ─────────────────────────────────────────────── */}
      <div style={card}>
        <p style={sectionTitle}>Meal Options</p>
        <p className="font-sans-clean" style={{ fontSize: '0.72rem', color: 'var(--mid-gray)', marginBottom: '1rem' }}>
          Add the meal options your caterer is offering (e.g. Chicken, Fish, Vegetarian). Guests will choose one when they RSVP. Leave empty to skip the meal question entirely.
        </p>

        {/* Current options */}
        {mealChoices.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
            {mealChoices.map(m => (
              <div key={m} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'var(--cream)', border: '1px solid var(--light-gray)', borderRadius: 8, padding: '0.4rem 0.75rem' }}>
                <span className="font-sans-clean" style={{ fontSize: '0.82rem', color: 'var(--charcoal)' }}>{m}</span>
                <button onClick={() => removeMeal(m)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--mid-gray)', fontSize: '0.75rem', lineHeight: 1, padding: 0 }}>✕</button>
              </div>
            ))}
          </div>
        )}

        {mealChoices.length === 0 && (
          <p className="font-sans-clean" style={{ fontSize: '0.75rem', color: 'var(--mid-gray)', fontStyle: 'italic', marginBottom: '1rem' }}>
            No meal options added — the meal question will be hidden on the RSVP form.
          </p>
        )}

        {/* Add option */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <input
            style={{ ...inputStyle, flex: 1 }}
            value={mealInput}
            onChange={e => setMealInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addMeal(); } }}
            placeholder="e.g. Chicken, Fish, Vegetarian, Vegan"
          />
          <button
            onClick={addMeal}
            className="font-sans-clean"
            style={{ padding: '0.65rem 1rem', background: 'var(--charcoal)', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}
          >
            Add
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <SaveBtn saving={savingMeals} onClick={saveMeals} />
        </div>
      </div>

    </div>
  );
}
