'use client';

import React from 'react';
import { Scheme, MatchStatus, Language } from '@schemesathi/shared';
import { translations } from '../../lib/i18n';
import { SCHEME_CATEGORIES } from '@schemesathi/shared';
import { Bookmark, CheckCircle2, AlertTriangle, HelpCircle, XCircle, ArrowUpRight, ShieldCheck } from 'lucide-react';

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
  const t = translations[language].results;
  const cat = SCHEME_CATEGORIES.find((c) => c.id === scheme.category);

  // Match badge styling & label
  const renderMatchBadge = () => {
    switch (matchStatus) {
      case 'strong_match':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-status-success-soft text-status-success border border-status-success/20 shadow-xs">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {t.potentialMatch}
          </span>
        );
      case 'possible_match':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-accent-mango-soft text-[#9A6400] border border-accent-mango/30 shadow-xs">
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
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-accent-sky-soft text-ink-light border border-accent-sky/30">
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
    <div className="editorial-card flex flex-col justify-between p-6 relative group overflow-hidden bg-white">
      {/* Decorative colored top accent strip */}
      <div
        className="absolute top-0 left-0 right-0 h-1.5 opacity-90"
        style={{ backgroundColor: cat?.color || '#5B5FEF' }}
      />

      {/* Top Meta Bar */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase"
              style={{
                backgroundColor: `${cat?.color || '#5B5FEF'}18`,
                color: cat?.color || '#5B5FEF',
              }}
            >
              {categoryLabel}
            </span>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-black/5 text-ink-muted">
              {scheme.level === 'central' ? 'Central' : `State (${scheme.state_code || 'GJ'})`}
            </span>
          </div>

          {/* Bookmark Button */}
          <button
            onClick={() => onToggleSave(scheme.id)}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
              isSaved
                ? 'bg-primary text-white shadow-sm'
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
          className="text-base md:text-lg font-bold font-display text-ink cursor-pointer hover:text-primary transition-colors leading-snug line-clamp-2"
        >
          {schemeTitle}
        </h3>

        {/* Issuing Authority */}
        <p className="text-xs text-ink-muted mt-1 font-medium truncate">
          {scheme.source_org}
        </p>

        {/* Short Description */}
        <p className="text-xs text-ink-light mt-3 line-clamp-3 leading-relaxed">
          {schemeSummary}
        </p>

        {/* Highlight Benefit Box */}
        <div className="mt-4 p-3 rounded-2xl bg-canvas border border-editorial-border">
          <div className="text-[10px] font-bold uppercase tracking-wider text-ink-muted mb-1">
            Benefit Overview
          </div>
          <div className="text-xs font-semibold text-ink line-clamp-2">
            {benefitSummary}
          </div>
        </div>
      </div>

      {/* Bottom Status & Actions */}
      <div className="mt-5 pt-4 border-t border-editorial-border flex flex-col gap-3">
        {/* Match status badge + reason badge */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          {renderMatchBadge()}

          {/* Verification Stamp */}
          <div className="flex items-center gap-1 text-[11px] font-medium text-ink-muted" title={`Verified: ${scheme.verified_at.split('T')[0]}`}>
            <ShieldCheck className="w-3.5 h-3.5 text-secondary" />
            <span>Verified Source</span>
          </div>
        </div>

        {/* Why it may fit link */}
        <button
          type="button"
          onClick={() => onOpenDetails(scheme)}
          className="text-left text-[11px] font-semibold text-primary hover:text-primary-hover hover:underline transition-colors flex items-center justify-between"
        >
          <span>{t.whyFit}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-primary-soft text-primary font-bold">
            {matchedCount > 0 ? `${matchedCount} criteria met` : 'Inspect rules'}
          </span>
        </button>

        {/* CTA Button */}
        <button
          onClick={() => onOpenDetails(scheme)}
          className="w-full mt-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-bold bg-white hover:bg-primary-soft text-primary border border-primary/30 transition-all hover:border-primary active:scale-[0.99]"
        >
          <span>{t.viewDetails}</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

