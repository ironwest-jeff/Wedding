'use client';
import { useEffect, useRef, useState } from 'react';

export default function GuestMusicPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [blocked, setBlocked] = useState(false); // browser blocked autoplay
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = 0.3;

    const tryAutoplay = () => {
      audio.play()
        .then(() => {
          setPlaying(true);
          setBlocked(false);
          setVisible(true);
        })
        .catch(() => {
          // Browser blocked autoplay — show the tap-to-play prompt
          setBlocked(true);
          setVisible(true);
        });
    };

    // Small delay so page has settled before attempting
    const t = setTimeout(tryAutoplay, 800);
    return () => clearTimeout(t);
  }, []);

  function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play().then(() => { setPlaying(true); setBlocked(false); }).catch(() => {});
    }
  }

  if (!visible) return <audio ref={audioRef} src="/bg-music.m4a" loop preload="auto" />;

  return (
    <>
      <audio ref={audioRef} src="/bg-music.m4a" loop preload="auto" />
      <div style={{
        position: 'fixed',
        bottom: '1.5rem',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 100,
        animation: 'fadeIn 0.6s ease',
      }}>
        <button
          onClick={toggle}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.6rem',
            background: 'rgba(20,16,10,0.75)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 30,
            padding: blocked ? '0.65rem 1.4rem' : '0.5rem 1.1rem 0.5rem 0.75rem',
            cursor: 'pointer',
            color: 'white',
            transition: 'all 0.25s',
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 24px rgba(0,0,0,0.35)',
          }}
        >
          {/* Animated bars when playing, note icon when paused/blocked */}
          <span style={{ display: 'flex', alignItems: 'center', gap: '2px', height: 16 }}>
            {playing ? (
              <>
                {[1, 2, 3, 4].map(i => (
                  <span key={i} style={{
                    display: 'inline-block',
                    width: 3, borderRadius: 2,
                    background: 'var(--champagne)',
                    animation: `musicBar${i} 0.8s ease-in-out infinite`,
                    animationDelay: `${(i - 1) * 0.15}s`,
                    height: `${[10, 16, 12, 8][i - 1]}px`,
                  }} />
                ))}
              </>
            ) : (
              <span style={{ fontSize: '1rem', color: blocked ? 'var(--blush)' : 'rgba(255,255,255,0.6)' }}>♫</span>
            )}
          </span>

          <span style={{
            fontFamily: 'Jost, sans-serif',
            fontSize: blocked ? '0.72rem' : '0.65rem',
            letterSpacing: blocked ? '0.08em' : '0.06em',
            color: blocked ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.7)',
          }}>
            {blocked
              ? 'Tap to hear our song'
              : playing
                ? 'Woke Up in Love'
                : 'Play music'
            }
          </span>

          {!blocked && (
            <span style={{ fontFamily: 'Jost, sans-serif', fontSize: '0.6rem', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.08em' }}>
              {playing ? '❚❚' : '▶'}
            </span>
          )}
        </button>
      </div>

      <style>{`
        @keyframes musicBar1 { 0%,100%{height:6px} 50%{height:14px} }
        @keyframes musicBar2 { 0%,100%{height:14px} 50%{height:6px} }
        @keyframes musicBar3 { 0%,100%{height:10px} 50%{height:16px} }
        @keyframes musicBar4 { 0%,100%{height:8px} 50%{height:10px} }
      `}</style>
    </>
  );
}
