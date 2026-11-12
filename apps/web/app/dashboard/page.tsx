'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import {
  CheckCircle,
  Clock,
  Copy,
  Printer,
  QrCode,
  Sparkle,
  UsersThree,
} from '@phosphor-icons/react';
import { useSathiStore } from '@/lib/store/useSathiStore';
import { runCitizenOrchestrator } from '@/lib/orchestrator';
import { calculateHouseholdMatrix, formatINR } from '@/lib/benefits';
import { formatNearMissBanner } from '@/lib/explain';
import { getSchemeName } from '@/lib/i18n/messages';
import { BrandConfetti } from '@/components/glass/BrandConfetti';
import {
  buildCitizenPassGrid,
  composePlainTextSummary,
  computeUnlockRoadmap,
} from '@/lib/citizen/tools';
import { computeLifetimeProjection, estimateNonCashSavings } from '@/lib/calculators';

const CHART_COLORS = ['#1479FF', '#FFC20E', '#12B76A', '#0A1A3C', '#66A7FF', '#FFEBA6'];

export default function CitizenDashboardPage() {
  const {
    locale,
    profiles,
    activeProfileId,
    catalogue,
    applicationsByProfile,
  } = useSathiStore();

  const activeProfile =
    profiles.find((p) => p.id === activeProfileId) ?? profiles[0];
  const applications = applicationsByProfile[activeProfile.id] ?? [];

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

  // Extra Feature #8: Family Benefit Planner (Household Matrix)
  const householdMatrix = useMemo(
    () => calculateHouseholdMatrix(catalogue.schemes, profiles),
    [catalogue.schemes, profiles]
  );

  const [displayTotal, setDisplayTotal] = useState(0);
  const [confetti, setConfetti] = useState(false);
  const [inflationPct, setInflationPct] = useState(5);
  const [copiedSummary, setCopiedSummary] = useState(false);

  const evalMap = useMemo(
    () => new Map(orchestrated.ranked.map((r) => [r.scheme.id, r.eligibility])),
    [orchestrated.ranked]
  );

  const unlockRoadmap = useMemo(
    () => computeUnlockRoadmap(catalogue.schemes, evalMap),
    [catalogue.schemes, evalMap]
  );

  const lifetimeProj = useMemo(
    () =>
      computeLifetimeProjection({
        schemes: catalogue.schemes,
        evaluations: evalMap,
        years: 5,
        inflationPct,
      }),
    [catalogue.schemes, evalMap, inflationPct]
  );

  const nonCash = useMemo(
    () =>
      estimateNonCashSavings({
        schemes: catalogue.schemes,
        evaluations: evalMap,
        familySize: activeProfile.family_size,
      }),
    [catalogue.schemes, evalMap, activeProfile.family_size]
  );

  const passGrid = useMemo(
    () =>
      buildCitizenPassGrid(
        `${activeProfile.id}:${activeProfile.label}:${orchestrated.eligibleCount}:${orchestrated.optimalBundle.annualTotal}`
      ),
    [activeProfile.id, activeProfile.label, orchestrated.eligibleCount, orchestrated.optimalBundle.annualTotal]
  );

  useEffect(() => {
    const target = orchestrated.optimalBundle.annualTotal;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      setDisplayTotal(target);
      return;
    }
    const start = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / 1000);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplayTotal(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(step);
      else if (target > 0) {
        setConfetti(true);
        setTimeout(() => setConfetti(false), 1100);
      }
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [orchestrated.optimalBundle.annualTotal]);

  const categoryBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of orchestrated.ranked) {
      if (r.eligibility.status === 'eligible') {
        map.set(r.scheme.category, (map.get(r.scheme.category) ?? 0) + 1);
      }
    }
    return [...map.entries()].map(([name, value]) => ({ name, value }));
  }, [orchestrated.ranked]);

  const funnelData = useMemo(() => {
    const eligible = orchestrated.eligibleCount;
    const docsReady = orchestrated.ranked.filter(
      (r) => r.eligibility.status === 'eligible' && r.readinessPct === 100
    ).length;
    const applied = applications.filter((a) => a.status === 'applied').length;
    const approved = applications.filter((a) => a.status === 'approved').length;
    return [
      { stage: 'Eligible', count: eligible },
      { stage: 'Docs Ready', count: docsReady },
      { stage: 'Applied', count: applied },
      { stage: 'Approved', count: approved },
    ];
  }, [orchestrated, applications]);

  const nearMisses = orchestrated.ranked
    .filter((r) => r.eligibility.near_miss !== null)
    .slice(0, 5);

  const upcomingDeadlines = orchestrated.ranked
    .filter((r) => r.scheme.deadline && r.eligibility.status !== 'not_eligible')
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Hero KPI Bento Tile */}
      <div className="grid gap-5 lg:grid-cols-12">
        <div className="glass p-6 md:p-8 lg:col-span-6 flex flex-col justify-between">
          <div>
            <span className="rounded-pill bg-yellow px-3 py-1 text-xs font-bold text-ink">
              Personal Benefit Estimate • {activeProfile.label}
            </span>
            <h1 className="mt-3 font-display text-2xl font-bold text-ink">
              Money on the table (non-conflicting bundle)
            </h1>
          </div>

          <div className="relative my-5">
            <BrandConfetti active={confetti} />
            <div className="font-mono-num text-4xl font-bold text-blue sm:text-5xl">
              {formatINR(displayTotal)} <span className="text-lg text-ink/70">/ year</span>
            </div>
            <p className="mt-1 text-xs font-semibold text-ink/75">
              Lifetime estimate: {formatINR(orchestrated.optimalBundle.lifetimeTotal)} • Always verify on official portals.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/documents"
              className="min-h-[42px] inline-flex items-center rounded-pill bg-blue px-5 text-xs font-bold text-white"
            >
              Open Document Wallet ({orchestrated.checklist.readinessPct}% ready)
            </Link>
            <Link
              href="/schemes"
              className="min-h-[42px] inline-flex items-center rounded-pill border border-blue/25 bg-white px-5 text-xs font-bold text-ink"
            >
              Explore All Matches
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:col-span-6">
          <div className="glass p-5">
            <div className="text-xs font-bold text-ink/70">Eligible Schemes</div>
            <div className="mt-2 font-mono-num text-3xl font-bold text-green-700">
              {orchestrated.eligibleCount}
            </div>
            <div className="mt-1 text-[11px] font-semibold text-ink/70">
              +{orchestrated.likelyCount} Likely matches
            </div>
          </div>
          <div className="glass p-5">
            <div className="text-xs font-bold text-ink/70">Document Readiness</div>
            <div className="mt-2 font-mono-num text-3xl font-bold text-blue">
              {orchestrated.checklist.readinessPct}%
            </div>
            <div className="mt-1 text-[11px] font-semibold text-ink/70">
              {activeProfile.held_documents.length} document(s) held
            </div>
          </div>
          <div className="glass p-5">
            <div className="text-xs font-bold text-ink/70">Applications Tracked</div>
            <div className="mt-2 font-mono-num text-3xl font-bold text-ink">
              {applications.length}
            </div>
            <div className="mt-1 text-[11px] font-semibold text-ink/70">
              {applications.filter((a) => a.status === 'approved').length} approved
            </div>
          </div>
          <div className="glass-yellow p-5">
            <div className="text-xs font-bold text-ink/80">Combined Family Est.</div>
            <div className="mt-2 font-mono-num text-2xl font-bold text-ink">
              {formatINR(householdMatrix.combinedAnnualEstimate)}
            </div>
            <div className="mt-1 text-[11px] font-semibold text-ink/75">
              Across {profiles.length} saved profile(s)
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="glass p-6 lg:col-span-6 space-y-3">
          <h2 className="font-display text-lg font-bold text-ink">
            Eligible Schemes by Category
          </h2>
          <div className="h-64 w-full">
            {categoryBreakdown.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs font-semibold text-ink/70">
                Answer more questions in the Wizard to populate category matches.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryBreakdown}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                  >
                    {categoryBreakdown.map((_, idx) => (
                      <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="glass p-6 lg:col-span-6 space-y-3">
          <h2 className="font-display text-lg font-bold text-ink">
            Personal Application Funnel
          </h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(20,121,255,0.14)" />
                <XAxis dataKey="stage" tick={{ fill: '#0A1A3C', fontSize: 12 }} />
                <YAxis tick={{ fill: '#0A1A3C', fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#1479FF" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Extra Feature #8: Family Benefit Planner Matrix */}
      <section className="glass p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 font-display text-xl font-bold text-ink">
              <UsersThree size={22} weight="duotone" className="text-blue" />
              Family Benefit Planner (Household Matrix)
            </h2>
            <p className="text-xs text-ink/75">
              Combines all saved family profiles while automatically deduplicating household-level schemes (e.g. PM-KISAN, PMAY, PM-JAY).
            </p>
          </div>
          <span className="rounded-pill bg-green px-3 py-1 font-mono-num text-xs font-bold text-white">
            Combined: {formatINR(householdMatrix.combinedAnnualEstimate)} / yr (est.)
          </span>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {householdMatrix.memberSummaries.map((m) => (
            <div key={m.profileId} className="rounded-chip border border-blue/15 bg-white/85 p-4">
              <div className="font-display text-base font-bold text-ink">{m.label}</div>
              <div className="mt-1 font-mono-num text-lg font-bold text-blue">
                {formatINR(m.individualAnnualEstimate)} / yr
              </div>
              <div className="mt-1 text-xs font-semibold text-ink/70">
                {m.eligibleCount} Eligible • {m.likelyCount} Likely
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Missed Benefits & Upcoming Deadlines */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="glass p-6 space-y-3">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold text-ink">
            <Sparkle size={18} weight="duotone" className="text-yellow-700" />
            &ldquo;Missed Benefits&rdquo; Near-Miss Leaderboard
          </h2>
          {nearMisses.length === 0 ? (
            <p className="text-xs text-ink/70">No single-rule near-misses found for this profile.</p>
          ) : (
            <div className="space-y-2">
              {nearMisses.map((r) => (
                <Link
                  key={r.scheme.id}
                  href={`/schemes/${r.scheme.slug}`}
                  className="block rounded-chip border border-yellow/50 bg-yellow-50/75 p-3 text-xs hover:bg-yellow-50"
                >
                  <div className="flex justify-between font-bold text-ink">
                    <span>{getSchemeName(r.scheme, locale)}</span>
                    <span className="font-mono-num">{formatINR(r.benefit.annualEstimate)}</span>
                  </div>
                  <div className="mt-0.5 text-ink/80">
                    {r.eligibility.near_miss && formatNearMissBanner(r.eligibility.near_miss, locale)}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="glass p-6 space-y-3">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold text-ink">
            <Clock size={18} weight="duotone" className="text-blue" />
            Upcoming Scheme Deadlines
          </h2>
          {upcomingDeadlines.length === 0 ? (
            <p className="text-xs text-ink/70">Most matched schemes accept rolling applications year-round.</p>
          ) : (
            <div className="space-y-2">
              {upcomingDeadlines.map((r) => (
                <Link
                  key={r.scheme.id}
                  href={`/schemes/${r.scheme.slug}`}
                  className="flex items-center justify-between rounded-chip border border-blue/15 bg-white/85 p-3 text-xs hover:border-blue"
                >
                  <span className="font-bold text-ink">{getSchemeName(r.scheme, locale)}</span>
                  <span className="inline-flex items-center gap-1 rounded-pill bg-yellow px-2.5 py-0.5 font-mono-num font-bold text-ink">
                    <CheckCircle size={12} />
                    {r.scheme.deadline}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 5-Year Real vs Nominal Projection + Non-Cash Savings + Citizen Pass QR */}
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="glass p-6 lg:col-span-7 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-lg font-bold text-ink">
                5-Year Benefit Projection (Nominal vs Real)
              </h2>
              <p className="text-xs text-ink/75">
                Inflation slider: {inflationPct}%/yr • Cumulative Real Est.:{' '}
                <strong className="font-mono-num text-blue">{formatINR(lifetimeProj.totalRealRs)}</strong>
              </p>
            </div>
            <input
              type="range"
              aria-label="Inflation rate percent"
              min={0}
              max={10}
              step={1}
              value={inflationPct}
              onChange={(e) => setInflationPct(Number(e.target.value))}
              className="w-32 accent-blue"
            />
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={lifetimeProj.rows}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(20,121,255,0.14)" />
                <XAxis dataKey="year" tickFormatter={(y) => `Yr ${y}`} tick={{ fill: '#0A1A3C', fontSize: 12 }} />
                <YAxis tick={{ fill: '#0A1A3C', fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="nominalRs" name="Nominal Rs." fill="#1479FF" radius={[8, 8, 0, 0]} />
                <Bar dataKey="realRs" name="Inflation-Adjusted Rs." fill="#12B76A" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Non-Cash In-Kind Breakdown */}
          <div className="grid grid-cols-3 gap-2 pt-2 text-xs">
            <div className="rounded-chip bg-white/85 p-3 border border-blue/15">
              <div className="text-[11px] font-bold text-ink/70">Health Cover Cap</div>
              <div className="font-mono-num font-bold text-blue">{formatINR(nonCash.healthCoverRs)}</div>
            </div>
            <div className="rounded-chip bg-white/85 p-3 border border-blue/15">
              <div className="text-[11px] font-bold text-ink/70">Ration In-Kind / yr</div>
              <div className="font-mono-num font-bold text-green-700">{formatINR(nonCash.rationEquivalentRs)}</div>
            </div>
            <div className="rounded-chip bg-white/85 p-3 border border-blue/15">
              <div className="text-[11px] font-bold text-ink/70">LPG + Accident Cover</div>
              <div className="font-mono-num font-bold text-ink">{formatINR(nonCash.lpgSupportRs + nonCash.insuranceCoverRs)}</div>
            </div>
          </div>
        </div>

        {/* Printable Citizen Pass + Unlock Roadmap + Plain-Text SMS Summary */}
        <div className="glass p-6 lg:col-span-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 font-display text-lg font-bold text-ink">
                <QrCode size={18} weight="duotone" className="text-blue" />
                Offline Citizen Benefit Pass
              </h2>
              <p className="text-xs text-ink/75">
                Show at Jan Seva Kendra / CSC for rapid scheme lookup.
              </p>
            </div>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex min-h-[34px] items-center gap-1 rounded-pill border border-blue/25 bg-white px-3 text-xs font-bold text-ink"
            >
              <Printer size={13} />
              Print Pass
            </button>
          </div>

          <div className="flex items-center gap-4 rounded-card border border-blue/20 bg-white/90 p-4">
            <svg width="90" height="90" viewBox="0 0 15 15" className="shrink-0 rounded-chip bg-white p-1 border border-blue/15">
              {passGrid.map((row, r) =>
                row.map((on, c) =>
                  on ? <rect key={`${r}-${c}`} x={c} y={r} width={1} height={1} fill="#0A1A3C" /> : null
                )
              )}
            </svg>
            <div className="text-xs space-y-1">
              <div className="font-display text-sm font-bold text-ink">{activeProfile.label}</div>
              <div className="font-mono-num text-ink/80">Eligible: {orchestrated.eligibleCount} • Est. {formatINR(orchestrated.optimalBundle.annualTotal)}/yr</div>
              <div className="font-mono-num text-blue-700">Docs Held: {activeProfile.held_documents.length}</div>
            </div>
          </div>

          {unlockRoadmap.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-xs font-bold text-ink">1-Step Unlock Roadmap (Highest Value First):</div>
              {unlockRoadmap.slice(0, 2).map((u) => (
                <Link
                  key={u.scheme.id}
                  href={`/schemes/${u.scheme.slug}`}
                  className="block rounded-chip border border-blue/15 bg-white/85 p-2.5 text-xs hover:border-blue"
                >
                  <div className="flex justify-between font-bold text-ink">
                    <span>{getSchemeName(u.scheme, locale)}</span>
                    <span className="font-mono-num text-green-700">+{formatINR(u.annualGainRs)}/yr</span>
                  </div>
                  <div className="text-[11px] text-ink/75">{u.hint}</div>
                </Link>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              const txt = composePlainTextSummary({
                locale,
                profile: activeProfile,
                eligibleSchemes: orchestrated.ranked
                  .filter((r) => r.eligibility.status === 'eligible')
                  .map((r) => r.scheme),
                missingDocs: orchestrated.checklist.items
                  .filter((i) => !i.held)
                  .map((i) => i.doc.nameEn),
              });
              navigator.clipboard?.writeText(txt);
              setCopiedSummary(true);
              setTimeout(() => setCopiedSummary(false), 1800);
            }}
            className="inline-flex min-h-[40px] w-full items-center justify-center gap-1.5 rounded-pill bg-blue px-4 text-xs font-bold text-white"
          >
            <Copy size={14} weight="bold" />
            {copiedSummary ? 'Copied Offline SMS / WhatsApp Summary!' : 'Copy Plain-Text Summary (SMS / WhatsApp)'}
          </button>
        </div>
      </div>
    </div>
  );
}

