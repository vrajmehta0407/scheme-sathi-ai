'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
} from 'recharts';
import {
  BookmarkSimple,
  DownloadSimple,
  Image as ImageIcon,
  Table as TableIcon,
  WarningCircle,
} from '@phosphor-icons/react';
import { IndiaCoverageMap } from '@/components/map/IndiaCoverageMap';
import { formatINR } from '@/lib/benefits';
import { INDIAN_STATES } from '@/lib/profile';
import type {
  AnalyticsOverviewResult,
  CohortComparisonResult,
  PopulationRow,
} from '@/lib/analytics';
import {
  buildBlockerRoi,
  buildCategoryEquity,
  buildStateScorecards,
} from '@/lib/analytics/extra';

export default function AnalyticsWorkbenchPage() {
  const [stateFilter, setStateFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [occFilter, setOccFilter] = useState('All');
  const [incomeBand, setIncomeBand] = useState('All');
  const [activeTab, setActiveTab] = useState<
    'overview' | 'cohorts' | 'equity' | 'overlap' | 'table'
  >('overview');
  const [showTableToggle, setShowTableToggle] = useState(false);
  const [viewName, setViewName] = useState('');
  const [savedViews, setSavedViews] = useState<
    Array<{ id: string; name: string; filters: Record<string, string> }>
  >([]);

  // Custom Cohort Builder state (Extra Feature #13)
  const [cohortA, setCohortA] = useState({
    label: 'SC Farmers',
    category: 'SC',
    occupation: 'farmer',
    state: 'All',
  });
  const [cohortB, setCohortB] = useState({
    label: 'All Farmers',
    category: 'All',
    occupation: 'farmer',
    state: 'All',
  });
  const [cohortResult, setCohortResult] = useState<CohortComparisonResult | null>(null);

  const chartBoxRef = useRef<HTMLDivElement>(null);

  const queryParams = useMemo(() => {
    const p = new URLSearchParams();
    if (stateFilter !== 'All') p.set('state', stateFilter);
    if (categoryFilter !== 'All') p.set('category', categoryFilter);
    if (occFilter !== 'All') p.set('occupation', occFilter);
    if (incomeBand !== 'All') p.set('incomeBand', incomeBand);
    return p.toString();
  }, [stateFilter, categoryFilter, occFilter, incomeBand]);

  const { data: overview, isLoading } = useQuery<AnalyticsOverviewResult>({
    queryKey: ['analytics-overview', queryParams],
    queryFn: async () => {
      const r = await fetch(`/api/analytics/overview?${queryParams}`);
      if (!r.ok) throw new Error('Failed to load analytics');
      return r.json();
    },
  });

  // Load saved analyst views
  useEffect(() => {
    fetch('/api/analytics/views')
      .then((r) => r.json())
      .then((d) => setSavedViews(d.views ?? []))
      .catch(() => {});
  }, []);

  // Cohort query
  useEffect(() => {
    fetch('/api/analytics/cohort', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cohortA, cohortB }),
    })
      .then((r) => r.json())
      .then((d) => setCohortResult(d))
      .catch(() => {});
  }, [cohortA, cohortB]);

  // Virtualised Population Table data
  const [popRows, setPopRows] = useState<PopulationRow[]>([]);
  const [popTotal, setPopTotal] = useState(0);
  useEffect(() => {
    if (activeTab !== 'table') return;
    fetch(`/api/analytics/population?limit=500&${queryParams}`)
      .then((r) => r.json())
      .then((d) => {
        setPopRows(d.rows ?? []);
        setPopTotal(d.total ?? 0);
      })
      .catch(() => {});
  }, [activeTab, queryParams]);

  const tableParentRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: popRows.length,
    getScrollElement: () => tableParentRef.current,
    estimateSize: () => 40,
    overscan: 10,
  });

  const handleSaveView = async () => {
    if (!viewName.trim()) return;
    const res = await fetch('/api/analytics/views', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: viewName,
        filters: {
          state: stateFilter,
          category: categoryFilter,
          occupation: occFilter,
          incomeBand,
        },
      }),
    });
    if (res.ok) {
      const d = await res.json();
      setSavedViews((prev) => [d.view, ...prev]);
      setViewName('');
    }
  };

  // Client-side SVG-to-PNG chart export
  const handleExportPNG = () => {
    const svg = chartBoxRef.current?.querySelector('svg');
    if (!svg) return;
    const xml = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = svg.clientWidth * 2 || 1000;
      canvas.height = svg.clientHeight * 2 || 600;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((png) => {
          if (!png) return;
          const a = document.createElement('a');
          a.href = URL.createObjectURL(png);
          a.download = 'scheme-sathi-chart.png';
          a.click();
        });
      }
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  return (
    <div className="space-y-6">
      {/* Top Workbench Header & Persistent Synthetic Data Badge */}
      <div className="glass p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-pill bg-yellow px-3 py-1 text-xs font-bold text-ink">
                <WarningCircle size={14} weight="duotone" />
                Synthetic data (n = {overview?.sampleSize.toLocaleString('en-IN') ?? '20,000'} households)
              </span>
              {overview && (
                <span className="rounded-pill bg-blue-50 px-3 py-1 font-mono-num text-xs font-bold text-blue-700">
                  Query: {overview.computedMs} ms • Cells n &lt; 30 suppressed
                </span>
              )}
            </div>
            <h1 className="mt-2 font-display text-3xl font-bold text-ink">
              Policy &amp; Coverage Analytics Workbench
            </h1>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setShowTableToggle((v) => !v)}
              className="inline-flex min-h-[42px] items-center gap-1.5 rounded-pill border border-blue/25 bg-white px-4 text-xs font-bold text-ink"
            >
              <TableIcon size={15} weight="duotone" className="text-blue" />
              {showTableToggle ? 'Chart View' : 'Table Fallback'}
            </button>
            <button
              type="button"
              onClick={handleExportPNG}
              className="inline-flex min-h-[42px] items-center gap-1.5 rounded-pill border border-blue/25 bg-white px-4 text-xs font-bold text-ink"
            >
              <ImageIcon size={15} weight="duotone" className="text-blue" />
              PNG
            </button>
            <a
              href={`/api/analytics/export?${queryParams}`}
              className="inline-flex min-h-[42px] items-center gap-1.5 rounded-pill bg-blue px-4 text-xs font-bold text-white"
            >
              <DownloadSimple size={15} weight="bold" />
              Export CSV
            </a>
          </div>
        </div>

        {/* Filters + Saved Views */}
        <div className="grid gap-3 md:grid-cols-6">
          <select
            aria-label="Filter analytics by state"
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            className="min-h-[44px] rounded-pill border border-blue/25 bg-white px-3 text-xs font-bold text-ink"
          >
            <option value="All">All States (India)</option>
            {INDIAN_STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter analytics by category"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="min-h-[44px] rounded-pill border border-blue/25 bg-white px-3 text-xs font-bold text-ink"
          >
            <option value="All">All Categories</option>
            {(['General', 'OBC', 'SC', 'ST', 'EWS'] as const).map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter analytics by occupation"
            value={occFilter}
            onChange={(e) => setOccFilter(e.target.value)}
            className="min-h-[44px] rounded-pill border border-blue/25 bg-white px-3 text-xs font-bold text-ink"
          >
            <option value="All">All Occupations</option>
            {(['farmer', 'student', 'worker', 'artisan', 'entrepreneur', 'salaried', 'unemployed', 'retired'] as const).map(
              (o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              )
            )}
          </select>

          <select
            aria-label="Filter analytics by income band"
            value={incomeBand}
            onChange={(e) => setIncomeBand(e.target.value)}
            className="min-h-[44px] rounded-pill border border-blue/25 bg-white px-3 text-xs font-bold text-ink"
          >
            <option value="All">All Income Bands</option>
            <option value="below_1l">Below ₹1L</option>
            <option value="1l_to_2_5l">₹1L – ₹2.5L</option>
            <option value="2_5l_to_5l">₹2.5L – ₹5L</option>
            <option value="5l_to_8l">₹5L – ₹8L</option>
            <option value="above_8l">Above ₹8L</option>
          </select>

          <div className="md:col-span-2 flex gap-2">
            <input
              type="text"
              placeholder="Save view name..."
              value={viewName}
              onChange={(e) => setViewName(e.target.value)}
              className="min-h-[44px] flex-1 rounded-pill border border-blue/25 bg-white px-3 text-xs font-semibold text-ink"
            />
            <button
              type="button"
              onClick={handleSaveView}
              className="inline-flex min-h-[44px] items-center gap-1 rounded-pill bg-yellow px-4 text-xs font-bold text-ink"
            >
              <BookmarkSimple size={14} weight="duotone" />
              Save
            </button>
          </div>
        </div>

        {savedViews.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-bold text-ink/70">Saved Views:</span>
            {savedViews.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => {
                  setStateFilter(v.filters.state ?? 'All');
                  setCategoryFilter(v.filters.category ?? 'All');
                  setOccFilter(v.filters.occupation ?? 'All');
                  setIncomeBand(v.filters.incomeBand ?? 'All');
                }}
                className="rounded-pill border border-blue/20 bg-white px-3 py-1 font-bold text-blue-700 hover:bg-blue-50"
              >
                {v.name}
              </button>
            ))}
          </div>
        )}

        {/* Sub-view tabs */}
        <div className="flex flex-wrap gap-2 border-t border-blue/10 pt-3">
          {(
            [
              ['overview', 'Overview & Map'],
              ['cohorts', 'Cohort Z-Test'],
              ['equity', 'Rural/Urban & Gini Equity'],
              ['overlap', 'Scheme Overlap Matrix'],
              ['table', '20K Synthetic Table'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`min-h-[40px] rounded-pill px-4 text-xs font-bold transition ${
                activeTab === id ? 'bg-blue text-white' : 'bg-white text-ink border border-blue/20'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {isLoading || !overview ? (
        <div className="glass p-10 text-center text-sm font-bold text-ink">
          Computing aggregations across 20,000 synthetic households...
        </div>
      ) : (
        <>
          {/* Insight Pins (Agent 10) */}
          <div className="grid gap-4 md:grid-cols-3">
            {overview.insights.map((pin) => (
              <div key={pin.id} className="glass p-5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="rounded-pill bg-yellow px-2.5 py-0.5 font-mono-num text-xs font-bold text-ink">
                    {pin.metric}
                  </span>
                  <span className="text-[11px] font-semibold text-ink/65">
                    Synthetic n={pin.sampleSize.toLocaleString('en-IN')}
                  </span>
                </div>
                <p className="text-xs font-bold leading-relaxed text-ink">
                  {pin.headline}
                </p>
              </div>
            ))}
          </div>

          {activeTab === 'overview' && (
            <div ref={chartBoxRef} className="space-y-6">
              {/* KPI Tiles */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="glass p-5">
                  <div className="text-xs font-bold text-ink/70">Sample Size (Synthetic)</div>
                  <div className="mt-1 font-mono-num text-3xl font-bold text-ink">
                    {overview.kpis.totalHouseholds.toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="glass p-5">
                  <div className="text-xs font-bold text-ink/70">Eligibility Rate</div>
                  <div className="mt-1 font-mono-num text-3xl font-bold text-green-700">
                    {overview.kpis.eligibilityRatePct}%
                  </div>
                  <div className="text-[11px] font-semibold text-ink/70">
                    Avg {overview.kpis.avgEligibleSchemes} schemes / household
                  </div>
                </div>
                <div className="glass p-5">
                  <div className="text-xs font-bold text-ink/70">Docs Ready Among Eligible</div>
                  <div className="mt-1 font-mono-num text-3xl font-bold text-blue">
                    {overview.kpis.docsReadyRatePct}%
                  </div>
                </div>
                <div className="glass-yellow p-5">
                  <div className="text-xs font-bold text-ink/80">Est. Unclaimed Pool</div>
                  <div className="mt-1 font-mono-num text-2xl font-bold text-ink">
                    {formatINR(overview.kpis.unclaimedBenefitRs)}
                  </div>
                  <div className="text-[11px] font-semibold text-ink/70">Synthetic aggregate</div>
                </div>
              </div>

              {/* India Map + Funnel & Blockers */}
              <div className="grid gap-6 lg:grid-cols-12">
                <div className="glass p-6 lg:col-span-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="font-display text-lg font-bold text-ink">
                      India Document Coverage Gap Map
                    </h2>
                    <span className="rounded-pill bg-yellow px-2.5 py-0.5 text-[10px] font-bold text-ink">
                      Synthetic data
                    </span>
                  </div>
                  <IndiaCoverageMap
                    states={overview.byState}
                    selectedState={stateFilter}
                    onSelectState={(st) =>
                      setStateFilter((prev) => (prev === st ? 'All' : st))
                    }
                  />
                </div>

                <div className="lg:col-span-6 space-y-6">
                  <div className="glass p-6 space-y-3">
                    <h2 className="font-display text-lg font-bold text-ink">
                      Top Blocking Criteria (Near-Eligible Households)
                    </h2>
                    {showTableToggle ? (
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-blue/15 text-left">
                            <th className="py-1.5">Criterion</th>
                            <th className="py-1.5">Near-Misses</th>
                            <th className="py-1.5">Share %</th>
                          </tr>
                        </thead>
                        <tbody>
                          {overview.blockers.map((b) => (
                            <tr key={b.field} className="border-b border-blue/10">
                              <td className="py-1.5 font-bold">{b.field}</td>
                              <td className="py-1.5 font-mono-num">{b.failureCount}</td>
                              <td className="py-1.5 font-mono-num">{b.sharePct}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="h-56 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={overview.blockers} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(20,121,255,0.12)" />
                            <XAxis type="number" tick={{ fill: '#0A1A3C', fontSize: 11 }} />
                            <YAxis
                              dataKey="field"
                              type="category"
                              width={110}
                              tick={{ fill: '#0A1A3C', fontSize: 11 }}
                            />
                            <Tooltip />
                            <Bar dataKey="sharePct" name="Share %" fill="#1479FF" radius={[0, 8, 8, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>

                  <div className="glass p-6 space-y-3">
                    <div className="flex items-center justify-between">
                      <h2 className="font-display text-lg font-bold text-ink">
                        Citizen-to-Approval Funnel
                      </h2>
                      <span className="text-[11px] font-bold text-blue-700">
                        Applied/Approved simulated
                      </span>
                    </div>
                    <div className="space-y-2">
                      {overview.funnel.map((f) => (
                        <div key={f.stage} className="space-y-1">
                          <div className="flex justify-between text-xs font-bold text-ink">
                            <span>{f.stage}</span>
                            <span className="font-mono-num">
                              {f.count.toLocaleString('en-IN')} ({f.pct}%)
                            </span>
                          </div>
                          <div className="h-3 w-full overflow-hidden rounded-pill bg-blue-50">
                            <div
                              className={`h-full rounded-pill ${
                                f.isSimulated ? 'bg-yellow' : 'bg-blue'
                              }`}
                              style={{ width: `${Math.max(2, f.pct)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'cohorts' && (
            <div className="glass p-6 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="font-display text-xl font-bold text-ink">
                    Custom Cohort Builder &amp; Two-Proportion Z-Test
                  </h2>
                  <p className="text-xs text-ink/75">
                    Compare any two synthetic cohorts with statistical significance (no causal claims).
                  </p>
                </div>
                <span className="rounded-pill bg-yellow px-3 py-1 text-xs font-bold text-ink">
                  Synthetic data • n ≥ 30 required
                </span>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {[
                  { title: 'Cohort A', state: cohortA, setter: setCohortA },
                  { title: 'Cohort B', state: cohortB, setter: setCohortB },
                ].map((box) => (
                  <div key={box.title} className="rounded-card border border-blue/15 bg-white/85 p-4 space-y-3">
                    <div className="font-bold text-sm text-blue-700">{box.title}</div>
                    <input
                      type="text"
                      value={box.state.label}
                      onChange={(e) => box.setter({ ...box.state, label: e.target.value })}
                      className="min-h-[40px] w-full rounded-pill border border-blue/20 px-3 text-xs font-bold"
                    />
                    <div className="grid grid-cols-3 gap-2">
                      <select
                        value={box.state.category}
                        onChange={(e) => box.setter({ ...box.state, category: e.target.value })}
                        className="min-h-[38px] rounded-pill border border-blue/20 px-2 text-xs font-semibold"
                      >
                        <option value="All">All Cat</option>
                        <option value="SC">SC</option>
                        <option value="ST">ST</option>
                        <option value="OBC">OBC</option>
                        <option value="EWS">EWS</option>
                        <option value="General">General</option>
                      </select>
                      <select
                        value={box.state.occupation}
                        onChange={(e) => box.setter({ ...box.state, occupation: e.target.value })}
                        className="min-h-[38px] rounded-pill border border-blue/20 px-2 text-xs font-semibold"
                      >
                        <option value="All">All Occ</option>
                        <option value="farmer">Farmer</option>
                        <option value="student">Student</option>
                        <option value="worker">Worker</option>
                        <option value="entrepreneur">Entrepreneur</option>
                      </select>
                      <select
                        value={box.state.state}
                        onChange={(e) => box.setter({ ...box.state, state: e.target.value })}
                        className="min-h-[38px] rounded-pill border border-blue/20 px-2 text-xs font-semibold"
                      >
                        <option value="All">All States</option>
                        {INDIAN_STATES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>

              {cohortResult && (
                <div className="rounded-card border border-blue/25 bg-blue-50/75 p-5 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="font-mono-num text-lg font-bold text-ink">
                      {cohortResult.summarySentence}
                    </div>
                    <span
                      className={`rounded-pill px-3 py-1 text-xs font-bold ${
                        cohortResult.significantAt95
                          ? 'bg-green text-white'
                          : 'bg-yellow text-ink'
                      }`}
                    >
                      {cohortResult.significantAt95 ? 'Significant (p < 0.05)' : 'Not significant'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'equity' && (
            <div className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-12">
                <div className="glass p-6 lg:col-span-6 space-y-4">
                  <h2 className="font-display text-xl font-bold text-ink">
                    Rural vs Semi-Urban vs Urban Disparity
                  </h2>
                  <div className="space-y-3">
                    {overview.byDistrictType.map((d) => (
                      <div key={d.districtType} className="rounded-chip border border-blue/15 bg-white/85 p-4">
                        <div className="flex justify-between font-bold text-sm capitalize text-ink">
                          <span>{d.districtType.replace('_', '-')} (n={d.households})</span>
                          <span className="font-mono-num text-blue">{d.eligibleRatePct}% eligible</span>
                        </div>
                        <div className="mt-1 flex justify-between text-xs text-ink/75">
                          <span>Docs ready: {d.docsReadyPct}%</span>
                          <span className="font-mono-num">Avg est. benefit: {formatINR(d.avgBenefitRs)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="glass p-6 lg:col-span-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="font-display text-xl font-bold text-ink">
                      Benefit Concentration (Lorenz Curve)
                    </h2>
                    <span className="rounded-pill bg-yellow px-3 py-1 font-mono-num text-xs font-bold text-ink">
                      Gini: {overview.giniCoefficient}
                    </span>
                  </div>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={overview.lorenzCurve}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(20,121,255,0.14)" />
                        <XAxis dataKey="popSharePct" tick={{ fill: '#0A1A3C', fontSize: 11 }} />
                        <YAxis tick={{ fill: '#0A1A3C', fontSize: 11 }} />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey="benefitSharePct"
                          name="Cumulative Benefit %"
                          stroke="#1479FF"
                          strokeWidth={3}
                          dot={{ fill: '#FFC20E', r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Extra Features #43, #45, #46: State Readiness Grades, Blocker ROI & Category Equity */}
              <div className="grid gap-6 lg:grid-cols-12">
                <div className="glass p-6 lg:col-span-7 space-y-3">
                  <h2 className="font-display text-lg font-bold text-ink">
                    State Readiness Scorecard (Grade A–D, Synthetic)
                  </h2>
                  <div className="max-h-64 overflow-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-blue/15 text-ink/70">
                          <th className="py-2 pr-3">State</th>
                          <th className="py-2 pr-3">Sample n</th>
                          <th className="py-2 pr-3">Docs Ready</th>
                          <th className="py-2 pr-3">Index</th>
                          <th className="py-2">Grade</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-blue/10">
                        {buildStateScorecards(overview).slice(0, 14).map((sc) => (
                          <tr key={sc.state}>
                            <td className="py-2 pr-3 font-bold text-ink">{sc.state}</td>
                            <td className="py-2 pr-3 font-mono-num">{sc.households}</td>
                            <td className="py-2 pr-3 font-mono-num">{sc.docsReadyPctOfElig}%</td>
                            <td className="py-2 pr-3 font-mono-num">{sc.readinessIndex}</td>
                            <td className="py-2">
                              <span
                                className={`rounded-pill px-2 py-0.5 text-[10px] font-bold ${
                                  sc.grade === 'A'
                                    ? 'bg-green text-white'
                                    : sc.grade === 'B'
                                    ? 'bg-blue text-white'
                                    : sc.grade === 'C'
                                    ? 'bg-yellow text-ink'
                                    : 'bg-blue-50 text-blue-700'
                                }`}
                              >
                                {sc.grade}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="glass p-6 lg:col-span-5 space-y-4">
                  <h2 className="font-display text-lg font-bold text-ink">
                    Category Equity &amp; Blocker Action ROI
                  </h2>
                  <div className="space-y-2">
                    {buildCategoryEquity(overview).map((c) => (
                      <div key={c.category} className="flex items-center justify-between rounded-chip bg-white/85 px-3 py-2 text-xs border border-blue/10">
                        <span className="font-bold text-ink">{c.category} (n={c.households})</span>
                        <span className="font-mono-num text-blue-700">
                          {c.suppressed ? 'Suppressed (n<30)' : `${c.eligibleRatePct}% • ${formatINR(c.unclaimedPerHouseholdRs)}/hh`}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-blue/10 pt-3 space-y-2">
                    <div className="text-xs font-bold text-ink">Top Blocker Interventions:</div>
                    {buildBlockerRoi(overview).slice(0, 3).map((b) => (
                      <div key={b.field} className="rounded-chip bg-yellow-50/70 p-2.5 text-[11px] text-ink">
                        <strong>{b.field.replace(/_/g, ' ')} ({b.sharePct}%):</strong> {b.actionHint}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'overlap' && (
            <div className="glass p-6 space-y-4">
              <h2 className="font-display text-xl font-bold text-ink">
                Pairwise Scheme Co-Eligibility Overlap Matrix
              </h2>
              <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
                {overview.overlapTop.map((cell, i) => (
                  <div
                    key={i}
                    className="rounded-chip border border-blue/15 p-3 text-xs"
                    style={{
                      backgroundColor: `rgba(20, 121, 255, ${Math.min(
                        0.38,
                        0.05 + cell.coEligiblePct / 100
                      )})`,
                    }}
                  >
                    <div className="font-bold text-ink truncate">{cell.schemeA}</div>
                    <div className="text-[11px] text-ink/75 truncate">× {cell.schemeB}</div>
                    <div className="mt-1 font-mono-num font-bold text-ink">
                      {cell.coEligiblePct}% ({cell.coEligibleCount})
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'table' && (
            <div className="glass p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-display text-xl font-bold text-ink">
                  Virtualised Synthetic Household Explorer (showing first {popRows.length} of{' '}
                  {popTotal.toLocaleString('en-IN')} rows)
                </h2>
                <span className="rounded-pill bg-yellow px-3 py-1 text-xs font-bold text-ink">
                  Synthetic data
                </span>
              </div>

              <div
                ref={tableParentRef}
                className="h-[440px] overflow-auto rounded-input border border-blue/15 bg-white/90"
              >
                <div
                  style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }}
                >
                  {rowVirtualizer.getVirtualItems().map((vRow) => {
                    const row = popRows[vRow.index];
                    if (!row) return null;
                    return (
                      <div
                        key={row.id}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: `${vRow.size}px`,
                          transform: `translateY(${vRow.start}px)`,
                        }}
                        className="grid grid-cols-7 items-center border-b border-blue/10 px-4 text-xs"
                      >
                        <span className="font-mono-num font-bold">#{row.id}</span>
                        <span className="font-semibold">{row.state}</span>
                        <span className="capitalize">{row.district_type}</span>
                        <span className="capitalize">{row.occupation}</span>
                        <span>{row.category}</span>
                        <span className="font-mono-num">{row.age}y</span>
                        <span className="font-mono-num font-bold">{formatINR(row.income)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

