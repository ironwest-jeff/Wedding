'use client';
import { useState, useEffect } from 'react';
import BudgetTab from '@/components/BudgetTab';
import GuestListTab from '@/components/GuestListTab';
import ChecklistTab from '@/components/ChecklistTab';
import TorontoTab from '@/components/TorontoTab';
import VillaTab from '@/components/VillaTab';
import SeatingTab from '@/components/SeatingTab';
import Countdown from '@/components/Countdown';

type Tab = 'budget' | 'guests' | 'checklist' | 'toronto' | 'villa' | 'seating';

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('budget');

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'budget', label: 'Budget', icon: '💰' },
    { id: 'guests', label: 'Guest List', icon: '🥂' },
    { id: 'checklist', label: 'Checklist', icon: '✓' },
    { id: 'villa', label: 'Villa Rooms', icon: '🏡' },
    { id: 'seating', label: 'Seating', icon: '🪑' },
    { id: 'toronto', label: 'Toronto Wedding', icon: '⛪' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
      {/* Villa Hero Image Header */}
      <div style={{ position: 'relative', height: 'clamp(220px, 32vw, 340px)', overflow: 'hidden' }}>
        {/* Background photo */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'url(/villa-hero.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center 35%',
        }} />
        {/* Gradient overlay — darker at bottom for text */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(180deg, rgba(15,12,8,0.25) 0%, rgba(15,10,5,0.62) 100%)',
        }} />
        {/* Top decorative bar */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '3px', zIndex: 2,
          background: 'linear-gradient(90deg, var(--blush), var(--champagne), var(--sage), var(--champagne), var(--blush))',
        }} />
        {/* Countdown — top right */}
        <div style={{ position: 'absolute', top: '1.25rem', right: '2rem', zIndex: 2 }}>
          <Countdown />
        </div>
        {/* Centred title */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          textAlign: 'center', color: 'white',
          padding: '0 2rem',
        }}>
          <p className="font-sans-clean" style={{
            letterSpacing: '0.35em', fontSize: '0.58rem',
            color: 'var(--champagne)', textTransform: 'uppercase', marginBottom: '0.8rem',
          }}>
            Villa Valentini Bonaparte · Lazio, Italy
          </p>
          <h1 className="font-display" style={{
            fontSize: 'clamp(2.4rem, 6vw, 4.5rem)', fontWeight: 300,
            lineHeight: 1.05, letterSpacing: '0.03em',
            textShadow: '0 2px 24px rgba(0,0,0,0.45)',
          }}>
            Jeff &amp; <span style={{ fontStyle: 'italic', color: 'var(--blush)' }}>Nat</span>
          </h1>
          <p className="font-sans-clean" style={{
            fontSize: '0.72rem', marginTop: '0.6rem',
            letterSpacing: '0.22em', color: 'rgba(255,255,255,0.82)',
          }}>
            AUG 31 – SEP 3, 2026
          </p>
        </div>
      </div>

      {/* Sticky Nav Bar */}
      <nav style={{
        background: 'var(--charcoal)',
        position: 'sticky', top: 0, zIndex: 50,
        boxShadow: '0 2px 16px rgba(0,0,0,0.25)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem', display: 'flex', overflowX: 'auto' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="font-sans-clean"
              style={{
                padding: '0.85rem 1.4rem',
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '0.75rem', letterSpacing: '0.12em', textTransform: 'uppercase',
                color: activeTab === tab.id ? 'var(--cream)' : 'var(--mid-gray)',
                borderBottom: activeTab === tab.id ? '2px solid var(--champagne)' : '2px solid transparent',
                transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', gap: '0.45rem',
                whiteSpace: 'nowrap', flexShrink: 0,
              }}
            >
              <span style={{ fontSize: '0.85rem' }}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Content */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
        <div className="animate-in">
          {activeTab === 'budget' && <BudgetTab />}
          {activeTab === 'guests' && <GuestListTab />}
          {activeTab === 'checklist' && <ChecklistTab />}
          {activeTab === 'villa' && <VillaTab />}
          {activeTab === 'seating' && <SeatingTab />}
          {activeTab === 'toronto' && <TorontoTab />}
        </div>
      </main>
    </div>
  );
}
