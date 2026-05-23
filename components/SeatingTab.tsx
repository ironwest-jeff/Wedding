'use client';
import { useState, useEffect } from 'react';
import { getGuests } from '@/lib/store';
import { Guest } from '@/lib/types';

// Serpentine: 2 arms, connected on the right
// Arm A (→): 27 top + 26 bottom = 53 seats
// Arm B (←): 27 top + 26 bottom = 53 seats
// Total: 106 seats ✓

const ARM_A_TOP = 27;
const ARM_A_BOT = 26;
const ARM_B_TOP = 27;
const ARM_B_BOT = 26;

const SEAT_W = 42;
const SEAT_H = 36;
const SEAT_GAP = 4;
const TABLE_H = 24;
const TABLE_COLOR = '#8B7355';
const ARM_GAP = 28;   // vertical gap between the two arms
const ARC_W = 64;     // width of the right-side arc connector

// Arm height = top seats + gap + table + gap + bottom seats
const ARM_H = SEAT_H + SEAT_GAP + TABLE_H + SEAT_GAP + SEAT_H;
// Total canvas height = 2 arms + gap between them
const CANVAS_H = ARM_H * 2 + ARM_GAP;
// Max seats per side in any arm
const MAX_PER_SIDE = Math.max(ARM_A_TOP, ARM_A_BOT, ARM_B_TOP, ARM_B_BOT);
// Canvas width = widest arm + arc
const CANVAS_W = MAX_PER_SIDE * (SEAT_W + SEAT_GAP) + ARC_W;

type SeatingMap = Record<string, string>;
function lsGet(): SeatingMap {
  if (typeof window === 'undefined') return {};
  try { return JSON.parse(localStorage.getItem('seating') || '{}'); } catch { return {}; }
}
function lsSave(s: SeatingMap) { localStorage.setItem('seating', JSON.stringify(s)); }

const SIDE_BG: Record<string, string> = { J: '#D6E8F5', N: '#F5D6E8', Both: '#D6F5DC' };
const SIDE_BD: Record<string, string> = { J: '#90B8D8', N: '#D890B8', Both: '#90D8A8' };

function makeIds(arm: 'A' | 'B', side: 'T' | 'B', count: number) {
  return Array.from({ length: count }, (_, i) => `${arm}-${side}-${i}`);
}

// Arm A (ltr): seats in natural order
const A_TOP = makeIds('A', 'T', ARM_A_TOP);
const A_BOT = makeIds('A', 'B', ARM_A_BOT);
// Arm B (rtl): seats displayed in reverse so they read right-to-left
// but seat IDs still start from 0 on the right (closer to connector)
const B_TOP_DISPLAY = makeIds('B', 'T', ARM_B_TOP).reverse();
const B_BOT_DISPLAY = makeIds('B', 'B', ARM_B_BOT).reverse();

