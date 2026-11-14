'use client';

import { use, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowSquareOut,
  CheckCircle,
  Copy,
  FileText,
  Info,
  Printer,
  Question,
  ShieldWarning,
  SpeakerHigh,
} from '@phosphor-icons/react';
import { useSathiStore } from '@/lib/store/useSathiStore';
import { evaluateScheme } from '@/lib/rules';
import { calculateSchemeBenefit, formatINR } from '@/lib/benefits';
import {
  explainCriterion,
  explainOverallEligibility,
  formatNearMissBanner,
} from '@/lib/explain';
import { getSchemeName, getSchemeSteps, getSchemeSummary } from '@/lib/i18n/messages';
import { EligibilityMeter } from '@/components/wizard/EligibilityMeter';
import type { ApplicationStatus } from '@/lib/types';
import { generateCitizenLetter, type LetterKind } from '@/lib/citizen/tools';

export default function SchemeDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const {
    locale,
    profiles,
    activeProfileId,
    catalogue,
    toggleHeldDocument,
    applicationsByProfile,
    setApplicationStatus,
  } = useSathiStore();

  const activeProfile =
    profiles.find((p) => p.id === activeProfileId) ?? profiles[0];
  const scheme = catalogue.schemes.find((s) => s.slug === slug || s.id === slug);

  const [speaking, setSpeaking] = useState(false);
  const [letterKind, setLetterKind] = useState<LetterKind>('grievance');
  const [letterOpen, setLetterOpen] = useState(false);
  const [copiedLetter, setCopiedLetter] = useState(false);

  const evalResult = useMemo(() => {
    if (!scheme?.ruleTree) return null;
    return evaluateScheme(scheme.ruleTree, activeProfile);
  }, [scheme, activeProfile]);

  const benefit = useMemo(() => {
    if (!scheme) return null;
    return calculateSchemeBenefit(scheme, activeProfile);
  }, [scheme, activeProfile]);

  if (!catalogue.loaded) {
    return <div className="glass p-8 text-sm font-semibold">Loading scheme details...</div>;
  }

  if (!scheme || !evalResult || !benefit) {
    return (
      <div className="glass p-8 space-y-3">
        <h1 className="font-display text-2xl font-bold text-ink">Scheme not found</h1>
        <Link href="/schemes" className="text-sm font-bold text-blue underline">
          ← Back to Scheme Board
        </Link>
      </div>
    );
  }

  const explanation = explainOverallEligibility(scheme, evalResult, locale);
  const docMap = new Map(catalogue.documents.map((d) => [d.docKey, d]));
  const heldSet = new Set(activeProfile.held_documents);
  const steps = getSchemeSteps(scheme, locale);
  const currentApp = (applicationsByProfile[activeProfile.id] ?? []).find(
    (a) => a.schemeId === scheme.id
  );

  return (
    <div className="space-y-6">
      <Link
        href="/schemes"
        className="inline-flex min-h-[40px] items-center gap-1.5 rounded-pill bg-white/80 px-4 py-1.5 text-xs font-bold text-ink hover:bg-white"
      >
        <ArrowLeft size={14} weight="bold" />
        Back to Masonry Board
      </Link>

      {/* Top Hero Card */}
      <div className="glass p-6 md:p-8">
        <div className="grid items-center gap-6 lg:grid-cols-12">
          <div className="lg:col-span-8 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-pill bg-blue-50 px-3 py-1 text-xs font-bold uppercase text-blue-700">
                {scheme.level === 'state' ? scheme.state : 'Central'} • {scheme.category}
              </span>
              <span className="rounded-pill bg-yellow px-3 py-1 text-xs font-bold text-ink">
                OFFICIAL DIRECTORY • Verified {scheme.lastVerified}
              </span>
              {scheme.exclusiveGroup && (
                <span className="rounded-pill border border-blue/25 bg-white px-3 py-1 text-xs font-semibold text-ink">
                  Exclusive group: {scheme.exclusiveGroup}
                </span>
              )}
            </div>

            <h1 className="font-display text-3xl font-bold text-ink">
              {getSchemeName(scheme, locale)}
            </h1>
            <p className="text-sm leading-relaxed text-ink/80">
              {getSchemeSummary(scheme, locale)}
            </p>

            {/* Benefit Estimate Box */}
            <div className="glass-yellow inline-flex flex-wrap items-center gap-4 rounded-card px-5 py-3">
              <div>
                <div className="text-[11px] font-bold uppercase text-ink/75">
                  Estimated Annual Benefit
                </div>
                <div className="font-mono-num text-2xl font-bold text-ink">
                  {formatINR(benefit.annualEstimate)}
                </div>
              </div>
              <div className="h-8 w-px bg-ink/15" />
              <div>
                <div className="text-[11px] font-bold uppercase text-ink/75">
                  Lifetime / Multi-Year Est.
                </div>
                <div className="font-mono-num text-lg font-bold text-ink">
                  {formatINR(benefit.lifetimeEstimate)}
                </div>
              </div>
              <div className="text-xs font-semibold text-ink/80">{benefit.formulaLabel}</div>
            </div>
          </div>

          <div className="lg:col-span-4 flex flex-col items-center rounded-card border border-blue/15 bg-white/80 p-5">
            <EligibilityMeter result={evalResult} />
            <a
              href={scheme.officialUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-pill bg-blue px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700"
            >
              Verify & Apply on Official Portal
              <ArrowSquareOut size={16} weight="bold" />
            </a>

            <div className="mt-2.5 grid w-full grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
                  if (speaking) {
                    window.speechSynthesis.cancel();
                    setSpeaking(false);
                    return;
                  }
                  const utter = new SpeechSynthesisUtterance(
                    `${getSchemeName(scheme, locale)}. ${explanation}. ${getSchemeSummary(scheme, locale)}`
                  );
                  utter.lang = locale === 'hi' ? 'hi-IN' : locale === 'gu' ? 'gu-IN' : 'en-IN';
                  utter.onend = () => setSpeaking(false);
                  setSpeaking(true);
                  window.speechSynthesis.speak(utter);
                }}
                className="inline-flex min-h-[38px] items-center justify-center gap-1 rounded-pill border border-blue/25 bg-white px-3 text-xs font-bold text-ink hover:bg-blue-50"
              >
                <SpeakerHigh size={14} weight="duotone" className="text-blue" />
                {speaking ? 'Stop Voice' : 'Listen Aloud'}
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex min-h-[38px] items-center justify-center gap-1 rounded-pill border border-blue/25 bg-white px-3 text-xs font-bold text-ink hover:bg-blue-50"
              >
                <Printer size={14} weight="duotone" className="text-blue" />
                Print Prep
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Near-miss callout if applicable */}
      {evalResult.near_miss && (
        <div className="near-miss-tape rounded-card p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm font-bold text-ink">
            Near-Miss Insight: {formatNearMissBanner(evalResult.near_miss, locale)}
          </div>
          <Link
            href="/what-if"
            className="min-h-[38px] rounded-pill bg-blue px-4 py-1.5 text-xs font-bold text-white"
          >
            Test in What-If Simulator →
          </Link>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-12">
        {/* WHY PANEL (Explainer Agent) */}
        <div className="glass p-6 lg:col-span-7 space-y-4">
          <h2 className="font-display text-xl font-bold text-ink">
            Why this result? (Rule-by-Rule Breakdown)
          </h2>
          <p className="text-sm font-semibold text-blue-700">{explanation.headline}</p>

          <div className="space-y-2.5">
            {evalResult.criteria.map((c, idx) => (
              <div
                key={`${c.field}-${idx}`}
                className={`flex items-start gap-3 rounded-chip border p-3 text-xs ${
                  c.passed === true
                    ? 'border-green/30 bg-green-50/70'
                    : c.passed === null
                    ? 'border-yellow/50 bg-yellow-50/80'
                    : 'border-blue/25 bg-white/90'
                }`}
              >
                {c.passed === true ? (
                  <CheckCircle size={18} weight="duotone" className="text-green shrink-0" />
                ) : c.passed === null ? (
                  <Question size={18} weight="duotone" className="text-yellow-700 shrink-0" />
                ) : (
                  <Info size={18} weight="duotone" className="text-blue shrink-0" />
                )}
                <div className="font-semibold text-ink">{explainCriterion(c, locale)}</div>
              </div>
            ))}
          </div>

          <div className="flex items-start gap-2 rounded-chip bg-blue-50 p-3 text-xs font-semibold text-ink/80">
            <ShieldWarning size={18} weight="duotone" className="text-blue shrink-0" />
            <span>{explanation.verifyNotice}</span>
          </div>
        </div>

        {/* DOCUMENTS & APPLICATION TRACKER */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass p-6 space-y-3">
            <h2 className="font-display text-xl font-bold text-ink">
              Required Documents (Tap to mark Have)
            </h2>
            <div className="space-y-2">
              {scheme.documents.map((key) => {
                const doc = docMap.get(key);
                const held = heldSet.has(key);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleHeldDocument(key)}
                    className={`flex w-full min-h-[48px] items-start justify-between gap-2 rounded-chip border p-3 text-left text-xs transition ${
                      held
                        ? 'border-green bg-green-50 text-green-700'
                        : 'border-blue/20 bg-white text-ink hover:bg-blue-50'
                    }`}
                  >
                    <div>
                      <div className="font-bold">
                        {doc
                          ? locale === 'hi'
                            ? doc.nameHi
                            : locale === 'gu'
                            ? doc.nameGu
                            : doc.nameEn
                          : key}
                      </div>
                      {doc && (
                        <div className="mt-0.5 text-[11px] opacity-80">
                          {locale === 'hi'
                            ? doc.whereToGetHi
                            : locale === 'gu'
                            ? doc.whereToGetGu
                            : doc.whereToGetEn}
                        </div>
                      )}
                    </div>
                    <span className="shrink-0 rounded-pill bg-white px-2.5 py-0.5 font-bold">
                      {held ? 'HAVE' : 'NEED'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step-by-step Application Guide & Tracker */}
          <div className="glass p-6 space-y-4">
            <h2 className="font-display text-xl font-bold text-ink">
              Step-by-Step Guide & Tracker
            </h2>
            <ol className="space-y-2.5 text-xs text-ink/85">
              {steps.map((st, idx) => (
                <li key={idx} className="flex gap-2.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-yellow font-mono-num text-[11px] font-bold text-ink">
                    {idx + 1}
                  </span>
                  <span className="pt-0.5 font-medium">{st}</span>
                </li>
              ))}
            </ol>

            <div className="border-t border-blue/15 pt-3">
              <label className="text-xs font-bold text-ink/75">
                Track Application Status ({activeProfile.label})
              </label>
              <select
                value={currentApp?.status ?? 'not_started'}
                onChange={(e) =>
                  setApplicationStatus(scheme.id, e.target.value as ApplicationStatus)
                }
                className="mt-1.5 min-h-[44px] w-full rounded-pill border border-blue/25 bg-white px-4 text-xs font-bold text-ink"
              >
                <option value="not_started">Not started</option>
                <option value="documents_ready">Documents ready</option>
                <option value="applied">Applied</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Offline Grievance / RTI Section 6(1) / Follow-Up Letter Generator */}
      <div className="glass p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 font-display text-xl font-bold text-ink">
              <FileText size={20} weight="duotone" className="text-blue" />
              Offline Grievance, RTI Sec 6(1) &amp; Follow-Up Letter Composer
            </h2>
            <p className="text-xs text-ink/75">
              100% template-based local draft in EN / HI / GU — helpful if an application stalls over 30 days.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setLetterOpen((v) => !v)}
            className="min-h-[40px] rounded-pill bg-blue px-4 text-xs font-bold text-white"
          >
            {letterOpen ? 'Hide Letter Composer' : 'Draft Offline Letter'}
          </button>
        </div>

        {letterOpen && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {(['grievance', 'rti', 'followup'] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setLetterKind(k)}
                  className={`min-h-[36px] rounded-pill px-4 text-xs font-bold uppercase ${
                    letterKind === k ? 'bg-yellow text-ink' : 'border border-blue/20 bg-white text-ink'
                  }`}
                >
                  {k === 'rti' ? 'RTI Sec 6(1)' : k}
                </button>
              ))}
            </div>

            {(() => {
              const letterText = generateCitizenLetter({
                kind: letterKind,
                locale,
                citizenName: activeProfile.label,
                state: activeProfile.state ?? scheme.state,
                schemeName: getSchemeName(scheme, locale),
                applicationRef: currentApp?.referenceNo,
                daysPending: 32,
              });
              return (
                <>
                  <textarea
                    readOnly
                    rows={8}
                    value={letterText}
                    className="w-full rounded-card border border-blue/20 bg-white/90 p-4 font-mono-num text-xs leading-relaxed text-ink"
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(letterText);
                        setCopiedLetter(true);
                        setTimeout(() => setCopiedLetter(false), 1800);
                      }}
                      className="inline-flex min-h-[38px] items-center gap-1.5 rounded-pill bg-green px-4 text-xs font-bold text-white"
                    >
                      <Copy size={14} weight="bold" />
                      {copiedLetter ? 'Copied!' : 'Copy Letter'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const blob = new Blob([letterText], { type: 'text/plain;charset=utf-8' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${scheme.slug}-${letterKind}.txt`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="inline-flex min-h-[38px] items-center gap-1.5 rounded-pill border border-blue/25 bg-white px-4 text-xs font-bold text-ink"
                    >
                      Download .txt
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}

