import type { AnalyticsOverviewResult } from './index';
import type { RuleNode, SchemeRecord } from '../types';

/**
 * Extra Feature #43: State Readiness Scorecard & Grade (A/B/C/D)
 */
export interface StateScorecard {
  state: string;
  households: number;
  docsReadyPctOfElig: number;
  readinessIndex: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'Suppressed';
}

export function buildStateScorecards(overview: AnalyticsOverviewResult): StateScorecard[] {
  return overview.byState.map((s) => {
    if (s.suppressed || s.eligibleHouseholds < 30) {
      return {
        state: s.state,
        households: s.households,
        docsReadyPctOfElig: 0,
        readinessIndex: 0,
        grade: 'Suppressed',
      };
    }
    const docsReadyPctOfElig = Number((100 - s.coverageGapPct).toFixed(1));
    const readinessIndex = Number((0.6 * docsReadyPctOfElig + 0.4 * s.eligibilityRatePct).toFixed(1));
    let grade: StateScorecard['grade'] = 'D';
    if (readinessIndex >= 70) grade = 'A';
    else if (readinessIndex >= 55) grade = 'B';
    else if (readinessIndex >= 40) grade = 'C';
    return {
      state: s.state,
      households: s.households,
      docsReadyPctOfElig,
      readinessIndex,
      grade,
    };
  });
}

/**
 * Extra Feature #45 & #48: Blocker ROI Ranker + Analytics Health Diagnostics
 */
export interface BlockerRoiRow {
  field: string;
  nearMissCount: number;
  sharePct: number;
  actionHint: string;
}

export function buildBlockerRoi(overview: AnalyticsOverviewResult): BlockerRoiRow[] {
  const hints: Record<string, string> = {
    income: 'Issue updated annual income certificate via Tehsildar/CSC',
    is_bpl: 'Verify SECC / BPL survey inclusion or ration category',
    land_hectares: 'Update 7/12 / Khatauni mutation records at Talati/Patwari',
    age: 'Check threshold bracket or alternate age-tier scheme',
    occupation: 'Register worker/artisan ID (e-Shram / Udyam / Vishwakarma)',
    is_income_tax_payer: 'Non-ITR declaration affidavit at CSC',
    owns_pucca_house: 'Verify kutcha/pucca housing survey tag',
    gender: 'Check household head vs female-member applicant eligibility',
  };
  return overview.blockers.map((b) => ({
    field: b.field,
    nearMissCount: b.failureCount,
    sharePct: b.sharePct,
    actionHint: hints[b.field] ?? 'Confirm field in citizen profile & verify portal rule',
  }));
}

/**
 * Extra Feature #46: Category Inclusion vs Unclaimed Benefit Summary
 */
export interface CategoryEquityRow {
  category: string;
  households: number;
  eligibleRatePct: number;
  unclaimedPerHouseholdRs: number;
  suppressed: boolean;
}

export function buildCategoryEquity(overview: AnalyticsOverviewResult): CategoryEquityRow[] {
  return overview.byCategory.map((c) => ({
    category: c.category,
    households: c.households,
    eligibleRatePct: c.eligibleRatePct,
    unclaimedPerHouseholdRs:
      c.suppressed || c.households === 0 ? 0 : Math.round(c.unclaimedRs / c.households),
    suppressed: c.suppressed,
  }));
}

/**
 * Extra Feature #51: Rule-Tree Complexity & Depth Linter for Admin Quality
 */
export interface RuleComplexityStats {
  schemeId: string;
  depth: number;
  leafCount: number;
  usesNegation: boolean;
  complexityLabel: 'Simple' | 'Moderate' | 'Complex';
}

export function inspectRuleComplexity(scheme: SchemeRecord): RuleComplexityStats {
  let leafCount = 0;
  let usesNegation = false;

  function walk(node: RuleNode, depth: number): number {
    if ('field' in node && 'op' in node) {
      leafCount++;
      return depth;
    }
    let maxD = depth;
    if (node.none && node.none.length > 0) usesNegation = true;
    for (const child of [...(node.all ?? []), ...(node.any ?? []), ...(node.none ?? [])]) {
      maxD = Math.max(maxD, walk(child, depth + 1));
    }
    return maxD;
  }

  const depth = scheme.ruleTree ? walk(scheme.ruleTree, 1) : 0;
  const complexityLabel: RuleComplexityStats['complexityLabel'] =
    leafCount <= 3 && depth <= 2 ? 'Simple' : leafCount <= 6 && depth <= 3 ? 'Moderate' : 'Complex';

  return {
    schemeId: scheme.id,
    depth,
    leafCount,
    usesNegation,
    complexityLabel,
  };
}

/**
 * Extra Feature #52 & #53: Official Domain Health & Translation Completeness Audit
 */
export interface CatalogueCoverageAudit {
  totalSchemes: number;
  govInUrlCount: number;
  fullHindiCount: number;
  fullGujaratiCount: number;
  staleCount: number;
  avgRuleLeaves: number;
}

export function auditCatalogueCoverage(schemes: SchemeRecord[]): CatalogueCoverageAudit {
  const now = Date.now();
  let govInUrlCount = 0;
  let fullHindiCount = 0;
  let fullGujaratiCount = 0;
  let staleCount = 0;
  let leafSum = 0;

  for (const s of schemes) {
    if (s.officialUrl.includes('.gov.in') || s.officialUrl.includes('.nic.in')) {
      govInUrlCount++;
    }
    if (s.nameHi.trim() && s.summaryHi.trim()) fullHindiCount++;
    if (s.nameGu.trim() && s.summaryGu.trim()) fullGujaratiCount++;
    const ts = Date.parse(s.lastVerified);
    if (Number.isNaN(ts) || (now - ts) / 86_400_000 > 180) staleCount++;
    leafSum += inspectRuleComplexity(s).leafCount;
  }

  return {
    totalSchemes: schemes.length,
    govInUrlCount,
    fullHindiCount,
    fullGujaratiCount,
    staleCount,
    avgRuleLeaves: schemes.length ? Number((leafSum / schemes.length).toFixed(1)) : 0,
  };
}

