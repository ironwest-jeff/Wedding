'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace('/');
    });
  }, [router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: err } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password,
    });

    setLoading(false);
    if (err) {
      setError(
        err.message === 'Invalid login credentials'
          ? 'Incorrect email or password — please try again.'
          : err.message
      );
    } else {
      router.replace('/');
    }
  }

  async function sendReset() {
    if (!email) { setError('Enter your email above first.'); return; }
    setResetting(true);
    await supabase.auth.resetPasswordForEmail(email.toLowerCase().trim(), {
      redirectTo: `${window.location.origin}/auth/reset`,
    });
    setResetting(false);
    setResetSent(true);
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.75rem 1rem',
    border: '1.5px solid var(--light-gray)',
    borderRadius: 8, fontSize: '0.9rem',
    outline: 'none', boxSizing: 'border-box',
    color: 'var(--charcoal)', fontFamily: 'inherit',
  };

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--cream)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '2rem',
    }}>
      {/* Decorative top bar */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: '3px',
        background: 'linear-gradient(90deg, var(--blush), var(--champagne), var(--sage), var(--champagne), var(--blush))',
      }} />

      <div style={{
        background: 'white', borderRadius: 16,
        padding: '3rem 2.5rem', maxWidth: 420, width: '100%',
        boxShadow: '0 4px 40px rgba(0,0,0,0.10)',
        textAlign: 'center',
      }}>
        {/* Title */}
        <p className="font-sans-clean" style={{
          fontSize: '0.58rem', letterSpacing: '0.35em',
          color: 'var(--champagne)', textTransform: 'uppercase', marginBottom: '0.75rem',
        }}>
          Wedding Planner
        </p>
        <h1 className="font-display" style={{
          fontSize: '2.4rem', fontWeight: 300, color: 'var(--charcoal)',
          marginBottom: '0.4rem', lineHeight: 1.1,
        }}>
          Welcome <span style={{ fontStyle: 'italic', color: 'var(--blush)' }}>back</span>
        </h1>
        <p className="font-sans-clean" style={{
          fontSize: '0.7rem', color: 'var(--mid-gray)',
          letterSpacing: '0.1em', marginBottom: '2rem',
        }}>
          Sign in to your wedding dashboard
        </p>

        <div style={{
          height: 1, background: 'var(--light-gray)',
          margin: '0 auto 2rem', width: '60%',
        }} />

        <form onSubmit={submit} style={{ textAlign: 'left' }}>
          <div style={{ marginBottom: '0.85rem' }}>
            <label className="font-sans-clean" style={{
              display: 'block', fontSize: '0.58rem', letterSpacing: '0.15em',
              textTransform: 'uppercase', color: 'var(--mid-gray)', marginBottom: '0.4rem',
            }}>Email</label>
            <input
              type="email" required value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="font-sans-clean" style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.4rem' }}>
              <label className="font-sans-clean" style={{
                fontSize: '0.58rem', letterSpacing: '0.15em',
                textTransform: 'uppercase', color: 'var(--mid-gray)',
              }}>Password</label>
              <button
                type="button" onClick={sendReset} disabled={resetting}
                className="font-sans-clean"
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: '0.62rem', color: 'var(--mid-gray)',
                  textDecoration: 'underline', padding: 0,
                }}
              >
                {resetting ? 'Sending…' : resetSent ? '✓ Check your email' : 'Forgot password?'}
              </button>
            </div>
            <input
              type="password" required value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Your password"
              className="font-sans-clean" style={inputStyle}
            />
          </div>

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
            type="submit" disabled={loading}
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
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="font-sans-clean" style={{
          marginTop: '1.5rem', fontSize: '0.7rem', color: 'var(--mid-gray)',
        }}>
          New here?{' '}
          <Link href="/signup" style={{ color: 'var(--charcoal)', fontWeight: 600 }}>
            Create your wedding
          </Link>
        </p>
      </div>
    </div>
  );
}
