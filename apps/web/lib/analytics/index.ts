import type { CitizenProfile, NormalizedProfile, SchemeRecord } from '../types';
import { evaluateSchemeFast } from '../rules';
import { getSqliteDb } from '../db/sqlite';
import { getCatalogueFromDb } from '../db/catalogue';

export interface AnalyticsFilter {
  state?: string;
  category?: string;
  occupation?: string;
  incomeBand?: string;
  districtType?: string;
  schemeId?: string;
}

export interface PopulationRow {
  id: number;
  state: string;
  district_type: 'rural' | 'semi_urban' | 'urban';
  age: number;
  gender: 'male' | 'female' | 'other';
  category: 'General' | 'OBC' | 'SC' | 'ST' | 'EWS';
  income: number;
  occupation: CitizenProfile['occupation'];
  land_hectares: number;
  education: CitizenProfile['education'];
  family_size: number;
  disability: number;
  docs_json: string;
}

function rowToNormalizedProfile(row: PopulationRow): NormalizedProfile {
  const heldDocs = JSON.parse(row.docs_json) as string[];
  const ageGroup: NormalizedProfile['ageGroup'] =
    row.age < 18 ? 'child' : row.age <= 35 ? 'youth' : row.age < 60 ? 'adult' : 'senior';
  return {
    id: `syn-${row.id}`,
    label: `Household #${row.id}`,
    state: row.state,
    district_type: row.district_type,
    age: row.age,
    gender: row.gender,
    income: row.income,
    occupation: row.occupation,
    category: row.category,
    land_hectares: row.land_hectares,
    education: row.education,
    family_size: row.family_size,
    disability: row.disability === 1,
    is_bpl: row.income <= 150000,
    is_income_tax_payer: row.income > 700000,
    owns_pucca_house: row.income > 220000,
    held_documents: heldDocs,
    knownFields: [],
    unknownFields: [],
    incomeRange: null,
    ageGroup,
    isSenior: row.age >= 60,
  };
}

function queryPopulation(filter: AnalyticsFilter): PopulationRow[] {
  const db = getSqliteDb();
  const clauses: string[] = [];
  const params: Array<string | number> = [];

  if (filter.state && filter.state !== 'All') {
    clauses.push('state = ?');
    params.push(filter.state);
  }
  if (filter.category && filter.category !== 'All') {
    clauses.push('category = ?');
    params.push(filter.category);
  }
  if (filter.occupation && filter.occupation !== 'All') {
    clauses.push('occupation = ?');
    params.push(filter.occupation);
  }
  if (filter.districtType && filter.districtType !== 'All') {
    clauses.push('district_type = ?');
    params.push(filter.districtType);
  }
  if (filter.incomeBand && filter.incomeBand !== 'All') {
    if (filter.incomeBand === 'below_1l') clauses.push('income <= 100000');
    else if (filter.incomeBand === '1l_to_2_5l') clauses.push('income > 100000 AND income <= 250000');
    else if (filter.incomeBand === '2_5l_to_5l') clauses.push('income > 250000 AND income <= 500000');
    else if (filter.incomeBand === '5l_to_8l') clauses.push('income > 500000 AND income <= 800000');
    else if (filter.incomeBand === 'above_8l') clauses.push('income > 800000');
  }

  const where = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
  const sql = `SELECT * FROM population ${where} ORDER BY id ASC`;
  return db.prepare(sql).all(...params) as unknown as PopulationRow[];
}

export interface StateMetric {
  state: string;
  households: number;
  eligibleHouseholds: number;
  docsReadyHouseholds: number;
  eligibilityRatePct: number;
  coverageGapPct: number;
  unclaimedBenefitRs: number;
  suppressed: boolean;
}

export interface BlockerMetric {
  field: string;
  failureCount: number;
  sharePct: number;
}

export interface OverlapCell {
  schemeA: string;
  schemeB: string;
  coEligibleCount: number;
  coEligiblePct: number;
}

export interface InsightPin {
  id: string;
  headline: string;
  metric: string;
  chartTarget: string;
  sampleSize: number;
}

