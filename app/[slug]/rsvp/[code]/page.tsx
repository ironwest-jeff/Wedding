'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Wedding, Invite } from '@/lib/types';

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

export default function PersonalizedRsvpPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const code = params?.code as string;

  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [invite, setInvite] = useState<Invite | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [alreadyUsed, setAlreadyUsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    attending: '' as 'yes' | 'no' | '',
    mealChoice: '',
    dietary: 'None',
    dietaryNotes: '',
    notes: '',
  });

  useEffect(() => {
    if (!slug || !code) return;
    Promise.all([
      supabase.from('weddings').select('*').eq('slug', slug).maybeSingle(),
      supabase.from('invites').select('*').eq('code', code).maybeSingle(),
    ]).then(([{ data: w }, { data: inv }]) => {
      if (!w || !inv) { setNotFound(true); setLoading(false); return; }
      if ((inv as Invite).wedding_id !== (w as Wedding).id) { setNotFound(true); setLoading(false); return; }
      if ((inv as Invite).used) { setAlreadyUsed(true); }
      setWedding(w as Wedding);
      setInvite(inv as Invite);
      setForm(f => ({
        ...f,
        firstName: (inv as Invite).first_name,
        lastName: (inv as Invite).last_name,
      }));
      setLoading(false);
    });
  }, [slug, code]);

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!wedding || !invite) return;
    if (!form.attending) { setError('Please let us know if you can attend.'); return; }
    setError('');
    setSubmitting(true);

    const [subRes, invRes] = await Promise.all([
      supabase.from('rsvp_submissions').insert({
        wedding_id:    wedding.id,
        invite_code:   code,
        guest_id:      invite.guest_id,
        first_name:    form.firstName.trim(),
        last_name:     form.lastName.trim(),
        email:         form.email.trim().toLowerCase(),
        rsvp:          form.attending === 'yes' ? 'Confirmed' : 'Declined',
        meal_choice:   form.attending === 'yes' ? form.mealChoice : '',
        dietary:       form.attending === 'yes' ? form.dietary : 'None',
        dietary_notes: form.attending === 'yes' ? form.dietaryNotes.trim() : '',
        notes:         form.notes.trim(),
      }),
      supabase.from('invites').update({ used: true }).eq('code', code),
    ]);

    setSubmitting(false);

    if (subRes.error) {
      setError('Something went wrong — please try again.');
      return;
    }

    setDone(true);
  }

  // ── States ──────────────────────────────────────────────────────────

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ fontFamily: 'Jost, sans-serif', color: 'var(--mid-gray)', letterSpacing: '0.2em', fontSize: '0.7rem', textTransform: 'uppercase' }}>Loading…</p>
    </div>
  );

  if (notFound) return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '2rem' }}>
      <h1 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: '2rem', fontWeight: 300, color: 'var(--charcoal)', marginBottom: '0.75rem' }}>Invite not found</h1>
      <p style={{ fontFamily: 'Jost, sans-serif', color: 'var(--mid-gray)', fontSize: '0.82rem' }}>This link may be invalid or expired. Please contact the couple.</p>
    </div>
  );

  // Already RSVP'd
  if (alreadyUsed && !done) return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '2rem' }}>
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, var(--blush), var(--champagne), var(--sage), var(--champagne), var(--blush))' }} />
      <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--sage)', margin: '0 auto 2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: '1.5rem' }}>✓</span>
      </div>
      <h1 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontWeight: 300, color: 'var(--charcoal)', marginBottom: '1rem' }}>
        Already responded,{' '}
        <span style={{ fontStyle: 'italic', color: 'var(--blush)' }}>{invite?.first_name}</span>
      </h1>
      <p style={{ fontFamily: 'Jost, sans-serif', fontSize: '0.82rem', color: 'var(--mid-gray)', marginBottom: '2rem' }}>
        We already have your RSVP. If something changed, please reach out to {wedding?.partner1_name} or {wedding?.partner2_name} directly.
      </p>
      <Link href={`/${slug}`} style={{ display: 'inline-block', padding: '0.85rem 2rem', background: 'var(--charcoal)', color: 'white', borderRadius: 8, fontFamily: 'Jost, sans-serif', fontSize: '0.72rem', letterSpacing: '0.2em', textTransform: 'uppercase', textDecoration: 'none' }}>
        View Wedding Page
      </Link>
    </div>
  );

  // Thank you screen
  if (done) return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '2rem' }}>
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, var(--blush), var(--champagne), var(--sage), var(--champagne), var(--blush))' }} />
      <div style={{ maxWidth: 480, width: '100%' }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--blush)', margin: '0 auto 2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '1.8rem' }}>{form.attending === 'yes' ? '✦' : '♡'}</span>
        </div>
        <p style={{ fontFamily: 'Jost, sans-serif', fontSize: '0.6rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--champagne)', marginBottom: '1rem' }}>
          {form.attending === 'yes' ? 'See you there' : 'You will be missed'}
        </p>
        <h1 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 300, lineHeight: 1.2, color: 'var(--charcoal)', marginBottom: '1.5rem' }}>
          Thank you,{' '}
          <span style={{ fontStyle: 'italic', color: 'var(--blush)' }}>{form.firstName}</span>
        </h1>
        <p style={{ fontFamily: 'Lora, Georgia, serif', fontSize: '1rem', lineHeight: 1.7, color: 'var(--mid-gray)', marginBottom: '2.5rem' }}>
          {form.attending === 'yes'
            ? `We can't wait to celebrate with you. ${wedding?.partner1_name} & ${wedding?.partner2_name} look forward to seeing you soon.`
            : `We'll miss you dearly. Thank you for letting us know.`}
        </p>
        <Link href={`/${slug}`} style={{ display: 'inline-block', padding: '0.85rem 2.5rem', background: 'var(--charcoal)', color: 'white', borderRadius: 8, fontFamily: 'Jost, sans-serif', fontSize: '0.72rem', letterSpacing: '0.2em', textTransform: 'uppercase', textDecoration: 'none' }}>
          View Wedding Page
        </Link>
      </div>
    </div>
  );

  // ── Personalized RSVP Form ──────────────────────────────────────────
  const mealChoices = wedding?.meal_choices ?? [];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: '3px', zIndex: 10, background: 'linear-gradient(90deg, var(--blush), var(--champagne), var(--sage), var(--champagne), var(--blush))' }} />

      {/* Header */}
      <div style={{ paddingTop: '3rem', paddingBottom: '2.5rem', textAlign: 'center', background: 'var(--charcoal)', position: 'relative' }}>
        <Link href={`/${slug}`} style={{ position: 'absolute', left: '2rem', top: '50%', transform: 'translateY(-50%)', fontFamily: 'Jost, sans-serif', fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>
          ← Back
        </Link>
        <p style={{ fontFamily: 'Jost, sans-serif', fontSize: '0.6rem', letterSpacing: '0.35em', textTransform: 'uppercase', color: 'var(--champagne)', marginBottom: '0.5rem' }}>
          You&apos;re invited
        </p>
        <h1 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', fontWeight: 300, color: 'white' }}>
          {wedding?.partner1_name} &amp;{' '}
          <span style={{ fontStyle: 'italic', color: 'var(--blush)' }}>{wedding?.partner2_name}</span>
        </h1>
      </div>

      {/* Personalized welcome */}
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '2.5rem 1.5rem 0' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h2 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontWeight: 300, color: 'var(--charcoal)', marginBottom: '0.5rem' }}>
            Welcome,{' '}
            <span style={{ fontStyle: 'italic', color: 'var(--blush)' }}>
              {invite?.first_name}{invite?.last_name ? ` ${invite.last_name}` : ''}
            </span>
          </h2>
          <p style={{ fontFamily: 'Jost, sans-serif', fontSize: '0.8rem', color: 'var(--mid-gray)', lineHeight: 1.6 }}>
            We&apos;re so happy you&apos;re here. Please take a moment to let us know if you can make it.
          </p>
        </div>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '4rem' }}>

          {/* Name — pre-filled but editable */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={labelStyle}>First Name</label>
              <input style={inputStyle} value={form.firstName} onChange={e => set('firstName', e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Last Name</label>
              <input style={inputStyle} value={form.lastName} onChange={e => set('lastName', e.target.value)} />
            </div>
          </div>

          {/* Email */}
          <div>
            <label style={labelStyle}>Email (optional)</label>
            <input style={inputStyle} type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="For any updates from the couple" />
          </div>

          {/* Attending */}
          <div>
            <label style={labelStyle}>Will you be joining us? *</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {[
                { val: 'yes', emoji: '✦', label: 'Joyfully accepts' },
                { val: 'no',  emoji: '♡', label: 'Regretfully declines' },
              ].map(opt => (
                <button key={opt.val} type="button" onClick={() => set('attending', opt.val)} style={{
                  padding: '1.25rem 1rem',
                  border: `2px solid ${form.attending === opt.val ? 'var(--charcoal)' : 'var(--light-gray)'}`,
                  borderRadius: 10,
                  background: form.attending === opt.val ? 'var(--charcoal)' : 'white',
                  color: form.attending === opt.val ? 'white' : 'var(--charcoal)',
                  cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s',
                }}>
                  <div style={{ fontSize: '1.4rem', marginBottom: '0.4rem' }}>{opt.emoji}</div>
                  <p style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: '1rem', fontWeight: 300 }}>{opt.label}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Meal choice */}
          {form.attending === 'yes' && mealChoices.length > 0 && (
            <div>
              <label style={labelStyle}>Meal Selection *</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {mealChoices.map(m => (
                  <button key={m} type="button" onClick={() => set('mealChoice', m)} style={{
                    padding: '0.85rem 1rem',
                    border: `2px solid ${form.mealChoice === m ? 'var(--charcoal)' : 'var(--light-gray)'}`,
                    borderRadius: 10,
                    background: form.mealChoice === m ? 'var(--charcoal)' : 'white',
                    color: form.mealChoice === m ? 'white' : 'var(--charcoal)',
                    cursor: 'pointer', textAlign: 'left',
                    fontFamily: 'Cormorant Garamond, Georgia, serif',
                    fontSize: '1rem', fontWeight: 300, transition: 'all 0.15s',
                  }}>
                    {m}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Dietary */}
          {form.attending === 'yes' && (
            <>
              <div>
                <label style={labelStyle}>Dietary Requirements</label>
                <select style={inputStyle} value={form.dietary} onChange={e => set('dietary', e.target.value)}>
                  {DIETARY_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              {form.dietary !== 'None' && (
                <div>
                  <label style={labelStyle}>Please describe</label>
                  <input style={inputStyle} value={form.dietaryNotes} onChange={e => set('dietaryNotes', e.target.value)} placeholder="Any specifics…" />
                </div>
              )}
            </>
          )}

          {/* Message */}
          <div>
            <label style={labelStyle}>Message to the couple (optional)</label>
            <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: '90px' }} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Share a wish, a memory, or just say hello…" />
          </div>

          {error && (
            <p style={{ fontFamily: 'Jost, sans-serif', fontSize: '0.75rem', color: '#721C24', background: '#F8D7DA', padding: '0.65rem 0.9rem', borderRadius: 8 }}>{error}</p>
          )}

          <button type="submit" disabled={submitting} style={{
            width: '100%', padding: '1.1rem',
            background: submitting ? 'var(--mid-gray)' : 'var(--charcoal)',
            color: 'white', border: 'none', borderRadius: 10,
            fontFamily: 'Jost, sans-serif', fontSize: '0.75rem',
            letterSpacing: '0.2em', textTransform: 'uppercase',
            cursor: submitting ? 'default' : 'pointer', transition: 'background 0.2s',
          }}>
            {submitting ? 'Sending…' : 'Send RSVP'}
          </button>

        </form>
      </div>
    </div>
  );
}
