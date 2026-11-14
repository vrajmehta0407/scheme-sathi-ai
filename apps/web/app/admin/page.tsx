'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Bug,
  CheckCircle,
  Plus,
  ShieldCheck,
  UploadSimple,
  Warning,
} from '@phosphor-icons/react';
import type { QualityReport } from '@/lib/admin';
import { evaluateScheme, type NodeTrace } from '@/lib/rules';
import type { RuleLeaf, RuleOp, SchemeRecord, SchemeRuleTree } from '@/lib/types';
import { auditCatalogueCoverage } from '@/lib/analytics/extra';
import { runAdminRegressionSuite } from '@/lib/admin/extra';

function TraceTreeView({ node, depth = 0 }: { node: NodeTrace; depth?: number }) {
  const badgeCls =
    node.passed === true
      ? 'bg-green text-white'
      : node.passed === null
      ? 'bg-yellow text-ink'
      : 'border border-blue bg-white text-blue-700';

  return (
    <div style={{ marginLeft: depth * 14 }} className="mt-1.5 border-l-2 border-blue/20 pl-3 text-xs">
      <div className="flex items-center gap-2">
        <span className={`rounded-pill px-2 py-0.5 text-[10px] font-bold ${badgeCls}`}>
          {node.passed === true ? 'PASS' : node.passed === null ? 'UNKNOWN' : 'FAIL'}
        </span>
        <span className="font-mono-num font-semibold text-ink">{node.label}</span>
      </div>
      {node.children?.map((ch, idx) => (
        <TraceTreeView key={idx} node={ch} depth={depth + 1} />
      ))}
    </div>
  );
}