export interface AnalyticsOverviewResult {
  isSynthetic: true;
  label: string;
  sampleSize: number;
  computedMs: number;
  kpis: {
    totalHouseholds: number;
    eligibleHouseholds: number;
    eligibilityRatePct: number;
    docsReadyRatePct: number;
    avgEligibleSchemes: number;
    unclaimedBenefitRs: number;
  };
  byState: StateMetric[];
  byCategory: Array<{ category: string; households: number; eligibleRatePct: number; unclaimedRs: number; suppressed: boolean }>;
  byDistrictType: Array<{ districtType: string; households: number; eligibleRatePct: number; docsReadyPct: number; avgBenefitRs: number }>;
  lorenzCurve: Array<{ popSharePct: number; benefitSharePct: number }>;
  giniCoefficient: number;
  blockers: BlockerMetric[];
  funnel: Array<{ stage: string; count: number; pct: number; isSimulated: boolean }>;
  topSchemes: Array<{ id: string; name: string; category: string; eligibleCount: number; eligiblePct: number; unclaimedRs: number }>;
  overlapTop: OverlapCell[];
  insights: InsightPin[];
}

export function computeAnalyticsOverview(
  filter: AnalyticsFilter = {}
): AnalyticsOverviewResult {
  const t0 = performance.now();
  const db = getSqliteDb();
  const paramsHash = JSON.stringify(filter);

  try {
    const cached = db
      .prepare('SELECT result_json FROM analytics_cache WHERE key = ? AND params_hash = ?')
      .get('overview', paramsHash) as { result_json: string } | undefined;
    if (cached) {
      return JSON.parse(cached.result_json) as AnalyticsOverviewResult;
    }
  } catch {
    // ignore cache miss
  }

  const { schemes } = getCatalogueFromDb();
  const targetSchemes =
    filter.schemeId && filter.schemeId !== 'All'
      ? schemes.filter((s) => s.id === filter.schemeId)
      : schemes;

  const rows = queryPopulation(filter);
  const sampleSize = rows.length;

  let eligibleHouseholds = 0;
  let docsReadyHouseholds = 0;
  let totalMatches = 0;
  let totalUnclaimed = 0;

  const stateMap = new Map<
    string,
    { n: number; elig: number; ready: number; unclaimed: number }
  >();
  const catMap = new Map<string, { n: number; elig: number; unclaimed: number }>();
  const distMap = new Map<string, { n: number; elig: number; ready: number; benefitSum: number }>();
  const blockerCounts = new Map<string, number>();
  const schemeHits = new Int32Array(targetSchemes.length);
  const householdBenefits = new Float64Array(sampleSize);

  // Track top 6 popular schemes for overlap matrix
  const overlapCount = Math.min(6, targetSchemes.length);
  const overlapSchemes: SchemeRecord[] = targetSchemes.slice(0, overlapCount);
  const overlapGrid = new Int32Array(overlapCount * overlapCount);
  const overlapHitFlags = new Uint8Array(overlapCount);

  for (let rowIdx = 0; rowIdx < sampleSize; rowIdx++) {
    const row = rows[rowIdx];
    const profile = rowToNormalizedProfile(row);
    const heldDocs = profile.held_documents ?? [];

    let hhEligible = 0;
    let hhReady = false;
    let hhBenefit = 0;
    overlapHitFlags.fill(0);

    for (let sIdx = 0; sIdx < targetSchemes.length; sIdx++) {
      const s = targetSchemes[sIdx];
      if (!s.ruleTree) continue;
      const res = evaluateSchemeFast(s.ruleTree, profile);
      if (res.status === 'eligible') {
        hhEligible++;
        totalMatches++;
        hhBenefit += s.benefitAmount;
        schemeHits[sIdx]++;
        if (sIdx < overlapCount) overlapHitFlags[sIdx] = 1;
        if (!hhReady) {
          let hasAllDocs = true;
          for (let dIdx = 0; dIdx < s.documents.length; dIdx++) {
            if (!heldDocs.includes(s.documents[dIdx])) {
              hasAllDocs = false;
              break;
            }
          }
          if (hasAllDocs) hhReady = true;
        }
      } else if (res.nearMissField) {
        const f = res.nearMissField;
        blockerCounts.set(f, (blockerCounts.get(f) ?? 0) + 1);
      }
    }

    if (hhEligible > 0) {
      eligibleHouseholds++;
      if (hhReady) docsReadyHouseholds++;
      totalUnclaimed += hhBenefit;
    }
    householdBenefits[rowIdx] = hhBenefit;

    let st = stateMap.get(row.state);
    if (!st) {
      st = { n: 0, elig: 0, ready: 0, unclaimed: 0 };
      stateMap.set(row.state, st);
    }
    st.n++;
    if (hhEligible > 0) {
      st.elig++;
      if (hhReady) st.ready++;
      st.unclaimed += hhBenefit;
    }

    let ct = catMap.get(row.category);
    if (!ct) {
      ct = { n: 0, elig: 0, unclaimed: 0 };
      catMap.set(row.category, ct);
    }
    ct.n++;
    if (hhEligible > 0) {
      ct.elig++;
      ct.unclaimed += hhBenefit;
    }

    let dt = distMap.get(row.district_type);
    if (!dt) {
      dt = { n: 0, elig: 0, ready: 0, benefitSum: 0 };
      distMap.set(row.district_type, dt);
    }
    dt.n++;
    if (hhEligible > 0) {
      dt.elig++;
      if (hhReady) dt.ready++;
      dt.benefitSum += hhBenefit;
    }

    for (let i = 0; i < overlapCount; i++) {
      if (overlapHitFlags[i] === 0) continue;
      for (let j = i; j < overlapCount; j++) {
        if (overlapHitFlags[j] === 1) {
          overlapGrid[i * overlapCount + j]++;
        }
      }
    }
  }

  const byState: StateMetric[] = [...stateMap.entries()]
    .map(([state, v]) => {
      const suppressed = v.n < 30;
      const eligPct = suppressed ? 0 : Number(((v.elig / v.n) * 100).toFixed(1));
      const gapPct =
        suppressed || v.elig === 0
          ? 0
          : Number((((v.elig - v.ready) / v.elig) * 100).toFixed(1));
      return {
        state,
        households: v.n,
        eligibleHouseholds: v.elig,
        docsReadyHouseholds: v.ready,
        eligibilityRatePct: eligPct,
        coverageGapPct: gapPct,
        unclaimedBenefitRs: v.unclaimed,
        suppressed,
      };
    })
    .sort((a, b) => b.households - a.households);

  const byCategory = [...catMap.entries()].map(([category, v]) => ({
    category,
    households: v.n,
    eligibleRatePct: v.n < 30 ? 0 : Number(((v.elig / v.n) * 100).toFixed(1)),
    unclaimedRs: v.unclaimed,
    suppressed: v.n < 30,
  }));

  const byDistrictType = [...distMap.entries()].map(([districtType, v]) => ({
    districtType,
    households: v.n,
    eligibleRatePct: v.n === 0 ? 0 : Number(((v.elig / v.n) * 100).toFixed(1)),
    docsReadyPct: v.elig === 0 ? 0 : Number(((v.ready / v.elig) * 100).toFixed(1)),
    avgBenefitRs: v.n === 0 ? 0 : Math.round(v.benefitSum / v.n),
  }));

  // Lorenz curve & Gini coefficient (Extra Feature #14)
  const sortedBenefits = Float64Array.from(householdBenefits).sort();
  let sumB = 0;
  for (let i = 0; i < sortedBenefits.length; i++) sumB += sortedBenefits[i];
  if (sumB < 1) sumB = 1;
  const lorenzCurve: Array<{ popSharePct: number; benefitSharePct: number }> = [
    { popSharePct: 0, benefitSharePct: 0 },
  ];
  let running = 0;
  let areaUnderLorenz = 0;
  const deciles = 10;
  if (sortedBenefits.length > 0) {
    for (let d = 1; d <= deciles; d++) {
      const endIdx = Math.floor((d / deciles) * sortedBenefits.length);
      const prevIdx = Math.floor(((d - 1) / deciles) * sortedBenefits.length);
      for (let k = prevIdx; k < endIdx; k++) running += sortedBenefits[k];
      const popSharePct = d * 10;
      const benefitSharePct = Number(((running / sumB) * 100).toFixed(1));
      const prevShare = lorenzCurve[lorenzCurve.length - 1].benefitSharePct;
      areaUnderLorenz += ((prevShare + benefitSharePct) / 200) * 0.1;
      lorenzCurve.push({ popSharePct, benefitSharePct });
    }
  }
  const giniCoefficient = Number(Math.max(0, 1 - 2 * areaUnderLorenz).toFixed(3));

  const totalBlockers = Math.max(
    1,
    [...blockerCounts.values()].reduce((a, b) => a + b, 0)
  );
  const blockers: BlockerMetric[] = [...blockerCounts.entries()]
    .map(([field, failureCount]) => ({
      field,
      failureCount,
      sharePct: Number(((failureCount / totalBlockers) * 100).toFixed(1)),
    }))
    .sort((a, b) => b.failureCount - a.failureCount)
    .slice(0, 8);

  const appliedSim = Math.round(docsReadyHouseholds * 0.44);
  const approvedSim = Math.round(appliedSim * 0.72);
  const funnel = [
    { stage: 'Synthetic Profiles', count: sampleSize, pct: 100, isSimulated: false },
    {
      stage: 'Eligible (1+ Scheme)',
      count: eligibleHouseholds,
      pct: sampleSize ? Number(((eligibleHouseholds / sampleSize) * 100).toFixed(1)) : 0,
      isSimulated: false,
    },
    {
      stage: 'Documents Ready',
      count: docsReadyHouseholds,
      pct: sampleSize ? Number(((docsReadyHouseholds / sampleSize) * 100).toFixed(1)) : 0,
      isSimulated: false,
    },
    {
      stage: 'Applied (Simulated)',
      count: appliedSim,
      pct: sampleSize ? Number(((appliedSim / sampleSize) * 100).toFixed(1)) : 0,
      isSimulated: true,
    },
    {
      stage: 'Approved (Simulated)',
      count: approvedSim,
      pct: sampleSize ? Number(((approvedSim / sampleSize) * 100).toFixed(1)) : 0,
      isSimulated: true,
    },
  ];

  const topSchemes = targetSchemes
    .map((s, sIdx) => {
      const cnt = schemeHits[sIdx] ?? 0;
      return {
        id: s.id,
        name: s.nameEn,
        category: s.category,
        eligibleCount: cnt,
        eligiblePct: sampleSize ? Number(((cnt / sampleSize) * 100).toFixed(1)) : 0,
        unclaimedRs: cnt * s.benefitAmount,
      };
    })
    .sort((a, b) => b.eligibleCount - a.eligibleCount)
    .slice(0, 12);

  const overlapTop: OverlapCell[] = [];
  for (let i = 0; i < overlapCount; i++) {
    for (let j = 0; j < overlapCount; j++) {
      const cnt = i <= j ? overlapGrid[i * overlapCount + j] : overlapGrid[j * overlapCount + i];
      overlapTop.push({
        schemeA: overlapSchemes[i].nameEn.slice(0, 22),
        schemeB: overlapSchemes[j].nameEn.slice(0, 22),
        coEligibleCount: cnt,
        coEligiblePct: sampleSize ? Number(((cnt / sampleSize) * 100).toFixed(1)) : 0,
      });
    }
  }

  // Agent 10: Insight Writer Agent (template-generated pins over computed stats)
  const insights: InsightPin[] = [];
  const validStates = byState.filter((s) => !s.suppressed);
  if (validStates.length >= 2) {
    const highestGap = [...validStates].sort((a, b) => b.coverageGapPct - a.coverageGapPct)[0];
    insights.push({
      id: 'gap-pin',
      headline: `${highestGap.state} has a ${highestGap.coverageGapPct}% document readiness gap among ${highestGap.eligibleHouseholds.toLocaleString('en-IN')} eligible synthetic households.`,
      metric: `${highestGap.coverageGapPct}% gap`,
      chartTarget: 'map',
      sampleSize: highestGap.households,
    });
  }
  if (blockers.length > 0) {
    const topB = blockers[0];
    insights.push({
      id: 'blocker-pin',
      headline: `'${topB.field.replace(/_/g, ' ')}' accounts for ${topB.sharePct}% of all single-rule near-misses in the filtered cohort.`,
      metric: `${topB.sharePct}% share`,
      chartTarget: 'blockers',
      sampleSize,
    });
  }
  const rural = byDistrictType.find((d) => d.districtType === 'rural');
  const urban = byDistrictType.find((d) => d.districtType === 'urban');
  if (rural && urban) {
    const diff = Number((rural.eligibleRatePct - urban.eligibleRatePct).toFixed(1));
    insights.push({
      id: 'rural-urban-pin',
      headline: `Rural synthetic households show ${Math.abs(diff)} percentage points ${diff >= 0 ? 'higher' : 'lower'} scheme eligibility (${rural.eligibleRatePct}%) than urban households (${urban.eligibleRatePct}%).`,
      metric: `${diff >= 0 ? '+' : ''}${diff} pts`,
      chartTarget: 'equity',
      sampleSize: rural.households + urban.households,
    });
  }

  const computedMs = Number((performance.now() - t0).toFixed(1));

  const result: AnalyticsOverviewResult = {
    isSynthetic: true,
    label: 'Synthetic data (seeded prototype dataset, not real citizen records)',
    sampleSize,
    computedMs,
    kpis: {
      totalHouseholds: sampleSize,
      eligibleHouseholds,
      eligibilityRatePct: sampleSize ? Number(((eligibleHouseholds / sampleSize) * 100).toFixed(1)) : 0,
      docsReadyRatePct: eligibleHouseholds
        ? Number(((docsReadyHouseholds / eligibleHouseholds) * 100).toFixed(1))
        : 0,
      avgEligibleSchemes: sampleSize ? Number((totalMatches / sampleSize).toFixed(2)) : 0,
      unclaimedBenefitRs: totalUnclaimed,
    },
    byState,
    byCategory,
    byDistrictType,
    lorenzCurve,
    giniCoefficient,
    blockers,
    funnel,
    topSchemes,
    overlapTop,
    insights,
  };

  try {
    db.prepare(
      'INSERT OR REPLACE INTO analytics_cache(key, params_hash, result_json, computed_at) VALUES (?, ?, ?, ?)'
    ).run('overview', paramsHash, JSON.stringify(result), new Date().toISOString());
  } catch {
    // ignore cache write failure
  }

  return result;
}

