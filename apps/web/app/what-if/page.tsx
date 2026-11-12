'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { ArrowRight, Calculator, SlidersHorizontal, TrendDown, TrendUp, Warning } from '@phosphor-icons/react';
import { useSathiStore } from '@/lib/store/useSathiStore';
import { computeSensitivityCurve, evaluateScheme, simulateWhatIf } from '@/lib/rules';
import { formatINR } from '@/lib/benefits';
import {
  detectWelfareCliffsForIncome,
  estimateEducationNetCost,
  estimateFarmerSupport,
  estimateLoanSubsidy,
  estimatePensionAdequacy,
} from '@/lib/calculators';
import { getSchemeName } from '@/lib/i18n/messages';
import type { CitizenProfile, OccupationType } from '@/lib/types';

export default function WhatIfPage() {
  const { locale, profiles, activeProfileId, catalogue } = useSathiStore();
  const baseProfile =
    profiles.find((p) => p.id === activeProfileId) ?? profiles[0];

  const [income, setIncome] = useState<number>(baseProfile.income ?? 180000);
  const [age, setAge] = useState<number>(baseProfile.age ?? 35);
  const [land, setLand] = useState<number>(baseProfile.land_hectares ?? 1.0);
  const [occupation, setOccupation] = useState<OccupationType>(
    baseProfile.occupation ?? 'farmer'
  );
  const [curveAxis, setCurveAxis] = useState<'income' | 'age' | 'land_hectares'>('income');
  const [calcTab, setCalcTab] = useState<'student' | 'farmer' | 'pension' | 'loan'>('farmer');
  const [tuitionRs, setTuitionRs] = useState(45000);
  const [hostelRs, setHostelRs] = useState(18000);
  const [monthlyExpenseRs, setMonthlyExpenseRs] = useState(5000);
  const [loanAmountRs, setLoanAmountRs] = useState(200000);
  const [loanTenureM, setLoanTenureM] = useState(36);

  const cliffAlerts = useMemo(
    () =>
      detectWelfareCliffsForIncome({ ...baseProfile, income, occupation, age, land_hectares: land }, catalogue.schemes, (s, p) =>
        evaluateScheme(s.ruleTree!, p)
      ),
    [baseProfile, income, occupation, age, land, catalogue.schemes]
  );

  const eduCalc = useMemo(
    () =>
      estimateEducationNetCost({
        annualTuitionRs: tuitionRs,
        hostelBooksRs: hostelRs,
        matchedEducationAnnualRs: 25000,
      }),
    [tuitionRs, hostelRs]
  );

  const farmerCalc = useMemo(
    () => estimateFarmerSupport({ landHectares: land }),
    [land]
  );

  const pensionCalc = useMemo(
    () =>
      estimatePensionAdequacy({
        monthlyExpensesRs: monthlyExpenseRs,
        eligibleMonthlyPensionRs: age >= 60 ? 2250 : 1250,
      }),
    [monthlyExpenseRs, age]
  );

  const loanCalc = useMemo(
    () =>
      estimateLoanSubsidy({
        loanAmountRs,
        tenureMonths: loanTenureM,
        standardRatePct: 12.5,
        subsidizedRatePct: 5,
      }),
    [loanAmountRs, loanTenureM]
  );

  const deltas: Partial<CitizenProfile> = useMemo(
    () => ({
      income,
      age,
      land_hectares: land,
      occupation,
    }),
    [income, age, land, occupation]
  );

  const diff = useMemo(
    () => simulateWhatIf(catalogue.schemes, baseProfile, deltas),
    [catalogue.schemes, baseProfile, deltas]
  );

  const sensitivityCurve = useMemo(
    () => computeSensitivityCurve(catalogue.schemes, { ...baseProfile, ...deltas }, curveAxis),
    [catalogue.schemes, baseProfile, deltas, curveAxis]
  );

  return (
    <div className="space-y-6">
      <div className="glass p-6 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-pill bg-yellow px-3 py-1 text-xs font-bold text-ink">
              <SlidersHorizontal size={14} weight="duotone" />
              Hypothetical Simulation — Does not overwrite saved profile
            </span>
            <h1 className="mt-2 font-display text-3xl font-bold text-ink">
              What-If Eligibility Simulator
            </h1>
            <p className="text-sm text-ink/75">
              Drag income, age, land, or switch occupation for <strong>{baseProfile.label}</strong> to see which schemes unlock or drop off.
            </p>
          </div>
          <div className="flex gap-3 font-mono-num text-sm font-bold">
            <span className="rounded-pill bg-green-50 border border-green/30 px-4 py-2 text-green-700">
              +{diff.gained.length} Gained
            </span>
            <span className="rounded-pill bg-blue-50 border border-blue/25 px-4 py-2 text-blue-700">
              -{diff.lost.length} Lost
            </span>
          </div>
        </div>
      </div>

      {/* Sliders */}
      <div className="glass p-6 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex justify-between text-xs font-bold">
            <span>Annual Income</span>
            <span className="font-mono-num text-blue">{formatINR(income)}</span>
          </div>
          <input
            aria-label="What-if annual income"
            type="range"
            min={40000}
            max={1000000}
            step={10000}
            value={income}
            onChange={(e) => setIncome(Number(e.target.value))}
            className="mt-3 h-3 w-full cursor-pointer accent-blue"
          />
        </div>

        <div>
          <div className="flex justify-between text-xs font-bold">
            <span>Age</span>
            <span className="font-mono-num text-blue">{age} yrs</span>
          </div>
          <input
            aria-label="What-if age"
            type="range"
            min={5}
            max={85}
            step={1}
            value={age}
            onChange={(e) => setAge(Number(e.target.value))}
            className="mt-3 h-3 w-full cursor-pointer accent-blue"
          />
        </div>

        <div>
          <div className="flex justify-between text-xs font-bold">
            <span>Land Holding</span>
            <span className="font-mono-num text-blue">{land} ha</span>
          </div>
          <input
            aria-label="What-if land hectares"
            type="range"
            min={0}
            max={5}
            step={0.1}
            value={land}
            onChange={(e) => setLand(Number(e.target.value))}
            className="mt-3 h-3 w-full cursor-pointer accent-blue"
          />
        </div>

        <div>
          <label className="text-xs font-bold">Occupation</label>
          <select
            value={occupation}
            onChange={(e) => setOccupation(e.target.value as OccupationType)}
            className="mt-1.5 min-h-[44px] w-full rounded-pill border border-blue/25 bg-white px-4 text-xs font-bold text-ink capitalize"
          >
            {(['farmer', 'student', 'worker', 'artisan', 'entrepreneur', 'salaried', 'unemployed', 'retired'] as const).map(
              (o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              )
            )}
          </select>
        </div>
      </div>

      {/* Gained & Lost Columns */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="glass p-6 space-y-4">
          <h2 className="flex items-center gap-2 font-display text-xl font-bold text-green-700">
            <TrendUp size={22} weight="duotone" />
            Gained / Upgraded Schemes ({diff.gained.length})
          </h2>
          {diff.gained.length === 0 ? (
            <p className="text-sm text-ink/70">
              Adjust sliders (e.g., lower income or change age/occupation) to see newly unlocked schemes.
            </p>
          ) : (
            <div className="space-y-2.5">
              <AnimatePresence>
                {diff.gained.map((g) => (
                  <motion.div
                    key={g.scheme.id}
                    layout
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center justify-between rounded-chip border border-green/35 bg-green-50/70 p-3.5"
                  >
                    <div>
                      <Link
                        href={`/schemes/${g.scheme.slug}`}
                        className="font-display text-sm font-bold text-ink hover:text-blue"
                      >
                        {getSchemeName(g.scheme, locale)}
                      </Link>
                      <div className="text-[11px] font-semibold text-ink/70">
                        {g.before} → <strong className="text-green-700">{g.after}</strong> • Changed:{' '}
                        {g.changedCriteria.join(', ') || 'rule match'}
                      </div>
                    </div>
                    <span className="rounded-pill bg-yellow px-3 py-1 font-mono-num text-xs font-bold text-ink">
                      {formatINR(g.scheme.benefitAmount)}
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        <div className="glass p-6 space-y-4">
          <h2 className="flex items-center gap-2 font-display text-xl font-bold text-blue-700">
            <TrendDown size={22} weight="duotone" />
            Lost / Dropped Schemes ({diff.lost.length})
          </h2>
          {diff.lost.length === 0 ? (
            <p className="text-sm text-ink/70">No baseline eligible schemes lost under these settings.</p>
          ) : (
            <div className="space-y-2.5">
              <AnimatePresence>
                {diff.lost.map((l) => (
                  <motion.div
                    key={l.scheme.id}
                    layout
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center justify-between rounded-chip border border-blue/25 bg-white/85 p-3.5"
                  >
                    <div>
                      <Link
                        href={`/schemes/${l.scheme.slug}`}
                        className="font-display text-sm font-bold text-ink hover:text-blue"
                      >
                        {getSchemeName(l.scheme, locale)}
                      </Link>
                      <div className="text-[11px] font-semibold text-ink/70">
                        {l.before} → <strong>{l.after}</strong> • Trigger:{' '}
                        {l.changedCriteria.join(', ') || 'threshold'}
                      </div>
                    </div>
                    <ArrowRight size={16} className="text-blue" />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Extra Feature #10: Sensitivity Curve ("Benefit Cliffs") */}
      <div className="glass p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-bold text-ink">
              Threshold Sensitivity Curve (&ldquo;Eligibility Cliffs&rdquo;)
            </h2>
            <p className="text-xs text-ink/75">
              Shows how many schemes remain eligible across different thresholds — synthetic / hypothetical simulation.
            </p>
          </div>
          <div className="flex gap-2">
            {(['income', 'age', 'land_hectares'] as const).map((ax) => (
              <button
                key={ax}
                type="button"
                onClick={() => setCurveAxis(ax)}
                className={`min-h-[38px] rounded-pill px-4 text-xs font-bold ${
                  curveAxis === ax ? 'bg-blue text-white' : 'bg-white text-ink border border-blue/20'
                }`}
              >
                {ax === 'land_hectares' ? 'Land (ha)' : ax.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sensitivityCurve}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(20,121,255,0.15)" />
              <XAxis dataKey="label" tick={{ fill: '#0A1A3C', fontSize: 12 }} />
              <YAxis tick={{ fill: '#0A1A3C', fontSize: 12 }} />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="eligibleCount"
                name="Eligible Schemes"
                stroke="#12B76A"
                fill="rgba(18,183,106,0.22)"
                strokeWidth={2.5}
              />
              <Area
                type="monotone"
                dataKey="likelyCount"
                name="Likely Schemes"
                stroke="#1479FF"
                fill="rgba(20,121,255,0.15)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Income-Tax vs Welfare-Cap Cliff Alert */}
        {cliffAlerts.length > 0 && (
          <div className="space-y-2 border-t border-blue/10 pt-4">
            <div className="flex items-center gap-1.5 text-xs font-bold text-ink">
              <Warning size={15} weight="duotone" className="text-yellow-700" />
              Upcoming Welfare Threshold Cliffs (Above {formatINR(income)}):
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {cliffAlerts.slice(0, 3).map((al) => (
                <div key={al.thresholdRs} className="rounded-chip border border-yellow bg-yellow-50 p-3 text-xs text-ink">
                  <div className="font-mono-num font-bold">Cap: {formatINR(al.thresholdRs)}/yr</div>
                  <div className="mt-0.5 text-ink/80">{al.message}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Specialized Offline Calculators (#27–#30) */}
      <div className="glass p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 font-display text-xl font-bold text-ink">
              <Calculator size={20} weight="duotone" className="text-blue" />
              Life-Stage Benefit &amp; Subsidy Calculators
            </h2>
            <p className="text-xs text-ink/75">
              Deterministic local math — estimates only, verify portal terms before applying.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ['farmer', 'Farmer Input'],
                ['student', 'Student Net Fee'],
                ['pension', 'Pension Adequacy'],
                ['loan', 'MSME Loan EMI'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setCalcTab(id)}
                className={`min-h-[38px] rounded-pill px-4 text-xs font-bold ${
                  calcTab === id ? 'bg-blue text-white' : 'border border-blue/20 bg-white text-ink'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {calcTab === 'farmer' && (
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="rounded-chip bg-white/85 p-4 border border-blue/15">
              <div className="text-[11px] font-bold text-ink/70">PM-KISAN Annual</div>
              <div className="mt-1 font-mono-num text-xl font-bold text-green-700">{formatINR(farmerCalc.pmKisanRs)}</div>
            </div>
            <div className="rounded-chip bg-white/85 p-4 border border-blue/15">
              <div className="text-[11px] font-bold text-ink/70">Input Seed/Fert Est. ({land} ha)</div>
              <div className="mt-1 font-mono-num text-xl font-bold text-blue">{formatINR(farmerCalc.inputSupportRs)}</div>
            </div>
            <div className="rounded-chip bg-white/85 p-4 border border-blue/15">
              <div className="text-[11px] font-bold text-ink/70">Fasal Bima Subsidy Saved</div>
              <div className="mt-1 font-mono-num text-xl font-bold text-ink">{formatINR(farmerCalc.insuranceSavedRs)}</div>
            </div>
            <div className="glass-yellow rounded-chip p-4">
              <div className="text-[11px] font-bold text-ink/80">Total Annual Farm Support</div>
              <div className="mt-1 font-mono-num text-xl font-bold text-ink">{formatINR(farmerCalc.totalAnnualSupportRs)}</div>
            </div>
          </div>
        )}

        {calcTab === 'student' && (
          <div className="grid gap-4 md:grid-cols-4 items-end">
            <label className="text-xs font-bold text-ink">
              Annual Tuition (Rs.)
              <input
                type="number"
                value={tuitionRs}
                onChange={(e) => setTuitionRs(Number(e.target.value))}
                className="mt-1 min-h-[40px] w-full rounded-input border border-blue/25 bg-white px-3 font-mono-num"
              />
            </label>
            <label className="text-xs font-bold text-ink">
              Hostel &amp; Books (Rs.)
              <input
                type="number"
                value={hostelRs}
                onChange={(e) => setHostelRs(Number(e.target.value))}
                className="mt-1 min-h-[40px] w-full rounded-input border border-blue/25 bg-white px-3 font-mono-num"
              />
            </label>
            <div className="rounded-chip bg-white/85 p-3 border border-blue/15">
              <div className="text-[11px] font-bold text-ink/70">Scholarship Offset</div>
              <div className="font-mono-num text-lg font-bold text-green-700">-{formatINR(eduCalc.scholarshipOffsetRs)} ({eduCalc.coveredPct}%)</div>
            </div>
            <div className="glass-yellow rounded-chip p-3">
              <div className="text-[11px] font-bold text-ink/80">Net Out-of-Pocket / yr</div>
              <div className="font-mono-num text-lg font-bold text-ink">{formatINR(eduCalc.netOutOfPocketRs)}</div>
            </div>
          </div>
        )}

        {calcTab === 'pension' && (
          <div className="grid gap-4 md:grid-cols-3 items-center">
            <label className="text-xs font-bold text-ink">
              Monthly Household Essential Spend (Rs.)
              <input
                type="number"
                value={monthlyExpenseRs}
                onChange={(e) => setMonthlyExpenseRs(Number(e.target.value))}
                className="mt-1 min-h-[40px] w-full rounded-input border border-blue/25 bg-white px-3 font-mono-num"
              />
            </label>
            <div className="rounded-chip bg-white/85 p-3 border border-blue/15">
              <div className="text-[11px] font-bold text-ink/70">Est. Combined Monthly Pension</div>
              <div className="font-mono-num text-lg font-bold text-blue">{formatINR(pensionCalc.monthlyPensionRs)} / mo</div>
            </div>
            <div className="glass-yellow rounded-chip p-3">
              <div className="text-[11px] font-bold text-ink/80">Adequacy Ratio • Gap</div>
              <div className="font-mono-num text-lg font-bold text-ink">{pensionCalc.adequacyPct}% • {formatINR(pensionCalc.monthlyGapRs)}/mo</div>
            </div>
          </div>
        )}

        {calcTab === 'loan' && (
          <div className="grid gap-4 md:grid-cols-4 items-end">
            <label className="text-xs font-bold text-ink">
              Loan Principal (Rs.)
              <input
                type="number"
                value={loanAmountRs}
                onChange={(e) => setLoanAmountRs(Number(e.target.value))}
                className="mt-1 min-h-[40px] w-full rounded-input border border-blue/25 bg-white px-3 font-mono-num"
              />
            </label>
            <label className="text-xs font-bold text-ink">
              Tenure (Months)
              <input
                type="number"
                min={6}
                max={120}
                value={loanTenureM}
                onChange={(e) => setLoanTenureM(Number(e.target.value))}
                className="mt-1 min-h-[40px] w-full rounded-input border border-blue/25 bg-white px-3 font-mono-num"
              />
            </label>
            <div className="rounded-chip bg-white/85 p-3 border border-blue/15">
              <div className="text-[11px] font-bold text-ink/70">Subsidized EMI vs Standard</div>
              <div className="font-mono-num text-lg font-bold text-green-700">
                {formatINR(loanCalc.subsidizedEmiRs)} vs {formatINR(loanCalc.standardEmiRs)}
              </div>
            </div>
            <div className="glass-yellow rounded-chip p-3">
              <div className="text-[11px] font-bold text-ink/80">15% Margin Grant Est.</div>
              <div className="font-mono-num text-lg font-bold text-ink">{formatINR(loanCalc.marginGrantRs)}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

