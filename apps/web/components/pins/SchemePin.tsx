'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  BookmarkSimple,
  CheckCircle,
  Clock,
  Info,
  Question,
  Scales,
  ArrowUpRight,
  Tractor,
  GraduationCap,
  GenderFemale,
  Heart,
  Briefcase,
  Storefront,
  FirstAid,
  House,
} from '@phosphor-icons/react';
import type { Locale, RankedScheme, SchemeRecord } from '@/lib/types';
import { getSchemeName, getSchemeSummary } from '@/lib/i18n/messages';
import { formatINR } from '@/lib/benefits';
import { formatNearMissBanner } from '@/lib/explain';
import { getDeadlineUrgency } from '@/lib/citizen/tools';

const CATEGORY_ICONS: Record<SchemeRecord['category'], typeof Tractor> = {
  farmers: Tractor,
  students: GraduationCap,
  women: GenderFemale,
  seniors: Heart,
  workers: Briefcase,
  entrepreneurs: Storefront,
  health: FirstAid,
  housing: House,
};

interface SchemePinProps {
  item: RankedScheme;
  locale: Locale;
  bookmarked: boolean;
  compared: boolean;
  onToggleBookmark: (id: string) => void;
  onToggleCompare: (id: string) => void;
  variant?: 'compact' | 'tall' | 'featured';
}