/**
 * Cohort Comparison with Two-Proportion Z-Test (Agents.md Section 9 & Extra Feature #13)
 */
export interface CohortComparisonResult {
  isSynthetic: true;
  cohortA: { label: string; n: number; eligibleCount: number; eligiblePct: number; docsReadyPct: number; suppressed: boolean };
  cohortB: { label: string; n: number; eligibleCount: number; eligiblePct: number; docsReadyPct: number; suppressed: boolean };
  diffPctPoints: number;
  zScore: number;
  pValue: number;
  significantAt95: boolean;
  summarySentence: string;
}

function normalCdf(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp((-z * z) / 2);
  const p =
    d *
    t *
    (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return z > 0 ? 1 - p : p;
}

export function compareCohorts(
  filterA: AnalyticsFilter & { label?: string },
  filterB: AnalyticsFilter & { label?: string }
): CohortComparisonResult {
  const ovA = computeAnalyticsOverview(filterA);
  const ovB = computeAnalyticsOverview(filterB);

  const n1 = ovA.sampleSize;
  const x1 = ovA.kpis.eligibleHouseholds;
  const n2 = ovB.sampleSize;
  const x2 = ovB.kpis.eligibleHouseholds;

  const p1 = n1 > 0 ? x1 / n1 : 0;
  const p2 = n2 > 0 ? x2 / n2 : 0;
  const pPool = n1 + n2 > 0 ? (x1 + x2) / (n1 + n2) : 0;
  const se = Math.sqrt(Math.max(1e-12, pPool * (1 - pPool) * (1 / Math.max(1, n1) + 1 / Math.max(1, n2))));
  const zScore = Number(((p1 - p2) / se).toFixed(2));
  const pValue = Number((2 * (1 - normalCdf(Math.abs(zScore)))).toFixed(4));
  const diffPctPoints = Number(((p1 - p2) * 100).toFixed(1));
  const suppressedA = n1 < 30;
  const suppressedB = n2 < 30;

  return {
    isSynthetic: true,
    cohortA: {
      label: filterA.label || 'Cohort A',
      n: n1,
      eligibleCount: x1,
      eligiblePct: suppressedA ? 0 : Number((p1 * 100).toFixed(1)),
      docsReadyPct: suppressedA ? 0 : ovA.kpis.docsReadyRatePct,
      suppressed: suppressedA,
    },
    cohortB: {
      label: filterB.label || 'Cohort B',
      n: n2,
      eligibleCount: x2,
      eligiblePct: suppressedB ? 0 : Number((p2 * 100).toFixed(1)),
      docsReadyPct: suppressedB ? 0 : ovB.kpis.docsReadyRatePct,
      suppressed: suppressedB,
    },
    diffPctPoints,
    zScore,
    pValue,
    significantAt95: !suppressedA && !suppressedB && pValue < 0.05,
    summarySentence:
      suppressedA || suppressedB
        ? 'One or both cohorts have fewer than 30 synthetic households — statistical comparison suppressed.'
        : `Cohort A (${(p1 * 100).toFixed(1)}%, n=${n1}) vs Cohort B (${(p2 * 100).toFixed(1)}%, n=${n2}): ${diffPctPoints >= 0 ? '+' : ''}${diffPctPoints} percentage points (z=${zScore}, p=${pValue}).`,
  };
}

export function getPopulationPage(
  filter: AnalyticsFilter,
  offset = 0,
  limit = 100
): { rows: PopulationRow[]; total: number } {
  const all = queryPopulation(filter);
  return {
    rows: all.slice(offset, offset + limit),
    total: all.length,
  };
}
