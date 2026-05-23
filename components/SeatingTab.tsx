'use client';
import { useState, useEffect } from 'react';
import { getGuests } from '@/lib/store';
import { Guest } from '@/lib/types';

// Serpentine table: 5 sections, 106 seats total
// (11+10+11+10+11) × 2 sides = 106 ✓
const SEGS = [
  { id: 'A', perSide: 11, dir: 'ltr' as const },
  { id: 'B', perSide: 10, dir: 'rtl' as const },
  { id: 'C', perSide: 11, dir: 'ltr' as const },
  { id: 'D', perSide: 10, dir: 'rtl' as const },
  { id: 'E', perSide: 11, dir: 'ltr' as const },
];

type SeatingMap = Record<string, string>; // seatId → guestId

function lsGet(): SeatingMap {
  if (typeof window === 'undefined') return {};
  try { return JSON.parse(localStorage.getItem('seating') || '{}'); } catch { return {}; }
}
function lsSave(s: SeatingMap) { localStorage.setItem('seating', JSON.stringify(s)); }

const SIDE_BG: Record<string, string> = { J: '#D6E8F5', N: '#F5D6E8', Both: '#D6F5DC' };
const SIDE_BD: Record<string, string> = { J: '#90B8D8', N: '#D890B8', Both: '#90D8A8' };
const TABLE_COLOR = '#8B7355';
const SEAT_W = 48;
const SEAT_H = 38;
const SEAT_GAP = 4;

function seatIds(segId: string, side: 'T' | 'B', count: number) {
  return Array.from({ length: count }, (_, i) => `${segId}-${side}-${i}`);
}

