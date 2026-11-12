'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  BellRinging,
  CalendarBlank,
  CheckCircle,
  DownloadSimple,
  FilePdf,
  FlipHorizontal,
  MapPin,
  Sparkle,
} from '@phosphor-icons/react';
import { useSathiStore } from '@/lib/store/useSathiStore';
import { runCitizenOrchestrator } from '@/lib/orchestrator';
import {
  generateCitizenDossierPDF,
  generateDeadlineICS,
} from '@/lib/documents';
import {
  DOC_PREFLIGHT_CHECKS,
  exportApplicationsCsv,
  ISSUING_OFFICE_DIRECTORY,
} from '@/lib/citizen/tools';
import { computeTrackerInsights, getAllowedTransitions } from '@/lib/tracker';
import { getSchemeName } from '@/lib/i18n/messages';
import type { ApplicationStatus } from '@/lib/types';

export default function DocumentsAndTrackerPage() {
  const {
    locale,
    profiles,
    activeProfileId,
    catalogue,
    toggleHeldDocument,
    setDocExpiry,
    applicationsByProfile,
    setApplicationStatus,
  } = useSathiStore();

  const activeProfile =
    profiles.find((p) => p.id === activeProfileId) ?? profiles[0];
  const applications = applicationsByProfile[activeProfile.id] ?? [];

  const [flippedDocs, setFlippedDocs] = useState<Record<string, boolean>>({});
  const [pdfBusy, setPdfBusy] = useState(false);

  const orchestrated = useMemo(
    () =>
      runCitizenOrchestrator(
        activeProfile,
        catalogue.schemes,
        catalogue.documents,
        locale
      ),
    [activeProfile, catalogue.schemes, catalogue.documents, locale]
  );

  const trackerInsights = useMemo(
    () => computeTrackerInsights(applications, catalogue.schemes),
    [applications, catalogue.schemes]
  );

  const handleDownloadPDF = async () => {
    setPdfBusy(true);
    try {
      const matched = orchestrated.ranked
        .filter((r) => r.eligibility.status !== 'not_eligible')
        .map((r) => r.scheme);
      const evalMap = new Map(
        orchestrated.ranked.map((r) => [r.scheme.id, r.eligibility])
      );
      const bytes = await generateCitizenDossierPDF({
        profile: activeProfile,
        schemes: matched,
        evalMap,
        documents: orchestrated.checklist.items,
        annualTotal: orchestrated.optimalBundle.annualTotal,
      });
      const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `scheme-sathi-dossier-${activeProfile.id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setPdfBusy(false);
    }
  };

  const handleDownloadICS = () => {
    const ics = generateDeadlineICS(
      orchestrated.ranked
        .filter((r) => r.eligibility.status !== 'not_eligible')
        .map((r) => r.scheme),
      activeProfile.doc_expiries ?? {},
      catalogue.documents
    );
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'scheme-sathi-reminders.ics';
    a.click();
    URL.revokeObjectURL(url);
  };

  const positiveRanked = orchestrated.ranked
    .filter((r) => r.eligibility.status !== 'not_eligible')
    .slice(0, 14);

  return (
    <div className="space-y-8">
      {/* Header + Exports */}
      <div className="glass p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink">
            Document Wallet &amp; Application Tracker
          </h1>
          <p className="text-sm text-ink/75">
            Active profile: <strong>{activeProfile.label}</strong> • Readiness:{' '}
            <strong className="font-mono-num text-blue">{orchestrated.checklist.readinessPct}%</strong> •{' '}
            {orchestrated.checklist.estimatedDaysToReady === 0
              ? 'All matched documents ready today!'
              : `Est. ~${orchestrated.checklist.estimatedDaysToReady} days to gather remaining docs`}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleDownloadICS}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-pill border border-blue/25 bg-white px-4 py-2 text-xs font-bold text-ink hover:bg-blue-50"
          >
            <CalendarBlank size={16} weight="duotone" className="text-blue" />
            Export .ICS Reminders
          </button>
          <button
            type="button"
            disabled={pdfBusy}
            onClick={handleDownloadPDF}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-pill bg-blue px-5 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            <FilePdf size={16} weight="duotone" />
            {pdfBusy ? 'Building PDF...' : 'Download Printable PDF Dossier'}
          </button>
        </div>
      </div>

      {/* Next Best Document Banner */}
      {orchestrated.checklist.nextBestDoc && (
        <div className="glass-yellow rounded-card p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-sm font-bold text-ink">
            <Sparkle size={20} weight="duotone" />
            <span>
              Next Best Document: Getting{' '}
              <u>{orchestrated.checklist.nextBestDoc.doc.nameEn}</u> unlocks{' '}
              {orchestrated.checklist.nextBestDoc.unlocksCount} matched scheme(s) (~
              {orchestrated.checklist.nextBestDoc.doc.typicalDays} days).
            </span>
          </div>
          <button
            type="button"
            onClick={() =>
              toggleHeldDocument(orchestrated.checklist.nextBestDoc!.doc.docKey)
            }
            className="min-h-[38px] rounded-pill bg-blue px-4 text-xs font-bold text-white"
          >
            Mark as Have
          </button>
        </div>
      )}

      {/* Document Checklist Wallet (Flip Cards) */}
      <section className="space-y-4">
        <h2 className="font-display text-2xl font-bold text-ink">
          Combined Document Wallet ({orchestrated.checklist.items.length})
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {orchestrated.checklist.items.map((item) => {
            const flipped = Boolean(flippedDocs[item.doc.docKey]);
            const name =
              locale === 'hi'
                ? item.doc.nameHi
                : locale === 'gu'
                ? item.doc.nameGu
                : item.doc.nameEn;
            const where =
              locale === 'hi'
                ? item.doc.whereToGetHi
                : locale === 'gu'
                ? item.doc.whereToGetGu
                : item.doc.whereToGetEn;

            return (
              <div
                key={item.doc.docKey}
                className={`glass p-5 flex flex-col justify-between gap-4 border ${
                  item.held ? 'border-green/40 bg-green-50/35' : 'border-blue/20'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="rounded-pill bg-yellow px-2.5 py-0.5 font-mono-num text-[11px] font-bold text-ink">
                      Needed by {item.unlocksCount} scheme{item.unlocksCount === 1 ? '' : 's'}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setFlippedDocs((prev) => ({
                          ...prev,
                          [item.doc.docKey]: !flipped,
                        }))
                      }
                      className="inline-flex items-center gap-1 rounded-pill bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700"
                    >
                      <FlipHorizontal size={13} />
                      {flipped ? 'Front' : 'Where to get'}
                    </button>
                  </div>

                  <h3 className="font-display text-base font-bold text-ink">{name}</h3>

                  {!flipped ? (
                    <div className="text-xs text-ink/75">
                      <div>Typical time: ~{item.doc.typicalDays} days</div>
                      {item.doc.validityMonths && (
                        <div className="mt-2">
                          <label className="block text-[11px] font-bold text-ink/70">
                            Renewal / Expiry Date:
                          </label>
                          <input
                            type="date"
                            value={item.expiryDate ?? ''}
                            onChange={(e) =>
                              setDocExpiry(item.doc.docKey, e.target.value)
                            }
                            className="mt-1 min-h-[36px] rounded-chip border border-blue/20 bg-white px-2 text-xs font-semibold text-ink"
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2 rounded-chip bg-blue-50 p-3 text-xs leading-relaxed text-ink">
                      <div>
                        <strong>How / Where to get it:</strong>
                        <p className="mt-1">{where}</p>
                      </div>
                      {DOC_PREFLIGHT_CHECKS[item.doc.docKey] && (
                        <div className="border-t border-blue/15 pt-2">
                          <strong className="text-blue-700">Pre-Flight Rejection Guard:</strong>
                          <ul className="mt-1 list-disc pl-4 space-y-0.5 text-[11px]">
                            {DOC_PREFLIGHT_CHECKS[item.doc.docKey].map((chk, idx) => (
                              <li key={idx}>{chk}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => toggleHeldDocument(item.doc.docKey)}
                  className={`flex min-h-[44px] w-full items-center justify-center gap-2 rounded-pill text-xs font-bold transition ${
                    item.held
                      ? 'bg-green text-white'
                      : 'border border-blue/25 bg-white text-ink hover:bg-blue-50'
                  }`}
                >
                  <CheckCircle size={16} weight={item.held ? 'fill' : 'duotone'} />
                  {item.held ? 'Have this Document' : 'Mark as Have'}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Application Tracker + In-App Reminders */}
      <section className="glass p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-bold text-ink">
              Application Tracker (In-App State Machine)
            </h2>
            <p className="text-xs text-ink/75">
              Transitions: Not started → Documents ready → Applied → Approved / Rejected
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {trackerInsights.length > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-pill bg-yellow px-3 py-1 text-xs font-bold text-ink">
                <BellRinging size={15} weight="duotone" />
                {trackerInsights.length} active reminder(s)
              </span>
            )}
            <button
              type="button"
              onClick={() => {
                const map = new Map(catalogue.schemes.map((s) => [s.id, s]));
                const csv = exportApplicationsCsv(applications, map);
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `applications-${activeProfile.label.toLowerCase().replace(/\W+/g, '-')}.csv`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-pill border border-blue/25 bg-white px-3 text-xs font-bold text-blue-700 hover:bg-blue-50"
            >
              <DownloadSimple size={14} weight="bold" />
              Export CSV
            </button>
          </div>
        </div>

        {trackerInsights.length > 0 && (
          <div className="grid gap-2 sm:grid-cols-2">
            {trackerInsights.map((ins, i) => (
              <div
                key={i}
                className="rounded-chip border border-yellow bg-yellow-50 p-3 text-xs font-semibold text-ink"
              >
                {ins.message}
              </div>
            ))}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-blue/15 text-ink/70">
                <th className="py-2.5 pr-4">Scheme</th>
                <th className="py-2.5 pr-4">Docs Ready</th>
                <th className="py-2.5 pr-4">Current Status</th>
                <th className="py-2.5 pr-4">Portal Ref No.</th>
                <th className="py-2.5 pr-4">Reminder Date</th>
                <th className="py-2.5">Update Step</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue/10">
              {positiveRanked.map((r) => {
                const app = applications.find((a) => a.schemeId === r.scheme.id);
                const status: ApplicationStatus = app?.status ?? 'not_started';
                const allowed = getAllowedTransitions(status);

                return (
                  <tr key={r.scheme.id}>
                    <td className="py-3 pr-4 font-bold text-ink">
                      <Link href={`/schemes/${r.scheme.slug}`} className="hover:text-blue">
                        {getSchemeName(r.scheme, locale)}
                      </Link>
                    </td>
                    <td className="py-3 pr-4 font-mono-num">
                      {r.readinessPct}% ({r.heldDocCount}/{r.totalDocCount})
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={`rounded-pill px-2.5 py-0.5 font-bold uppercase text-[10px] ${
                          status === 'approved'
                            ? 'bg-green text-white'
                            : status === 'applied' || status === 'documents_ready'
                            ? 'bg-yellow text-ink'
                            : 'bg-blue-50 text-blue-700'
                        }`}
                      >
                        {status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <input
                        type="text"
                        placeholder="e.g. PMK-2026-104"
                        aria-label={`Reference number for ${r.scheme.nameEn}`}
                        value={app?.referenceNo ?? ''}
                        onChange={(e) =>
                          setApplicationStatus(r.scheme.id, status, undefined, undefined, e.target.value)
                        }
                        className="min-h-[34px] w-32 rounded-chip border border-blue/20 bg-white px-2 font-mono-num text-[11px]"
                      />
                    </td>
                    <td className="py-3 pr-4">
                      <input
                        type="date"
                        aria-label={`Reminder date for ${r.scheme.nameEn}`}
                        value={app?.remindOn ?? r.scheme.deadline ?? ''}
                        onChange={(e) =>
                          setApplicationStatus(r.scheme.id, status, e.target.value)
                        }
                        className="min-h-[34px] rounded-chip border border-blue/20 bg-white px-2 text-xs"
                      />
                    </td>
                    <td className="py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {allowed.length === 0 ? (
                          <span className="text-[11px] font-semibold text-green-700">
                            Completed
                          </span>
                        ) : (
                          allowed.map((nextSt) => (
                            <button
                              key={nextSt}
                              type="button"
                              onClick={() =>
                                setApplicationStatus(r.scheme.id, nextSt)
                              }
                              className="min-h-[32px] rounded-pill border border-blue/25 bg-white px-2.5 text-[11px] font-bold text-ink hover:bg-blue-50"
                            >
                              → {nextSt.replace(/_/g, ' ')}
                            </button>
                          ))
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Extra Feature #35: Offline Issuing Office & CSC Directory */}
      <section className="glass p-6 space-y-4">
        <div className="flex items-center gap-2">
          <MapPin size={20} weight="duotone" className="text-blue" />
          <h2 className="font-display text-xl font-bold text-ink">
            Offline Issuing Office &amp; CSC Directory ({locale.toUpperCase()})
          </h2>
        </div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {ISSUING_OFFICE_DIRECTORY.map((off) => (
            <div key={off.docKey} className="rounded-chip border border-blue/15 bg-white/85 p-3.5 text-xs space-y-1">
              <div className="flex justify-between font-bold text-ink">
                <span className="capitalize">{off.docKey.replace(/_/g, ' ')}</span>
                <span className="rounded-pill bg-blue-50 px-2 py-0.5 font-mono-num text-[10px] text-blue-700">
                  ~{off.typicalDays}d
                </span>
              </div>
              <div className="text-ink/80">
                {locale === 'hi' ? off.officeHi : locale === 'gu' ? off.officeGu : off.officeEn}
              </div>
              <div className="text-[11px] font-semibold text-green-700">{off.feeHint}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

