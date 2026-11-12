'use client';

import { motion, AnimatePresence } from 'framer-motion';

const BRAND_DOTS = Array.from({ length: 18 }).map((_, idx) => ({
  id: idx,
  color: idx % 3 === 0 ? '#1479FF' : idx % 3 === 1 ? '#FFC20E' : '#12B76A',
  angle: (idx / 18) * Math.PI * 2,
  dist: 48 + (idx % 4) * 18,
  size: 7 + (idx % 3) * 3,
}));

export function BrandConfetti({ active }: { active: boolean }) {
  return (
    <AnimatePresence>
      {active && (
        <div
          aria-hidden="true"
          className="pointer-events-none relative flex items-center justify-center"
        >
          {BRAND_DOTS.map((d) => (
            <motion.span
              key={d.id}
              initial={{ opacity: 1, x: 0, y: 0, scale: 0.4 }}
              animate={{
                opacity: 0,
                x: Math.cos(d.angle) * d.dist,
                y: Math.sin(d.angle) * d.dist - 12,
                scale: 1.2,
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              className="absolute rounded-full"
              style={{
                width: d.size,
                height: d.size,
                backgroundColor: d.color,
              }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}

