'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    // Supabase automatically parses the token from the URL hash.
    // We just listen for the SIGNED_IN event and redirect home.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        router.replace('/');
      }
    });

    // Also check if there's already a session (in case the event already fired)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace('/');
    });

    return () => subscription.unsubscribe();
  }, [router]);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--cream)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '1rem',
    }}>
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: '3px',
        background: 'linear-gradient(90deg, var(--blush), var(--champagne), var(--sage), var(--champagne), var(--blush))',
      }} />
      <h1 className="font-display" style={{
        fontSize: '2rem', fontWeight: 300, color: 'var(--charcoal)',
      }}>
        Jeff &amp; <span style={{ fontStyle: 'italic', color: 'var(--blush)' }}>Nat</span>
      </h1>
      <p className="font-sans-clean" style={{
        fontSize: '0.75rem', color: 'var(--mid-gray)',
        letterSpacing: '0.15em', textTransform: 'uppercase',
      }}>
        Signing you in…
      </p>
    </div>
  );
}
