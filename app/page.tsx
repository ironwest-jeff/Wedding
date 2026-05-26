'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import BudgetTab from '@/components/BudgetTab';
import GuestListTab from '@/components/GuestListTab';
import ChecklistTab from '@/components/ChecklistTab';
import TorontoTab from '@/components/TorontoTab';
import VillaTab from '@/components/VillaTab';
import SeatingTab from '@/components/SeatingTab';
import GuestSiteTab from '@/components/GuestSiteTab';
import Countdown from '@/components/Countdown';
import { supabase } from '@/lib/supabase';
import { setWeddingId, migrateLegacyLocalStorage } from '@/lib/store';
import { Wedding } from '@/lib/types';
import MusicPlayer from '@/components/MusicPlayer';

type Tab = 'budget' | 'guests' | 'checklist' | 'toronto' | 'villa' | 'seating' | 'guestsite';

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

// ── Members Modal ─────────────────────────────────────────────────────────────

function MembersModal({
  weddingId,
  members,
  onClose,
  onSaved,
}: {
  weddingId: string;
  members: string[];
  onClose: () => void;
  onSaved: (emails: string[]) => void;
}) {
  const [list, setList] = useState<string[]>(members);
  const [input, setInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  function addEmail() {
    const email = input.trim().toLowerCase();
    if (!email) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErr('Please enter a valid email address.');
      return;
    }
    if (list.includes(email)) {
      setErr('That email is already in the list.');
      return;
    }
    setErr('');
    setList(prev => [...prev, email]);
    setInput('');
  }

  function removeEmail(email: string) {
    setList(prev => prev.filter(e => e !== email));
  }

  async function save() {
    setSaving(true);
    setErr('');
    const { error } = await supabase
      .from('weddings')
      .update({ member_emails: list })
      .eq('id', weddingId);
    setSaving(false);
    if (error) { setErr(error.message); return; }
    onSaved(list);
    onClose();
  }

  const overlay: React.CSSProperties = {
    position: 'fixed', inset: 0, zIndex: 1000,
    background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem',
  };

  const modal: React.CSSProperties = {
    background: 'white', borderRadius: 16, padding: '2rem',
    maxWidth: 480, width: '100%',
    boxShadow: '0 8px 60px rgba(0,0,0,0.25)',
  };

  const inputStyle: React.CSSProperties = {
    flex: 1, padding: '0.65rem 0.9rem',
    border: '1.5px solid var(--light-gray)',
    borderRadius: 8, fontSize: '0.85rem',
    outline: 'none', color: 'var(--charcoal)',
    fontFamily: 'inherit', background: 'white',
  };

  return (
    <div style={overlay} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={modal}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <div>
            <h2 className="font-display" style={{ fontSize: '1.5rem', fontWeight: 300, color: 'var(--charcoal)', marginBottom: '0.2rem' }}>
              Manage <span style={{ fontStyle: 'italic', color: 'var(--blush)' }}>Access</span>
            </h2>
            <p className="font-sans-clean" style={{ fontSize: '0.65rem', color: 'var(--mid-gray)', letterSpacing: '0.05em' }}>
              Add email addresses for people who should access this wedding dashboard.
            </p>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '1.2rem', color: 'var(--mid-gray)', padding: '0 0 0 1rem',
          }}>✕</button>
        </div>

        {/* Add email row */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <input
            ref={inputRef}
            type="email"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addEmail(); }}}
            placeholder="email@example.com"
            className="font-sans-clean"
            style={inputStyle}
          />
          <button
            onClick={addEmail}
            className="font-sans-clean"
            style={{
              padding: '0.65rem 1rem',
              background: 'var(--charcoal)', color: 'white',
              border: 'none', borderRadius: 8, cursor: 'pointer',
              fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase',
              whiteSpace: 'nowrap',
            }}
          >
            Add
          </button>
        </div>

        {err && (
          <p className="font-sans-clean" style={{
            fontSize: '0.7rem', color: '#721C24',
            background: '#F8D7DA', padding: '0.4rem 0.7rem',
            borderRadius: 6, marginBottom: '0.75rem',
          }}>{err}</p>
        )}

        {/* Member list */}
        <div style={{ minHeight: 40, marginBottom: '1.5rem' }}>
          {list.length === 0 ? (
            <p className="font-sans-clean" style={{ fontSize: '0.72rem', color: 'var(--mid-gray)', fontStyle: 'italic' }}>
              No members yet — only the account owner can access this wedding.
            </p>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {list.map(email => (
                <li key={email} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  background: 'var(--cream)', borderRadius: 8,
                  padding: '0.5rem 0.85rem',
                }}>
                  <span className="font-sans-clean" style={{ fontSize: '0.78rem', color: 'var(--charcoal)' }}>
                    {email}
                  </span>
                  <button
                    onClick={() => removeEmail(email)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      fontSize: '0.75rem', color: 'var(--mid-gray)',
                      padding: '0 0 0 0.75rem',
                    }}
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="font-sans-clean" style={{
            background: 'none', border: '1.5px solid var(--light-gray)',
            borderRadius: 8, padding: '0.6rem 1.25rem',
            fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase',
            cursor: 'pointer', color: 'var(--charcoal)',
          }}>
            Cancel
          </button>
          <button onClick={save} disabled={saving} className="font-sans-clean" style={{
            background: saving ? 'var(--mid-gray)' : 'var(--charcoal)',
            color: 'white', border: 'none', borderRadius: 8,
            padding: '0.6rem 1.5rem',
            fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase',
            cursor: saving ? 'default' : 'pointer',
          }}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function Home() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('budget');
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [checking, setChecking] = useState(true);
  const [showMembers, setShowMembers] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        router.replace('/login');
        return;
      }

      const email = session.user.email ?? null;
      setUserEmail(email);

      // 1. Try as owner
      const { data: owned } = await supabase
        .from('weddings')
        .select('*')
        .eq('owner_id', session.user.id)
        .maybeSingle();

      if (owned) {
        setWeddingId(owned.id);
        migrateLegacyLocalStorage();
        setWedding(owned as Wedding);
        setIsOwner(true);
        setChecking(false);
        return;
      }

      // 2. Try as member (someone shared the wedding with this email)
      if (email) {
        const { data: membered } = await supabase
          .from('weddings')
          .select('*')
          .contains('member_emails', [email])
          .maybeSingle();

        if (membered) {
          setWeddingId(membered.id);
          migrateLegacyLocalStorage();
          setWedding(membered as Wedding);
          setIsOwner(false);
          setChecking(false);
          return;
        }
      }

      // No wedding found at all — go to signup to set one up
      router.replace('/signup');
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
    { id: 'guestsite', label: 'Guest Site',        icon: '🌐' },
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

  const venueLine = [wedding?.venue_name, wedding?.venue_location]
    .filter(Boolean).join(' · ');
  const dateLine = weddingDateRange(
    wedding?.wedding_date ?? null,
    wedding?.wedding_end_date ?? null,
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
      {/* Members Modal */}
      {showMembers && wedding && (
        <MembersModal
          weddingId={wedding.id}
          members={wedding.member_emails ?? []}
          onClose={() => setShowMembers(false)}
          onSaved={emails => setWedding(w => w ? { ...w, member_emails: emails } : w)}
        />
      )}

      {/* Villa Hero Image Header */}
      <div style={{ position: 'relative', height: 'clamp(220px, 32vw, 340px)', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'url(/villa-hero.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center 35%',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(180deg, rgba(15,12,8,0.25) 0%, rgba(15,10,5,0.62) 100%)',
        }} />
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '3px', zIndex: 2,
          background: 'linear-gradient(90deg, var(--blush), var(--champagne), var(--sage), var(--champagne), var(--blush))',
        }} />
        {/* Countdown — top right */}
        <div style={{ position: 'absolute', top: '1.25rem', right: '2rem', zIndex: 2 }}>
          <Countdown />
        </div>
        {/* Music player — bottom left */}
        <div style={{ position: 'absolute', bottom: '1.25rem', left: '2rem', zIndex: 2 }}>
          <MusicPlayer />
        </div>
        {/* Top-left buttons: Sign Out + Members (owner only) */}
        <div style={{ position: 'absolute', top: '1.25rem', left: '2rem', zIndex: 2, display: 'flex', gap: '0.5rem' }}>
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
          {isOwner && (
            <button
              onClick={() => setShowMembers(true)}
              className="font-sans-clean"
              title="Manage who can access this wedding"
              style={{
                background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.13)',
                borderRadius: 8, padding: '0.35rem 0.75rem',
                color: 'rgba(255,255,255,0.7)', fontSize: '0.55rem',
                letterSpacing: '0.15em', textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
              Members
            </button>
          )}
        </div>
        {/* Centred title */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          textAlign: 'center', color: 'white', padding: '0 2rem',
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
        {activeTab === 'guestsite' && <GuestSiteTab />}
      </main>
    </div>
  );
}