const TOTAL_SEATS = ARM_A_TOP + ARM_A_BOT + ARM_B_TOP + ARM_B_BOT;

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
          fontSize: '0.5rem', fontFamily: 'Jost, sans-serif',
          color: g ? '#333' : '#C5C0B8',
          textAlign: 'center', lineHeight: 1.15, padding: '2px',
          transition: 'all 0.12s', userSelect: 'none', overflow: 'hidden',
        }}
      >
        {g ? g.firstName.slice(0, 7) : ''}
      </div>
    );
  }

  function SeatRow({ ids, justify }: { ids: string[]; justify?: 'left' | 'right' }) {
    return (
      <div style={{ display: 'flex', gap: SEAT_GAP, justifyContent: justify === 'right' ? 'flex-end' : 'flex-start' }}>
        {ids.map(sid => <Seat key={sid} sid={sid} />)}
      </div>
    );
  }

  function TableStrip({ width }: { width: number }) {
    return (
      <div style={{
        height: TABLE_H, background: TABLE_COLOR,
        borderRadius: 4, margin: `${SEAT_GAP}px 0`,
        width, opacity: 0.88,
      }} />
    );
  }

  const armAWidth = ARM_A_TOP * (SEAT_W + SEAT_GAP);
  const armBWidth = ARM_B_TOP * (SEAT_W + SEAT_GAP);

  const activeGuest = activeSeat ? guestMap[seating[activeSeat]] : null;

  return (
    <div>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Total Seats', value: TOTAL_SEATS, accent: 'var(--charcoal)' },
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

      {/* Table card */}
      <div style={{ ...card, padding: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div>
            <h2 className="font-display" style={{ fontSize: '1.3rem', fontWeight: 400 }}>Serpentine Table</h2>
            <p className="font-sans-clean" style={{ fontSize: '0.7rem', color: 'var(--mid-gray)', marginTop: '0.2rem' }}>
              Click any seat to assign · two arms connected on the right
            </p>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Legend */}
            <div style={{ display: 'flex', gap: '0.6rem', fontSize: '0.65rem', fontFamily: 'Jost', alignItems: 'center' }}>
              {(['J', 'N', 'Both'] as const).map(k => (
                <span key={k} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: 12, height: 12, background: SIDE_BG[k], border: `1px solid ${SIDE_BD[k]}`, borderRadius: 2, display: 'inline-block' }} />
                  {k === 'J' ? "Jeff's" : k === 'N' ? "Nat's" : 'Both'}
                </span>
              ))}
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: 12, height: 12, background: '#F0EDE7', border: '1px solid #DDD8D0', borderRadius: 2, display: 'inline-block' }} />
                Empty
              </span>
            </div>
            <button onClick={clearAll} style={{ padding: '0.4rem 0.8rem', background: 'var(--light-gray)', border: 'none', borderRadius: 6, cursor: 'pointer', fontFamily: 'Jost', fontSize: '0.72rem', color: 'var(--mid-gray)' }}>
              Clear All
            </button>
          </div>
        </div>

        {/* Arm labels */}
        <div style={{ display: 'flex', gap: '3rem', marginBottom: '0.4rem' }}>
          <span className="font-sans-clean" style={{ fontSize: '0.58rem', color: 'var(--mid-gray)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            Arm A →
          </span>
        </div>

        {/* Scrollable serpentine canvas */}
        <div style={{ overflowX: 'auto', paddingBottom: '0.5rem' }}>
          <div style={{ position: 'relative', width: CANVAS_W, height: CANVAS_H }}>

            {/* ── Arm A (top half, seats go left → right) ── */}
            <div style={{ position: 'absolute', top: 0, left: 0, width: armAWidth }}>
              <SeatRow ids={A_TOP} />
              <TableStrip width={armAWidth} />
              <SeatRow ids={A_BOT} />
            </div>

            {/* ── Arc connector (right side, spans full height) ── */}
            <div style={{
              position: 'absolute',
              right: 0,
              top: SEAT_H + SEAT_GAP,          // align with table strip top of Arm A
              height: CANVAS_H - (SEAT_H + SEAT_GAP) * 2,  // from Arm A table to Arm B table bottom
              width: ARC_W,
              background: TABLE_COLOR,
              borderRadius: `0 ${ARC_W * 1.2}px ${ARC_W * 1.2}px 0`,
              opacity: 0.82,
            }} />

            {/* ── Arm B label (positioned just above arm B) ── */}
            <div style={{
              position: 'absolute',
              top: ARM_H + ARM_GAP - 18,
              left: 0,
            }}>
              <span className="font-sans-clean" style={{ fontSize: '0.58rem', color: 'var(--mid-gray)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                ← Arm B
              </span>
            </div>

            {/* ── Arm B (bottom half, seats go right → left, right-justified) ── */}
            <div style={{
              position: 'absolute',
              top: ARM_H + ARM_GAP,
              right: ARC_W,   // right edge aligns with left edge of the arc
              width: armBWidth,
            }}>
              <SeatRow ids={B_TOP_DISPLAY} justify="right" />
              <TableStrip width={armBWidth} />
              <SeatRow ids={B_BOT_DISPLAY} justify="right" />
            </div>

          </div>
        </div>
      </div>

      {/* Guest list (compact, below table) */}
      <div style={{ ...card, padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h3 className="font-display" style={{ fontSize: '1.1rem', fontWeight: 400 }}>
            Unassigned Guests ({unassigned.length})
          </h3>
          <p className="font-sans-clean" style={{ fontSize: '0.7rem', color: 'var(--mid-gray)' }}>
            Click a seat above, then click a name below to assign
          </p>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
          {unassigned.map(g => (
            <div
              key={g.id}
              onClick={() => activeSeat ? assignGuest(g.id) : undefined}
              style={{
                padding: '0.3rem 0.65rem',
                background: SIDE_BG[g.side],
                border: `1px solid ${SIDE_BD[g.side]}`,
                borderRadius: 20,
                fontSize: '0.72rem',
                fontFamily: 'Jost',
                cursor: activeSeat ? 'pointer' : 'default',
                transition: 'opacity 0.1s',
                opacity: activeSeat ? 1 : 0.8,
                boxShadow: activeSeat ? '0 0 0 2px #C9A96E' : 'none',
              }}
            >
              {g.firstName} {g.lastName}
            </div>
          ))}
          {unassigned.length === 0 && (
            <p style={{ fontSize: '0.8rem', color: 'var(--mid-gray)', fontFamily: 'Jost' }}>
              🎉 All guests have been seated!
            </p>
          )}
        </div>
      </div>

      {/* ── Seat assignment modal ── */}
      {activeSeat && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
          onClick={() => setActiveSeat(null)}
        >
          <div
            style={{ background: 'white', borderRadius: 16, padding: '1.5rem', width: '100%', maxWidth: 420, maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <h3 className="font-display" style={{ fontSize: '1.3rem', fontWeight: 400 }}>
                  Seat {activeSeat}
                </h3>
                {activeGuest && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--mid-gray)', fontFamily: 'Jost', marginTop: '0.15rem' }}>
                    Currently: {activeGuest.firstName} {activeGuest.lastName}
                  </p>
                )}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {activeGuest && (
                  <button
                    onClick={() => unassignSeat(activeSeat)}
                    style={{ padding: '0.4rem 0.8rem', background: '#FEE2E2', color: '#B91C1C', border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: 'Jost', fontSize: '0.72rem' }}
                  >
                    Unassign
                  </button>
                )}
                <button
                  onClick={() => setActiveSeat(null)}
                  style={{ padding: '0.4rem 0.8rem', background: 'var(--light-gray)', border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: 'Jost', fontSize: '0.72rem' }}
                >
                  Cancel
                </button>
              </div>
            </div>

            {/* Search */}
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search guests…"
              autoFocus
              style={{
                padding: '0.55rem 0.8rem', border: '1px solid var(--light-gray)',
                borderRadius: 8, fontSize: '0.82rem', fontFamily: 'Jost',
                background: 'var(--warm-white)', outline: 'none', marginBottom: '0.6rem',
              }}
            />

            {/* Guest list */}
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {modalGuests.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--mid-gray)', fontSize: '0.8rem', padding: '1rem', fontFamily: 'Jost' }}>No matches</p>
              ) : (
                modalGuests.map(g => {
                  const isAssigned = assignedIds.has(g.id);
                  const isCurrentSeat = seating[activeSeat] === g.id;
                  return (
                    <div
                      key={g.id}
                      onClick={() => assignGuest(g.id)}
                      style={{
                        padding: '0.5rem 0.6rem',
                        borderBottom: '1px solid var(--light-gray)',
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        cursor: 'pointer',
                        background: isCurrentSeat ? '#FFF3E0' : 'transparent',
                        opacity: isAssigned && !isCurrentSeat ? 0.4 : 1,
                        borderRadius: 6,
                      }}
                    >
                      <span style={{
                        width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                        background: SIDE_BG[g.side], border: `1px solid ${SIDE_BD[g.side]}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.52rem', fontFamily: 'Jost', color: '#333', fontWeight: 600,
                      }}>
                        {g.side}
                      </span>
                      <div>
                        <div style={{ fontSize: '0.82rem', fontFamily: 'Jost' }}>{g.firstName} {g.lastName}</div>
                        {isAssigned && !isCurrentSeat && (
                          <div style={{ fontSize: '0.65rem', color: 'var(--mid-gray)', fontFamily: 'Jost' }}>already seated</div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
