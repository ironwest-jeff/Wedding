'use client';
import { useState, useEffect } from 'react';
import { getGuests, syncGuests, getSeating, saveSeating, syncSeating } from '@/lib/store';
import { Guest } from '@/lib/types';

// ── Two horizontal C-shaped tables stacked vertically ─────────────────────────
//
//  TOP TABLE (⊃) — arc on LEFT, opens RIGHT
//
//  ╔══ ○○○○○○○○○○○○○○○○○  (Arm A — upper row)
//  ║   ═══════════════════  (table strip)
//  ║   ○○○○○○○○○○○○○○○○○  (Arm A — lower row)
//  ║
//  ║   ○○○○○○○○○○○○○○○○○  (Arm B — upper row)
//  ║   ═══════════════════  (table strip)
//  ╚══ ○○○○○○○○○○○○○○○○○  (Arm B — lower row)
//
//  BOTTOM TABLE (⊂) — arc on RIGHT, opens LEFT
//
//  ○○○○○○○○○○○○○○○○○ ══╗  (Arm C — upper row)
//  ═══════════════════   ║
//  ○○○○○○○○○○○○○○○○○ ══╣  (Arm C — lower row)
//                        ║
//  ○○○○○○○○○○○○○○○○○ ══╣  (Arm D — upper row)
//  ═══════════════════   ║
//  ○○○○○○○○○○○○○○○○○ ══╝  (Arm D — lower row)
//
// ─────────────────────────────────────────────────────────────────────────────

const SEAT_W  = 26;
const SEAT_H  = 26;
const N_COLS  = 17;   // seat columns per arm
const COL_STEP = 30;  // horizontal step between columns
const GAP_ST  = 4;    // gap between seat row and table strip edge
const TABLE_H = 14;   // table strip height

const ARM_W_PX = (N_COLS - 1) * COL_STEP + SEAT_W;   // 506
const B_ROW_OY = SEAT_H + GAP_ST + TABLE_H + GAP_ST;  // 48  (y-offset: top row → bottom row)
const ARM_H_PX = B_ROW_OY + SEAT_H;                   // 74  (total arm height)

const ARC_DEPTH  = 50;   // horizontal width of the side arc connector
const ARC_RADIUS = 40;   // border-radius for arc corners
const INNER_GAP  = 80;   // vertical gap between arm A and arm B (interior of each C)
const L_MARGIN   = 16;
const T_MARGIN   = 48;
const TABLE_GAP  = 68;   // vertical gap between the two C tables

// ── Top C (⊃): left arc, arms extend right ───────────────────────────────────
const C1_ARM_X = L_MARGIN + ARC_DEPTH;            // 66  — arms start after arc
const C1_A_Y   = T_MARGIN;                         // 48  — arm A (upper)
const C1_B_Y   = C1_A_Y + ARM_H_PX + INNER_GAP;  // 202 — arm B (lower)
// Arc spans from arm A's table strip down to arm B's table strip
const C1_ARC_X = L_MARGIN;                         // 16
const C1_ARC_Y = C1_A_Y + SEAT_H + GAP_ST;        // 78
const C1_ARC_H = (C1_B_Y + SEAT_H + GAP_ST + TABLE_H) - C1_ARC_Y; // 168

// ── Bottom C (⊂): right arc, arms extend left ────────────────────────────────
const C2_ARM_X = L_MARGIN;                                   // 16
const C2_C_Y   = C1_B_Y + ARM_H_PX + TABLE_GAP;             // 344 — arm C (upper)
const C2_D_Y   = C2_C_Y + ARM_H_PX + INNER_GAP;             // 498 — arm D (lower)
const C2_ARC_X = L_MARGIN + ARM_W_PX;                        // 522
const C2_ARC_Y = C2_C_Y + SEAT_H + GAP_ST;                  // 374
const C2_ARC_H = (C2_D_Y + SEAT_H + GAP_ST + TABLE_H) - C2_ARC_Y; // 168

const CANVAS_W    = L_MARGIN + ARC_DEPTH + ARM_W_PX + L_MARGIN; // 588
const CANVAS_H    = C2_D_Y + ARM_H_PX + 28;                      // 600
const TOTAL_SEATS = N_COLS * 2 * 4;                               // 136

const TABLE_COLOR = '#8B7355';

const ARM_CFG = {
  A: { x: C1_ARM_X, y: C1_A_Y },
  B: { x: C1_ARM_X, y: C1_B_Y },
  C: { x: C2_ARM_X, y: C2_C_Y },
  D: { x: C2_ARM_X, y: C2_D_Y },
} as const;

type SeatingMap = Record<string, string>;
const SIDE_BG: Record<string, string> = { J: '#D6E8F5', N: '#F5D6E8', Both: '#D6F5DC' };
const SIDE_BD: Record<string, string> = { J: '#90B8D8', N: '#D890B8', Both: '#90D8A8' };