export default function AdminConsolePage() {
  const [schemes, setSchemes] = useState<SchemeRecord[]>([]);
  const [qualityReport, setQualityReport] = useState<QualityReport | null>(null);
  const [auditLogs, setAuditLogs] = useState<Array<Record<string, unknown>>>([]);
  const [statusMsg, setStatusMsg] = useState('');

  // Form state for adding/editing a scheme + visual rule builder
  const [schemeId, setSchemeId] = useState('custom-gujarat-solar-pump');
  const [nameEn, setNameEn] = useState('Gujarat Solar Pump Subsidy (i-Khedut)');
  const [nameHi, setNameHi] = useState('गुजरात सोलर पंप सहायता योजना');
  const [nameGu, setNameGu] = useState('ગુજરાત સોલર પંપ સહાય યોજના');
  const [level, setLevel] = useState<'central' | 'state'>('state');
  const [stateName, setStateName] = useState('Gujarat');
  const [category, setCategory] = useState<SchemeRecord['category']>('farmers');
  const [benefitAmount, setBenefitAmount] = useState(45000);
  const [officialUrl, setOfficialUrl] = useState('https://ikhedut.gujarat.gov.in');
  const [summaryEn, setSummaryEn] = useState(
    'Capital subsidy for farmers installing solar irrigation water pumps under state agriculture department.'
  );
  const [ruleLeaves, setRuleLeaves] = useState<RuleLeaf[]>([
    { field: 'state', op: 'eq', value: 'Gujarat' },
    { field: 'occupation', op: 'in', value: ['farmer'] },
    { field: 'income', op: 'lte', value: 400000 },
  ]);

  // Extra Feature #15: Guided Rule-Tree Debugger Sandbox
  const [debugState, setDebugState] = useState('Gujarat');
  const [debugOcc, setDebugOcc] = useState('farmer');
  const [debugIncome, setDebugIncome] = useState(220000);
  const [debugAge, setDebugAge] = useState(42);
  const [bulkJson, setBulkJson] = useState('');

  const loadAdmin = () => {
    fetch('/api/admin/schemes')
      .then((r) => r.json())
      .then((d) => {
        setSchemes(d.schemes ?? []);
        setQualityReport(d.qualityReport ?? null);
        setAuditLogs(d.auditLogs ?? []);
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadAdmin();
  }, []);

  const draftRuleTree: SchemeRuleTree = useMemo(
    () => ({
      scheme_id: schemeId,
      all: ruleLeaves,
    }),
    [schemeId, ruleLeaves]
  );

  const debugTrace = useMemo(
    () =>
      evaluateScheme(draftRuleTree, {
        state: debugState,
        occupation: debugOcc as SchemeRecord['category'] extends never ? never : 'farmer',
        income: debugIncome,
        age: debugAge,
      }),
    [draftRuleTree, debugState, debugOcc, debugIncome, debugAge]
  );

  const handlePublishScheme = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg('Running Admin Quality checks...');
    const res = await fetch('/api/admin/schemes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: schemeId,
        slug: schemeId,
        nameEn,
        nameHi,
        nameGu,
        level,
        state: stateName,
        category,
        benefitType: 'subsidy',
        benefitAmount,
        benefitPeriod: 'one_time',
        summaryEn,
        summaryHi: summaryEn,
        summaryGu: summaryEn,
        officialUrl,
        lastVerified: new Date().toISOString().slice(0, 10),
        documents: ['aadhaar', 'land_record', 'bank_passbook'],
        stepsEn: ['Apply via official state portal with Aadhaar and land record.'],
        ruleTree: draftRuleTree,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setStatusMsg(`Blocked by Admin Quality Agent: ${data.error}`);
      if (data.qualityReport) setQualityReport(data.qualityReport);
      return;
    }
    setStatusMsg(`Published '${data.scheme.nameEn}' (v${data.scheme.version})!`);
    loadAdmin();
  };

  const handleBulkValidate = async () => {
    try {
      const parsed = JSON.parse(bulkJson);
      const arr = Array.isArray(parsed) ? parsed : [parsed];
      const res = await fetch('/api/admin/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schemes: arr }),
      });
      const data = await res.json();
      if (res.ok) {
        setQualityReport(data.qualityReport);
        setStatusMsg(
          `Validated ${data.validatedCount} imported scheme(s). Quality passed: ${data.qualityReport.passed}`
        );
      } else {
        setStatusMsg(data.error);
      }
    } catch {
      setStatusMsg('Invalid JSON array for bulk import.');
    }
  };

  const coverageAudit = useMemo(() => auditCatalogueCoverage(schemes), [schemes]);
  const regressionSuite = useMemo(() => runAdminRegressionSuite(schemes), [schemes]);

  return (
    <div className="space-y-6">
      <div className="glass p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink">
            Local Admin Console &amp; Quality Gate
          </h1>
          <p className="text-sm text-ink/75">
            Manage welfare scheme directory, build rules visually, inspect node-by-node traces, and run automated regression gates.
          </p>
        </div>

        {qualityReport && (
          <span
            className={`inline-flex items-center gap-2 rounded-pill px-4 py-2 text-xs font-bold ${
              qualityReport.passed ? 'bg-green text-white' : 'bg-yellow text-ink'
            }`}
          >
            {qualityReport.passed ? (
              <CheckCircle size={16} weight="fill" />
            ) : (
              <Warning size={16} weight="duotone" />
            )}
            Quality Gate: {qualityReport.passed ? 'PASSED' : 'BLOCKED'} ({qualityReport.errorCount} errors,{' '}
            {qualityReport.warningCount} warnings)
          </span>
        )}
      </div>

      {statusMsg && (
        <div className="glass-blue rounded-card p-4 text-xs font-bold text-ink">
          {statusMsg}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Visual Scheme & Rule Builder */}
        <form onSubmit={handlePublishScheme} className="glass p-6 lg:col-span-7 space-y-4">
          <h2 className="font-display text-xl font-bold text-ink">
            Scheme Editor &amp; Visual Rule Builder
          </h2>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-bold">Scheme ID / Slug</label>
              <input
                required
                value={schemeId}
                onChange={(e) => setSchemeId(e.target.value)}
                className="mt-1 min-h-[42px] w-full rounded-input border border-blue/25 bg-white px-3 text-xs font-mono-num"
              />
            </div>
            <div>
              <label className="text-xs font-bold">Official Portal URL</label>
              <input
                required
                type="url"
                value={officialUrl}
                onChange={(e) => setOfficialUrl(e.target.value)}
                className="mt-1 min-h-[42px] w-full rounded-input border border-blue/25 bg-white px-3 text-xs"
              />
            </div>
            <div>
              <label className="text-xs font-bold">Name (English)</label>
              <input
                required
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                className="mt-1 min-h-[42px] w-full rounded-input border border-blue/25 bg-white px-3 text-xs font-semibold"
              />
            </div>
            <div>
              <label className="text-xs font-bold">Name (Hindi)</label>
              <input
                required
                value={nameHi}
                onChange={(e) => setNameHi(e.target.value)}
                className="mt-1 min-h-[42px] w-full rounded-input border border-blue/25 bg-white px-3 text-xs"
              />
            </div>
            <div>
              <label className="text-xs font-bold">Name (Gujarati)</label>
              <input
                required
                value={nameGu}
                onChange={(e) => setNameGu(e.target.value)}
                className="mt-1 min-h-[42px] w-full rounded-input border border-blue/25 bg-white px-3 text-xs"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs font-bold">Level</label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value as 'central' | 'state')}
                  className="mt-1 min-h-[42px] w-full rounded-input border border-blue/25 bg-white px-2 text-xs"
                >
                  <option value="central">Central</option>
                  <option value="state">State</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold">State</label>
                <input
                  value={stateName}
                  onChange={(e) => setStateName(e.target.value)}
                  className="mt-1 min-h-[42px] w-full rounded-input border border-blue/25 bg-white px-2 text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-bold">Amount (Rs.)</label>
                <input
                  type="number"
                  value={benefitAmount}
                  onChange={(e) => setBenefitAmount(Number(e.target.value))}
                  className="mt-1 min-h-[42px] w-full rounded-input border border-blue/25 bg-white px-2 font-mono-num text-xs"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold">Category &amp; Sample Summary</label>
            <div className="mt-1 flex gap-2">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as SchemeRecord['category'])}
                className="min-h-[42px] rounded-input border border-blue/25 bg-white px-3 text-xs font-bold"
              >
                {(['farmers', 'students', 'women', 'seniors', 'workers', 'entrepreneurs', 'health', 'housing'] as const).map(
                  (c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  )
                )}
              </select>
              <input
                value={summaryEn}
                onChange={(e) => setSummaryEn(e.target.value)}
                className="min-h-[42px] flex-1 rounded-input border border-blue/25 bg-white px-3 text-xs"
              />
            </div>
          </div>

          {/* Visual Rule Builder */}
          <div className="rounded-card border border-blue/20 bg-white/85 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-700">
                Visual Rule Builder (ALL must pass)
              </span>
              <button
                type="button"
                onClick={() =>
                  setRuleLeaves((prev) => [
                    ...prev,
                    { field: 'age', op: 'gte', value: 18 },
                  ])
                }
                className="inline-flex items-center gap-1 rounded-pill bg-blue-50 px-3 py-1 text-[11px] font-bold text-blue-700"
              >
                <Plus size={12} weight="bold" /> Add Rule
              </button>
            </div>

            {ruleLeaves.map((leaf, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2">
                <select
                  value={leaf.field}
                  onChange={(e) => {
                    const next = [...ruleLeaves];
                    next[idx] = { ...leaf, field: e.target.value };
                    setRuleLeaves(next);
                  }}
                  className="col-span-4 min-h-[38px] rounded-chip border border-blue/20 bg-white px-2 text-xs font-semibold"
                >
                  <option value="state">state</option>
                  <option value="occupation">occupation</option>
                  <option value="income">income</option>
                  <option value="age">age</option>
                  <option value="gender">gender</option>
                  <option value="category">category</option>
                  <option value="land_hectares">land_hectares</option>
                </select>
                <select
                  value={leaf.op}
                  onChange={(e) => {
                    const next = [...ruleLeaves];
                    next[idx] = { ...leaf, op: e.target.value as RuleOp };
                    setRuleLeaves(next);
                  }}
                  className="col-span-3 min-h-[38px] rounded-chip border border-blue/20 bg-white px-2 text-xs font-mono-num"
                >
                  {(['eq', 'neq', 'in', 'lte', 'gte', 'gt', 'lt'] as RuleOp[]).map((op) => (
                    <option key={op} value={op}>
                      {op}
                    </option>
                  ))}
                </select>
                <input
                  value={
                    Array.isArray(leaf.value) ? leaf.value.join(',') : String(leaf.value ?? '')
                  }
                  onChange={(e) => {
                    const raw = e.target.value;
                    const parsedVal =
                      leaf.op === 'in'
                        ? raw.split(',').map((s) => s.trim())
                        : !Number.isNaN(Number(raw)) && raw.trim() !== ''
                        ? Number(raw)
                        : raw;
                    const next = [...ruleLeaves];
                    next[idx] = { ...leaf, value: parsedVal };
                    setRuleLeaves(next);
                  }}
                  className="col-span-4 min-h-[38px] rounded-chip border border-blue/20 bg-white px-2 text-xs font-mono-num"
                />
                <button
                  type="button"
                  onClick={() =>
                    setRuleLeaves((prev) => prev.filter((_, i) => i !== idx))
                  }
                  className="col-span-1 text-xs font-bold text-ink/60 hover:text-blue"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <button
            type="submit"
            className="min-h-[46px] w-full rounded-pill bg-blue px-6 py-2.5 text-sm font-bold text-white hover:bg-blue-700"
          >
            Validate &amp; Publish Scheme to Local SQLite
          </button>
        </form>

        {/* Right: Extra Feature #15 Rule-Tree Debugger + Quality Gate + Bulk Import */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass p-6 space-y-3">
            <h2 className="flex items-center gap-2 font-display text-lg font-bold text-ink">
              <Bug size={18} weight="duotone" className="text-blue" />
              Guided Rule-Tree Debugger Sandbox
            </h2>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <input
                value={debugState}
                onChange={(e) => setDebugState(e.target.value)}
                placeholder="State"
                className="min-h-[38px] rounded-chip border border-blue/20 bg-white px-2.5 font-semibold"
              />
              <input
                value={debugOcc}
                onChange={(e) => setDebugOcc(e.target.value)}
                placeholder="Occupation"
                className="min-h-[38px] rounded-chip border border-blue/20 bg-white px-2.5 font-semibold"
              />
              <input
                type="number"
                value={debugIncome}
                onChange={(e) => setDebugIncome(Number(e.target.value))}
                placeholder="Income"
                className="min-h-[38px] rounded-chip border border-blue/20 bg-white px-2.5 font-mono-num"
              />
              <input
                type="number"
                value={debugAge}
                onChange={(e) => setDebugAge(Number(e.target.value))}
                placeholder="Age"
                className="min-h-[38px] rounded-chip border border-blue/20 bg-white px-2.5 font-mono-num"
              />
            </div>

            <div className="rounded-chip border border-blue/15 bg-white/85 p-3">
              <div className="text-xs font-bold text-ink">
                Live Status:{' '}
                <span className="uppercase text-blue">{debugTrace.status}</span> (confidence{' '}
                {debugTrace.confidence})
              </div>
              <TraceTreeView node={debugTrace.trace} />
            </div>
          </div>

          {qualityReport && (
            <div className="glass p-6 space-y-3">
              <h2 className="flex items-center gap-2 font-display text-lg font-bold text-ink">
                <ShieldCheck size={18} weight="duotone" className="text-green" />
                Golden Profile Regression Tests
              </h2>
              <div className="space-y-2">
                {qualityReport.goldenResults.map((g) => (
                  <div
                    key={g.name}
                    className={`rounded-chip p-2.5 text-xs ${
                      g.passed ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-ink'
                    }`}
                  >
                    <div className="font-bold">
                      [{g.passed ? 'PASS' : 'FAIL'}] {g.name}
                    </div>
                    <div className="text-[11px]">{g.details}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="glass p-6 space-y-3">
            <h2 className="flex items-center gap-2 font-display text-lg font-bold text-ink">
              <UploadSimple size={18} weight="duotone" className="text-blue" />
              Bulk JSON Import Validator
            </h2>
            <textarea
              rows={3}
              placeholder='Paste JSON array of schemes to validate...'
              value={bulkJson}
              onChange={(e) => setBulkJson(e.target.value)}
              className="w-full rounded-chip border border-blue/20 bg-white p-2.5 font-mono-num text-[11px]"
            />
            <button
              type="button"
              onClick={handleBulkValidate}
              className="min-h-[40px] w-full rounded-pill bg-yellow px-4 text-xs font-bold text-ink"
            >
              Validate Import Against Quality Gate
            </button>
          </div>
        </div>
      </div>

      {/* Audit Log, Catalogue Completeness & Snapshot Export */}
      <div className="glass p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-bold text-ink">
              Catalogue Health, Regression &amp; Audit Log ({schemes.length} schemes)
            </h2>
            <p className="text-xs text-ink/75">
              Official .gov.in/.nic.in URLs: {coverageAudit.govInUrlCount}/{coverageAudit.totalSchemes} •
              Hindi: {coverageAudit.fullHindiCount} • Gujarati: {coverageAudit.fullGujaratiCount} •
              Avg rule leaves: {coverageAudit.avgRuleLeaves} • Golden Suite: {regressionSuite.passed}/{regressionSuite.total} PASS
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              const blob = new Blob([JSON.stringify(schemes, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `schemes-snapshot-${new Date().toISOString().slice(0, 10)}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="min-h-[38px] rounded-pill border border-blue/25 bg-white px-4 text-xs font-bold text-blue-700 hover:bg-blue-50"
          >
            Export Catalogue JSON
          </button>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {regressionSuite.rows.slice(0, 9).map((r, idx) => (
            <div
              key={idx}
              className={`rounded-chip px-3 py-2 text-[11px] font-semibold ${
                r.passed ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-ink'
              }`}
            >
              [{r.passed ? 'PASS' : 'FAIL'}] {r.schemeId} → {r.actual}
            </div>
          ))}
        </div>

        {auditLogs.length === 0 ? (
          <p className="text-xs text-ink/70">No admin edits recorded yet in this database.</p>
        ) : (
          <div className="space-y-1.5 text-xs">
            {auditLogs.map((log, i) => (
              <div key={i} className="rounded-chip bg-white/80 px-3 py-2 font-mono-num">
                {String(log.at)} • {String(log.action)} • {String(log.entity)} ({String(log.actor)})
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