export function SchemePin({
  item,
  locale,
  bookmarked,
  compared,
  onToggleBookmark,
  onToggleCompare,
  variant = 'compact',
}: SchemePinProps) {
  const { scheme, eligibility, benefit, readinessPct, daysToReady } = item;
  const Icon = CATEGORY_ICONS[scheme.category] ?? Tractor;
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, gx: 50, gy: 50 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setTilt({
      rx: Number(((0.5 - y) * 6).toFixed(2)),
      ry: Number(((x - 0.5) * 6).toFixed(2)),
      gx: Math.round(x * 100),
      gy: Math.round(y * 100),
    });
  };

  const resetTilt = () => setTilt({ rx: 0, ry: 0, gx: 50, gy: 50 });

  const statusConfig =
    eligibility.status === 'eligible'
      ? {
          cls: 'bg-green text-white',
          label: locale === 'hi' ? 'पात्र' : locale === 'gu' ? 'પાત્ર' : 'Eligible',
          Icon: CheckCircle,
        }
      : eligibility.status === 'likely'
      ? {
          cls: 'bg-yellow text-ink',
          label: locale === 'hi' ? 'संभावित' : locale === 'gu' ? 'સંભવિત' : 'Likely',
          Icon: Question,
        }
      : {
          cls: 'border border-blue bg-white/90 text-blue-700',
          label: locale === 'hi' ? 'अपात्र' : locale === 'gu' ? 'પાત્ર નથી' : 'Not eligible',
          Icon: Info,
        };

  const StatusIcon = statusConfig.Icon;
  const ringRadius = 15;
  const ringCirc = 2 * Math.PI * ringRadius;
  const ringOffset = ringCirc - (readinessPct / 100) * ringCirc;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="masonry-item"
    >
      <div
        onMouseMove={handleMouseMove}
        onMouseLeave={resetTilt}
        style={{
          transform: `perspective(900px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) translateY(${tilt.rx || tilt.ry ? -6 : 0}px)`,
          backgroundImage: `radial-gradient(circle at ${tilt.gx}% ${tilt.gy}%, rgba(255,255,255,0.88), rgba(255,255,255,0.62) 60%)`,
        }}
        className={`glass relative p-5 transition-all duration-200 hover:shadow-glass-hover ${
          variant === 'featured' ? 'border-blue/35' : ''
        }`}
      >
        {/* Top Row: Category + Level + Status */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-chip bg-blue-50 text-blue">
              <Icon size={20} weight="duotone" />
            </span>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
                {scheme.category} • {scheme.level === 'state' ? scheme.state : 'Central'}
              </span>
              {scheme.exclusiveGroup && (
                <div className="text-[10px] font-semibold text-ink/60">
                  Group: {scheme.exclusiveGroup}
                </div>
              )}
            </div>
          </div>

          <span
            className={`inline-flex items-center gap-1 rounded-pill px-2.5 py-1 text-xs font-bold ${statusConfig.cls}`}
          >
            <StatusIcon size={14} weight="duotone" />
            {statusConfig.label}
          </span>
        </div>

        {/* Title */}
        <Link href={`/schemes/${scheme.slug}`} className="mt-3 block group">
          <h3 className="font-display text-lg font-bold leading-snug text-ink group-hover:text-blue">
            {getSchemeName(scheme, locale)}
          </h3>
        </Link>

        {/* Sunbeam Yellow Benefit Sticker (navy text on yellow) */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <div className="inline-flex items-center gap-1.5 rounded-chip bg-yellow px-3 py-1.5 text-ink shadow-sm">
            <span className="font-mono-num text-base font-bold">
              {formatINR(benefit.annualEstimate)}
            </span>
            <span className="text-[11px] font-semibold opacity-85">
              /{scheme.benefitPeriod === 'one_time' ? 'once' : 'yr'} (est.)
            </span>
          </div>

          {/* Mini Document Readiness Ring */}
          <div className="flex items-center gap-1.5" title={`Document readiness: ${readinessPct}%`}>
            <svg width="38" height="38" viewBox="0 0 38 38" className="-rotate-90">
              <circle
                cx="19"
                cy="19"
                r={ringRadius}
                fill="none"
                stroke="rgba(20,121,255,0.16)"
                strokeWidth="3.5"
              />
              <circle
                cx="19"
                cy="19"
                r={ringRadius}
                fill="none"
                stroke={readinessPct === 100 ? '#12B76A' : '#1479FF'}
                strokeWidth="3.5"
                strokeDasharray={ringCirc}
                strokeDashoffset={ringOffset}
                strokeLinecap="round"
              />
            </svg>
            <span className="font-mono-num text-xs font-bold text-ink">{readinessPct}%</span>
          </div>
        </div>

        {/* Summary */}
        <p className={`mt-3 text-sm leading-relaxed text-ink/80 ${variant === 'tall' ? '' : 'line-clamp-3'}`}>
          {getSchemeSummary(scheme, locale)}
        </p>

        {/* Near-Miss Ribbon */}
        {eligibility.near_miss && (
          <div className="near-miss-tape mt-3 rounded-chip px-3 py-2 text-xs font-bold text-ink">
            {formatNearMissBanner(eligibility.near_miss, locale)}
          </div>
        )}

        {/* Deadline & Readiness Time-to-Apply Estimator */}
        <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] font-semibold text-ink/70">
          {(() => {
            const urg = getDeadlineUrgency(scheme.deadline);
            return (
              <span
                className={`inline-flex items-center gap-1 rounded-pill px-2.5 py-0.5 font-bold ${
                  urg.urgencyLevel === 'urgent'
                    ? 'bg-yellow text-ink'
                    : urg.urgencyLevel === 'soon'
                    ? 'bg-yellow-50 text-ink'
                    : 'bg-white text-ink/75 border border-blue/15'
                }`}
              >
                <Clock size={12} weight="duotone" />
                {urg.badgeText}
              </span>
            );
          })()}
          <span className="inline-flex items-center gap-1 rounded-pill bg-blue-50 px-2.5 py-0.5 text-blue-700">
            {daysToReady === 0 ? 'Docs Ready Today' : `~${daysToReady}d to gather docs`}
          </span>
        </div>

        {/* Actions */}
        <div className="mt-4 flex items-center justify-between gap-2 border-t border-blue/10 pt-3">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onToggleBookmark(scheme.id)}
              aria-label="Bookmark scheme"
              className={`inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-pill border transition ${
                bookmarked
                  ? 'border-yellow bg-yellow text-ink'
                  : 'border-blue/20 bg-white/80 text-ink hover:bg-blue-50'
              }`}
            >
              <BookmarkSimple size={18} weight={bookmarked ? 'fill' : 'duotone'} />
            </button>
            <button
              type="button"
              onClick={() => onToggleCompare(scheme.id)}
              aria-label="Compare scheme"
              className={`inline-flex min-h-[40px] items-center gap-1 rounded-pill border px-2.5 text-xs font-bold transition ${
                compared
                  ? 'border-blue bg-blue text-white'
                  : 'border-blue/20 bg-white/80 text-ink hover:bg-blue-50'
              }`}
            >
              <Scales size={16} weight="duotone" />
              {compared ? 'In Compare' : 'Compare'}
            </button>
          </div>

          <Link
            href={`/schemes/${scheme.slug}`}
            className="inline-flex min-h-[40px] items-center gap-1 rounded-pill bg-blue px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-blue-700"
          >
            Why & Apply
            <ArrowUpRight size={14} weight="bold" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

