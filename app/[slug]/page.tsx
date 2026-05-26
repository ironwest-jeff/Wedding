'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Wedding } from '@/lib/types';

function fmtShort(d: string | null | undefined): string {
  if (!d) return '';
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
}

function dateRange(start: string | null, end: string | null): string {
  if (!start) return '';
  const year = new Date(start + 'T00:00:00').getFullYear();
  if (!end || end === start) return `${fmtShort(start)}, ${year}`;
  return `${fmtShort(start)} – ${fmtShort(end)}, ${year}`;
}

export default function WeddingPublicPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);

  // Invite code entry
  const [codeInput, setCodeInput] = useState('');
  const [codeError, setCodeError] = useState('');
  const [checkingCode, setCheckingCode] = useState(false);
  const [showCodeEntry, setShowCodeEntry] = useState(false);

  async function submitCode(e: React.FormEvent) {
    e.preventDefault();
    const code = codeInput.trim().toLowerCase();
    if (!code || !wedding) return;
    setCodeError('');
    setCheckingCode(true);
    const { data } = await supabase
      .from('invites')
      .select('code, wedding_id')
      .eq('code', code)
      .eq('wedding_id', wedding.id)
      .maybeSingle();
    setCheckingCode(false);
    if (!data) {
      setCodeError('Code not found. Please check and try again.');
      return;
    }
    router.push(`/${slug}/${code}`);
  }

  useEffect(() => {
    if (!slug) return;
    supabase
      .from('weddings')
      .select('*')
      .eq('slug', slug)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) setNotFound(true);
        else setWedding(data as Wedding);
        setLoading(false);
      });
  }, [slug]);

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#1a1510', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Jost, sans-serif', letterSpacing: '0.2em', fontSize: '0.7rem', textTransform: 'uppercase' }}>Loading…</p>
    </div>
  );

  if (notFound || !wedding) return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '2rem' }}>
      <h1 className="font-display" style={{ fontSize: '2.5rem', fontWeight: 300, color: 'var(--charcoal)', marginBottom: '0.75rem' }}>Page not found</h1>
      <p className="font-sans-clean" style={{ color: 'var(--mid-gray)', fontSize: '0.85rem' }}>This wedding page doesn&apos;t exist or the link may have changed.</p>
    </div>
  );

  const events = wedding.events ?? [];
  const venueLine = [wedding.venue_name, wedding.venue_location].filter(Boolean).join(' · ');
  const dateLine = dateRange(wedding.wedding_date, wedding.wedding_end_date);
  const hasContent = !!(wedding.welcome_message && wedding.welcome_message !== 'EMPTY') || events.length > 0;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)', fontFamily: 'Lora, Georgia, serif' }}>

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <div style={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url(/villa-hero.jpg)', backgroundSize: 'cover', backgroundPosition: 'center 30%' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(10,8,5,0.3) 0%, rgba(10,8,5,0.6) 60%, rgba(10,8,5,0.85) 100%)' }} />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, var(--blush), var(--champagne), var(--sage), var(--champagne), var(--blush))' }} />

        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', color: 'white', padding: '4rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
          {venueLine && (
            <p style={{ fontFamily: 'Jost, sans-serif', fontSize: '0.62rem', letterSpacing: '0.4em', textTransform: 'uppercase', color: 'var(--champagne)' }}>
              {venueLine}
            </p>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '100%', maxWidth: '400px' }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.2)' }} />
            <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.8rem' }}>✦</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.2)' }} />
          </div>

          <h1 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 'clamp(3rem, 8vw, 6rem)', fontWeight: 300, lineHeight: 1.05, letterSpacing: '0.04em', textShadow: '0 2px 32px rgba(0,0,0,0.5)' }}>
            {wedding.partner1_name}
            <span style={{ display: 'block', fontStyle: 'italic', color: 'var(--blush)', fontSize: '0.65em' }}>&amp; {wedding.partner2_name}</span>
          </h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '100%', maxWidth: '400px' }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.2)' }} />
            <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.8rem' }}>✦</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.2)' }} />
          </div>

          {dateLine && (
            <p style={{ fontFamily: 'Jost, sans-serif', fontSize: '0.78rem', letterSpacing: '0.28em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.8)' }}>
              {dateLine}
            </p>
          )}

          <Link
            href={`/${slug}/rsvp`}
            style={{ marginTop: '1rem', display: 'inline-block', padding: '1rem 3rem', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.5)', borderRadius: '4px', color: 'white', fontFamily: 'Jost, sans-serif', fontSize: '0.72rem', letterSpacing: '0.3em', textTransform: 'uppercase', textDecoration: 'none', backdropFilter: 'blur(4px)' }}
          >
            RSVP
          </Link>
        </div>

        {hasContent && (
          <div style={{ position: 'absolute', bottom: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', color: 'rgba(255,255,255,0.4)' }}>
            <p style={{ fontFamily: 'Jost, sans-serif', fontSize: '0.55rem', letterSpacing: '0.25em', textTransform: 'uppercase' }}>Scroll</p>
            <div style={{ width: '1px', height: '40px', background: 'linear-gradient(to bottom, rgba(255,255,255,0.4), transparent)' }} />
          </div>
        )}
      </div>

      {/* ── Welcome Message ───────────────────────────────────────────── */}
      {wedding.welcome_message && wedding.welcome_message !== 'EMPTY' && (
        <div style={{ padding: '6rem 2rem', maxWidth: '680px', margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontFamily: 'Jost, sans-serif', fontSize: '0.6rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--champagne)', marginBottom: '2rem' }}>
            A note from the couple
          </p>
          <p style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 'clamp(1.3rem, 3vw, 1.8rem)', fontWeight: 300, lineHeight: 1.7, color: 'var(--charcoal)', fontStyle: 'italic' }}>
            &ldquo;{wedding.welcome_message}&rdquo;
          </p>
          <p style={{ marginTop: '2rem', fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: '1.1rem', color: 'var(--mid-gray)' }}>
            — {wedding.partner1_name} &amp; {wedding.partner2_name}
          </p>
        </div>
      )}

      {/* ── Events ────────────────────────────────────────────────────── */}
      {events.length > 0 && (
        <div style={{ background: 'white', padding: '5rem 2rem' }}>
          <div style={{ maxWidth: '720px', margin: '0 auto' }}>
            <p style={{ textAlign: 'center', fontFamily: 'Jost, sans-serif', fontSize: '0.6rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--champagne)', marginBottom: '0.75rem' }}>Join us</p>
            <h2 style={{ textAlign: 'center', fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 300, color: 'var(--charcoal)', marginBottom: '3.5rem' }}>
              Weekend Events
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(events.length, 2)}, 1fr)`, gap: '1.5rem' }}>
              {events.map(ev => (
                <div key={ev.id} style={{ padding: '2rem', border: '1px solid var(--light-gray)', borderRadius: '12px', textAlign: 'center' }}>
                  {ev.date && (
                    <p style={{ fontFamily: 'Jost, sans-serif', fontSize: '0.55rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--champagne)', marginBottom: '0.75rem' }}>
                      {new Date(ev.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                      {ev.time ? ` · ${ev.time}` : ''}
                    </p>
                  )}
                  <p style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: '1.6rem', fontWeight: 300, color: 'var(--charcoal)', marginBottom: '0.4rem' }}>
                    {ev.name}
                  </p>
                  {ev.description && (
                    <p style={{ fontFamily: 'Jost, sans-serif', fontSize: '0.75rem', color: 'var(--mid-gray)', marginTop: '0.5rem', lineHeight: 1.6 }}>
                      {ev.description}
                    </p>
                  )}
                  {ev.dresscode && (
                    <p style={{ fontFamily: 'Jost, sans-serif', fontSize: '0.62rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--sage)', marginTop: '0.75rem' }}>
                      {ev.dresscode}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Venue + Details ───────────────────────────────────────────── */}
      <div style={{ padding: '5rem 2rem', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
        <p style={{ fontFamily: 'Jost, sans-serif', fontSize: '0.6rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--champagne)', marginBottom: '0.75rem' }}>Details</p>
        <h2 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 300, color: 'var(--charcoal)', marginBottom: '2.5rem' }}>
          Where &amp; When
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {wedding.venue_name && (
            <div style={{ padding: '1.5rem', background: 'white', borderRadius: '12px', border: '1px solid var(--light-gray)' }}>
              <p style={{ fontFamily: 'Jost, sans-serif', fontSize: '0.58rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--mid-gray)', marginBottom: '0.5rem' }}>Venue</p>
              <p style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: '1.4rem', fontWeight: 300, color: 'var(--charcoal)' }}>{wedding.venue_name}</p>
              {wedding.venue_location && <p style={{ fontFamily: 'Jost, sans-serif', fontSize: '0.78rem', color: 'var(--mid-gray)', marginTop: '0.3rem' }}>{wedding.venue_location}</p>}
            </div>
          )}
          {dateLine && (
            <div style={{ padding: '1.5rem', background: 'white', borderRadius: '12px', border: '1px solid var(--light-gray)' }}>
              <p style={{ fontFamily: 'Jost, sans-serif', fontSize: '0.58rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--mid-gray)', marginBottom: '0.5rem' }}>Date</p>
              <p style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: '1.4rem', fontWeight: 300, color: 'var(--charcoal)' }}>{dateLine}</p>
            </div>
          )}
        </div>
      </div>

      {/* ── RSVP CTA ──────────────────────────────────────────────────── */}
      <div style={{ background: 'var(--charcoal)', padding: '5rem 2rem', textAlign: 'center' }}>
        <p style={{ fontFamily: 'Jost, sans-serif', fontSize: '0.6rem', letterSpacing: '0.35em', textTransform: 'uppercase', color: 'var(--champagne)', marginBottom: '1.25rem' }}>
          We hope to see you there
        </p>
        <h2 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 300, color: 'white', marginBottom: '2.5rem' }}>
          Kindly let us know<br />
          <span style={{ fontStyle: 'italic', color: 'var(--blush)' }}>if you can make it</span>
        </h2>
        <Link href={`/${slug}/rsvp`} style={{ display: 'inline-block', padding: '1.1rem 3.5rem', background: 'white', borderRadius: '4px', color: 'var(--charcoal)', fontFamily: 'Jost, sans-serif', fontSize: '0.72rem', letterSpacing: '0.3em', textTransform: 'uppercase', textDecoration: 'none', fontWeight: 500 }}>
          RSVP Now
        </Link>

        {/* Invite code entry */}
        <div style={{ marginTop: '2.5rem' }}>
          {!showCodeEntry ? (
            <button
              onClick={() => setShowCodeEntry(true)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Jost, sans-serif', fontSize: '0.65rem', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.4)', textDecoration: 'underline', textUnderlineOffset: '3px' }}
            >
              Have a personal invite code?
            </button>
          ) : (
            <form onSubmit={submitCode} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem', animation: 'fadeIn 0.2s ease' }}>
              <p style={{ fontFamily: 'Jost, sans-serif', fontSize: '0.62rem', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>
                Enter your invite code
              </p>
              <div style={{ display: 'flex', gap: '0.5rem', width: '100%', maxWidth: 320, justifyContent: 'center' }}>
                <input
                  autoFocus
                  value={codeInput}
                  onChange={e => { setCodeInput(e.target.value); setCodeError(''); }}
                  placeholder="e.g. abc12345"
                  style={{
                    flex: 1, padding: '0.7rem 1rem',
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.25)',
                    borderRadius: 8, color: 'white',
                    fontFamily: 'Jost, sans-serif', fontSize: '0.9rem',
                    outline: 'none', letterSpacing: '0.12em',
                    textAlign: 'center',
                  }}
                />
                <button
                  type="submit"
                  disabled={checkingCode}
                  style={{ padding: '0.7rem 1.1rem', background: 'var(--blush)', border: 'none', borderRadius: 8, cursor: checkingCode ? 'default' : 'pointer', fontFamily: 'Jost, sans-serif', fontSize: '0.72rem', fontWeight: 600, color: 'var(--charcoal)', whiteSpace: 'nowrap' }}
                >
                  {checkingCode ? '…' : 'Go →'}
                </button>
              </div>
              {codeError && (
                <p style={{ fontFamily: 'Jost, sans-serif', fontSize: '0.7rem', color: 'var(--blush)' }}>{codeError}</p>
              )}
              <button onClick={() => { setShowCodeEntry(false); setCodeError(''); setCodeInput(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Jost, sans-serif', fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em' }}>
                cancel
              </button>
            </form>
          )}
        </div>
      </div>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <div style={{ padding: '2rem', textAlign: 'center', background: 'var(--charcoal)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <p style={{ fontFamily: 'Jost, sans-serif', fontSize: '0.6rem', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.25)' }}>
          {wedding.partner1_name} &amp; {wedding.partner2_name} · {wedding.wedding_date ? new Date(wedding.wedding_date + 'T00:00:00').getFullYear() : ''}
        </p>
      </div>
    </div>
  );
}
