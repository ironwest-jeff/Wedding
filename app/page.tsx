'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BudgetTab from '@/components/BudgetTab';
import GuestListTab from '@/components/GuestListTab';
import ChecklistTab from '@/components/ChecklistTab';
import TorontoTab from '@/components/TorontoTab';
import VillaTab from '@/components/VillaTab';
import SeatingTab from '@/components/SeatingTab';
import Countdown from '@/components/Countdown';
import { supabase } from '@/lib/supabase';
import { setWeddingId, migrateLegacyLocalStorage } from '@/lib/store';
import { Wedding } from '@/lib/types';
import MusicPlayer from '@/components/MusicPlayer';

type Tab = 'budget' | 'guests' | 'checklist' | 'toronto' | 'villa' | 'seating';

/** Format an ISO date string as "AUG 31" */
function fmtDate(d: string | null | undefined): string {
  if (!d) return '';
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
}

/** Returns "AUG 31 – SEP 2, 2026" style range */
function weddingDateRange(start: string | null, end: string | null): string {
  if (!start) return '';
  const year = new Date(start + 'T00:00:00').getFullYear();
  if (!end) return `${fmtDate(start)}, ${year}`;
  return `${fmtDate(start)} – ${fmtDate(end)}, ${year}`;
}

export default function Home() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('budget');
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        router.replace('/login');
        return;
      }

      setUserEmail(session.user.email ?? null);

      // Load this user's wedding record
      const { data: weddingData } = await supabase
        .from('weddings')
        .select('*')
        .eq('owner_id', session.user.id)
        .single();

      if (!weddingData) {
        // Account exists but wedding setup isn't complete — send to signup
        router.replace('/signup');
        return;
      }

      // Scope all data access to this wedding
      setWeddingId(weddingData.id);
      migrateLegacyLocalStorage();

      setWedding(weddingData as Wedding);
      setChecking(false);
    });
  }, [router]);

  async function signOut() {
    await supabase.auth.signOut();
    router.replace('/login');
  }

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'budget',    label: 'Budget',           icon: '💰' },
    { id: 'guests',    label: 'Guest List',        icon: '🥂' },
    { id: 'checklist', label: 'Checklist',         icon: '✓'  },
    { id: 'villa',     label: 'Villa Rooms',       icon: '🏡' },
    { id: 'seating',   label: 'Seating',           icon: '🪑' },
    { id: 'toronto',   label: 'Toronto Wedding',   icon: '⛪' },
  ];

  if (checking) return (
    <div style={{
      minHeight: '100vh', background: 'var(--cream)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <p className="font-sans-clean" style={{
        color: 'var(--mid-gray)', letterSpacing: '0.15em',
        textTransform: 'uppercase', fontSize: '0.7rem',
      }}>Loading…</p>
    </div>
  );

  // Derive display strings from wedding record
  const venueLine = [wedding?.venue_name, wedding?.venue_location]
    .filter(Boolean).join(' · ');
  const dateLine = weddingDateRange(
    wedding?.wedding_date ?? null,
    wedding?.wedding_end_date ?? null,
  );

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
        {/* Gradient overlay */}
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
        {/* Music player — bottom left of hero */}
        <div style={{ position: 'absolute', bottom: '1.25rem', left: '2rem', zIndex: 2 }}>
          <MusicPlayer />
        </div>
        {/* Sign out — top left */}
        <div style={{ position: 'absolute', top: '1.25rem', left: '2rem', zIndex: 2 }}>
          <button
            onClick={signOut}
            className="font-sans-clean"
            style={{
              background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.13)',
              borderRadius: 8, padding: '0.35rem 0.75rem',
              color: 'rgba(255,255,255,0.7)', fontSize: '0.55rem',
              letterSpacing: '0.15em', textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            Sign Out
          </button>
        </div>
        {/* Centred title */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          textAlign: 'center', color: 'white',
          padding: '0 2rem',
        }}>
          {venueLine && (
            <p className="font-sans-clean" style={{
              letterSpacing: '0.35em', fontSize: '0.58rem',
              color: 'var(--champagne)', textTransform: 'uppercase', marginBottom: '0.8rem',
            }}>
              {venueLine}
            </p>
          )}
          <h1 className="font-display" style={{
            fontSize: 'clamp(2.4rem, 6vw, 4.5rem)', fontWeight: 300,
            lineHeight: 1.05, letterSpacing: '0.03em',
            textShadow: '0 2px 24px rgba(0,0,0,0.45)',
          }}>
            {wedding?.partner1_name || 'Partner 1'} &amp;{' '}
            <span style={{ fontStyle: 'italic', color: 'var(--blush)' }}>
              {wedding?.partner2_name || 'Partner 2'}
            </span>
          </h1>
          {dateLine && (
            <p className="font-sans-clean" style={{
              fontSize: '0.72rem', marginTop: '0.6rem',
              letterSpacing: '0.22em', color: 'rgba(255,255,255,0.82)',
            }}>
              {dateLine}
            </p>
          )}
        </div>
      </div>

      {/* Sticky Nav Bar */}
      <nav style={{
        background: 'var(--charcoal)',
        position: 'sticky', top: 0, zIndex: 50,
        boxShadow: '0 2px 16px rgba(0,0,0,0.25)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem', display: 'flex', overflowX: 'auto', alignItems: 'center' }}>
          <div style={{ flex: 1, display: 'flex', overflowX: 'auto' }}>
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
          {userEmail && (
            <span className="font-sans-clean" style={{
              fontSize: '0.6rem', color: 'var(--mid-gray)',
              letterSpacing: '0.08em', flexShrink: 0, paddingLeft: '1rem',
              whiteSpace: 'nowrap',
            }}>
              {userEmail}
            </span>
          )}
        </div>
      </nav>

      {/* Content */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
        {activeTab === 'budget'    && <BudgetTab />}
        {activeTab === 'guests'    && <GuestListTab />}
        {activeTab === 'checklist' && <ChecklistTab />}
        {activeTab === 'villa'     && <VillaTab />}
        {activeTab === 'seating'   && <SeatingTab />}
        {activeTab === 'toronto'   && <TorontoTab />}
      </main>
    </div>
  );
}
