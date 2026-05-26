'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Wedding, Invite } from '@/lib/types';
import GuestMusicPlayer from '@/components/GuestMusicPlayer';

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

export default function PersonalizedWeddingPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const code = params?.code as string;

  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [invite, setInvite] = useState<Invite | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug || !code) return;
    Promise.all([
      supabase.from('weddings').select('*').eq('slug', slug).maybeSingle(),
      supabase.from('invites').select('*').eq('code', code).maybeSingle(),
    ]).then(([{ data: w }, { data: inv }]) => {
      if (!w) { setNotFound(true); setLoading(false); return; }
      setWedding(w as Wedding);
      // inv may be null if invites table not yet set up — still show the page
      if (inv && (inv as Invite).wedding_id === (w as Wedding).id) {
        setInvite(inv as Invite);
      }
      setLoading(false);
    });
  }, [slug, code]);

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#1a1510', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Jost, sans-serif', letterSpacing: '0.2em', fontSize: '0.7rem', textTransform: 'uppercase' }}>Loading…</p>
    </div>
  );

  if (notFound || !wedding) return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '2rem' }}>
      <h1 className="font-display" style={{ fontSize: '2.5rem', fontWeight: 300, color: 'var(--charcoal)', marginBottom: '0.75rem' }}>Page not found</h1>
      <p className="font-sans-clean" style={{ color: 'var(--mid-gray)', fontSize: '0.85rem' }}>This link may be invalid or expired.</p>
    </div>
  );

  const events = wedding.events ?? [];
  const venueLine = [wedding.venue_name, wedding.venue_location].filter(Boolean).join(' · ');
  const dateLine = dateRange(wedding.wedding_date, wedding.wedding_end_date);
  const guestName = invite ? `${invite.first_name}${invite.last_name ? ` ${invite.last_name}` : ''}` : null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)', fontFamily: 'Lora, Georgia, serif' }}>
      <GuestMusicPlayer />

      {/* ── Personalized welcome banner ───────────────────────────────── */}
      {invite && (
        <div style={{
          background: invite.used ? '#EEF5EE' : 'var(--charcoal)',
          borderBottom: `1px solid ${invite.used ? '#C8E0C8' : 'rgba(255,255,255,0.1)'}`,
          padding: '0.85rem 2rem',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: '1rem', flexWrap: 'wrap', textAlign: 'center',
        }}>
          {invite.used ? (
            <p style={{ fontFamily: 'Jost, sans-serif', fontSize: '0.75rem', color: '#2D6A2D', letterSpacing: '0.05em' }}>
              ✓ &nbsp;You&apos;ve already sent your RSVP, <strong>{invite.first_name}</strong>. We can&apos;t wait to see you!
            </p>
          ) : (
            <>
              <p style={{ fontFamily: 'Jost, sans-serif', fontSize: '0.75rem', color: 'rgba(255,255,255,0.85)', letterSpacing: '0.05em' }}>
                ✦ &nbsp;Welcome, <strong style={{ color: 'var(--champagne)' }}>{guestName}</strong> — you&apos;ve been personally invited.
              </p>
              <Link
                href={`/${slug}/${code}/rsvp`}
                style={{
                  padding: '0.4rem 1.1rem',
                  background: 'var(--blush)', color: 'var(--charcoal)',
                  borderRadius: 6, fontFamily: 'Jost, sans-serif',
                  fontSize: '0.65rem', letterSpacing: '0.15em',
                  textTransform: 'uppercase', textDecoration: 'none',
                  fontWeight: 600, whiteSpace: 'nowrap',
                }}
              >
                RSVP Now →
              </Link>
            </>
          )}
        </div>
      )}

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <div style={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url(/villa-hero.jpg)', backgroundSize: 'cover', backgroundPosition: 'center 30%' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(10,8,5,0.3) 0%, rgba(10,8,5,0.6) 60%, rgba(10,8,5,0.85) 100%)' }} />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, var(--blush), var(--champagne), var(--sage), var(--champagne), var(--blush))' }} />

        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', color: 'white', padding: '4rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
          {venueLine && (
            <p style={{ fontFamily: 'Jost, sans-serif', fontSize: '0.62rem', letterSpacing: '0.4em', textTransform: 'uppercase', color: 'var(--champagne)' }}>{venueLine}</p>
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
            <p style={{ fontFamily: 'Jost, sans-serif', fontSize: '0.78rem', letterSpacing: '0.28em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.8)' }}>{dateLine}</p>
          )}

          {/* RSVP button — personalized or generic */}
          {invite && !invite.used ? (
            <Link href={`/${slug}/${code}/rsvp`} style={{ marginTop: '1rem', display: 'inline-block', padding: '1rem 3rem', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.5)', borderRadius: '4px', color: 'white', fontFamily: 'Jost, sans-serif', fontSize: '0.72rem', letterSpacing: '0.3em', textTransform: 'uppercase', textDecoration: 'none', backdropFilter: 'blur(4px)' }}>
              RSVP
            </Link>
          ) : invite?.used ? (
            <div style={{ marginTop: '1rem', padding: '1rem 3rem', border: '1px solid rgba(255,255,255,0.25)', borderRadius: '4px', fontFamily: 'Jost, sans-serif', fontSize: '0.72rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }}>
              ✓ RSVP Sent
            </div>
          ) : (
            <Link href={`/${slug}/rsvp`} style={{ marginTop: '1rem', display: 'inline-block', padding: '1rem 3rem', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.5)', borderRadius: '4px', color: 'white', fontFamily: 'Jost, sans-serif', fontSize: '0.72rem', letterSpacing: '0.3em', textTransform: 'uppercase', textDecoration: 'none', backdropFilter: 'blur(4px)' }}>
              RSVP
            </Link>
          )}
        </div>

        {(wedding.welcome_message || events.length > 0) && (
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
            {guestName ? `Dear ${guestName}` : 'A note from the couple'}
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
            <h2 style={{ textAlign: 'center', fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 300, color: 'var(--charcoal)', marginBottom: '3.5rem' }}>Weekend Events</h2>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(events.length, 2)}, 1fr)`, gap: '1.5rem' }}>
              {events.map(ev => (
                <div key={ev.id} style={{ padding: '2rem', border: '1px solid var(--light-gray)', borderRadius: '12px', textAlign: 'center' }}>
                  {ev.date && (
                    <p style={{ fontFamily: 'Jost, sans-serif', fontSize: '0.55rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--champagne)', marginBottom: '0.75rem' }}>
                      {new Date(ev.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                      {ev.time ? ` · ${ev.time}` : ''}
                    </p>
                  )}
                  <p style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: '1.6rem', fontWeight: 300, color: 'var(--charcoal)', marginBottom: '0.4rem' }}>{ev.name}</p>
                  {ev.description && <p style={{ fontFamily: 'Jost, sans-serif', fontSize: '0.75rem', color: 'var(--mid-gray)', marginTop: '0.5rem', lineHeight: 1.6 }}>{ev.description}</p>}
                  {ev.dresscode && <p style={{ fontFamily: 'Jost, sans-serif', fontSize: '0.62rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--sage)', marginTop: '0.75rem' }}>{ev.dresscode}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Venue + Details ───────────────────────────────────────────── */}
      <div style={{ padding: '5rem 2rem', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
        <p style={{ fontFamily: 'Jost, sans-serif', fontSize: '0.6rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--champagne)', marginBottom: '0.75rem' }}>Details</p>
        <h2 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 300, color: 'var(--charcoal)', marginBottom: '2.5rem' }}>Where &amp; When</h2>
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
      {invite && !invite.used && (
        <div style={{ background: 'var(--charcoal)', padding: '5rem 2rem', textAlign: 'center' }}>
          <p style={{ fontFamily: 'Jost, sans-serif', fontSize: '0.6rem', letterSpacing: '0.35em', textTransform: 'uppercase', color: 'var(--champagne)', marginBottom: '1.25rem' }}>
            We hope to see you there
          </p>
          <h2 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 300, color: 'white', marginBottom: '2.5rem' }}>
            {guestName ? (
              <><span style={{ fontStyle: 'italic', color: 'var(--blush)' }}>{invite.first_name}</span>, will you join us?</>
            ) : (
              <>Kindly let us know<br /><span style={{ fontStyle: 'italic', color: 'var(--blush)' }}>if you can make it</span></>
            )}
          </h2>
          <Link href={`/${slug}/${code}/rsvp`} style={{ display: 'inline-block', padding: '1.1rem 3.5rem', background: 'white', borderRadius: '4px', color: 'var(--charcoal)', fontFamily: 'Jost, sans-serif', fontSize: '0.72rem', letterSpacing: '0.3em', textTransform: 'uppercase', textDecoration: 'none', fontWeight: 500 }}>
            Send my RSVP
          </Link>
        </div>
      )}

      {/* Footer */}
      <div style={{ padding: '2rem', textAlign: 'center', background: 'var(--charcoal)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <p style={{ fontFamily: 'Jost, sans-serif', fontSize: '0.6rem', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.25)' }}>
          {wedding.partner1_name} &amp; {wedding.partner2_name} · {wedding.wedding_date ? new Date(wedding.wedding_date + 'T00:00:00').getFullYear() : ''}
        </p>
      </div>
    </div>
  );
}
