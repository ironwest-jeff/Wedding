'use client';
import { useEffect, useState } from 'react';

const EVENTS = [
  {
    label: 'Toronto',
    subtitle: 'Jul 11, 2025',
    date: new Date('2025-07-11T18:00:00'),
    emoji: '🍁',
    doneLabel: 'Toronto ✓',
  },
  {
    label: 'Italy',
    subtitle: 'Aug 31, 2025',
    date: new Date('2025-08-31T17:00:00'),
    emoji: '🇮🇹',
    doneLabel: 'Italy ✓',
  },
];

function getTimeLeft(target: Date) {
  const diff = target.getTime() - Date.now();
  if (diff <= 0) return null;
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    mins: Math.floor((diff % 3600000) / 60000),
    secs: Math.floor((diff % 60000) / 1000),
  };
}

export default function Countdown() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTick(x => x + 1), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
      {EVENTS.map(ev => {
        const tl = getTimeLeft(ev.date);
        return (
          <div
            key={ev.label}
            style={{
              background: 'rgba(0,0,0,0.35)',
              backdropFilter: 'blur(8px)',
              borderRadius: 12,
              padding: '0.6rem 0.9rem',
              border: '1px solid rgba(255,255,255,0.13)',
              textAlign: 'center',
              minWidth: 130,
            }}
          >
            <p className="font-sans-clean" style={{
              color: 'var(--champagne)',
              fontSize: '0.56rem',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              marginBottom: '0.15rem',
            }}>
              {ev.emoji} {ev.label}
            </p>
            <p className="font-sans-clean" style={{
              color: 'rgba(255,255,255,0.5)',
              fontSize: '0.5rem',
              letterSpacing: '0.1em',
              marginBottom: '0.4rem',
            }}>
              {ev.subtitle}
            </p>

            {tl ? (
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                {[
                  { val: tl.days, unit: 'D' },
                  { val: tl.hours, unit: 'H' },
                  { val: tl.mins, unit: 'M' },
                  { val: tl.secs, unit: 'S' },
                ].map(({ val, unit }) => (
                  <div key={unit} style={{ textAlign: 'center' }}>
                    <div className="font-display" style={{
                      fontSize: '1.55rem', fontWeight: 300,
                      color: 'white', lineHeight: 1,
                    }}>
                      {String(val).padStart(2, '0')}
                    </div>
                    <div className="font-sans-clean" style={{
                      fontSize: '0.46rem', color: 'rgba(255,255,255,0.55)',
                      letterSpacing: '0.12em', textTransform: 'uppercase',
                    }}>
                      {unit}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="font-display" style={{
                color: 'var(--champagne)', fontSize: '1rem',
                fontStyle: 'italic', marginTop: '0.25rem',
              }}>
                {ev.doneLabel} 🎉
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