export default function SeatingTab() {
  const [guests,     setGuests]     = useState<Guest[]>([]);
  const [seating,    setSeating]    = useState<SeatingMap>({});
  const [activeSeat, setActiveSeat] = useState<string | null>(null);
  const [search,     setSearch]     = useState('');

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
    const gid  = seating[sid];
    const g    = gid ? guestMap[gid] : undefined;
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
          fontSize: '0.4rem', fontFamily: 'Jost',
          color: g ? '#333' : '#C5C0B8',
          textAlign: 'center', lineHeight: 1.1, padding: '2px',
          transition: 'all 0.12s', userSelect: 'none', overflow: 'hidden',
        }}
      >
        {g ? g.firstName.slice(0, 5) : ''}
      </div>
    );
  }

  // Each arm: N_COLS columns × 2 rows (top + bottom) of seats
  function renderArm(arm: 'A' | 'B' | 'C' | 'D') {
    const { x: ax, y: ay } = ARM_CFG[arm];
    return Array.from({ length: N_COLS }, (_, col) => (
      <div key={`${arm}-${col}`}>
        {/* Top row */}
        <div style={{ position: 'absolute', left: ax + col * COL_STEP, top: ay }}>
          <Seat sid={`${arm}-T-${col}`} />
        </div>
        {/* Bottom row */}
        <div style={{ position: 'absolute', left: ax + col * COL_STEP, top: ay + B_ROW_OY }}>
          <Seat sid={`${arm}-B-${col}`} />
        </div>
      </div>
    ));
  }

  const activeGuest   = activeSeat ? guestMap[seating[activeSeat]] : null;
  const displayGuests = (activeSeat ? guests : unassigned)
    .filter(g => `${g.firstName} ${g.lastName}`.toLowerCase().includes(searchLower));

  return (
    <div>

      {/* ── Stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Total Seats',     value: TOTAL_SEATS,                 accent: 'var(--charcoal)'   },
          { label: 'Assigned',        value: assignedCount,               accent: 'var(--deep-sage)'  },
          { label: 'Empty Seats',     value: TOTAL_SEATS - assignedCount, accent: 'var(--dusty-rose)' },
          { label: 'Unseated Guests', value: unassigned.length,           accent: 'var(--champagne)'  },
        ].map(s => (
          <div key={s.label} style={{ ...card, padding: '1rem' }}>
            <p className="font-sans-clean" style={{ fontSize: '0.62rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--mid-gray)', marginBottom: '0.4rem' }}>{s.label}</p>
            <p className="font-display" style={{ fontSize: '1.6rem', fontWeight: 400, color: s.accent }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── Table canvas ── */}
      <div style={{ ...card, padding: '1.5rem', marginBottom: '1.5rem' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h2 className="font-display" style={{ fontSize: '1.3rem', fontWeight: 400 }}>Serpentine Table</h2>
            <p className="font-sans-clean" style={{ fontSize: '0.7rem', color: 'var(--mid-gray)', marginTop: '0.15rem' }}>
              Two C-shaped sections · {activeSeat ? 'seat selected — pick a guest below' : 'click any seat · then pick a guest below'}
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

        {/* Canvas */}
        <div style={{ overflowX: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'center', minWidth: CANVAS_W }}>
            <div style={{ position: 'relative', width: CANVAS_W, height: CANVAS_H, flexShrink: 0 }}>

              {/* ── Table labels ── */}
              <div style={{
                position: 'absolute',
                top: C1_A_Y - 24,
                left: C1_ARM_X + ARM_W_PX / 2,
                transform: 'translateX(-50%)',
                fontFamily: 'Jost', fontSize: '0.58rem', letterSpacing: '0.12em',
                textTransform: 'uppercase', color: 'var(--mid-gray)', whiteSpace: 'nowrap',
              }}>Top Table ⊃</div>

              <div style={{
                position: 'absolute',
                top: C2_C_Y - 24,
                left: C2_ARM_X + ARM_W_PX / 2,
                transform: 'translateX(-50%)',
                fontFamily: 'Jost', fontSize: '0.58rem', letterSpacing: '0.12em',
                textTransform: 'uppercase', color: 'var(--mid-gray)', whiteSpace: 'nowrap',
              }}>Bottom Table ⊂</div>

              {/* ── Table strips (one per arm) ── */}
              {(['A', 'B', 'C', 'D'] as const).map(arm => {
                const { x, y } = ARM_CFG[arm];
                return (
                  <div key={`strip-${arm}`} style={{
                    position: 'absolute',
                    left: x,
                    top: y + SEAT_H + GAP_ST,
                    width: ARM_W_PX,
                    height: TABLE_H,
                    background: TABLE_COLOR,
                    borderRadius: 4,
                    opacity: 0.88,
                  }} />
                );
              })}

              {/* ── Top C left arc (⊃) ── */}
              <div style={{
                position: 'absolute',
                left: C1_ARC_X,
                top: C1_ARC_Y,
                width: ARC_DEPTH,
                height: C1_ARC_H,
                borderTop:    `${TABLE_H}px solid ${TABLE_COLOR}`,
                borderLeft:   `${TABLE_H}px solid ${TABLE_COLOR}`,
                borderBottom: `${TABLE_H}px solid ${TABLE_COLOR}`,
                borderRight: 'none',
                borderRadius: `${ARC_RADIUS}px 0 0 ${ARC_RADIUS}px`,
                boxSizing: 'border-box',
                opacity: 0.88,
              }} />

              {/* ── Bottom C right arc (⊂) ── */}
              <div style={{
                position: 'absolute',
                left: C2_ARC_X,
                top: C2_ARC_Y,
                width: ARC_DEPTH,
                height: C2_ARC_H,
                borderTop:    `${TABLE_H}px solid ${TABLE_COLOR}`,
                borderRight:  `${TABLE_H}px solid ${TABLE_COLOR}`,
                borderBottom: `${TABLE_H}px solid ${TABLE_COLOR}`,
                borderLeft: 'none',
                borderRadius: `0 ${ARC_RADIUS}px ${ARC_RADIUS}px 0`,
                boxSizing: 'border-box',
                opacity: 0.88,
              }} />

              {/* ── Seats ── */}
              {renderArm('A')}
              {renderArm('B')}
              {renderArm('C')}
              {renderArm('D')}

            </div>
          </div>
        </div>
      </div>

      {/* ── Guest panel ── */}
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
