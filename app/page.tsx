'use client';
import { useState, useEffect } from 'react';
import BudgetTab from '@/components/BudgetTab';
import GuestListTab from '@/components/GuestListTab';
import ChecklistTab from '@/components/ChecklistTab';
import TorontoTab from '@/components/TorontoTab';
import Countdown from '@/components/Countdown';

type Tab = 'budget' | 'guests' | 'checklist' | 'toronto';

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('budget');

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'budget', label: 'Budget', icon: '💰' },
    { id: 'guests', label: 'Guest List', icon: '🥂' },
    { id: 'checklist', label: 'Checklist', icon: '✓' },
    { id: 'toronto', label: 'Toronto Wedding', icon: '⛪' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
      {/* Header */}
      <header style={{
        background: 'var(--charcoal)',
        color: 'var(--cream)',
        padding: '2rem 2rem 0',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative line */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
          background: 'linear-gradient(90deg, var(--blush), var(--champagne), var(--sage), var(--champagne), var(--blush))'
        }} />

        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <p className="font-sans-clean" style={{ letterSpacing: '0.3em', fontSize: '0.65rem', color: 'var(--champagne)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                Wedding Planner
              </p>
              <h1 className="font-display" style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 300, lineHeight: 1.1, letterSpacing: '0.02em' }}>
                Jeff &amp; <span style={{ fontStyle: 'italic', color: 'var(--blush)' }}>Nat</span>
              </h1>
              <p className="font-sans-clean" style={{ color: 'var(--mid-gray)', fontSize: '0.8rem', marginTop: '0.3rem', letterSpacing: '0.15em' }}>
                AUG 31 – SEP 3, 2025
              </p>
            </div>
            <Countdown />
          </div>

          {/* Nav tabs */}
          <nav style={{ display: 'flex', gap: '0', marginTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="font-sans-clean"
                style={{
                  padding: '0.85rem 1.5rem',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.78rem',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: activeTab === tab.id ? 'var(--cream)' : 'var(--mid-gray)',
                  borderBottom: activeTab === tab.id ? '2px solid var(--champagne)' : '2px solid transparent',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '-1px',
                }}
              >
                <span style={{ fontSize: '0.9rem' }}>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Content */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
        <div className="animate-in">
          {activeTab === 'budget' && <BudgetTab />}
          {activeTab === 'guests' && <GuestListTab />}
          {activeTab === 'checklist' && <ChecklistTab />}
          {activeTab === 'toronto' && <TorontoTab />}
        </div>
      </main>
    </div>
  );
}
