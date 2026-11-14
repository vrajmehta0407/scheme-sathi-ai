'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Fuse from 'fuse.js';
import { AnimatePresence } from 'framer-motion';
import {
  MagnifyingGlass,
  Scales,
  Sparkle,
  BookmarkSimple,
  DownloadSimple,
  X,
} from '@phosphor-icons/react';
import { useSathiStore } from '@/lib/store/useSathiStore';
import { runCitizenOrchestrator } from '@/lib/orchestrator';
import { SchemePin } from '@/components/pins/SchemePin';
import { formatINR } from '@/lib/benefits';
import { getSchemeName } from '@/lib/i18n/messages';
import { expandSmartQuery, exportSchemesCsv, getDeadlineUrgency } from '@/lib/citizen/tools';

export default function SchemesExplorerPage() {
  const {
    locale,
    profiles,
    activeProfileId,
    catalogue,
    bookmarksByProfile,
    compareIds,
    toggleBookmark,
    toggleCompare,
    clearCompare,
  } = useSathiStore();

  const activeProfile =
    profiles.find((p) => p.id === activeProfileId) ?? profiles[0];
  const bookmarkedSet = new Set(bookmarksByProfile[activeProfile.id] ?? []);

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'eligible' | 'likely' | 'not_eligible'>('all');
  const [levelFilter, setLevelFilter] = useState<'all' | 'central' | 'state'>('all');
  const [onlyBookmarked, setOnlyBookmarked] = useState(false);
  const [optimalOnly, setOptimalOnly] = useState(false);
  const [zeroMissingOnly, setZeroMissingOnly] = useState(false);
  const [closingSoonOnly, setClosingSoonOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'match' | 'benefit' | 'docs' | 'days' | 'deadline'>('match');
  const [showCompareModal, setShowCompareModal] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cat = params.get('category');
    if (cat) setCategory(cat);
  }, []);

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

  const optimalIds = useMemo(
    () => new Set(orchestrated.optimalBundle.selectedSchemes.map((r) => r.scheme.id)),
    [orchestrated.optimalBundle]
  );

  const fuse = useMemo(() => {
    return new Fuse(orchestrated.ranked, {
      keys: [
        'scheme.nameEn',
        'scheme.nameHi',
        'scheme.nameGu',
        'scheme.summaryEn',
        'scheme.category',
        'scheme.state',
      ],
      threshold: 0.35,
    });
  }, [orchestrated.ranked]);

  const filtered = useMemo(() => {
    const expanded = expandSmartQuery(query);
    let list = expanded
      ? fuse.search(expanded).map((res) => res.item)
      : orchestrated.ranked;

    if (category !== 'all') list = list.filter((r) => r.scheme.category === category);
    if (statusFilter !== 'all') list = list.filter((r) => r.eligibility.status === statusFilter);
    if (levelFilter !== 'all') list = list.filter((r) => r.scheme.level === levelFilter);
    if (onlyBookmarked) list = list.filter((r) => bookmarkedSet.has(r.scheme.id));
    if (optimalOnly) list = list.filter((r) => optimalIds.has(r.scheme.id));
    if (zeroMissingOnly) list = list.filter((r) => r.missingDocs.length === 0);
    if (closingSoonOnly) {
      list = list.filter((r) => {
        const u = getDeadlineUrgency(r.scheme.deadline);
        return u.urgencyLevel === 'urgent' || u.urgencyLevel === 'soon';
      });
    }

    if (sortBy === 'benefit') {
      list = [...list].sort((a, b) => b.benefit.annualEstimate - a.benefit.annualEstimate);
    } else if (sortBy === 'docs') {
      list = [...list].sort((a, b) => a.missingDocs.length - b.missingDocs.length);
    } else if (sortBy === 'days') {
      list = [...list].sort((a, b) => a.daysToReady - b.daysToReady);
    } else if (sortBy === 'deadline') {
      list = [...list].sort((a, b) => {
        const da = getDeadlineUrgency(a.scheme.deadline).daysRemaining ?? 9999;
        const db = getDeadlineUrgency(b.scheme.deadline).daysRemaining ?? 9999;
        return da - db;
      });
    }

    return list;
  }, [
    query,
    fuse,
    orchestrated.ranked,
    category,
    statusFilter,
    levelFilter,
    onlyBookmarked,
    optimalOnly,
    zeroMissingOnly,
    closingSoonOnly,
    sortBy,
    bookmarkedSet,
    optimalIds,
  ]);

  const handleExportCsv = () => {
    const csv = exportSchemesCsv(
      filtered.map((f) => ({ scheme: f.scheme, evaluation: f.eligibility }))
    );
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `schemes-${activeProfile.label.toLowerCase().replace(/\W+/g, '-')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const comparedItems = orchestrated.ranked.filter((r) =>
    compareIds.includes(r.scheme.id)
  );

  return (
    <div className="space-y-6">
      {/* Header + Optimal Bundle Banner */}
      <div className="glass p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-ink">
              Scheme Explorer Board
            </h1>
            <p className="text-sm text-ink/75">
              Showing {filtered.length} of {orchestrated.ranked.length} official schemes for{' '}
              <strong>{activeProfile.label}</strong> • Evaluated in {orchestrated.computeMs} ms
            </p>
          </div>

          {/* Extra Feature #5: Optimal Stackable Bundle Pill */}
          <div className="glass-yellow flex flex-wrap items-center gap-3 rounded-card px-4 py-3">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-ink/75">
                Max Non-Conflicting Bundle
              </div>
              <div className="font-mono-num text-xl font-bold text-ink">
                {formatINR(orchestrated.optimalBundle.annualTotal)} / yr (est.)
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOptimalOnly((v) => !v)}
              className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-pill px-4 py-1.5 text-xs font-bold transition ${
                optimalOnly
                  ? 'bg-blue text-white'
                  : 'bg-white text-ink border border-blue/25 hover:bg-blue-50'
              }`}
            >
              <Sparkle size={14} weight="duotone" />
              {optimalOnly ? 'Showing Optimal Stack' : 'Filter Optimal Bundle'}
            </button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="grid gap-3 md:grid-cols-12">
          <div className="relative md:col-span-5">
            <MagnifyingGlass
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-blue"
            />
            <input
              type="search"
              placeholder="Fuzzy search schemes (e.g. किसान, MYSY, solar, pension)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="min-h-[46px] w-full rounded-pill border border-blue/25 bg-white pl-11 pr-4 text-sm font-semibold text-ink"
            />
          </div>

          <select
            aria-label="Filter by category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="min-h-[46px] rounded-pill border border-blue/25 bg-white px-4 text-xs font-bold text-ink md:col-span-2"
          >
            <option value="all">All Categories</option>
            <option value="farmers">Farmers</option>
            <option value="students">Students</option>
            <option value="women">Women</option>
            <option value="seniors">Seniors</option>
            <option value="workers">Workers</option>
            <option value="entrepreneurs">Entrepreneurs</option>
            <option value="health">Health</option>
            <option value="housing">Housing</option>
          </select>

          <select
            aria-label="Filter by eligibility status"
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as typeof statusFilter)
            }
            className="min-h-[46px] rounded-pill border border-blue/25 bg-white px-4 text-xs font-bold text-ink md:col-span-2"
          >
            <option value="all">All Statuses</option>
            <option value="eligible">Eligible ({orchestrated.eligibleCount})</option>
            <option value="likely">Likely ({orchestrated.likelyCount})</option>
            <option value="not_eligible">Not eligible ({orchestrated.notEligibleCount})</option>
          </select>

          <select
            aria-label="Filter by level"
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value as typeof levelFilter)}
            className="min-h-[46px] rounded-pill border border-blue/25 bg-white px-4 text-xs font-bold text-ink md:col-span-2"
          >
            <option value="all">Central & State</option>
            <option value="central">Central Only</option>
            <option value="state">State Only</option>
          </select>

          <button
            type="button"
            onClick={() => setOnlyBookmarked((v) => !v)}
            className={`inline-flex min-h-[46px] items-center justify-center gap-1 rounded-pill border px-3 text-xs font-bold md:col-span-1 ${
              onlyBookmarked
                ? 'border-yellow bg-yellow text-ink'
                : 'border-blue/25 bg-white text-ink'
            }`}
          >
            <BookmarkSimple size={16} weight={onlyBookmarked ? 'fill' : 'duotone'} />
            Saved
          </button>
        </div>

        {/* Multi-Sort, Quick Chips & CSV Export */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setZeroMissingOnly((v) => !v)}
              className={`min-h-[34px] rounded-pill px-3 text-xs font-bold border ${
                zeroMissingOnly
                  ? 'border-green bg-green text-white'
                  : 'border-blue/20 bg-white text-ink hover:bg-blue-50'
              }`}
            >
              0 Missing Docs
            </button>
            <button
              type="button"
              onClick={() => setClosingSoonOnly((v) => !v)}
              className={`min-h-[34px] rounded-pill px-3 text-xs font-bold border ${
                closingSoonOnly
                  ? 'border-yellow bg-yellow text-ink'
                  : 'border-blue/20 bg-white text-ink hover:bg-blue-50'
              }`}
            >
              Closing Soon (&le;45d)
            </button>
            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex min-h-[34px] items-center gap-1.5 rounded-pill border border-blue/25 bg-white px-3 text-xs font-bold text-blue-700 hover:bg-blue-50"
            >
              <DownloadSimple size={14} weight="bold" />
              Export CSV ({filtered.length})
            </button>
            {bookmarkedSet.size > 0 && (
              <button
                type="button"
                onClick={() => {
                  const text = orchestrated.ranked
                    .filter((r) => bookmarkedSet.has(r.scheme.id))
                    .map((r, i) => `${i + 1}. ${getSchemeName(r.scheme, locale)} — ${formatINR(r.benefit.annualEstimate)}/yr (${r.eligibility.status})`)
                    .join('\n');
                  navigator.clipboard?.writeText(text);
                }}
                className="min-h-[34px] rounded-pill bg-yellow px-3 text-xs font-bold text-ink"
              >
                Copy {bookmarkedSet.size} Bookmarked
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-ink/70">Sort:</span>
            <select
              aria-label="Sort schemes"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="min-h-[34px] rounded-pill border border-blue/25 bg-white px-3 text-xs font-bold text-ink"
            >
              <option value="match">Best Recommender Score</option>
              <option value="benefit">Highest Benefit (Rs.)</option>
              <option value="docs">Fewest Missing Docs</option>
              <option value="days">Fastest Ready Days</option>
              <option value="deadline">Earliest Deadline</option>
            </select>
          </div>
        </div>

        {/* Conflict Notice when Optimal Filter is active */}
        {optimalOnly && orchestrated.optimalBundle.skippedConflicts.length > 0 && (
          <div className="rounded-chip border border-blue/20 bg-blue-50 p-3 text-xs text-ink">
            <strong>Mutual-Exclusivity Guard:</strong> Skipped{' '}
            {orchestrated.optimalBundle.skippedConflicts.length} overlapping scheme(s) (e.g.{' '}
            {orchestrated.optimalBundle.skippedConflicts
              .map((c) => `${c.scheme.scheme.nameEn} vs ${c.chosenSchemeName}`)
              .slice(0, 2)
              .join('; ')}
            ) to avoid double counting.
          </div>
        )}
      </div>

      {/* Floating Compare Bar */}
      {compareIds.length > 0 && (
        <div className="glass-blue sticky top-[74px] z-20 flex flex-wrap items-center justify-between gap-3 rounded-card p-4">
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-ink">
            <Scales size={18} weight="duotone" className="text-blue" />
            <span>Compare ({compareIds.length}/3):</span>
            {comparedItems.map((c) => (
              <span
                key={c.scheme.id}
                className="inline-flex items-center gap-1 rounded-pill bg-white px-3 py-1"
              >
                {getSchemeName(c.scheme, locale)}
                <button
                  type="button"
                  onClick={() => toggleCompare(c.scheme.id)}
                  aria-label="Remove from compare"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={clearCompare}
              className="min-h-[38px] rounded-pill bg-white px-3 text-xs font-bold text-ink"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => setShowCompareModal(true)}
              className="min-h-[38px] rounded-pill bg-blue px-4 text-xs font-bold text-white"
            >
              Side-by-Side View
            </button>
          </div>
        </div>
      )}

      {/* Side-by-Side Comparison Modal */}
      {showCompareModal && comparedItems.length > 0 && (
        <div className="glass p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold text-ink">
              Side-by-Side Scheme Comparison
            </h2>
            <button
              type="button"
              onClick={() => setShowCompareModal(false)}
              className="min-h-[36px] rounded-pill bg-blue-50 px-3 text-xs font-bold text-blue-700"
            >
              Close
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-blue/15 text-ink/70">
                  <th className="py-2 pr-4">Attribute</th>
                  {comparedItems.map((c) => (
                    <th key={c.scheme.id} className="py-2 pr-4 font-display text-sm text-ink">
                      {getSchemeName(c.scheme, locale)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-blue/10">
                <tr>
                  <td className="py-2.5 pr-4 font-bold">Status</td>
                  {comparedItems.map((c) => (
                    <td key={c.scheme.id} className="py-2.5 pr-4 font-bold uppercase">
                      {c.eligibility.status}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2.5 pr-4 font-bold">Annual Est.</td>
                  {comparedItems.map((c) => (
                    <td key={c.scheme.id} className="py-2.5 pr-4 font-mono-num font-bold">
                      {formatINR(c.benefit.annualEstimate)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2.5 pr-4 font-bold">Lifetime Est.</td>
                  {comparedItems.map((c) => (
                    <td key={c.scheme.id} className="py-2.5 pr-4 font-mono-num">
                      {formatINR(c.benefit.lifetimeEstimate)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2.5 pr-4 font-bold">Doc Readiness</td>
                  {comparedItems.map((c) => (
                    <td key={c.scheme.id} className="py-2.5 pr-4 font-mono-num">
                      {c.readinessPct}% ({c.heldDocCount}/{c.totalDocCount})
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2.5 pr-4 font-bold">Exclusive Group</td>
                  {comparedItems.map((c) => (
                    <td key={c.scheme.id} className="py-2.5 pr-4">
                      {c.scheme.exclusiveGroup ?? 'Stackable with all'}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pinterest Masonry Grid */}
      {filtered.length === 0 ? (
        <div className="glass p-10 text-center space-y-3">
          <p className="font-display text-lg font-bold text-ink">
            No schemes match these filters yet.
          </p>
          <p className="text-sm text-ink/75">
            Try clearing search/status filters or updating your answers in the{' '}
            <Link href="/wizard" className="font-bold text-blue underline">
              Sathi Wizard
            </Link>
            .
          </p>
        </div>
      ) : (
        <div className="masonry-grid">
          <AnimatePresence>
            {filtered.map((item, idx) => (
              <SchemePin
                key={item.scheme.id}
                item={item}
                locale={locale}
                bookmarked={bookmarkedSet.has(item.scheme.id)}
                compared={compareIds.includes(item.scheme.id)}
                onToggleBookmark={toggleBookmark}
                onToggleCompare={toggleCompare}
                variant={idx % 5 === 0 ? 'tall' : idx % 7 === 0 ? 'featured' : 'compact'}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

