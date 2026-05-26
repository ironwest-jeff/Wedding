'use client';
import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

// Old URL: /[slug]/rsvp/[code]
// Redirects to new URL: /[slug]/[code]/rsvp
export default function LegacyRsvpRedirect() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;
  const code = params?.code as string;

  useEffect(() => {
    if (slug && code) {
      router.replace(`/${slug}/${code}/rsvp`);
    }
  }, [slug, code, router]);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ fontFamily: 'Jost, sans-serif', color: 'var(--mid-gray)', fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
        Redirecting…
      </p>
    </div>
  );
}
