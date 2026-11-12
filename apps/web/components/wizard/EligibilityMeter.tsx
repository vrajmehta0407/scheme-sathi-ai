'use client';

import type { EligibilityResult } from '@/lib/types';

export function EligibilityMeter({ result }: { result: EligibilityResult }) {
  const total = Math.max(1, result.criteria.length);
  const passed = result.criteria.filter((c) => c.passed === true).length;
  const unknown = result.criteria.filter((c) => c.passed === null).length;

  const pct = Math.round(((passed + unknown * 0.45) / total) * 100);
  const passedAngle = (passed / total) * 180;
  const unknownAngle = (unknown / total) * 180;
  const needleAngle = -90 + (pct / 100) * 180;

  const radius = 78;
  const cx = 100;
  const cy = 96;
  const semiCircumference = Math.PI * radius;
  const greenLen = (passedAngle / 180) * semiCircumference;
  const yellowLen = (unknownAngle / 180) * semiCircumference;

  return (
    <div className="flex flex-col items-center">
      <svg width="200" height="118" viewBox="0 0 200 118" aria-label={`Eligibility confidence ${pct}%`}>
        {/* Track */}
        <path
          d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
          fill="none"
          stroke="rgba(20,121,255,0.18)"
          strokeWidth="16"
          strokeLinecap="round"
        />
        {/* Unknown (Yellow) */}
        {yellowLen > 0 && (
          <path
            d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
            fill="none"
            stroke="#FFC20E"
            strokeWidth="16"
            strokeDasharray={`${greenLen + yellowLen} ${semiCircumference}`}
            strokeLinecap="round"
          />
        )}
        {/* Passed (Green) */}
        {greenLen > 0 && (
          <path
            d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
            fill="none"
            stroke="#12B76A"
            strokeWidth="16"
            strokeDasharray={`${greenLen} ${semiCircumference}`}
            strokeLinecap="round"
          />
        )}
        {/* Needle */}
        <g transform={`translate(${cx}, ${cy}) rotate(${needleAngle})`}>
          <line x1="0" y1="0" x2="0" y2="-62" stroke="#0A1A3C" strokeWidth="3.5" strokeLinecap="round" />
          <circle cx="0" cy="0" r="7" fill="#1479FF" stroke="#FFFFFF" strokeWidth="2" />
        </g>
      </svg>
      <div className="-mt-2 text-center">
        <div className="font-mono-num text-2xl font-bold text-ink">{pct}%</div>
        <div className="text-xs font-semibold text-ink/70">
          {passed}/{total} rules passed {unknown > 0 ? `• ${unknown} pending` : ''}
        </div>
      </div>
    </div>
  );
}

