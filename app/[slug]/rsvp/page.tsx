'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Wedding } from '@/lib/types';

export default function RsvpCodeGate() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [code, setCode] = useState('');
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!wedding) return;
    const trimmed = code.trim().toLowerCase();
    if (!trimmed) { setError('Please enter your invite code.'); return; }

    setError('');
    setChecking(true);

    const { data } = await supabase
      .from('invites')
      .select('code')
      .eq('code', trimmed)
      .eq('wedding_id', wedding.id)
      .maybeSingle();

    setChecking(false);

    if (!data) {
      setError('That code wasn\'t found. Please double-check your invitation and try again.');
      return;
    }

    router.push(`/${slug}/${trimmed}/rsvp`);
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ fontFamily: 'Jost, sans-serif', color: 'var(--mid-gray)', letterSpacing: '0.2em', fontSize: '0.7rem', textTransform: 'uppercase' }}>
        Loading…
      </p>
    </div>
  );

  if (notFound || !wedding) return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ fontFamily: 'Jost, sans-serif', color: 'var(--mid-gray)' }}>Page not found.</p>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
      {/* Top gradient bar */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: '3px', zIndex: 10,
        background: 'linear-gradient(90deg, var(--blush), var(--champagne), var(--sage), var(--champagne), var(--blush))',
      }} />

      {/* Dark header */}
      <div style={{
        paddingTop: '3rem', paddingBottom: '2rem',
        textAlign: 'center', background: 'var(--charcoal)',
        position: 'relative',
      }}>
        <Link href={`/${slug}`} style={{
          position: 'absolute', left: '2rem', top: '50%',
          transform: 'translateY(-50%)',
          fontFamily: 'Jost, sans-serif',
          fontSize: '0.6rem', letterSpacing: '0.15em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.45)',
          textDecoration: 'none',
        }}>
          ← Back
        </Link>
        <p style={{
          fontFamily: 'Jost, sans-serif',
          fontSize: '0.6rem', letterSpacing: '0.35em',
          textTransform: 'uppercase', color: 'var(--champagne)',
          marginBottom: '0.5rem',
        }}>
          {wedding.venue_name || 'Wedding'}
        </p>
        <h1 style={{
          fontFamily: 'Cormorant Garamond, Georgia, serif',
          fontSize: 'clamp(1.6rem, 4vw, 2.4rem)',
          fontWeight: 300, color: 'white',
        }}>
          {wedding.partner1_name} &amp;{' '}
          <span style={{ fontStyle: 'italic', color: 'var(--blush)' }}>
            {wedding.partner2_name}
          </span>
        </h1>
      </div>

      {/* Code entry */}
      <div style={{
        maxWidth: 480, margin: '0 auto',
        padding: '4rem 1.5rem',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        textAlign: 'center',
      }}>
        {/* Icon */}
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'var(--blush)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: '2rem',
        }}>
          <span style={{ fontSize: '1.8rem', lineHeight: 1 }}>✉︎</span>
        </div>

        <p style={{
          fontFamily: 'Jost, sans-serif',
          fontSize: '0.6rem', letterSpacing: '0.3em',
          textTransform: 'uppercase', color: 'var(--champagne)',
          marginBottom: '1rem',
        }}>
          Your Personal Invitation
        </p>

        <h2 style={{
          fontFamily: 'Cormorant Garamond, Georgia, serif',
          fontSize: 'clamp(1.8rem, 5vw, 2.6rem)',
          fontWeight: 300, color: 'var(--charcoal)',
          marginBottom: '0.75rem',
          lineHeight: 1.2,
        }}>
          Enter your invite code
        </h2>

        <p style={{
          fontFamily: 'Lora, Georgia, serif',
          fontSize: '0.95rem', lineHeight: 1.7,
          color: 'var(--mid-gray)',
          marginBottom: '2.5rem',
        }}>
          You should have received a unique code with your invitation.
          Please enter it below to RSVP.
        </p>

        <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input
            value={code}
            onChange={e => { setCode(e.target.value); setError(''); }}
            placeholder="e.g. abc123"
            autoFocus
            style={{
              width: '100%',
              padding: '1.1rem 1.2rem',
              border: `2px solid ${error ? '#E5A0A0' : 'var(--light-gray)'}`,
              borderRadius: 12,
              fontSize: '1.1rem',
              fontFamily: 'Jost, sans-serif',
              letterSpacing: '0.12em',
              textAlign: 'center',
              outline: 'none',
              background: 'white',
              color: 'var(--charcoal)',
              boxSizing: 'border-box',
              transition: 'border-color 0.2s',
            }}
          />

          {error && (
            <p style={{
              fontFamily: 'Jost, sans-serif',
              fontSize: '0.75rem', color: '#721C24',
              background: '#F8D7DA', padding: '0.65rem 0.9rem',
              borderRadius: 8, margin: 0,
            }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={checking}
            style={{
              width: '100%', padding: '1.1rem',
              background: checking ? 'var(--mid-gray)' : 'var(--charcoal)',
              color: 'white', border: 'none', borderRadius: 10,
              fontFamily: 'Jost, sans-serif',
              fontSize: '0.75rem', letterSpacing: '0.2em',
              textTransform: 'uppercase',
              cursor: checking ? 'default' : 'pointer',
              transition: 'background 0.2s',
            }}
          >
            {checking ? 'Checking…' : 'Continue →'}
          </button>
        </form>

        <p style={{
          fontFamily: 'Jost, sans-serif',
          fontSize: '0.65rem', color: 'var(--mid-gray)',
          marginTop: '2rem', lineHeight: 1.6,
        }}>
          Can&apos;t find your code? Check your invitation or reach out to the couple.
        </p>
      </div>
    </div>
  );
}
