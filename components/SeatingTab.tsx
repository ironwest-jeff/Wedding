'use client';
import { useState, useEffect } from 'react';
import { getGuests, syncGuests, getSeating, saveSeating, syncSeating } from '@/lib/store';
import { Guest } from '@/lib/types';

// ── Horizontal Serpentine — 3 arms, curves on alternating sides ───────────
const SEAT_W   = 32;   // px
const SEAT_H   = 26;
const COL_GAP  = 4;    // gap between seat columns
const TABLE_H  = 16;   // table strip height
const SEAT_VG  = 5;    // seat ↔ table vertical gap
const ARM_COLS = 17;   // seats per side per arm  (3 arms × 2 sides × 17 = 102 total)
const CURVE_W  = 42;   // horizontal radius of arc connectors
const ARM_VG   = 52;   // vertical gap between arms

const COL_STEP  = SEAT_W + COL_GAP;                           // 36
const ARM_PX_W  = ARM_COLS * COL_STEP - COL_GAP;             // 608
const ARM_H     = SEAT_H * 2 + SEAT_VG * 2 + TABLE_H;        // 78
const TABLE_TOP = SEAT_H + SEAT_VG;                           // 31  (table strip top within arm)
const ARM_STEP  = ARM_H + ARM_VG;                             // 130
const CURVE_H   = ARM_STEP + TABLE_H;                         // 146 (arc div height)
const CANVAS_W  = CURVE_W + ARM_PX_W + CURVE_W;              // 692
const CANVAS_H  = ARM_H * 3 + ARM_VG * 2;                    // 338
const ARM_LEFT  = CURVE_W;                                    // x offset of all arms

const TABLE_COLOR = '#8B7355';
const TOTAL_SEATS = ARM_COLS * 2 * 3;                         // 102

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

  // Renders seats for one arm. Arm B is reversed (right→left) for serpentine flow.
  function renderArm(letter: 'A' | 'B' | 'C', armIdx: number) {
    const armTop  = armIdx * ARM_STEP;
    const rev     = letter === 'B';
    return Array.from({ length: ARM_COLS }, (_, col) => {
      const dc   = rev ? ARM_COLS - 1 - col : col;
      const xPos = ARM_LEFT + dc * COL_STEP;
      return (
        <div key={`${letter}-${col}`}>
          <div style={{ position: 'absolute', left: xPos, top: armTop }}>
            <Seat sid={`${letter}-T-${col}`} />
          </div>
          <div style={{ position: 'absolute', left: xPos, top: armTop + TABLE_TOP + TABLE_H + SEAT_VG }}>
            <Seat sid={`${letter}-B-${col}`} />
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
          { label: 'Total Seats',     value: TOTAL_SEATS,              accent: 'var(--charcoal)' },
          { label: 'Assigned',        value: assignedCount,            accent: 'var(--deep-sage)' },
          { label: 'Empty Seats',     value: TOTAL_SEATS - assignedCount, accent: 'var(--dusty-rose)' },
          { label: 'Unseated Guests', value: unassigned.length,        accent: 'var(--champagne)' },
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
              {activeSeat ? 'Seat selected — pick a guest in the panel below' : 'Click any seat · then pick a guest below'}
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

              {/* Table strips */}
              {([0, 1, 2] as const).map(i => (
                <div key={i} style={{
                  position: 'absolute', left: ARM_LEFT,
                  top: i * ARM_STEP + TABLE_TOP,
                  width: ARM_PX_W, height: TABLE_H,
                  background: TABLE_COLOR, borderRadius: 4, opacity: 0.88,
                }} />
              ))}

              {/* Right arc — connects Arm A → Arm B */}
              <div style={{
                position: 'absolute',
                left: ARM_LEFT + ARM_PX_W,
                top: 0 * ARM_STEP + TABLE_TOP,
                width: CURVE_W, height: CURVE_H,
                borderRight: `${TABLE_H}px solid ${TABLE_COLOR}`,
                borderTop: `${TABLE_H}px solid ${TABLE_COLOR}`,
                borderBottom: `${TABLE_H}px solid ${TABLE_COLOR}`,
                borderLeft: 'none',
                borderRadius: `0 ${CURVE_W}px ${CURVE_W}px 0`,
                boxSizing: 'border-box', opacity: 0.88,
              }} />

              {/* Left arc — connects Arm B → Arm C */}
              <div style={{
                position: 'absolute',
                left: ARM_LEFT - CURVE_W,
                top: 1 * ARM_STEP + TABLE_TOP,
                width: CURVE_W, height: CURVE_H,
                borderLeft: `${TABLE_H}px solid ${TABLE_COLOR}`,
                borderTop: `${TABLE_H}px solid ${TABLE_COLOR}`,
                borderBottom: `${TABLE_H}px solid ${TABLE_COLOR}`,
                borderRight: 'none',
                borderRadius: `${CURVE_W}px 0 0 ${CURVE_W}px`,
                boxSizing: 'border-box', opacity: 0.88,
              }} />

              {/* Seats */}
              {renderArm('A', 0)}
              {renderArm('B', 1)}
              {renderArm('C', 2)}

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
