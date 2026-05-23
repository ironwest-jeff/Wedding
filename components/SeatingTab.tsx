'use client';
import { useState, useEffect } from 'react';
import { getGuests } from '@/lib/store';
import { Guest } from '@/lib/types';

// Vertical serpentine: 2 arms side-by-side, arc connects at the bottom
// Arm A (↓): 27 rows × 2 sides = 54 seats
// Arm B (↑): 26 rows × 2 sides = 52 seats
// Total: 106 seats ✓

const SEAT_W = 42;
const SEAT_H = 36;
const SEAT_GAP = 6;   // horizontal gap: seat ↔ table strip
const ROW_GAP = 4;    // vertical gap between rows
const TABLE_W = 20;   // width of the vertical table strip
const ARM_GAP = 52;   // horizontal gap between the two arms
const ARC_H = 60;     // height of the bottom U-turn arc
const TABLE_COLOR = '#8B7355';

const ARM_A_ROWS = 27;
const ARM_B_ROWS = 26;

// Arm width: left-seat + gap + table + gap + right-seat
const ARM_W = SEAT_W + SEAT_GAP + TABLE_W + SEAT_GAP + SEAT_W; // 116px

// Arm heights
const ARM_A_H = ARM_A_ROWS * (SEAT_H + ROW_GAP) - ROW_GAP; // 1076px
const ARM_B_H = ARM_B_ROWS * (SEAT_H + ROW_GAP) - ROW_GAP; // 1036px

// Canvas
const CANVAS_W = ARM_W + ARM_GAP + ARM_W; // 284px
const CANVAS_H = ARM_A_H + ARC_H + 20;    // ~1156px

// Bottom-align: Arm B top offset so both bottoms align at ARM_A_H
const ARM_B_TOP = ARM_A_H - ARM_B_H; // 40px

// Arc: spans horizontally from Arm A table strip left edge → Arm B table strip right edge
const ARC_LEFT = SEAT_W + SEAT_GAP;  // 48px
const ARC_RIGHT = ARM_W + ARM_GAP + SEAT_W + SEAT_GAP + TABLE_W; // 232px
const ARC_W = ARC_RIGHT - ARC_LEFT;  // 184px

const TOTAL_SEATS = ARM_A_ROWS * 2 + ARM_B_ROWS * 2; // 106

type SeatingMap = Record<string, string>;
function lsGet(): SeatingMap {
  if (typeof window === 'undefined') return {};
  try { return JSON.parse(localStorage.getItem('seating') || '{}'); } catch { return {}; }
}
function lsSave(s: SeatingMap) { localStorage.setItem('seating', JSON.stringify(s)); }

