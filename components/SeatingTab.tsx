'use client';
import { useState, useEffect } from 'react';
import { getGuests, syncGuests, getSeating, saveSeating, syncSeating } from '@/lib/store';
import { Guest } from '@/lib/types';

// ── Vertical Serpentine S — 3 vertical arms ──────────────────────────────────
// Path: ARM_A (right, top→bottom) → bottom arc (right) → ARM_B (middle, bottom→top)
//       → top arch (left) → ARM_C (left, top→bottom)
// Reads: starts top-right, ends bottom-left = letter S
// ─────────────────────────────────────────────────────────────────────────────
const SEAT_W    = 30;
const SEAT_H    = 26;
const ROW_GAP   = 4;
const TABLE_W   = 16;
const SEAT_HG   = 5;

const ARM_ROWS  = 17;
const ROW_STEP  = SEAT_H + ROW_GAP;                    // 30
const ARM_PX_H  = ARM_ROWS * ROW_STEP - ROW_GAP;       // 506
const ARM_W     = SEAT_W * 2 + SEAT_HG * 2 + TABLE_W; // 86
const TABLE_OX  = SEAT_W + SEAT_HG;                    // 35 (table x-offset within arm)
const R_SEAT_OX = SEAT_W + SEAT_HG + TABLE_W + SEAT_HG; // 56 (right-seat x-offset)

const ARC_H      = 50;
const ARC_PAD    = 16;
const ARM_TOP_Y  = ARC_PAD + ARC_H;                    // 66

const COL_SPACING = 176;
const ARM_C_X   = 10;
const ARM_B_X   = ARM_C_X + COL_SPACING;               // 186
const ARM_A_X   = ARM_B_X + COL_SPACING;               // 362

const CANVAS_W  = ARM_A_X + ARM_W + 10;                // 458
const CANVAS_H  = ARM_TOP_Y + ARM_PX_H + ARC_H + ARC_PAD; // 638
const TOTAL_SEATS = ARM_ROWS * 2 * 3;                  // 102

const TABLE_COLOR = '#8B7355';

// Top arch: C-top ↔ B-top (inverted U — opens downward)
// Left border = ARM_C table strip; right border = ARM_B table strip right edge
const ARCH_LEFT  = ARM_C_X + TABLE_OX;                 // 45
const ARCH_RIGHT = ARM_B_X + TABLE_OX + TABLE_W;       // 237
const ARCH_WIDTH = ARCH_RIGHT - ARCH_LEFT;              // 192
const ARCH_TOP   = ARC_PAD;                             // 16

// Bottom arc: B-bottom ↔ A-bottom (U-shape — opens upward)
const ARC_LEFT   = ARM_B_X + TABLE_OX;                 // 221
const ARC_RIGHT  = ARM_A_X + TABLE_OX + TABLE_W;       // 413
const ARC_WIDTH  = ARC_RIGHT - ARC_LEFT;               // 192
const ARC_TOP    = ARM_TOP_Y + ARM_PX_H;               // 572

type SeatingMap = Record<string, string>;
const SIDE_BG: Record<string, string> = { J: '#D6E8F5', N: '#F5D6E8', Both: '#D6F5DC' };
const SIDE_BD: Record<string, string> = { J: '#90B8D8', N: '#D890B8', Both: '#90D8A8' };

