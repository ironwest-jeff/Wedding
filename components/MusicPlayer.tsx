'use client';
import { useEffect, useRef, useState } from 'react';

export default function MusicPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = 0.35;
    const onReady = () => setReady(true);
    audio.addEventListener('canplaythrough', onReady);
    return () => audio.removeEventListener('canplaythrough', onReady);
  }, []);

  function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play().then(() => setPlaying(true)).catch(() => {});
    }
  }

  return (
    <>
      <audio ref={audioRef} src="/bg-music.m4a" loop preload="auto" />
      <button
        onClick={toggle}
        title={playing ? 'Pause music' : 'Play music'}
        className="font-sans-clean"
        style={{
          display: 'flex', alignItems: 'center', gap: '0.4rem',
          background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.13)',
          borderRadius: 20, padding: '0.35rem 0.8rem',
          cursor: ready ? 'pointer' : 'default',
          color: playing ? 'var(--champagne)' : 'rgba(255,255,255,0.65)',
          fontSize: '0.6rem', letterSpacing: '0.12em',
          textTransform: 'uppercase', transition: 'all 0.2s',
          opacity: ready ? 1 : 0.5,
        }}
      >
        <span style={{ fontSize: '0.85rem' }}>{playing ? '♫' : '♩'}</span>
        {playing ? 'Playing' : 'Music'}
      </button>
    </>
  );
}
