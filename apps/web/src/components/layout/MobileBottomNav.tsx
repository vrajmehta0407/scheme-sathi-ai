'use client';

import React from 'react';
import { Compass, User, Sparkles, Bookmark } from 'lucide-react';
import { Language } from '@schemesathi/shared';
import { translations } from '../../lib/i18n';

interface MobileBottomNavProps {
  language: Language;
  onOpenProfile: () => void;
  onOpenSaved: () => void;
  onOpenChat: () => void;
  hasProfile: boolean;
  savedCount: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  language,
  onOpenProfile,
  onOpenSaved,
  onOpenChat,
  hasProfile,
  savedCount,
}) => {
  const t = translations[language].nav;

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 glass-nav border-t border-editorial-border py-2 px-4 shadow-lg pb-safe"
      aria-label="Mobile Navigation"
    >
      <div className="flex items-center justify-around">
        {/* Discover */}
        <a
          href="#discover"
          className="flex flex-col items-center justify-center min-w-[56px] min-h-[44px] text-ink-muted hover:text-coral transition-colors"
        >
          <Compass className="w-5 h-5" />
          <span className="text-[10px] font-semibold mt-0.5">Discover</span>
        </a>

        {/* My Profile */}
        <button
          onClick={onOpenProfile}
          className="flex flex-col items-center justify-center min-w-[56px] min-h-[44px] text-ink-muted hover:text-navy transition-colors relative"
        >
          <User className="w-5 h-5" />
          <span className="text-[10px] font-semibold mt-0.5">{t.myProfile}</span>
          {hasProfile && (
            <span className="absolute top-1 right-2.5 w-2 h-2 rounded-full bg-status-success" />
          )}
        </button>

        {/* Ask AI (Central Highlight) */}
        <button
          onClick={onOpenChat}
          className="flex flex-col items-center justify-center min-w-[56px] min-h-[44px] text-coral transition-all active:scale-95"
        >
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-coral to-rose-600 flex items-center justify-center text-white shadow-glow-coral">
            <Sparkles className="w-4 h-4 text-cream-light" />
          </div>
          <span className="text-[10px] font-bold text-coral mt-0.5">{t.askAi}</span>
        </button>

        {/* Saved */}
        <button
          onClick={onOpenSaved}
          className="flex flex-col items-center justify-center min-w-[56px] min-h-[44px] text-ink-muted hover:text-coral transition-colors relative"
        >
          <Bookmark className="w-5 h-5" />
          <span className="text-[10px] font-semibold mt-0.5">{t.saved}</span>
          {savedCount > 0 && (
            <span className="absolute top-1 right-2.5 w-4 h-4 rounded-full bg-coral text-white text-[9px] font-extrabold flex items-center justify-center shadow-xs">
              {savedCount}
            </span>
          )}
        </button>
      </div>
    </nav>
  );
};

