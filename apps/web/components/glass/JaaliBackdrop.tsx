'use client';

export function JaaliBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-mist"
    >
      {/* Large blurred blobs: blue & yellow at 20-30%, plus one small green glow */}
      <div
        className="absolute -left-24 -top-24 h-[460px] w-[460px] rounded-full opacity-25"
        style={{ background: '#1479FF', filter: 'blur(90px)' }}
      />
      <div
        className="absolute right-[-120px] top-[12%] h-[420px] w-[420px] rounded-full opacity-25"
        style={{ background: '#FFC20E', filter: 'blur(90px)' }}
      />
      <div
        className="absolute bottom-[-140px] left-[28%] h-[440px] w-[440px] rounded-full opacity-20"
        style={{ background: '#1479FF', filter: 'blur(90px)' }}
      />
      <div
        className="absolute bottom-[14%] right-[12%] h-[220px] w-[220px] rounded-full opacity-15"
        style={{ background: '#12B76A', filter: 'blur(90px)' }}
      />

      {/* Slowly rotating rangoli radial geometry */}
      <svg
        className="animate-rangoli absolute right-[-160px] top-[-120px] h-[560px] w-[560px] opacity-[0.07]"
        viewBox="0 0 200 200"
        fill="none"
      >
        <circle cx="100" cy="100" r="90" stroke="#1479FF" strokeWidth="1.2" strokeDasharray="6 6" />
        <circle cx="100" cy="100" r="68" stroke="#FFC20E" strokeWidth="1.5" />
        <circle cx="100" cy="100" r="46" stroke="#1479FF" strokeWidth="1" />
        {Array.from({ length: 12 }).map((_, idx) => {
          const angle = (idx * 30 * Math.PI) / 180;
          const x2 = 100 + Math.cos(angle) * 90;
          const y2 = 100 + Math.sin(angle) * 90;
          return (
            <line
              key={idx}
              x1="100"
              y1="100"
              x2={x2}
              y2={y2}
              stroke="#1479FF"
              strokeWidth="0.9"
            />
          );
        })}
      </svg>

      {/* Animated Indian jaali geometric SVG lattice (blue lines at 8% opacity) */}
      <svg
        className="animate-jaali absolute -inset-12 h-[120%] w-[120%] opacity-[0.08]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="jaali-pattern" width="64" height="64" patternUnits="userSpaceOnUse">
            <path
              d="M32 0L64 32L32 64L0 32Z"
              fill="none"
              stroke="#1479FF"
              strokeWidth="1"
            />
            <circle cx="32" cy="32" r="8" fill="none" stroke="#1479FF" strokeWidth="0.9" />
            <circle cx="0" cy="0" r="4" fill="none" stroke="#1479FF" strokeWidth="0.8" />
            <circle cx="64" cy="0" r="4" fill="none" stroke="#1479FF" strokeWidth="0.8" />
            <circle cx="0" cy="64" r="4" fill="none" stroke="#1479FF" strokeWidth="0.8" />
            <circle cx="64" cy="64" r="4" fill="none" stroke="#1479FF" strokeWidth="0.8" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#jaali-pattern)" />
      </svg>

      {/* Subtle 3% procedural SVG noise texture */}
      <svg className="absolute inset-0 h-full w-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
        <filter id="ss-noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#ss-noise)" />
      </svg>
    </div>
  );
}

