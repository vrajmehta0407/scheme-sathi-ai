'use client';

import React from 'react';
import { Scheme, Language } from '@schemesathi/shared';
import { translations } from '../../lib/i18n';
import { X, Trash2, ArrowUpRight, Scale } from 'lucide-react';

interface CompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedSchemes: Scheme[];
  onRemoveSaved: (id: string) => void;
  onOpenDetails: (scheme: Scheme) => void;
  language: Language;
}

export const CompareModal: React.FC<CompareModalProps> = ({
  isOpen,
  onClose,
  savedSchemes,
  onRemoveSaved,
  onOpenDetails,
  language,
}) => {
  if (!isOpen) return null;

  const t = translations[language].compare;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-navy/40 backdrop-blur-md animate-fade-in">
      <div
        className="w-full max-w-4xl bg-white/95 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-[0_25px_60px_-15px_rgba(11,25,44,0.25)] border border-editorial-border relative overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="compare-heading"
      >
        {/* Luminous Top Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-navy via-coral to-coral-light" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-editorial-border mt-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-coral-soft flex items-center justify-center text-coral shadow-xs">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 id="compare-heading" className="text-lg sm:text-xl font-bold font-display text-navy">
                {t.title}
              </h2>
              <p className="text-xs text-ink-muted">
                {t.subtitle} • <span className="font-semibold text-coral">Saved locally on your device</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-black/5 text-ink-muted transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto py-6">
          {savedSchemes.length === 0 ? (
            <div className="text-center py-12 px-4 space-y-3">
              <Scale className="w-12 h-12 text-ink-muted mx-auto opacity-40" />
              <p className="text-xs text-ink-muted max-w-md mx-auto">
                {t.empty}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-editorial-border">
                    <th className="p-3 text-ink-muted font-bold uppercase tracking-wider w-36">Attribute</th>
                    {savedSchemes.map((s) => (
                      <th key={s.id} className="p-3 min-w-[200px] max-w-[280px]">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="font-bold text-sm text-ink line-clamp-1">
                              {language === 'gu' ? s.name_gu : s.name_en}
                            </span>
                            <span className="text-[10px] text-ink-muted block mt-0.5">
                              {s.source_org}
                            </span>
                          </div>
                          <button
                            onClick={() => onRemoveSaved(s.id)}
                            className="p-1 rounded text-ink-muted hover:text-status-error hover:bg-status-error-soft"
                            title={t.remove}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-editorial-border">
                  <tr>
                    <td className="p-3 font-bold text-ink-muted">{t.benefitType}</td>
                    {savedSchemes.map((s) => (
                      <td key={s.id} className="p-3 text-ink font-medium">{s.benefit_type}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-ink-muted">{t.benefitAmount}</td>
                    {savedSchemes.map((s) => (
                      <td key={s.id} className="p-3 text-primary font-bold">
                        {language === 'gu' ? s.benefit_amount_text_gu || s.benefit_amount_text_en : s.benefit_amount_text_en || 'Norm-based'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-ink-muted">{t.level}</td>
                    {savedSchemes.map((s) => (
                      <td key={s.id} className="p-3 text-ink">
                        {s.level === 'central' ? 'Central Government' : `Gujarat State (${s.state_code})`}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-ink-muted">{t.documentsCount}</td>
                    {savedSchemes.map((s) => (
                      <td key={s.id} className="p-3 text-ink">
                        <span className="font-bold">{s.documents.filter(d => d.is_mandatory).length}</span> mandatory documents
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-ink-muted">{t.source}</td>
                    {savedSchemes.map((s) => (
                      <td key={s.id} className="p-3 text-xs text-ink-muted">
                        <span className="font-mono text-primary">{s.source_domain}</span>
                        <div className="text-[10px] mt-0.5">Verified: {s.verified_at.split('T')[0]}</div>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3"></td>
                    {savedSchemes.map((s) => (
                      <td key={s.id} className="p-3">
                        <button
                          onClick={() => {
                            onClose();
                            onOpenDetails(s);
                          }}
                          className="flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                        >
                          <span>View Full Criteria</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

