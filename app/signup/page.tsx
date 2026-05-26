'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

function generateSlug(p1: string, p2: string, year: number): string {
  const clean = (s: string) =>
    s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  return `${clean(p1) || 'partner1'}-and-${clean(p2) || 'partner2'}-${year}`;
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.75rem 1rem',
  border: '1.5px solid var(--light-gray)',
  borderRadius: 8, fontSize: '0.9rem',
  outline: 'none', boxSizing: 'border-box',
  color: 'var(--charcoal)', background: 'white',
  fontFamily: 'inherit',
};

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '0.58rem', letterSpacing: '0.15em',
  textTransform: 'uppercase', color: 'var(--mid-gray)', marginBottom: '0.35rem',
};

const sectionStyle: React.CSSProperties = {
  background: 'var(--cream)', borderRadius: 10, padding: '1.25rem',
};

const sectionTitle: React.CSSProperties = {
  fontSize: '0.58rem', letterSpacing: '0.2em', textTransform: 'uppercase',
  color: 'var(--mid-gray)', marginBottom: '1rem',
};

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState('');
  // If user is already signed in but has no wedding, we skip the account fields
  const [existingUserId, setExistingUserId] = useState<string | null>(null);

  const [form, setForm] = useState({
    email: '', password: '',
    partner1: '', partner2: '',
    weddingDate: '', weddingEndDate: '',
    venueName: '', venueLocation: '',
  });

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        // Check if they already have a wedding
        const { data } = await supabase
          .from('weddings')
          .select('id')
          .eq('owner_id', session.user.id)
          .single();

        if (data) {
          router.replace('/');
          return;
        }
        // Signed in but no wedding yet — skip account fields
        setExistingUserId(session.user.id);
      }
      setChecking(false);
    });
  }, [router]);

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let userId: string;

      if (existingUserId) {
        userId = existingUserId;
      } else {
        const { data: authData, error: authErr } = await supabase.auth.signUp({
          email: form.email.toLowerCase().trim(),
          password: form.password,
        });

        if (authErr) throw new Error(authErr.message);
        if (!authData.user) throw new Error('Signup failed — please try again.');

        if (!authData.session) {
          // Email confirmation is enabled — tell the user
          setError(
            'Check your inbox for a confirmation email. Once confirmed, return here to sign in.'
          );
          setLoading(false);
          return;
        }

        userId = authData.user.id;
      }

      // Create the wedding record
      const startYear = form.weddingDate
        ? new Date(form.weddingDate + 'T00:00:00').getFullYear()
        : new Date().getFullYear() + 1;
      const slug = generateSlug(form.partner1, form.partner2, startYear);

      const { error: weddingErr } = await supabase.from('weddings').insert({
        owner_id: userId,
        slug,
        partner1_name: form.partner1.trim(),
        partner2_name: form.partner2.trim(),
        wedding_date:     form.weddingDate     || null,
        wedding_end_date: form.weddingEndDate  || null,
        venue_name:       form.venueName.trim(),
        venue_location:   form.venueLocation.trim(),
      });

      if (weddingErr) throw new Error(weddingErr.message);

      router.replace('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading(false);
    }
  }

  if (checking) {
    return (
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
  }

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
        padding: '3rem 2.5rem', maxWidth: 500, width: '100%',
        boxShadow: '0 4px 40px rgba(0,0,0,0.10)',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <p className="font-sans-clean" style={{
            fontSize: '0.58rem', letterSpacing: '0.35em',
            color: 'var(--champagne)', textTransform: 'uppercase', marginBottom: '0.5rem',
          }}>
            Wedding Planner
          </p>
          <h1 className="font-display" style={{
            fontSize: '2rem', fontWeight: 300, color: 'var(--charcoal)', lineHeight: 1.1,
          }}>
            {existingUserId
              ? <>Set up your <span style={{ fontStyle: 'italic', color: 'var(--blush)' }}>wedding</span></>
              : <>Create your <span style={{ fontStyle: 'italic', color: 'var(--blush)' }}>wedding</span></>
            }
          </h1>
          {existingUserId && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginTop: '0.4rem' }}>
              <p className="font-sans-clean" style={{ fontSize: '0.7rem', color: 'var(--mid-gray)' }}>
                You&apos;re already signed in.
              </p>
              <button
                type="button"
                className="font-sans-clean"
                onClick={async () => { await supabase.auth.signOut(); setExistingUserId(null); }}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: '0.7rem', color: 'var(--charcoal)',
                  textDecoration: 'underline', padding: 0,
                }}
              >
                Sign out
              </button>
            </div>
          )}
        </div>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Account section — only for new signups */}
          {!existingUserId && (
            <div style={sectionStyle}>
              <p className="font-sans-clean" style={sectionTitle}>Account Details</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <label className="font-sans-clean" style={labelStyle}>Email</label>
                  <input
                    type="email" required value={form.email}
                    onChange={e => set('email', e.target.value)}
                    placeholder="your@email.com"
                    className="font-sans-clean" style={inputStyle}
                  />
                </div>
                <div>
                  <label className="font-sans-clean" style={labelStyle}>Password</label>
                  <input
                    type="password" required minLength={8} value={form.password}
                    onChange={e => set('password', e.target.value)}
                    placeholder="Minimum 8 characters"
                    className="font-sans-clean" style={inputStyle}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Wedding details section */}
          <div style={sectionStyle}>
            <p className="font-sans-clean" style={sectionTitle}>Your Wedding</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

              {/* Partner names */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className="font-sans-clean" style={labelStyle}>Partner 1 Name</label>
                  <input
                    type="text" required value={form.partner1}
                    onChange={e => set('partner1', e.target.value)}
                    placeholder="e.g. Nat"
                    className="font-sans-clean" style={inputStyle}
                  />
                </div>
                <div>
                  <label className="font-sans-clean" style={labelStyle}>Partner 2 Name</label>
                  <input
                    type="text" required value={form.partner2}
                    onChange={e => set('partner2', e.target.value)}
                    placeholder="e.g. Jeff"
                    className="font-sans-clean" style={inputStyle}
                  />
                </div>
              </div>
              <p className="font-sans-clean" style={{
                fontSize: '0.62rem', color: 'var(--mid-gray)', marginTop: '-0.25rem',
              }}>
                Displayed as: <em>{form.partner1 || 'Partner 1'} &amp; {form.partner2 || 'Partner 2'}</em>
              </p>

              {/* Dates */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className="font-sans-clean" style={labelStyle}>Start Date</label>
                  <input
                    type="date" value={form.weddingDate}
                    onChange={e => set('weddingDate', e.target.value)}
                    className="font-sans-clean" style={inputStyle}
                  />
                </div>
                <div>
                  <label className="font-sans-clean" style={labelStyle}>End Date</label>
                  <input
                    type="date" value={form.weddingEndDate}
                    onChange={e => set('weddingEndDate', e.target.value)}
                    className="font-sans-clean" style={inputStyle}
                  />
                </div>
              </div>

              {/* Venue */}
              <div>
                <label className="font-sans-clean" style={labelStyle}>Venue Name</label>
                <input
                  type="text" value={form.venueName}
                  onChange={e => set('venueName', e.target.value)}
                  placeholder="e.g. Villa Valentini Bonaparte"
                  className="font-sans-clean" style={inputStyle}
                />
              </div>
              <div>
                <label className="font-sans-clean" style={labelStyle}>Venue Location</label>
                <input
                  type="text" value={form.venueLocation}
                  onChange={e => set('venueLocation', e.target.value)}
                  placeholder="e.g. Lazio, Italy"
                  className="font-sans-clean" style={inputStyle}
                />
              </div>
            </div>
          </div>

          {error && (
            <p className="font-sans-clean" style={{
              color: '#721C24', fontSize: '0.72rem',
              background: '#F8D7DA', padding: '0.6rem 0.85rem',
              borderRadius: 6,
            }}>
              {error}
            </p>
          )}

          <button
            type="submit" disabled={loading}
            className="font-sans-clean"
            style={{
              width: '100%', padding: '0.9rem',
              background: loading ? 'var(--mid-gray)' : 'var(--charcoal)',
              color: 'white', border: 'none', borderRadius: 8,
              fontSize: '0.75rem', letterSpacing: '0.15em',
              textTransform: 'uppercase', cursor: loading ? 'default' : 'pointer',
              transition: 'background 0.2s',
            }}
          >
            {loading
              ? (existingUserId ? 'Saving…' : 'Creating your wedding…')
              : (existingUserId ? 'Save & Open Dashboard' : 'Create Wedding Account')
            }
          </button>

          {!existingUserId && (
            <p className="font-sans-clean" style={{
              textAlign: 'center', fontSize: '0.7rem', color: 'var(--mid-gray)',
            }}>
              Already have an account?{' '}
              <Link href="/login" style={{ color: 'var(--charcoal)', fontWeight: 600 }}>
                Sign in
              </Link>
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