export default function SeatingTab() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [seating, setSeating] = useState<SeatingMap>({});
  const [activeSeat, setActiveSeat] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setGuests(getGuests());
    setSeating(lsGet());
  }, []);

  const guestMap = Object.fromEntries(guests.map(g => [g.id, g]));
  const assignedIds = new Set(Object.values(seating));
  const unassigned = guests.filter(g => !assignedIds.has(g.id));
  const totalSeats = SEGS.reduce((n, s) => n + s.perSide * 2, 0);
  const assignedCount = Object.keys(seating).length;

  const searchLower = search.toLowerCase();
  const panelGuests = activeSeat
    ? guests.filter(g => `${g.firstName} ${g.lastName}`.toLowerCase().includes(searchLower))
    : unassigned.filter(g => `${g.firstName} ${g.lastName}`.toLowerCase().includes(searchLower));

  function handleSeatClick(sid: string) {
    if (activeSeat === sid) { setActiveSeat(null); return; }
    setActiveSeat(sid);
    setSearch('');
  }

  function assignGuest(gid: string) {
    if (!activeSeat) return;
    const updated = { ...seating };
    for (const s of Object.keys(updated)) { if (updated[s] === gid) delete updated[s]; }
    updated[activeSeat] = gid;
    setSeating(updated);
    lsSave(updated);
    setActiveSeat(null);
  }

  function unassignSeat(sid: string) {
    const updated = { ...seating };
    delete updated[sid];
    setSeating(updated);
    lsSave(updated);
    setActiveSeat(null);
  }

  function clearAll() {
    if (!confirm('Clear all seating assignments?')) return;
    setSeating({});
    lsSave({});
    setActiveSeat(null);
  }

  const card: React.CSSProperties = {
    background: 'white', borderRadius: 12,
    padding: '1.5rem',
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
    border: '1px solid var(--light-gray)',
  };

  function SeatBox({ sid }: { sid: string }) {
    const gid = seating[sid];
    const g = gid ? guestMap[gid] : undefined;
    const isActive = activeSeat === sid;
    const isActiveSeatGuest = activeSeat && gid && seating[activeSeat] === gid && activeSeat !== sid;
    return (
      <div
        onClick={() => handleSeatClick(sid)}
        title={g ? `${g.firstName} ${g.lastName}` : 'Click to assign'}
        style={{
          width: SEAT_W, height: SEAT_H, flexShrink: 0,
          background: isActive ? '#C9A96E' : g ? SIDE_BG[g.side] : '#F2EFE9',
          border: `2px solid ${isActive ? '#B08A50' : g ? SIDE_BD[g.side] : '#DDDAD4'}`,
          borderRadius: 7, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.5rem', fontFamily: 'Jost, sans-serif',
          color: g ? '#333' : '#C8C3BB',
          textAlign: 'center', lineHeight: 1.15,
          padding: '2px', transition: 'all 0.12s', userSelect: 'none',
          overflow: 'hidden',
        }}
      >
        {g ? g.firstName.slice(0, 7) : ''}
      </div>
    );
  }

  const maxW = Math.max(...SEGS.map(s => s.perSide)) * (SEAT_W + SEAT_GAP);

  return (
    <div>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Total Seats', value: totalSeats, accent: 'var(--charcoal)' },
          { label: 'Assigned', value: assignedCount, accent: 'var(--deep-sage)' },
          { label: 'Unassigned Guests', value: unassigned.length, accent: 'var(--dusty-rose)' },
          { label: 'Total Guests', value: guests.length, accent: 'var(--champagne)' },
        ].map(s => (
          <div key={s.label} style={{ ...card, padding: '1.25rem' }}>
            <p className="font-sans-clean" style={{ fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--mid-gray)', marginBottom: '0.5rem' }}>{s.label}</p>
            <p className="font-display" style={{ fontSize: '1.8rem', fontWeight: 400, color: s.accent }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
        {/* Serpentine table */}
        <div style={{ ...card, flex: 1, minWidth: 0, overflowX: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div>
              <h2 className="font-display" style={{ fontSize: '1.3rem', fontWeight: 400 }}>Serpentine Table</h2>
              <p className="font-sans-clean" style={{ fontSize: '0.7rem', color: 'var(--mid-gray)', marginTop: '0.2rem' }}>
                Click a seat to select it, then click a guest in the panel to assign
              </p>
            </div>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '0.6rem', fontSize: '0.65rem', fontFamily: 'Jost', alignItems: 'center', flexWrap: 'wrap' }}>
                {(['J', 'N', 'Both'] as const).map(k => (
                  <span key={k} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: 12, height: 12, background: SIDE_BG[k], border: `1px solid ${SIDE_BD[k]}`, borderRadius: 2, display: 'inline-block' }} />
                    {k === 'J' ? "Jeff's" : k === 'N' ? "Nat's" : 'Both'}
                  </span>
                ))}
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: 12, height: 12, background: '#F2EFE9', border: '1px solid #DDDAD4', borderRadius: 2, display: 'inline-block' }} />
                  Empty
                </span>
              </div>
              <button onClick={clearAll} style={{ padding: '0.4rem 0.8rem', background: 'var(--light-gray)', border: 'none', borderRadius: 6, cursor: 'pointer', fontFamily: 'Jost', fontSize: '0.72rem', color: 'var(--mid-gray)' }}>
                Clear All
              </button>
            </div>
          </div>

          <div style={{ minWidth: maxW }}>
            {SEGS.map((seg, si) => {
              const tops = seatIds(seg.id, 'T', seg.perSide);
              const bots = seatIds(seg.id, 'B', seg.perSide);
              const displayTop = seg.dir === 'ltr' ? tops : [...tops].reverse();
              const displayBot = seg.dir === 'ltr' ? bots : [...bots].reverse();
              const isLast = si === SEGS.length - 1;
              const connRight = seg.dir === 'ltr';

              return (
                <div key={seg.id}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: 4 }}>
                    <span className="font-sans-clean" style={{ fontSize: '0.58rem', color: 'var(--mid-gray)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                      Section {seg.id}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: '#BDBAB4' }}>{seg.dir === 'ltr' ? '→' : '←'}</span>
                  </div>

                  {/* Top seats */}
                  <div style={{ display: 'flex', gap: SEAT_GAP, marginBottom: 4 }}>
                    {displayTop.map(sid => <SeatBox key={sid} sid={sid} />)}
                  </div>

                  {/* Table */}
                  <div style={{ height: 22, background: TABLE_COLOR, borderRadius: 4, marginBottom: 4, opacity: 0.82 }} />

                  {/* Bottom seats */}
                  <div style={{ display: 'flex', gap: SEAT_GAP, marginBottom: 4 }}>
                    {displayBot.map(sid => <SeatBox key={sid} sid={sid} />)}
                  </div>

                  {/* Serpentine connector */}
                  {!isLast && (
                    <div style={{ display: 'flex', justifyContent: connRight ? 'flex-end' : 'flex-start', marginBottom: 4 }}>
                      <div style={{
                        width: SEAT_W + SEAT_GAP,
                        height: 38,
                        background: TABLE_COLOR,
                        opacity: 0.65,
                        borderRadius: connRight ? '0 14px 14px 0' : '14px 0 0 14px',
                      }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Guest panel */}
        <div style={{ ...card, width: 250, minWidth: 220, flexShrink: 0, display: 'flex', flexDirection: 'column', maxHeight: 680 }}>
          <h3 className="font-display" style={{ fontSize: '1.1rem', fontWeight: 400, marginBottom: '0.75rem' }}>
            {activeSeat ? 'Pick a guest' : `Unassigned (${unassigned.length})`}
          </h3>

          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={activeSeat ? 'Search all guests…' : 'Search…'}
            style={{
              padding: '0.5rem 0.75rem', border: '1px solid var(--light-gray)',
              borderRadius: 8, fontSize: '0.8rem', fontFamily: 'Jost, sans-serif',
              background: 'var(--warm-white)', outline: 'none', marginBottom: '0.5rem', width: '100%', boxSizing: 'border-box',
            }}
          />

          {activeSeat && (
            <div style={{
              padding: '0.5rem 0.6rem', background: '#FFF8EC',
              border: '1px solid #C9A96E', borderRadius: 8, fontSize: '0.7rem',
              fontFamily: 'Jost', color: 'var(--charcoal)', marginBottom: '0.5rem',
            }}>
              <strong>Seat {activeSeat}</strong>{seating[activeSeat] ? ` — ${guestMap[seating[activeSeat]]?.firstName} ${guestMap[seating[activeSeat]]?.lastName}` : ' — empty'}
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.35rem' }}>
                <button onClick={() => setActiveSeat(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--mid-gray)', fontSize: '0.68rem', padding: 0 }}>Cancel</button>
                {seating[activeSeat] && (
                  <button onClick={() => unassignSeat(activeSeat)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dusty-rose)', fontSize: '0.68rem', padding: 0 }}>Unassign</button>
                )}
              </div>
            </div>
          )}

          <div style={{ overflowY: 'auto', flex: 1 }}>
            {panelGuests.length === 0 ? (
              <p style={{ fontSize: '0.75rem', color: 'var(--mid-gray)', textAlign: 'center', padding: '1.5rem 0' }}>
                {(activeSeat ? guests : unassigned).length === 0 ? '🎉 All guests seated!' : 'No matches'}
              </p>
            ) : (
              panelGuests.map(g => {
                const isCurrentlyInSeat = activeSeat && seating[activeSeat] === g.id;
                const isAssignedElsewhere = !isCurrentlyInSeat && assignedIds.has(g.id);
                return (
                  <div
                    key={g.id}
                    onClick={() => activeSeat ? assignGuest(g.id) : undefined}
                    style={{
                      padding: '0.45rem 0.6rem',
                      borderBottom: '1px solid var(--light-gray)',
                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                      cursor: activeSeat ? 'pointer' : 'default',
                      background: isCurrentlyInSeat ? '#FFF3E0' : 'transparent',
                      opacity: isAssignedElsewhere ? 0.45 : 1,
                      borderRadius: 4,
                      transition: 'background 0.1s',
                    }}
                  >
                    <span style={{
                      width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                      background: SIDE_BG[g.side], border: `1px solid ${SIDE_BD[g.side]}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.52rem', fontFamily: 'Jost', color: '#333', fontWeight: 600,
                    }}>
                      {g.side}
                    </span>
                    <span style={{ fontSize: '0.78rem', fontFamily: 'Jost', lineHeight: 1.2 }}>
                      {g.firstName} {g.lastName}
                      {isAssignedElsewhere && <span style={{ fontSize: '0.62rem', color: 'var(--mid-gray)', display: 'block' }}>already seated</span>}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {!activeSeat && unassigned.length === 0 && guests.length > 0 && (
            <p style={{ fontSize: '0.72rem', color: 'var(--deep-sage)', textAlign: 'center', padding: '0.75rem 0', fontFamily: 'Jost' }}>
              🎉 All guests have been seated!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
