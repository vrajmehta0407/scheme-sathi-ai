'use client';

import React from 'react';
import { Language } from '@schemesathi/shared';
import { translations } from '../../lib/i18n';
import { Shield, ExternalLink, MessageSquare, AlertCircle } from 'lucide-react';

interface FooterProps {
  language: Language;
  onOpenFeedback: () => void;
}

export const Footer: React.FC<FooterProps> = ({ language, onOpenFeedback }) => {
  const t = translations[language].footer;
  const fText = translations[language].feedback;

  return (
    <footer className="w-full border-t border-editorial-border bg-[#FBF6EE] px-4 md:px-8 py-12 mt-20 text-ink">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Trust & Privacy Pill Strip */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-editorial-border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-status-success-soft flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5 text-status-success" />
            </div>
            <p className="text-xs text-ink-light">
              <strong className="font-semibold text-ink">Privacy Guarantee:</strong> {t.privacyPill}
            </p>
          </div>
          <button
            onClick={onOpenFeedback}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold bg-white border border-editorial-border hover:border-primary/40 text-ink hover:text-primary transition-all shrink-0 shadow-xs"
          >
            <MessageSquare className="w-3.5 h-3.5 text-primary" />
            <span>{fText.btn}</span>
          </button>
        </div>

        {/* Official Portal Directory Links */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-xs text-ink-muted">
          <div>
            <h4 className="font-bold text-ink mb-2">Central Portals</h4>
            <ul className="space-y-1.5">
              <li>
                <a href="https://www.india.gov.in" target="_blank" rel="noopener noreferrer" className="hover:text-primary flex items-center gap-1">
                  National Portal of India <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a href="https://pmkisan.gov.in" target="_blank" rel="noopener noreferrer" className="hover:text-primary flex items-center gap-1">
                  PM-KISAN Portal <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a href="https://pmjay.gov.in" target="_blank" rel="noopener noreferrer" className="hover:text-primary flex items-center gap-1">
                  National Health Authority <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-ink mb-2">Gujarat Portals</h4>
            <ul className="space-y-1.5">
              <li>
                <a href="https://www.digitalgujarat.gov.in" target="_blank" rel="noopener noreferrer" className="hover:text-primary flex items-center gap-1">
                  Digital Gujarat Portal <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a href="https://ikhedut.gujarat.gov.in" target="_blank" rel="noopener noreferrer" className="hover:text-primary flex items-center gap-1">
                  i-Khedut Portal <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a href="https://wcd.gujarat.gov.in" target="_blank" rel="noopener noreferrer" className="hover:text-primary flex items-center gap-1">
                  Women & Child Dev Gujarat <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-ink mb-2">Information Integrity</h4>
            <p className="leading-relaxed">
              Every scheme displayed cites public guidelines, verified dates, and direct links to official ministry authorities.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-ink mb-2">Anti-Fraud Notice</h4>
            <p className="leading-relaxed text-status-caution font-medium flex items-start gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-status-caution" />
              Government scheme applications never require fees paid to third parties. Apply solely through official .gov.in domains.
            </p>
          </div>
        </div>

        {/* Disclaimer Bar */}
        <div className="pt-6 border-t border-editorial-border/60 text-center space-y-2">
          <p className="text-xs text-ink-muted max-w-4xl mx-auto leading-relaxed">
            {t.disclaimer}
          </p>
          <p className="text-xs font-semibold text-ink-light pt-2">
            {t.copyright}
          </p>
        </div>
      </div>
    </footer>
  );
};