const SIDE_BG: Record<string, string> = { J: '#D6E8F5', N: '#F5D6E8', Both: '#D6F5DC' };
const SIDE_BD: Record<string, string> = { J: '#90B8D8', N: '#D890B8', Both: '#90D8A8' };

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
  const assignedCount = Object.keys(seating).length;

  const searchLower = search.toLowerCase();
  const modalGuests = guests.filter(g =>
    `${g.firstName} ${g.lastName}`.toLowerCase().includes(searchLower)
  );

  function handleSeatClick(sid: string) {
    setActiveSeat(sid === activeSeat ? null : sid);
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
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
    border: '1px solid var(--light-gray)',
  };

  function Seat({ sid }: { sid: string }) {
    const gid = seating[sid];
    const g = gid ? guestMap[gid] : undefined;
    const isActive = activeSeat === sid;
    return (
      <div
        onClick={() => handleSeatClick(sid)}
        title={g ? `${g.firstName} ${g.lastName}` : 'Click to assign'}
        style={{
          width: SEAT_W, height: SEAT_H, flexShrink: 0,
          background: isActive ? '#C9A96E' : g ? SIDE_BG[g.side] : '#F0EDE7',
          border: `2px solid ${isActive ? '#B08A50' : g ? SIDE_BD[g.side] : '#DDD8D0'}`,
          borderRadius: 6, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.48rem', fontFamily: 'Jost, sans-serif',
          color: g ? '#333' : '#C5C0B8',
          textAlign: 'center', lineHeight: 1.15, padding: '2px',
          transition: 'all 0.12s', userSelect: 'none', overflow: 'hidden',
        }}
      >
        {g ? g.firstName.slice(0, 6) : ''}
      </div>
    );
  }

  const activeGuest = activeSeat ? guestMap[seating[activeSeat]] : null;

  return (
    <div>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Total Seats', value: TOTAL_SEATS, accent: 'var(--charcoal)' },
          { label: 'Assigned', value: assignedCount, accent: 'var(--deep-sage)' },
          { label: 'Unassigned', value: unassigned.length, accent: 'var(--dusty-rose)' },
          { label: 'Total Guests', value: guests.length, accent: 'var(--champagne)' },
        ].map(s => (
          <div key={s.label} style={{ ...card, padding: '1.25rem' }}>
            <p className="font-sans-clean" style={{ fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--mid-gray)', marginBottom: '0.5rem' }}>{s.label}</p>
            <p className="font-display" style={{ fontSize: '1.8rem', fontWeight: 400, color: s.accent }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>

        {/* ── Serpentine Table ── */}
        <div style={{ ...card, padding: '1.5rem', flex: '0 0 auto' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <div>
              <h2 className="font-display" style={{ fontSize: '1.3rem', fontWeight: 400 }}>Serpentine Table</h2>
              <p className="font-sans-clean" style={{ fontSize: '0.7rem', color: 'var(--mid-gray)', marginTop: '0.2rem' }}>
                Click a seat · assign from the panel →
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.63rem', fontFamily: 'Jost', alignItems: 'center' }}>
                {(['J', 'N', 'Both'] as const).map(k => (
                  <span key={k} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <span style={{ width: 10, height: 10, background: SIDE_BG[k], border: `1px solid ${SIDE_BD[k]}`, borderRadius: 2, display: 'inline-block' }} />
                    {k === 'J' ? "Jeff's" : k === 'N' ? "Nat's" : 'Both'}
                  </span>
                ))}
                <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <span style={{ width: 10, height: 10, background: '#F0EDE7', border: '1px solid #DDD8D0', borderRadius: 2, display: 'inline-block' }} />
                  Empty
                </span>
              </div>
              <button onClick={clearAll} style={{ padding: '0.35rem 0.75rem', background: 'var(--light-gray)', border: 'none', borderRadius: 6, cursor: 'pointer', fontFamily: 'Jost', fontSize: '0.7rem', color: 'var(--mid-gray)' }}>
                Clear All
              </button>
            </div>
          </div>

          {/* Arm labels row */}
          <div style={{ display: 'flex', gap: ARM_GAP, marginBottom: 6, width: CANVAS_W }}>
            <div style={{ width: ARM_W, textAlign: 'center' }}>
              <span className="font-sans-clean" style={{ fontSize: '0.58rem', color: 'var(--mid-gray)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                Arm A ↓
              </span>
            </div>
            <div style={{ width: ARM_W, textAlign: 'center' }}>
              <span className="font-sans-clean" style={{ fontSize: '0.58rem', color: 'var(--mid-gray)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                ↑ Arm B
              </span>
            </div>
          </div>

          {/* Canvas */}
          <div style={{ position: 'relative', width: CANVAS_W, height: CANVAS_H }}>

            {/* ── Arm A (left, rows go top→bottom) ── */}
            <div style={{ position: 'absolute', left: 0, top: 0, width: ARM_W, height: ARM_A_H }}>
              {/* Table strip */}
              <div style={{
                position: 'absolute',
                left: SEAT_W + SEAT_GAP,
                top: 0, width: TABLE_W, height: ARM_A_H,
                background: TABLE_COLOR, borderRadius: 4, opacity: 0.88,
              }} />
              {/* Seat rows */}
              {Array.from({ length: ARM_A_ROWS }, (_, i) => (
                <div key={i} style={{
                  position: 'absolute',
                  top: i * (SEAT_H + ROW_GAP),
                  left: 0, height: SEAT_H, width: ARM_W,
                  display: 'flex', alignItems: 'center',
                }}>
                  <Seat sid={`A-L-${i}`} />
                  <div style={{ width: SEAT_GAP + TABLE_W + SEAT_GAP }} />
                  <Seat sid={`A-R-${i}`} />
                </div>
              ))}
            </div>

            {/* ── Arc connector at the bottom (U-turn) ── */}
            <div style={{
              position: 'absolute',
              left: ARC_LEFT,
              top: ARM_A_H,
              width: ARC_W,
              height: ARC_H,
              borderBottom: `${TABLE_W}px solid ${TABLE_COLOR}`,
              borderLeft: `${TABLE_W}px solid ${TABLE_COLOR}`,
              borderRight: `${TABLE_W}px solid ${TABLE_COLOR}`,
              borderTop: 'none',
              borderRadius: `0 0 ${ARC_H}px ${ARC_H}px`,
              opacity: 0.85,
              boxSizing: 'border-box',
            }} />

            {/* ── Arm B (right, rows appear top→bottom but seat ids run bottom→top for serpentine flow) ── */}
            <div style={{ position: 'absolute', left: ARM_W + ARM_GAP, top: ARM_B_TOP, width: ARM_W, height: ARM_B_H }}>
              {/* Table strip */}
              <div style={{
                position: 'absolute',
                left: SEAT_W + SEAT_GAP,
                top: 0, width: TABLE_W, height: ARM_B_H,
                background: TABLE_COLOR, borderRadius: 4, opacity: 0.88,
              }} />
              {/* Seat rows — displayed top→bottom, seat index counts from bottom (reversed) */}
              {Array.from({ length: ARM_B_ROWS }, (_, displayRow) => {
                const seatIdx = ARM_B_ROWS - 1 - displayRow;
                return (
                  <div key={displayRow} style={{
                    position: 'absolute',
                    top: displayRow * (SEAT_H + ROW_GAP),
                    left: 0, height: SEAT_H, width: ARM_W,
                    display: 'flex', alignItems: 'center',
                  }}>
                    <Seat sid={`B-L-${seatIdx}`} />
                    <div style={{ width: SEAT_GAP + TABLE_W + SEAT_GAP }} />
                    <Seat sid={`B-R-${seatIdx}`} />
                  </div>
                );
              })}
            </div>

          </div>
        </div>

        {/* ── Guest Panel ── */}
        <div style={{ ...card, flex: 1, minWidth: 220, padding: '1.25rem', position: 'sticky', top: 70, maxHeight: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
          <h3 className="font-display" style={{ fontSize: '1.1rem', fontWeight: 400, marginBottom: '0.15rem' }}>
            {activeSeat ? `Assign to ${activeSeat}` : `Unassigned (${unassigned.length})`}
          </h3>
          {activeSeat && (
            <p className="font-sans-clean" style={{ fontSize: '0.68rem', color: 'var(--mid-gray)', marginBottom: '0.6rem' }}>
              {activeGuest ? `Currently: ${activeGuest.firstName} ${activeGuest.lastName}` : 'Seat is empty'}
            </p>
          )}

          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={activeSeat ? 'Search all guests…' : 'Search…'}
            style={{
              padding: '0.5rem 0.75rem', border: '1px solid var(--light-gray)',
              borderRadius: 8, fontSize: '0.8rem', fontFamily: 'Jost',
              background: 'var(--warm-white)', outline: 'none',
              marginBottom: '0.5rem', width: '100%', boxSizing: 'border-box',
            }}
          />

          {activeSeat && (
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.6rem' }}>
              {activeGuest && (
                <button onClick={() => unassignSeat(activeSeat)} style={{ padding: '0.35rem 0.75rem', background: '#FEE2E2', color: '#B91C1C', border: 'none', borderRadius: 6, cursor: 'pointer', fontFamily: 'Jost', fontSize: '0.7rem', flex: 1 }}>
                  Unassign
                </button>
              )}
              <button onClick={() => setActiveSeat(null)} style={{ padding: '0.35rem 0.75rem', background: 'var(--light-gray)', border: 'none', borderRadius: 6, cursor: 'pointer', fontFamily: 'Jost', fontSize: '0.7rem', flex: 1 }}>
                Cancel
              </button>
            </div>
          )}

          <div style={{ overflowY: 'auto', flex: 1 }}>
            {(activeSeat ? modalGuests : unassigned.filter(g => `${g.firstName} ${g.lastName}`.toLowerCase().includes(searchLower))).length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--mid-gray)', fontSize: '0.78rem', padding: '1.5rem 0', fontFamily: 'Jost' }}>
                {!activeSeat && unassigned.length === 0 ? '🎉 All guests seated!' : 'No matches'}
              </p>
            ) : (
              (activeSeat ? modalGuests : unassigned.filter(g => `${g.firstName} ${g.lastName}`.toLowerCase().includes(searchLower))).map(g => {
                const isCurrentSeat = activeSeat && seating[activeSeat] === g.id;
                const isElsewhere = !isCurrentSeat && assignedIds.has(g.id);
                return (
                  <div
                    key={g.id}
                    onClick={() => activeSeat ? assignGuest(g.id) : undefined}
                    style={{
                      padding: '0.45rem 0.6rem',
                      borderBottom: '1px solid var(--light-gray)',
                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                      cursor: activeSeat ? 'pointer' : 'default',
                      background: isCurrentSeat ? '#FFF3E0' : 'transparent',
                      opacity: isElsewhere ? 0.4 : 1,
                      borderRadius: 4,
                    }}
                  >
                    <span style={{
                      width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                      background: SIDE_BG[g.side], border: `1px solid ${SIDE_BD[g.side]}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.5rem', fontFamily: 'Jost', fontWeight: 600,
                    }}>{g.side}</span>
                    <div style={{ fontSize: '0.78rem', fontFamily: 'Jost', lineHeight: 1.3 }}>
                      {g.firstName} {g.lastName}
                      {isElsewhere && <div style={{ fontSize: '0.62rem', color: 'var(--mid-gray)' }}>already seated</div>}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
