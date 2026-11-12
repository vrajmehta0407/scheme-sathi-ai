'use client';

import { useEffect, useState } from 'react';

export function BlobCursor() {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [interactive, setInteractive] = useState(false);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = window.matchMedia('(pointer: fine)').matches;
    if (reduced || !finePointer) return;
    setEnabled(true);

    const onMove = (e: MouseEvent) => {
      setPos({ x: e.clientX, y: e.clientY });
      const target = e.target as HTMLElement | null;
      const isInteractive = Boolean(
        target?.closest('a, button, input, select, [role="button"]')
      );
      setInteractive(isInteractive);
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  if (!enabled) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-50 hidden -translate-x-1/2 -translate-y-1/2 rounded-full transition-transform duration-150 md:block"
      style={{
        transform: `translate3d(${pos.x}px, ${pos.y}px, 0) translate(-50%, -50%) scale(${interactive ? 1.35 : 1})`,
        width: interactive ? 34 : 22,
        height: interactive ? 34 : 22,
        backgroundColor: 'rgba(20, 121, 255, 0.14)',
        border: interactive ? '2px solid #FFC20E' : '1px solid rgba(20, 121, 255, 0.35)',
      }}
    />
  );
}

