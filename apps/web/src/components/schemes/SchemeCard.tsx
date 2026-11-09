'use client';

import React, { useState, useRef } from 'react';
import { Scheme, MatchStatus, Language, SCHEME_CATEGORIES } from '@schemesathi/shared';
import { translations } from '../../lib/i18n';
import { Bookmark, CheckCircle2, AlertTriangle, HelpCircle, XCircle, ArrowUpRight, ShieldCheck, Sparkles } from 'lucide-react';

interface SchemeCardProps {
  scheme: Scheme;
  matchStatus?: MatchStatus;
  matchedCount?: number;
  unknownCount?: number;
  language: Language;
  isSaved: boolean;
  onToggleSave: (id: string) => void;
  onOpenDetails: (scheme: Scheme) => void;
}

export const SchemeCard: React.FC<SchemeCardProps> = ({
  scheme,
  matchStatus = 'needs_more_info',
  matchedCount = 0,
  unknownCount = 0,
  language,
  isSaved,
  onToggleSave,
  onOpenDetails,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [glowPos, setGlowPos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const t = translations[language].results;
  const cat = SCHEME_CATEGORIES.find((c) => c.id === scheme.category);

  // 3D tilt & cursor spotlight
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotX = ((y - centerY) / centerY) * -8; // subtle max 8 deg tilt
    const rotY = ((x - centerX) / centerX) * 8;

    setTilt({ x: rotX, y: rotY });
    setGlowPos({ x, y });
  };

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => {
    setIsHovered(false);
    setTilt({ x: 0, y: 0 });
  };

  // Match badge styling & label
  const renderMatchBadge = () => {
    switch (matchStatus) {
      case 'strong_match':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-status-success-soft text-status-success border border-status-success/25 shadow-xs">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {t.potentialMatch}
          </span>
        );
      case 'possible_match':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-accent-mango-soft text-[#9A6400] border border-accent-mango/35 shadow-xs">
            <AlertTriangle className="w-3.5 h-3.5" />
            {t.possibleMatch}
          </span>
        );
      case 'does_not_match':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-black/5 text-ink-muted border border-editorial-border">
            <XCircle className="w-3.5 h-3.5" />
            {t.doesNotMatch}
          </span>
        );
      case 'needs_more_info':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-accent-sky-soft text-ink-light border border-accent-sky/35">
            <HelpCircle className="w-3.5 h-3.5 text-primary" />
            {t.needsDetails}
          </span>
        );
    }
  };

  const schemeTitle = language === 'gu' ? scheme.name_gu : scheme.name_en;
  const schemeSummary = language === 'gu' ? scheme.short_description_gu : scheme.short_description_en;
  const benefitSummary = language === 'gu' ? scheme.benefit_summary_gu : scheme.benefit_summary_en;
  const categoryLabel = language === 'gu' ? cat?.label_gu : cat?.label_en;

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="card-3d-wrapper perspective-1000 h-full"
    >
      <div
        className="editorial-card h-full flex flex-col justify-between p-6 sm:p-7 relative overflow-hidden bg-white transform-style-3d cursor-pointer"
        style={{
          transform: isHovered
            ? `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateY(-6px) scale3d(1.015, 1.015, 1.015)`
            : 'rotateX(0deg) rotateY(0deg) translateY(0px) scale3d(1, 1, 1)',
        }}
      >
        {/* Interactive Specular Radial Spotlight */}
        {isHovered && (
          <div
            className="absolute inset-0 pointer-events-none rounded-[28px] opacity-60 transition-opacity duration-300"
            style={{
              background: `radial-gradient(circle 280px at ${glowPos.x}px ${glowPos.y}px, rgba(255, 255, 255, 0.8), rgba(84, 87, 235, 0.08) 40%, transparent 80%)`,
            }}
          />
        )}

        {/* Top Accent Color Strip with Ambient Glow */}
        <div
          className="absolute top-0 left-0 right-0 h-1.5 opacity-90 transition-opacity"
          style={{ backgroundColor: cat?.color || '#5457EB' }}
        />

        {/* Top Header Row */}
        <div>
          <div className="flex items-center justify-between gap-2 mb-3.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase transition-transform"
                style={{
                  backgroundColor: `${cat?.color || '#5457EB'}18`,
                  color: cat?.color || '#5457EB',
                }}
              >
                {categoryLabel}
              </span>
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-black/5 text-ink-muted">
                {scheme.level === 'central' ? 'Central Scheme' : `State (${scheme.state_code || 'GJ'})`}
              </span>
            </div>

            {/* Bookmark Save Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleSave(scheme.id);
              }}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                isSaved
                  ? 'bg-primary text-white shadow-md shadow-primary/25 scale-105'
                  : 'bg-black/5 text-ink-muted hover:text-ink hover:bg-black/10'
              }`}
              aria-label={isSaved ? t.saved : t.save}
              title={isSaved ? t.saved : t.save}
            >
              <Bookmark className="w-4 h-4 fill-current" />
            </button>
          </div>

          {/* Scheme Title */}
          <h3
            onClick={() => onOpenDetails(scheme)}
            className="text-base sm:text-lg font-bold font-display text-ink hover:text-primary transition-colors leading-snug line-clamp-2"
          >
            {schemeTitle}
          </h3>

          {/* Issuing Authority */}
          <p className="text-xs text-ink-muted mt-1.5 font-medium truncate">
            {scheme.source_org}
          </p>

          {/* Short Description */}
          <p className="text-xs text-ink-light mt-3 line-clamp-3 leading-relaxed">
            {schemeSummary}
          </p>

          {/* Highlight Benefit Box */}
          <div className="mt-4 p-3.5 rounded-2xl bg-canvas border border-editorial-border shadow-2xs group-hover:border-primary/20 transition-colors">
            <div className="text-[10px] font-bold uppercase tracking-wider text-ink-muted mb-1 flex items-center justify-between">
              <span>Benefit Overview</span>
              {scheme.benefit_amount_text_en && (
                <span className="text-primary font-bold">
                  {language === 'gu' ? scheme.benefit_amount_text_gu : scheme.benefit_amount_text_en}
                </span>
              )}
            </div>
            <div className="text-xs font-semibold text-ink line-clamp-2">
              {benefitSummary}
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-5 pt-4 border-t border-editorial-border flex flex-col gap-3">
          {/* Match status badge + verified badge */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            {renderMatchBadge()}

            {/* Verification Stamp */}
            <div
              className="flex items-center gap-1 text-[11px] font-medium text-ink-muted"
              title={`Verified: ${scheme.verified_at.split('T')[0]}`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-secondary" />
              <span>Verified Source</span>
            </div>
          </div>

          {/* Why it may fit link */}
          <button
            type="button"
            onClick={() => onOpenDetails(scheme)}
            className="text-left text-[11px] font-semibold text-primary hover:text-primary-hover hover:underline transition-colors flex items-center justify-between py-0.5 focus:outline-none"
          >
            <span>{t.whyFit}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-primary/10 text-primary font-bold">
              {matchedCount > 0 ? `${matchedCount} rules met` : 'Inspect requirements'}
            </span>
          </button>

          {/* Primary View Details Button */}
          <button
            type="button"
            onClick={() => onOpenDetails(scheme)}
            className="w-full mt-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold bg-white hover:bg-primary hover:text-white text-primary border border-primary/30 transition-all shadow-xs active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <span>{t.viewDetails}</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
