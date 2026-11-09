'use client';

import React, { useState } from 'react';
import { Scheme, MatchEvaluationResult, Language } from '@schemesathi/shared';
import { translations } from '../../lib/i18n';
import { SCHEME_CATEGORIES } from '@schemesathi/shared';
import {
  X,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  HelpCircle,
  FileText,
  ListOrdered,
  AlertTriangle,
  Bookmark,
  Calendar,
  Building2
} from 'lucide-react';

interface SchemeDetailModalProps {
  scheme: Scheme | null;
  matchEvaluation?: MatchEvaluationResult | null;
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  isSaved: boolean;
  onToggleSave: (id: string) => void;
}

export const SchemeDetailModal: React.FC<SchemeDetailModalProps> = ({
  scheme,
  matchEvaluation,
  isOpen,
  onClose,
  language,
  isSaved,
  onToggleSave,
}) => {
  const [activeTab, setActiveTab] = useState<'benefits' | 'eligibility' | 'documents' | 'steps' | 'source'>('eligibility');
  const [showDepartureDialog, setShowDepartureDialog] = useState<boolean>(false);

  if (!isOpen || !scheme) return null;

  const t = translations[language].details;
  const cat = SCHEME_CATEGORIES.find((c) => c.id === scheme.category);

  const matchedList = matchEvaluation?.matched_criteria || [];
  const notMetList = matchEvaluation?.not_met_criteria || [];
  const unknownList = matchEvaluation?.unknown_criteria || scheme.rules.map((r) => ({
    rule_id: r.id,
    field_key: r.field_key,
    criterion_name_en: r.criterion_name_en,
    criterion_name_gu: r.criterion_name_gu,
    status: 'unknown' as const,
    reasoning_en: `Requires ${r.criterion_name_en}`,
    reasoning_gu: `${r.criterion_name_gu} ની પુષ્ટિ જરૂરી છે`,
  }));

  const schemeTitle = language === 'gu' ? scheme.name_gu : scheme.name_en;
  const schemeSummary = language === 'gu' ? scheme.short_description_gu : scheme.short_description_en;
  const benefitSummary = language === 'gu' ? scheme.benefit_summary_gu : scheme.benefit_summary_en;

  const handleApplyClick = () => {
    setShowDepartureDialog(true);
  };

  const handleConfirmDeparture = () => {
    setShowDepartureDialog(false);
    window.open(scheme.official_application_url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-ink/40 backdrop-blur-md animate-fade-in">
      <div
        className="w-full max-w-3xl bg-white/95 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.2)] border border-editorial-border relative overflow-hidden flex flex-col max-h-[92vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="scheme-detail-title"
      >
        {/* Dynamic Category Accent Bar */}
        <div
          className="absolute top-0 left-0 right-0 h-1.5 transition-colors"
          style={{ backgroundColor: cat?.color || '#6366F1' }}
        />

        {/* Top Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-editorial-border mt-1">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider"
                style={{
                  backgroundColor: `${cat?.color || '#5B5FEF'}18`,
                  color: cat?.color || '#5B5FEF',
                }}
              >
                {language === 'gu' ? cat?.label_gu : cat?.label_en}
              </span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-black/5 text-ink-muted">
                {scheme.level === 'central' ? 'Central Government' : `State of Gujarat (${scheme.state_code})`}
              </span>
              {scheme.is_demo && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent-mango-soft text-[#9A6400] border border-accent-mango/30">
                  DEMO — NOT VERIFIED
                </span>
              )}
            </div>
            <h2 id="scheme-detail-title" className="text-xl sm:text-2xl font-display font-bold text-ink">
              {schemeTitle}
            </h2>
            <div className="flex items-center gap-4 text-xs text-ink-muted pt-1 flex-wrap">
              <span className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" />
                {scheme.source_org}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {t.verifiedDate}: {scheme.verified_at.split('T')[0]}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleSave(scheme.id)}
              className={`p-2.5 rounded-full border transition-all ${
                isSaved
                  ? 'bg-primary text-white border-primary shadow-xs'
                  : 'bg-white text-ink border-editorial-border hover:bg-black/5'
              }`}
              title={isSaved ? 'Saved locally' : 'Save Scheme'}
              aria-label="Bookmark scheme"
            >
              <Bookmark className="w-4 h-4 fill-current" />
            </button>
            <button
              onClick={onClose}
              className="p-2.5 rounded-full hover:bg-black/5 text-ink-muted transition-colors"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-editorial-border py-2 overflow-x-auto no-scrollbar">
          {[
            { id: 'eligibility', label: 'Eligibility Breakdown', icon: ShieldCheck },
            { id: 'benefits', label: 'Benefits & Aid', icon: CheckCircle2 },
            { id: 'documents', label: 'Documents Required', icon: FileText },
            { id: 'steps', label: 'How to Apply', icon: ListOrdered },
            { id: 'source', label: 'Official Source', icon: ExternalLink },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
                  isActive
                    ? 'bg-ink text-white shadow-xs'
                    : 'text-ink-muted hover:text-ink hover:bg-black/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto py-5 space-y-6 pr-1">
          {/* Eligibility Tab */}
          {activeTab === 'eligibility' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-canvas border border-editorial-border flex items-start gap-2.5 text-xs">
                <HelpCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <p className="text-ink-muted">
                  These criteria are evaluated deterministically against the inputs provided in your profile questionnaire.
                </p>
              </div>

              {/* Matched Criteria */}
              {matchedList.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-status-success flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{t.matchedTab} ({matchedList.length})</span>
                  </h4>
                  <div className="space-y-2">
                    {matchedList.map((crit, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-status-success-soft/30 border border-status-success/20 text-xs">
                        <div className="font-bold text-ink">
                          {language === 'gu' ? crit.criterion_name_gu : crit.criterion_name_en}
                        </div>
                        <p className="text-ink-muted mt-0.5">
                          {language === 'gu' ? crit.reasoning_gu : crit.reasoning_en}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Unmet Criteria */}
              {notMetList.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-status-error flex items-center gap-1.5">
                    <XCircle className="w-4 h-4" />
                    <span>{t.unmetTab} ({notMetList.length})</span>
                  </h4>
                  <div className="space-y-2">
                    {notMetList.map((crit, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-status-error-soft/30 border border-status-error/20 text-xs">
                        <div className="font-bold text-ink">
                          {language === 'gu' ? crit.criterion_name_gu : crit.criterion_name_en}
                        </div>
                        <p className="text-ink-muted mt-0.5">
                          {language === 'gu' ? crit.reasoning_gu : crit.reasoning_en}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Unknown Criteria */}
              {unknownList.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-ink-light flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-primary" />
                    <span>{t.unknownTab} ({unknownList.length})</span>
                  </h4>
                  <div className="space-y-2">
                    {unknownList.map((crit, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-canvas border border-editorial-border text-xs">
                        <div className="font-bold text-ink">
                          {language === 'gu' ? crit.criterion_name_gu : crit.criterion_name_en}
                        </div>
                        <p className="text-ink-muted mt-0.5">
                          {language === 'gu' ? crit.reasoning_gu : crit.reasoning_en}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Benefits Tab */}
          {activeTab === 'benefits' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-canvas border border-editorial-border space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                  Official Benefit Summary
                </div>
                <p className="text-sm font-semibold text-ink leading-relaxed">
                  {benefitSummary}
                </p>
                {scheme.benefit_amount_text_en && (
                  <div className="pt-2 text-xs text-primary font-bold">
                    Amount / Grant:{' '}
                    {language === 'gu' ? scheme.benefit_amount_text_gu : scheme.benefit_amount_text_en}
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-ink mb-2">Target Beneficiaries</h4>
                <div className="flex flex-wrap gap-2">
                  {scheme.target_groups.map((tg, idx) => (
                    <span key={idx} className="px-3 py-1 rounded-full text-xs font-semibold bg-primary-soft text-primary border border-primary/20">
                      {tg}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-ink mb-1.5">Overview</h4>
                <p className="text-xs text-ink-light leading-relaxed">
                  {schemeSummary}
                </p>
              </div>
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <div className="space-y-3">
              <p className="text-xs text-ink-muted">
                Ensure you have clear digital scans or original physical copies of these documents before applying on the official portal:
              </p>
              <div className="grid grid-cols-1 gap-2.5">
                {scheme.documents.map((doc, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl border border-editorial-border bg-white flex items-start gap-3">
                    <FileText className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                    <div className="flex-1 text-xs">
                      <div className="flex items-center gap-2 justify-between">
                        <span className="font-bold text-ink">
                          {language === 'gu' ? doc.name_gu : doc.name_en}
                        </span>
                        {doc.is_mandatory && (
                          <span className="text-[10px] uppercase font-bold text-status-error px-2 py-0.5 rounded-full bg-status-error-soft">
                            Mandatory
                          </span>
                        )}
                      </div>
                      {doc.notes && <p className="text-ink-muted mt-1">{doc.notes}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Steps Tab */}
          {activeTab === 'steps' && (
            <div className="space-y-4">
              <p className="text-xs text-ink-muted">
                Standard application process according to official ministry directives:
              </p>
              <div className="space-y-3">
                {scheme.application_steps.map((st) => (
                  <div key={st.step_number} className="flex items-start gap-3 p-3.5 rounded-xl bg-canvas border border-editorial-border">
                    <div className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center shrink-0">
                      {st.step_number}
                    </div>
                    <div className="text-xs">
                      <h5 className="font-bold text-ink">
                        {language === 'gu' ? st.title_gu : st.title_en}
                      </h5>
                      <p className="text-ink-muted mt-1 leading-relaxed">
                        {language === 'gu' ? st.description_gu : st.description_en}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Source Provenance Tab */}
          {activeTab === 'source' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-white border border-editorial-border space-y-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-status-success" />
                  <span className="font-bold text-sm text-ink">Approved Official Source Record</span>
                </div>
                <div className="space-y-1.5 text-ink-muted">
                  <div><strong>Issuing Organization:</strong> {scheme.source_org}</div>
                  <div><strong>Official Domain:</strong> {scheme.source_domain}</div>
                  <div><strong>Information Last Verified:</strong> {scheme.verified_at}</div>
                  <div><strong>Source URL:</strong> <a href={scheme.official_source_url} target="_blank" rel="noopener noreferrer" className="text-primary underline">{scheme.official_source_url}</a></div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-canvas border border-editorial-border space-y-1.5">
                <div className="font-bold text-ink uppercase tracking-wide text-[10px]">Verified Source Excerpt</div>
                <blockquote className="italic text-ink-light leading-relaxed border-l-2 border-primary pl-3 py-1">
                  &ldquo;{scheme.source_excerpt}&rdquo;
                </blockquote>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-editorial-border flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-ink-muted text-center sm:text-left">
            SchemeSathi AI provides assistance; final decisions rest with the government authority.
          </div>

          <button
            onClick={handleApplyClick}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-full text-xs font-bold bg-primary hover:bg-primary-hover text-white shadow-md active:scale-95 transition-all"
          >
            <span>{t.applyOfficialBtn}</span>
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>

        {/* Departure Confirmation Dialog */}
        {showDepartureDialog && (
          <div className="absolute inset-0 bg-ink/70 backdrop-blur-md flex items-center justify-center p-6 z-60 animate-fade-in">
            <div className="bg-surface rounded-2xl p-6 max-w-md w-full shadow-2xl border border-editorial-border space-y-4">
              <div className="w-10 h-10 rounded-full bg-status-caution-soft flex items-center justify-center text-status-caution">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-ink">Visiting Official Government Portal</h3>
                <p className="text-xs text-ink-muted mt-2 leading-relaxed">
                  {t.departureWarning}
                </p>
                <div className="mt-3 p-2.5 rounded-xl bg-canvas text-xs font-mono text-primary truncate">
                  {scheme.official_application_url}
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowDepartureDialog(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-ink hover:bg-black/5"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDeparture}
                  className="px-5 py-2.5 rounded-full text-xs font-bold bg-primary text-white shadow-sm hover:bg-primary-hover"
                >
                  Proceed to Official Portal
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

