'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function ResetPassword() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase puts the recovery token in the URL hash; onAuthStateChange picks it up
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setError('Passwords don\'t match.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setError('');
    setLoading(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (err) setError(err.message);
    else router.replace('/');
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
      alignItems: 'center', justifyContent: 'center', padding: '2rem',
    }}>
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: '3px',
        background: 'linear-gradient(90deg, var(--blush), var(--champagne), var(--sage), var(--champagne), var(--blush))',
      }} />

      <div style={{
        background: 'white', borderRadius: 16, padding: '3rem 2.5rem',
        maxWidth: 420, width: '100%',
        boxShadow: '0 4px 40px rgba(0,0,0,0.10)', textAlign: 'center',
      }}>
        <h1 className="font-display" style={{
          fontSize: '2rem', fontWeight: 300, color: 'var(--charcoal)',
          marginBottom: '0.4rem', lineHeight: 1.1,
        }}>
          New <span style={{ fontStyle: 'italic', color: 'var(--blush)' }}>password</span>
        </h1>
        <p className="font-sans-clean" style={{
          fontSize: '0.7rem', color: 'var(--mid-gray)', marginBottom: '2rem',
        }}>
          {ready ? 'Choose a new password for your account.' : 'Loading your reset link…'}
        </p>

        {ready && (
          <form onSubmit={submit} style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div>
              <label className="font-sans-clean" style={{
                display: 'block', fontSize: '0.58rem', letterSpacing: '0.15em',
                textTransform: 'uppercase', color: 'var(--mid-gray)', marginBottom: '0.4rem',
              }}>New Password</label>
              <input type="password" required minLength={8} value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className="font-sans-clean" style={inputStyle} />
            </div>
            <div>
              <label className="font-sans-clean" style={{
                display: 'block', fontSize: '0.58rem', letterSpacing: '0.15em',
                textTransform: 'uppercase', color: 'var(--mid-gray)', marginBottom: '0.4rem',
              }}>Confirm Password</label>
              <input type="password" required value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Type it again"
                className="font-sans-clean" style={inputStyle} />
            </div>

            {error && (
              <p className="font-sans-clean" style={{
                color: '#721C24', fontSize: '0.72rem',
                background: '#F8D7DA', padding: '0.5rem 0.75rem', borderRadius: 6,
              }}>{error}</p>
            )}

            <button type="submit" disabled={loading} className="font-sans-clean" style={{
              width: '100%', padding: '0.8rem',
              background: loading ? 'var(--mid-gray)' : 'var(--charcoal)',
              color: 'white', border: 'none', borderRadius: 8,
              fontSize: '0.75rem', letterSpacing: '0.15em',
              textTransform: 'uppercase', cursor: loading ? 'default' : 'pointer',
            }}>
              {loading ? 'Saving…' : 'Set New Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
