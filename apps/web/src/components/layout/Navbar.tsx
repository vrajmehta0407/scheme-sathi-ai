'use client';

import React from 'react';
import { Language } from '@schemesathi/shared';
import { translations } from '../../lib/i18n';
import { Bookmark, Sparkles, User, ShieldCheck, Globe, Compass, ArrowUpRight } from 'lucide-react';

interface NavbarProps {
  language: Language;
  onToggleLanguage: () => void;
  onOpenProfile: () => void;
  onOpenSaved: () => void;
  onOpenChat: () => void;
  onOpenAdmin: () => void;
  hasProfile: boolean;
  savedCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  language,
  onToggleLanguage,
  onOpenProfile,
  onOpenSaved,
  onOpenChat,
  onOpenAdmin,
  hasProfile,
  savedCount,
}) => {
  const t = translations[language].nav;

  return (
    <header className="sticky top-0 z-40 w-full glass-nav px-4 md:px-8 py-3.5 transition-all duration-300">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand / Logo with 3D Holographic Crest */}
        <a
          href="#discover"
          className="flex items-center gap-3.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-2xl p-1"
        >
          <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-tr from-navy via-navy-light to-navy flex items-center justify-center shadow-lg shadow-navy/30 group-hover:scale-105 group-hover:shadow-glow-coral transition-all duration-300 transform-style-3d">
            {/* Coral Accent Glow Ring */}
            <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-coral via-coral-light to-navy-light opacity-80 blur-[3px] group-hover:opacity-100 transition-opacity -z-10" />

            {/* Modern "S" path motif */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M16 5C14.5 4 12 4 10 5.5C8 7 8 9.5 10 11L14 13C16 14.5 16 17 14 18.5C12 20 9.5 20 8 19"
                stroke="white"
                strokeWidth="2.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="16.5" cy="5.5" r="2.2" fill="#FF6542" />
            </svg>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-black text-xl tracking-tight text-navy group-hover:text-coral transition-colors">
                {t.brand}
              </span>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-coral-soft text-coral border border-coral/30 shadow-2xs">
                AI Guide
              </span>
            </div>
            <p className="text-xs text-ink-muted hidden sm:block font-medium">
              {t.tagline}
            </p>
          </div>
        </a>

        {/* Action Controls */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Guided Profile Button */}
          <button
            onClick={onOpenProfile}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold border transition-all active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy ${
              hasProfile
                ? 'border-status-success/40 bg-status-success-soft text-status-success shadow-xs'
                : 'border-editorial-border hover:border-coral/40 bg-white/95 text-navy shadow-2xs hover:bg-white'
            }`}
            aria-label={t.myProfile}
          >
            <User className="w-3.5 h-3.5 text-navy" />
            <span className="hidden sm:inline">{t.myProfile}</span>
            {hasProfile && (
              <span className="w-2 h-2 rounded-full bg-status-success inline-block animate-ping" title="Profile Active" />
            )}
          </button>

          {/* Ask AI Trigger (Electric Sunset Coral) */}
          <button
            onClick={onOpenChat}
            className="flex items-center gap-2 px-4.5 py-2 rounded-full text-xs font-bold bg-gradient-to-r from-coral to-rose-600 hover:from-coral-hover hover:to-rose-700 text-white shadow-glow-coral hover:scale-[1.03] transition-all active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-coral"
          >
            <Sparkles className="w-3.5 h-3.5 text-cream-light animate-spin" style={{ animationDuration: '6s' }} />
            <span>{t.askAi}</span>
          </button>

          {/* Saved Schemes Bookmark */}
          <button
            onClick={onOpenSaved}
            className="relative flex items-center justify-center w-10 h-10 rounded-full border border-editorial-border bg-white/90 hover:bg-white text-navy hover:text-coral transition-all active:scale-95 shadow-2xs hover:shadow-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-navy"
            aria-label={t.saved}
            title={t.saved}
          >
            <Bookmark className="w-4 h-4 text-coral" />
            {savedCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-coral text-white text-[10px] font-extrabold flex items-center justify-center shadow-md animate-pulse">
                {savedCount}
              </span>
            )}
          </button>

          {/* Language Switcher */}
          <button
            onClick={onToggleLanguage}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-black border border-editorial-border bg-white/90 hover:bg-white text-navy shadow-2xs hover:shadow-xs transition-all active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy"
            title="Switch Language / ભાષા બદલો"
          >
            <Globe className="w-3.5 h-3.5 text-navy" />
            <span>{t.switchLang}</span>
          </button>

          {/* Content Review / Admin Link */}
          <button
            onClick={onOpenAdmin}
            className="p-2.5 rounded-full text-ink-muted hover:text-navy hover:bg-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-navy"
            title={t.admin}
            aria-label={t.admin}
          >
            <ShieldCheck className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
