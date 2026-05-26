'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Wedding } from '@/lib/types';

const DIETARY_OPTIONS = [
  'None', 'Vegetarian', 'Vegan', 'Gluten-Free',
  'Kosher', 'Halal', 'Nut Allergy', 'Dairy-Free', 'Other',
];

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.85rem 1rem',
  border: '1.5px solid var(--light-gray)',
  borderRadius: 10, fontSize: '0.9rem',
  outline: 'none', color: 'var(--charcoal)',
  background: 'white', fontFamily: 'Jost, sans-serif',
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  display: 'block', fontFamily: 'Jost, sans-serif',
  fontSize: '0.58rem', letterSpacing: '0.18em',
  textTransform: 'uppercase', color: 'var(--mid-gray)',
  marginBottom: '0.5rem',
};

type Step = 'form' | 'thankyou';

export default function RsvpPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<Step>('form');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    attending: '' as 'yes' | 'no' | '',
    dietary: 'None',
    dietaryNotes: '',
    notes: '',
  });

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

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!wedding) return;
    if (!form.attending) { setError('Please let us know if you can attend.'); return; }
    if (!form.firstName.trim()) { setError('Please enter your first name.'); return; }

    setError('');
    setSubmitting(true);

    const { error: err } = await supabase.from('rsvp_submissions').insert({
      wedding_id:    wedding.id,
      first_name:    form.firstName.trim(),
      last_name:     form.lastName.trim(),
      email:         form.email.trim().toLowerCase(),
      rsvp:          form.attending === 'yes' ? 'Confirmed' : 'Declined',
      dietary:       form.attending === 'yes' ? form.dietary : 'None',
      dietary_notes: form.attending === 'yes' ? form.dietaryNotes.trim() : '',
      notes:         form.notes.trim(),
    });

    setSubmitting(false);

    if (err) {
      setError('Something went wrong — please try again.');
      console.error(err);
      return;
    }

    setStep('thankyou');
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', background: 'var(--cream)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <p style={{ fontFamily: 'Jost, sans-serif', color: 'var(--mid-gray)', letterSpacing: '0.2em', fontSize: '0.7rem', textTransform: 'uppercase' }}>
          Loading…
        </p>
      </div>
    );
  }

  if (notFound || !wedding) {
    return (
      <div style={{
        minHeight: '100vh', background: 'var(--cream)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', padding: '2rem',
      }}>
        <h1 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: '2rem', fontWeight: 300, color: 'var(--charcoal)' }}>
          Page not found
        </h1>
      </div>
    );
  }

  // ── Thank You Screen ────────────────────────────────────────────────
  if (step === 'thankyou') {
    return (
      <div style={{
        minHeight: '100vh', background: 'var(--cream)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', padding: '2rem',
      }}>
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, height: '3px',
          background: 'linear-gradient(90deg, var(--blush), var(--champagne), var(--sage), var(--champagne), var(--blush))',
        }} />

        <div style={{ maxWidth: 480, width: '100%' }}>
          {/* Monogram-style icon */}
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'var(--blush)', margin: '0 auto 2rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: '1.8rem', lineHeight: 1 }}>
              {form.attending === 'yes' ? '✦' : '♡'}
            </span>
          </div>

          <p style={{
            fontFamily: 'Jost, sans-serif',
            fontSize: '0.6rem', letterSpacing: '0.3em',
            textTransform: 'uppercase', color: 'var(--champagne)',
            marginBottom: '1rem',
          }}>
            {form.attending === 'yes' ? 'See you there' : 'You will be missed'}
          </p>

          <h1 style={{
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontSize: 'clamp(2rem, 5vw, 3rem)',
            fontWeight: 300, lineHeight: 1.2,
            color: 'var(--charcoal)', marginBottom: '1.5rem',
          }}>
            Thank you,{' '}
            <span style={{ fontStyle: 'italic', color: 'var(--blush)' }}>
              {form.firstName}
            </span>
          </h1>

          <p style={{
            fontFamily: 'Lora, Georgia, serif',
            fontSize: '1rem', lineHeight: 1.7,
            color: 'var(--mid-gray)', marginBottom: '2.5rem',
          }}>
            {form.attending === 'yes'
              ? `We're so excited to celebrate with you. ${wedding.partner1_name} & ${wedding.partner2_name} look forward to seeing you soon.`
              : `We'll miss you dearly. Thank you for letting us know — we hope to celebrate with you another time.`
            }
          </p>

          <Link href={`/${slug}`} style={{
            display: 'inline-block',
            padding: '0.85rem 2.5rem',
            background: 'var(--charcoal)',
            color: 'white',
            borderRadius: 8,
            fontFamily: 'Jost, sans-serif',
            fontSize: '0.72rem',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            textDecoration: 'none',
          }}>
            Back to Wedding Page
          </Link>
        </div>
      </div>
    );
  }

  // ── RSVP Form ───────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
      {/* Gradient top bar */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: '3px', zIndex: 10,
        background: 'linear-gradient(90deg, var(--blush), var(--champagne), var(--sage), var(--champagne), var(--blush))',
      }} />

      {/* Mini header */}
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

      {/* Form container */}
      <div style={{
        maxWidth: 560, margin: '0 auto',
        padding: '3rem 1.5rem 4rem',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h2 style={{
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
            fontWeight: 300, color: 'var(--charcoal)',
            marginBottom: '0.5rem',
          }}>
            RSVP
          </h2>
          <p style={{
            fontFamily: 'Jost, sans-serif',
            fontSize: '0.78rem', color: 'var(--mid-gray)',
          }}>
            Kindly reply at your earliest convenience
          </p>
        </div>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Name */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={labelStyle}>First Name *</label>
              <input
                style={inputStyle} required
                value={form.firstName}
                onChange={e => set('firstName', e.target.value)}
                placeholder="Jane"
              />
            </div>
            <div>
              <label style={labelStyle}>Last Name</label>
              <input
                style={inputStyle}
                value={form.lastName}
                onChange={e => set('lastName', e.target.value)}
                placeholder="Smith"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label style={labelStyle}>Email (optional)</label>
            <input
              style={inputStyle} type="email"
              value={form.email}
              onChange={e => set('email', e.target.value)}
              placeholder="jane@example.com"
            />
          </div>

          {/* Attending toggle */}
          <div>
            <label style={labelStyle}>Will you be joining us? *</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {[
                { val: 'yes', emoji: '✦', label: 'Joyfully accepts' },
                { val: 'no',  emoji: '♡', label: 'Regretfully declines' },
              ].map(opt => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => set('attending', opt.val)}
                  style={{
                    padding: '1.25rem 1rem',
                    border: `2px solid ${form.attending === opt.val ? 'var(--charcoal)' : 'var(--light-gray)'}`,
                    borderRadius: 10,
                    background: form.attending === opt.val ? 'var(--charcoal)' : 'white',
                    color: form.attending === opt.val ? 'white' : 'var(--charcoal)',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ fontSize: '1.4rem', marginBottom: '0.4rem' }}>{opt.emoji}</div>
                  <p style={{
                    fontFamily: 'Cormorant Garamond, Georgia, serif',
                    fontSize: '1rem', fontWeight: 300,
                  }}>{opt.label}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Dietary — only if attending */}
          {form.attending === 'yes' && (
            <>
              <div>
                <label style={labelStyle}>Dietary Requirements</label>
                <select
                  style={inputStyle}
                  value={form.dietary}
                  onChange={e => set('dietary', e.target.value)}
                >
                  {DIETARY_OPTIONS.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {form.dietary !== 'None' && (
                <div>
                  <label style={labelStyle}>Please describe your dietary needs</label>
                  <input
                    style={inputStyle}
                    value={form.dietaryNotes}
                    onChange={e => set('dietaryNotes', e.target.value)}
                    placeholder="Any specifics we should know..."
                  />
                </div>
              )}
            </>
          )}

          {/* Message */}
          <div>
            <label style={labelStyle}>Message to the couple (optional)</label>
            <textarea
              style={{ ...inputStyle, resize: 'vertical', minHeight: '90px' }}
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              placeholder="Share a message, well-wishes, or anything else..."
            />
          </div>

          {error && (
            <p style={{
              fontFamily: 'Jost, sans-serif',
              fontSize: '0.75rem', color: '#721C24',
              background: '#F8D7DA', padding: '0.65rem 0.9rem',
              borderRadius: 8,
            }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            style={{
              width: '100%', padding: '1.1rem',
              background: submitting ? 'var(--mid-gray)' : 'var(--charcoal)',
              color: 'white', border: 'none', borderRadius: 10,
              fontFamily: 'Jost, sans-serif',
              fontSize: '0.75rem', letterSpacing: '0.2em',
              textTransform: 'uppercase',
              cursor: submitting ? 'default' : 'pointer',
              transition: 'background 0.2s',
            }}
          >
            {submitting ? 'Sending…' : 'Send RSVP'}
          </button>

        </form>
      </div>
    </div>
  );
}
