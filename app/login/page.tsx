'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // If already signed in, go straight to the app
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace('/');
    });
  }, [router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const addr = email.toLowerCase().trim();

    // Check against the allowed_emails table in Supabase
    const { data } = await supabase
      .from('allowed_emails')
      .select('email')
      .eq('email', addr)
      .single();

    if (!data) {
      setError('That email isn\'t on the list. Contact Jeff or Nat to get access.');
      setLoading(false);
      return;
    }

    const { error: err } = await supabase.auth.signInWithOtp({
      email: addr,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setLoading(false);
    if (err) setError(err.message);
    else setSent(true);
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--cream)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
    }}>
      {/* Decorative top bar */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: '3px',
        background: 'linear-gradient(90deg, var(--blush), var(--champagne), var(--sage), var(--champagne), var(--blush))',
      }} />

      <div style={{
        background: 'white',
        borderRadius: 16,
        padding: '3rem 2.5rem',
        maxWidth: 420,
        width: '100%',
        boxShadow: '0 4px 40px rgba(0,0,0,0.10)',
        textAlign: 'center',
      }}>
        {/* Title */}
        <p className="font-sans-clean" style={{
          fontSize: '0.6rem', letterSpacing: '0.35em',
          color: 'var(--champagne)', textTransform: 'uppercase', marginBottom: '0.75rem',
        }}>
          Villa Valentini Bonaparte · Aug 31, 2026
        </p>
        <h1 className="font-display" style={{
          fontSize: '2.4rem', fontWeight: 300, color: 'var(--charcoal)',
          marginBottom: '0.4rem', lineHeight: 1.1,
        }}>
          Jeff &amp; <span style={{ fontStyle: 'italic', color: 'var(--blush)' }}>Nat</span>
        </h1>
        <p className="font-sans-clean" style={{
          fontSize: '0.7rem', color: 'var(--mid-gray)',
          letterSpacing: '0.1em', marginBottom: '2rem',
        }}>
          Wedding Planner
        </p>

        {/* Divider */}
        <div style={{
          height: 1, background: 'var(--light-gray)',
          margin: '0 auto 2rem', width: '60%',
        }} />

        {sent ? (
          <div>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>✉️</div>
            <p className="font-sans-clean" style={{
              color: 'var(--charcoal)', fontSize: '0.9rem', lineHeight: 1.6,
            }}>
              Check your inbox at<br />
              <strong>{email}</strong>
            </p>
            <p className="font-sans-clean" style={{
              color: 'var(--mid-gray)', fontSize: '0.75rem',
              marginTop: '0.75rem', lineHeight: 1.6,
            }}>
              Click the link in the email to sign in.<br />
              You can close this tab.
            </p>
          </div>
        ) : (
          <form onSubmit={submit}>
            <p className="font-sans-clean" style={{
              fontSize: '0.75rem', color: 'var(--mid-gray)',
              marginBottom: '1.25rem', lineHeight: 1.6,
            }}>
              Enter your email and we'll send you a magic link to sign in — no password needed.
            </p>

            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="font-sans-clean"
              style={{
                width: '100%', padding: '0.75rem 1rem',
                border: '1.5px solid var(--light-gray)',
                borderRadius: 8, fontSize: '0.9rem',
                outline: 'none', boxSizing: 'border-box',
                marginBottom: '1rem',
                color: 'var(--charcoal)',
              }}
            />

            {error && (
              <p className="font-sans-clean" style={{
                color: '#721C24', fontSize: '0.72rem',
                background: '#F8D7DA', padding: '0.5rem 0.75rem',
                borderRadius: 6, marginBottom: '1rem',
              }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="font-sans-clean"
              style={{
                width: '100%', padding: '0.8rem',
                background: loading ? 'var(--mid-gray)' : 'var(--charcoal)',
                color: 'white', border: 'none', borderRadius: 8,
                fontSize: '0.75rem', letterSpacing: '0.15em',
                textTransform: 'uppercase', cursor: loading ? 'default' : 'pointer',
                transition: 'background 0.2s',
              }}
            >
              {loading ? 'Sending…' : 'Send Magic Link'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
