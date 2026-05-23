'use client';
import { useEffect, useState } from 'react';

interface DayCountdown {
  label: string;
  date: Date;
  emoji: string;
}

const events: DayCountdown[] = [
  { label: 'Welcome Dinner', date: new Date('2025-08-31T17:00:00'), emoji: '🥂' },
  { label: 'Wedding Day', date: new Date('2025-09-01T14:00:00'), emoji: '💍' },
  { label: 'Pool Party', date: new Date('2025-09-02T12:00:00'), emoji: '🌊' },
  { label: 'Checkout', date: new Date('2025-09-03T11:00:00'), emoji: '✈️' },
];

function getTimeLeft(target: Date) {
  const diff = target.getTime() - Date.now();
  if (diff <= 0) return null;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const secs = Math.floor((diff % (1000 * 60)) / 1000);
  return { days, hours, mins, secs };
}

export default function Countdown() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTick(x => x + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const nextEvent = events.find(e => e.date.getTime() > Date.now());
  if (!nextEvent) {
    return (
      <div style={{ textAlign: 'right' }}>
        <p className="font-display" style={{ color: 'var(--champagne)', fontSize: '1.4rem', fontStyle: 'italic' }}>
          Congratulations! 🎉
        </p>
      </div>
    );
  }

  const tl = getTimeLeft(nextEvent.date);
  if (!tl) return null;

  return (
    <div style={{
      textAlign: 'right',
      background: 'rgba(0,0,0,0.32)',
      backdropFilter: 'blur(6px)',
      borderRadius: 12,
      padding: '0.65rem 1rem',
      border: '1px solid rgba(255,255,255,0.12)',
    }}>
      <p className="font-sans-clean" style={{ color: 'var(--champagne)', fontSize: '0.58rem', letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
        {nextEvent.emoji} {nextEvent.label}
      </p>
      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
        {[
          { val: tl.days, unit: 'Days' },
          { val: tl.hours, unit: 'Hrs' },
          { val: tl.mins, unit: 'Min' },
          { val: tl.secs, unit: 'Sec' },
        ].map(({ val, unit }) => (
          <div key={unit} style={{ textAlign: 'center' }}>
            <div className="font-display" style={{ fontSize: '1.8rem', fontWeight: 300, color: 'white', lineHeight: 1 }}>
              {String(val).padStart(2, '0')}
            </div>
            <div className="font-sans-clean" style={{ fontSize: '0.52rem', color: 'rgba(255,255,255,0.6)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
              {unit}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
