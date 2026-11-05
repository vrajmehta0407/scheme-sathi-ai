'use client';

import React from 'react';
import { Language } from '@schemesathi/shared';
import { translations } from '../../lib/i18n';
import { Bookmark, Sparkles, User, ShieldCheck, Globe, Compass } from 'lucide-react';

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
    <header className="sticky top-0 z-40 w-full glass-nav px-4 md:px-8 py-3 transition-all duration-200">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand / Logo */}
        <a href="#discover" className="flex items-center gap-3 group focus:outline-none focus:ring-2 focus:ring-primary rounded-xl p-1">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary via-indigo-600 to-secondary flex items-center justify-center shadow-md shadow-primary/20 group-hover:scale-105 transition-transform">
            {/* Friendly abstract "S" motif */}
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 5C14.5 4 12 4 10 5.5C8 7 8 9.5 10 11L14 13C16 14.5 16 17 14 18.5C12 20 9.5 20 8 19" stroke="white" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="16.5" cy="5.5" r="1.5" fill="#FFC857"/>
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-xl tracking-tight text-ink">
                {t.brand}
              </span>
              <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                AI Guide
              </span>
            </div>
            <p className="text-xs text-ink-muted hidden sm:block">
              {t.tagline}
            </p>
          </div>
        </a>

        {/* Action Controls */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Guided Profile Button */}
          <button
            onClick={onOpenProfile}
            className="flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-semibold border transition-all text-ink hover:border-primary/40 hover:bg-white/80 active:scale-95"
            aria-label={t.myProfile}
          >
            <User className="w-3.5 h-3.5 text-primary" />
            <span className="hidden sm:inline">{t.myProfile}</span>
            {hasProfile && (
              <span className="w-2 h-2 rounded-full bg-status-success inline-block animate-pulse" title="Profile Active" />
            )}
          </button>

          {/* Ask AI Trigger */}
          <button
            onClick={onOpenChat}
            className="flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-semibold bg-gradient-to-r from-primary to-indigo-600 text-white shadow-sm hover:shadow-md hover:from-primary-hover hover:to-indigo-700 transition-all active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5 text-accent-mango animate-spin" style={{ animationDuration: '8s' }} />
            <span>{t.askAi}</span>
          </button>

          {/* Saved / Compare Schemes */}
          <button
            onClick={onOpenSaved}
            className="relative flex items-center justify-center w-9 h-9 rounded-full border border-editorial-border bg-white/70 hover:bg-white text-ink transition-all active:scale-95"
            aria-label={t.saved}
            title={t.saved}
          >
            <Bookmark className="w-4 h-4 text-secondary" />
            {savedCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent-coral text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
                {savedCount}
              </span>
            )}
          </button>

          {/* Language Switcher */}
          <button
            onClick={onToggleLanguage}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border border-editorial-border bg-white/80 hover:bg-white text-ink transition-all active:scale-95"
            title="Switch Language / ભાષા બદલો"
          >
            <Globe className="w-3.5 h-3.5 text-ink-muted" />
            <span>{t.switchLang}</span>
          </button>

          {/* Content Review / Admin Link */}
          <button
            onClick={onOpenAdmin}
            className="p-2 rounded-full text-ink-muted hover:text-ink hover:bg-white/60 transition-colors"
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