export default function SeatingTab() {
  const [guests, setGuests]         = useState<Guest[]>([]);
  const [seating, setSeating]       = useState<SeatingMap>({});
  const [activeSeat, setActiveSeat] = useState<string | null>(null);
  const [search, setSearch]         = useState('');

  useEffect(() => {
    const lg = getGuests(); const ls = getSeating();
    setGuests(lg); setSeating(ls);
    syncGuests(lg).then(f => setGuests(f));
    syncSeating(ls).then(f => setSeating(f));
  }, []);

  const guestMap      = Object.fromEntries(guests.map(g => [g.id, g]));
  const assignedIds   = new Set(Object.values(seating));
  const unassigned    = guests.filter(g => !assignedIds.has(g.id));
  const assignedCount = Object.keys(seating).length;
  const searchLower   = search.toLowerCase();

  function handleSeatClick(sid: string) { setActiveSeat(sid === activeSeat ? null : sid); setSearch(''); }

  function assignGuest(gid: string) {
    if (!activeSeat) return;
    const u = { ...seating };
    for (const s of Object.keys(u)) { if (u[s] === gid) delete u[s]; }
    u[activeSeat] = gid;
    setSeating(u); saveSeating(u); setActiveSeat(null);
  }

  function unassignSeat(sid: string) {
    const u = { ...seating }; delete u[sid];
    setSeating(u); saveSeating(u); setActiveSeat(null);
  }

  function clearAll() {
    if (!confirm('Clear all seating assignments?')) return;
    setSeating({}); saveSeating({}); setActiveSeat(null);
  }

  const card: React.CSSProperties = {
    background: 'white', borderRadius: 12,
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
    border: '1px solid var(--light-gray)',
  };

  function Seat({ sid }: { sid: string }) {
    const gid = seating[sid];
    const g   = gid ? guestMap[gid] : undefined;
    const active = activeSeat === sid;
    return (
      <div
        onClick={() => handleSeatClick(sid)}
        title={g ? `${g.firstName} ${g.lastName}` : 'Click to assign'}
        style={{
          width: SEAT_W, height: SEAT_H,
          background: active ? '#C9A96E' : g ? SIDE_BG[g.side] : '#F0EDE7',
          border: `2px solid ${active ? '#B08A50' : g ? SIDE_BD[g.side] : '#DDD8D0'}`,
          borderRadius: 5, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.42rem', fontFamily: 'Jost',
          color: g ? '#333' : '#C5C0B8',
          textAlign: 'center', lineHeight: 1.1, padding: '2px',
          transition: 'all 0.12s', userSelect: 'none', overflow: 'hidden',
        }}
      >
        {g ? g.firstName.slice(0, 5) : ''}
      </div>
    );
  }

  // ARM_B is reversed (bottom→top) so the serpentine S flows correctly
  function renderArm(letter: 'A' | 'B' | 'C') {
    const armX = letter === 'A' ? ARM_A_X : letter === 'B' ? ARM_B_X : ARM_C_X;
    const rev  = letter === 'B';
    return Array.from({ length: ARM_ROWS }, (_, row) => {
      const displayRow = rev ? ARM_ROWS - 1 - row : row;
      const yPos = ARM_TOP_Y + displayRow * ROW_STEP;
      return (
        <div key={`${letter}-${row}`}>
          <div style={{ position: 'absolute', left: armX, top: yPos }}>
            <Seat sid={`${letter}-L-${row}`} />
          </div>
          <div style={{ position: 'absolute', left: armX + R_SEAT_OX, top: yPos }}>
            <Seat sid={`${letter}-R-${row}`} />
          </div>
        </div>
      );
    });
  }

  const activeGuest = activeSeat ? guestMap[seating[activeSeat]] : null;
  const displayGuests = (activeSeat ? guests : unassigned)
    .filter(g => `${g.firstName} ${g.lastName}`.toLowerCase().includes(searchLower));

  return (
    <div>

      {/* ── Stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Total Seats',     value: TOTAL_SEATS,                accent: 'var(--charcoal)' },
          { label: 'Assigned',        value: assignedCount,              accent: 'var(--deep-sage)' },
          { label: 'Empty Seats',     value: TOTAL_SEATS - assignedCount, accent: 'var(--dusty-rose)' },
          { label: 'Unseated Guests', value: unassigned.length,          accent: 'var(--champagne)' },
        ].map(s => (
          <div key={s.label} style={{ ...card, padding: '1rem' }}>
            <p className="font-sans-clean" style={{ fontSize: '0.62rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--mid-gray)', marginBottom: '0.4rem' }}>{s.label}</p>
            <p className="font-display" style={{ fontSize: '1.6rem', fontWeight: 400, color: s.accent }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── Table ── */}
      <div style={{ ...card, padding: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h2 className="font-display" style={{ fontSize: '1.3rem', fontWeight: 400 }}>Serpentine Table</h2>
            <p className="font-sans-clean" style={{ fontSize: '0.7rem', color: 'var(--mid-gray)', marginTop: '0.15rem' }}>
              {activeSeat ? 'Seat selected — pick a guest below' : 'Click any seat · then pick a guest below'}
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

        {/* Serpentine canvas — centered, horizontally scrollable on small screens */}
        <div style={{ overflowX: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'center', minWidth: CANVAS_W }}>
            <div style={{ position: 'relative', width: CANVAS_W, height: CANVAS_H, flexShrink: 0 }}>

              {/* Table strips (one per arm) */}
              {[ARM_C_X, ARM_B_X, ARM_A_X].map(ax => (
                <div key={ax} style={{
                  position: 'absolute',
                  left: ax + TABLE_OX, top: ARM_TOP_Y,
                  width: TABLE_W, height: ARM_PX_H,
                  background: TABLE_COLOR, borderRadius: 4, opacity: 0.88,
                }} />
              ))}

              {/* Top arch: C-top ↔ B-top (inverted U, opens downward) */}
              <div style={{
                position: 'absolute',
                left: ARCH_LEFT, top: ARCH_TOP,
                width: ARCH_WIDTH, height: ARC_H,
                borderTop:   `${TABLE_W}px solid ${TABLE_COLOR}`,
                borderLeft:  `${TABLE_W}px solid ${TABLE_COLOR}`,
                borderRight: `${TABLE_W}px solid ${TABLE_COLOR}`,
                borderBottom: 'none',
                borderRadius: `${ARC_H}px ${ARC_H}px 0 0`,
                boxSizing: 'border-box', opacity: 0.88,
              }} />

              {/* Bottom arc: B-bottom ↔ A-bottom (U-shape, opens upward) */}
              <div style={{
                position: 'absolute',
                left: ARC_LEFT, top: ARC_TOP,
                width: ARC_WIDTH, height: ARC_H,
                borderBottom: `${TABLE_W}px solid ${TABLE_COLOR}`,
                borderLeft:   `${TABLE_W}px solid ${TABLE_COLOR}`,
                borderRight:  `${TABLE_W}px solid ${TABLE_COLOR}`,
                borderTop: 'none',
                borderRadius: `0 0 ${ARC_H}px ${ARC_H}px`,
                boxSizing: 'border-box', opacity: 0.88,
              }} />

              {/* Seats — A (right, ↓), B (middle, ↑ reversed), C (left, ↓) */}
              {renderArm('A')}
              {renderArm('B')}
              {renderArm('C')}

            </div>
          </div>
        </div>
      </div>

      {/* ── Guest panel — below the table ── */}
      <div style={{ ...card, padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h3 className="font-display" style={{ fontSize: '1.1rem', fontWeight: 400 }}>
            {activeSeat ? 'Assign a guest to the selected seat' : `Unassigned Guests (${unassigned.length})`}
          </h3>
          {activeSeat && (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {activeGuest && (
                <button onClick={() => unassignSeat(activeSeat)} style={{ padding: '0.35rem 0.75rem', background: '#FEE2E2', color: '#B91C1C', border: 'none', borderRadius: 6, cursor: 'pointer', fontFamily: 'Jost', fontSize: '0.7rem' }}>
                  Unassign
                </button>
              )}
              <button onClick={() => setActiveSeat(null)} style={{ padding: '0.35rem 0.75rem', background: 'var(--light-gray)', border: 'none', borderRadius: 6, cursor: 'pointer', fontFamily: 'Jost', fontSize: '0.7rem' }}>
                Cancel
              </button>
            </div>
          )}
        </div>

        {activeSeat && activeGuest && (
          <p className="font-sans-clean" style={{ fontSize: '0.68rem', color: 'var(--mid-gray)', marginBottom: '0.5rem' }}>
            Currently: {activeGuest.firstName} {activeGuest.lastName}
          </p>
        )}

        <input
          type="text" value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={activeSeat ? 'Search all guests…' : 'Search unassigned guests…'}
          style={{
            padding: '0.5rem 0.75rem', border: '1px solid var(--light-gray)',
            borderRadius: 8, fontSize: '0.8rem', fontFamily: 'Jost',
            background: 'var(--warm-white)', outline: 'none',
            marginBottom: '0.75rem', width: '100%', boxSizing: 'border-box',
          }}
        />

        {displayGuests.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--mid-gray)', fontSize: '0.78rem', padding: '1.5rem 0', fontFamily: 'Jost' }}>
            {!activeSeat && unassigned.length === 0 ? '🎉 All guests seated!' : 'No matches'}
          </p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '0.4rem' }}>
            {displayGuests.map(g => {
              const isCurrent   = !!(activeSeat && seating[activeSeat] === g.id);
              const isElsewhere = !isCurrent && assignedIds.has(g.id);
              return (
                <div
                  key={g.id}
                  onClick={() => activeSeat ? assignGuest(g.id) : undefined}
                  style={{
                    padding: '0.45rem 0.6rem',
                    border: `1px solid ${isCurrent ? '#C9A96E' : 'var(--light-gray)'}`,
                    borderRadius: 8,
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    cursor: activeSeat ? 'pointer' : 'default',
                    background: isCurrent ? '#FFF3E0' : 'white',
                    opacity: isElsewhere ? 0.45 : 1,
                    transition: 'background 0.1s',
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
                    {isElsewhere && <div style={{ fontSize: '0.6rem', color: 'var(--mid-gray)' }}>seated elsewhere</div>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
