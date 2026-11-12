import type {
  CitizenProfile,
  CriterionResult,
  EligibilityResult,
  EligibilityStatus,
  NearMissInfo,
  NormalizedProfile,
  RuleGroup,
  RuleLeaf,
  RuleNode,
  SchemeRecord,
  SchemeRuleTree,
} from '../types';
import { normalizeProfile } from '../profile';

const VERIFY_DISCLAIMER =
  'Sample rule evaluation — verify exact eligibility on the official portal before applying.';

function isRuleLeaf(node: RuleNode): node is RuleLeaf {
  return 'field' in node && 'op' in node;
}

function getProfileFieldValue(profile: NormalizedProfile, field: string): unknown {
  return (profile as unknown as Record<string, unknown>)[field];
}

function compareNumericWithRange(
  range: [number, number],
  op: RuleLeaf['op'],
  expected: unknown
): { passed: boolean | null; distance: number | null } {
  const [minVal, maxVal] = range;
  const mid = (minVal + maxVal) / 2;

  if (op === 'lt' && typeof expected === 'number') {
    if (maxVal < expected) return { passed: true, distance: 0 };
    if (minVal >= expected) return { passed: false, distance: Number((minVal - expected + 1).toFixed(2)) };
    return { passed: null, distance: null };
  }
  if (op === 'lte' && typeof expected === 'number') {
    if (maxVal <= expected) return { passed: true, distance: 0 };
    if (minVal > expected) return { passed: false, distance: Number((minVal - expected).toFixed(2)) };
    return { passed: null, distance: null };
  }
  if (op === 'gt' && typeof expected === 'number') {
    if (minVal > expected) return { passed: true, distance: 0 };
    if (maxVal <= expected) return { passed: false, distance: Number((expected - maxVal).toFixed(2)) };
    return { passed: null, distance: null };
  }
  if (op === 'gte' && typeof expected === 'number') {
    if (minVal >= expected) return { passed: true, distance: 0 };
    if (maxVal < expected) return { passed: false, distance: Number((expected - maxVal).toFixed(2)) };
    return { passed: null, distance: null };
  }
  if (op === 'between' && Array.isArray(expected) && expected.length === 2) {
    const [lo, hi] = expected as [number, number];
    if (minVal >= lo && maxVal <= hi) return { passed: true, distance: 0 };
    if (maxVal < lo) return { passed: false, distance: Number((lo - maxVal).toFixed(2)) };
    if (minVal > hi) return { passed: false, distance: Number((minVal - hi).toFixed(2)) };
    return { passed: null, distance: null };
  }

  return { passed: mid === expected, distance: null };
}

function getUnitForField(field: string): NearMissInfo['unit'] {
  if (field === 'income') return 'rs';
  if (field === 'age') return 'years';
  if (field === 'land_hectares') return 'hectares';
  return 'other';
}

export function evaluateLeaf(leaf: RuleLeaf, profile: NormalizedProfile): CriterionResult {
  const actual = getProfileFieldValue(profile, leaf.field);

  if (leaf.op === 'exists') {
    const exists = actual !== undefined && actual !== null && actual !== '';
    return {
      field: leaf.field,
      op: leaf.op,
      expected: true,
      actual: actual ?? null,
      passed: exists ? true : null,
      distance: null,
      hint: exists ? '' : `Provide ${leaf.field} to confirm`,
    };
  }

  // Unknown is NEVER treated as pass
  if (actual === undefined || actual === null || actual === '') {
    return {
      field: leaf.field,
      op: leaf.op,
      expected: leaf.value,
      actual: null,
      passed: null,
      distance: null,
      unit: getUnitForField(leaf.field),
      hint: `Add your ${leaf.field.replace(/_/g, ' ')} to confirm`,
    };
  }

  // Special handling for income band ranges when exact income isn't entered
  if (
    leaf.field === 'income' &&
    profile.incomeRange &&
    profile.incomeRange[0] !== profile.incomeRange[1] &&
    ['lt', 'lte', 'gt', 'gte', 'between'].includes(leaf.op)
  ) {
    const res = compareNumericWithRange(profile.incomeRange, leaf.op, leaf.value);
    return {
      field: leaf.field,
      op: leaf.op,
      expected: leaf.value,
      actual: profile.incomeRange,
      passed: res.passed,
      distance: res.distance,
      unit: 'rs',
      hint:
        res.passed === null
          ? 'Your income band spans this cap — enter exact income to confirm'
          : '',
    };
  }

  let passed = false;
  let distance: number | null = null;

  switch (leaf.op) {
    case 'eq':
      passed = actual === leaf.value;
      break;
    case 'neq':
      passed = actual !== leaf.value;
      break;
    case 'in':
      passed = Array.isArray(leaf.value) && leaf.value.includes(actual);
      break;
    case 'nin':
      passed = Array.isArray(leaf.value) && !leaf.value.includes(actual);
      break;
    case 'lt':
      if (typeof actual === 'number' && typeof leaf.value === 'number') {
        passed = actual < leaf.value;
        distance = passed ? 0 : Number((actual - leaf.value + 1).toFixed(2));
      }
      break;
    case 'lte':
      if (typeof actual === 'number' && typeof leaf.value === 'number') {
        passed = actual <= leaf.value;
        distance = passed ? 0 : Number((actual - leaf.value).toFixed(2));
      }
      break;
    case 'gt':
      if (typeof actual === 'number' && typeof leaf.value === 'number') {
        passed = actual > leaf.value;
        distance = passed ? 0 : Number((leaf.value - actual).toFixed(2));
      }
      break;
    case 'gte':
      if (typeof actual === 'number' && typeof leaf.value === 'number') {
        passed = actual >= leaf.value;
        distance = passed ? 0 : Number((leaf.value - actual).toFixed(2));
      }
      break;
    case 'between':
      if (
        typeof actual === 'number' &&
        Array.isArray(leaf.value) &&
        leaf.value.length === 2
      ) {
        const [lo, hi] = leaf.value as [number, number];
        passed = actual >= lo && actual <= hi;
        if (!passed) {
          distance = actual < lo ? Number((lo - actual).toFixed(2)) : Number((actual - hi).toFixed(2));
        } else {
          distance = 0;
        }
      }
      break;
  }

  return {
    field: leaf.field,
    op: leaf.op,
    expected: leaf.value,
    actual,
    passed,
    distance,
    unit: getUnitForField(leaf.field),
    hint: '',
  };
}

export interface NodeTrace {
  kind: 'leaf' | 'all' | 'any' | 'none';
  passed: boolean | null;
  label: string;
  children?: NodeTrace[];
  criterion?: CriterionResult;
}

function combineAll(results: Array<boolean | null>): boolean | null {
  if (results.some((r) => r === false)) return false;
  if (results.some((r) => r === null)) return null;
  return true;
}

function combineAny(results: Array<boolean | null>): boolean | null {
  if (results.some((r) => r === true)) return true;
  if (results.some((r) => r === null)) return null;
  return false;
}

function negateTriState(val: boolean | null): boolean | null {
  if (val === true) return false;
  if (val === false) return true;
  return null;
}

export function evaluateRuleNodeWithTrace(
  node: RuleNode,
  profile: NormalizedProfile,
  criteriaOut: CriterionResult[]
): NodeTrace {
  if (isRuleLeaf(node)) {
    const crit = evaluateLeaf(node, profile);
    criteriaOut.push(crit);
    return {
      kind: 'leaf',
      passed: crit.passed,
      label: `${node.field} ${node.op} ${JSON.stringify(node.value)}`,
      criterion: crit,
    };
  }

  const group = node as RuleGroup;
  const groupTraces: NodeTrace[] = [];
  const groupResults: Array<boolean | null> = [];

  if (group.all && group.all.length > 0) {
    const childTraces = group.all.map((child) =>
      evaluateRuleNodeWithTrace(child, profile, criteriaOut)
    );
    const res = combineAll(childTraces.map((t) => t.passed));
    groupResults.push(res);
    groupTraces.push({ kind: 'all', passed: res, label: 'ALL', children: childTraces });
  }

  if (group.any && group.any.length > 0) {
    const childTraces = group.any.map((child) =>
      evaluateRuleNodeWithTrace(child, profile, criteriaOut)
    );
    const res = combineAny(childTraces.map((t) => t.passed));
    groupResults.push(res);
    groupTraces.push({ kind: 'any', passed: res, label: 'ANY', children: childTraces });
  }

  if (group.none && group.none.length > 0) {
    const rawChildTraces = group.none.map((child) =>
      evaluateRuleNodeWithTrace(child, profile, criteriaOut)
    );
    // Flip leaf criteria passed for display in `none` exclusion checks
    const flippedTraces = rawChildTraces.map((t) => ({
      ...t,
      passed: negateTriState(t.passed),
      criterion: t.criterion
        ? { ...t.criterion, passed: negateTriState(t.criterion.passed) }
        : undefined,
    }));
    // Replace corresponding entries in criteriaOut with negated meaning
    const startIdx = criteriaOut.length - rawChildTraces.length;
    for (let i = startIdx; i < criteriaOut.length; i++) {
      if (criteriaOut[i]) {
        criteriaOut[i] = {
          ...criteriaOut[i],
          passed: negateTriState(criteriaOut[i].passed),
          op: criteriaOut[i].op === 'eq' ? 'neq' : criteriaOut[i].op,
        };
      }
    }
    const anyForbiddenTrue = combineAny(rawChildTraces.map((t) => t.passed));
    const nonePassed = negateTriState(anyForbiddenTrue);
    groupResults.push(nonePassed);
    groupTraces.push({ kind: 'none', passed: nonePassed, label: 'NONE', children: flippedTraces });
  }

  if (groupTraces.length === 1) return groupTraces[0];
  return {
    kind: 'all',
    passed: combineAll(groupResults),
    label: 'ROOT',
    children: groupTraces,
  };
}

export function evaluateScheme(
  ruleTree: SchemeRuleTree,
  profileInput: Partial<CitizenProfile> | NormalizedProfile
): EligibilityResult & { trace: NodeTrace } {
  const profile =
    'knownFields' in profileInput ? profileInput : normalizeProfile(profileInput);
  const criteria: CriterionResult[] = [];
  const trace = evaluateRuleNodeWithTrace(ruleTree, profile, criteria);

  let status: EligibilityStatus;
  if (trace.passed === true) {
    status = 'eligible';
  } else if (trace.passed === null) {
    status = 'likely';
  } else {
    status = 'not_eligible';
  }

  const totalCount = Math.max(1, criteria.length);
  const passedCount = criteria.filter((c) => c.passed === true).length;
  const unknownCount = criteria.filter((c) => c.passed === null).length;
  const confidence = Number(
    ((passedCount + unknownCount * 0.45) / totalCount).toFixed(2)
  );

  // Near-miss: Not eligible with exactly 1 failed criterion
  let near_miss: NearMissInfo | null = null;
  if (status === 'not_eligible') {
    const failed = criteria.filter((c) => c.passed === false);
    if (failed.length === 1) {
      const f = failed[0];
      near_miss = {
        field: f.field,
        distance: f.distance ?? 1,
        unit: getUnitForField(f.field),
        messageKey: `near_miss.${f.field}`,
        actual: f.actual,
        expected: f.expected,
      };
    }
  }

  return {
    scheme_id: ruleTree.scheme_id,
    status,
    criteria,
    near_miss,
    confidence,
    disclaimer: VERIFY_DISCLAIMER,
    trace,
  };
}

function evaluateLeafPassedFast(leaf: RuleLeaf, profile: NormalizedProfile): boolean | null {
  const actual = (profile as unknown as Record<string, unknown>)[leaf.field];
  if (leaf.op === 'exists') {
    return actual !== undefined && actual !== null && actual !== '' ? true : null;
  }
  if (actual === undefined || actual === null || actual === '') {
    return null;
  }
  switch (leaf.op) {
    case 'eq':
      return actual === leaf.value;
    case 'neq':
      return actual !== leaf.value;
    case 'in':
      return Array.isArray(leaf.value) && leaf.value.includes(actual);
    case 'nin':
      return Array.isArray(leaf.value) && !leaf.value.includes(actual);
    case 'lt':
      return typeof actual === 'number' && typeof leaf.value === 'number' && actual < leaf.value;
    case 'lte':
      return typeof actual === 'number' && typeof leaf.value === 'number' && actual <= leaf.value;
    case 'gt':
      return typeof actual === 'number' && typeof leaf.value === 'number' && actual > leaf.value;
    case 'gte':
      return typeof actual === 'number' && typeof leaf.value === 'number' && actual >= leaf.value;
    case 'between':
      if (typeof actual === 'number' && Array.isArray(leaf.value) && leaf.value.length === 2) {
        return actual >= (leaf.value[0] as number) && actual <= (leaf.value[1] as number);
      }
      return false;
  }
}

function evalNodeFast(
  node: RuleNode,
  profile: NormalizedProfile,
  failTracker: { count: number; field: string },
  negate: boolean
): boolean | null {
  if (isRuleLeaf(node)) {
    const raw = evaluateLeafPassedFast(node, profile);
    const passed = negate ? negateTriState(raw) : raw;
    if (passed === false) {
      failTracker.count++;
      failTracker.field = node.field;
    }
    return passed;
  }
  const group = node as RuleGroup;
  let allFalse = false;
  let allNull = false;
  let hasGroup = false;

  if (group.all && group.all.length > 0) {
    hasGroup = true;
    let f = false;
    let n = false;
    for (let i = 0; i < group.all.length; i++) {
      const r = evalNodeFast(group.all[i], profile, failTracker, negate);
      if (r === false) f = true;
      else if (r === null) n = true;
    }
    if (f) allFalse = true;
    else if (n) allNull = true;
  }

  if (group.any && group.any.length > 0) {
    hasGroup = true;
    let t = false;
    let n = false;
    for (let i = 0; i < group.any.length; i++) {
      const r = evalNodeFast(group.any[i], profile, failTracker, negate);
      if (r === true) t = true;
      else if (r === null) n = true;
    }
    const anyRes = t ? true : n ? null : false;
    if (anyRes === false) allFalse = true;
    else if (anyRes === null) allNull = true;
  }

  if (group.none && group.none.length > 0) {
    hasGroup = true;
    // In NONE group: any child true means NONE fails
    let anyForbiddenTrue = false;
    let anyNull = false;
    for (let i = 0; i < group.none.length; i++) {
      const r = evalNodeFast(group.none[i], profile, failTracker, !negate);
      if (r === false) anyForbiddenTrue = true; // because !negate flipped true -> false
      else if (r === null) anyNull = true;
    }
    if (anyForbiddenTrue) allFalse = true;
    else if (anyNull) allNull = true;
  }

  if (!hasGroup) return true;
  if (allFalse) return false;
  if (allNull) return null;
  return true;
}

const sharedFailTracker = { count: 0, field: '' };

/** Zero-allocation fast evaluator for batch analytics (assumes exact/pre-normalized profile) */
export function evaluateSchemeFast(
  ruleTree: SchemeRuleTree,
  profile: NormalizedProfile
): { status: EligibilityStatus; nearMissField: string | null } {
  sharedFailTracker.count = 0;
  sharedFailTracker.field = '';
  const passed = evalNodeFast(ruleTree, profile, sharedFailTracker, false);
  if (passed === true) return { status: 'eligible', nearMissField: null };
  if (passed === null) return { status: 'likely', nearMissField: null };
  return {
    status: 'not_eligible',
    nearMissField: sharedFailTracker.count === 1 ? sharedFailTracker.field : null,
  };
}

export function evaluateAllSchemes(
  schemes: SchemeRecord[],
  profileInput: Partial<CitizenProfile> | NormalizedProfile
): Map<string, EligibilityResult> {
  const profile =
    'knownFields' in profileInput ? profileInput : normalizeProfile(profileInput);
  const map = new Map<string, EligibilityResult>();
  for (const s of schemes) {
    if (!s.ruleTree) continue;
    const { trace: _trace, ...res } = evaluateScheme(s.ruleTree, profile);
    map.set(s.id, res);
  }
  return map;
}

/**
 * Agent 3: What-If Simulator — diffs baseline vs hypothetical profile
 */
export interface WhatIfDiffResult {
  gained: Array<{ scheme: SchemeRecord; before: EligibilityStatus; after: EligibilityStatus; changedCriteria: string[] }>;
  lost: Array<{ scheme: SchemeRecord; before: EligibilityStatus; after: EligibilityStatus; changedCriteria: string[] }>;
  unchangedEligible: number;
  hypotheticalNote: string;
}

export function simulateWhatIf(
  schemes: SchemeRecord[],
  baseProfile: Partial<CitizenProfile>,
  deltas: Partial<CitizenProfile>
): WhatIfDiffResult {
  const baseEval = evaluateAllSchemes(schemes, baseProfile);
  const nextProfile: Partial<CitizenProfile> = { ...baseProfile, ...deltas };
  // If exact income delta provided, clear income_band so exact value governs
  if (deltas.income !== undefined) {
    nextProfile.income_band = undefined;
  }
  const nextEval = evaluateAllSchemes(schemes, nextProfile);

  const gained: WhatIfDiffResult['gained'] = [];
  const lost: WhatIfDiffResult['lost'] = [];
  let unchangedEligible = 0;

  const isPositive = (st: EligibilityStatus) => st === 'eligible' || st === 'likely';

  for (const scheme of schemes) {
    const b = baseEval.get(scheme.id);
    const a = nextEval.get(scheme.id);
    if (!b || !a) continue;

    const changedCriteria = a.criteria
      .filter((ac, idx) => b.criteria[idx] && b.criteria[idx].passed !== ac.passed)
      .map((c) => c.field);

    if (!isPositive(b.status) && isPositive(a.status)) {
      gained.push({ scheme, before: b.status, after: a.status, changedCriteria });
    } else if (b.status === 'likely' && a.status === 'eligible') {
      gained.push({ scheme, before: b.status, after: a.status, changedCriteria });
    } else if (isPositive(b.status) && !isPositive(a.status)) {
      lost.push({ scheme, before: b.status, after: a.status, changedCriteria });
    } else if (isPositive(a.status)) {
      unchangedEligible++;
    }
  }

  return {
    gained,
    lost,
    unchangedEligible,
    hypotheticalNote: 'Hypothetical simulation — verify official rules before acting.',
  };
}

/**
 * Extra Feature #10: What-If Sensitivity Curves across income / age / land ranges
 */
export interface SensitivityPoint {
  x: number;
  label: string;
  eligibleCount: number;
  likelyCount: number;
  totalAnnualBenefit: number;
}

export function computeSensitivityCurve(
  schemes: SchemeRecord[],
  baseProfile: Partial<CitizenProfile>,
  axis: 'income' | 'age' | 'land_hectares'
): SensitivityPoint[] {
  const points: number[] =
    axis === 'income'
      ? [50000, 100000, 150000, 200000, 250000, 350000, 500000, 600000, 800000, 1000000]
      : axis === 'age'
      ? [10, 16, 19, 25, 35, 45, 55, 60, 70, 80]
      : [0, 0.2, 0.5, 1, 1.5, 2, 3, 5];

  return points.map((val) => {
    const simProfile: Partial<CitizenProfile> = {
      ...baseProfile,
      [axis]: val,
      ...(axis === 'income' ? { income_band: undefined } : {}),
    };
    const resMap = evaluateAllSchemes(schemes, simProfile);
    let eligibleCount = 0;
    let likelyCount = 0;
    let totalAnnualBenefit = 0;

    for (const s of schemes) {
      const r = resMap.get(s.id);
      if (!r) continue;
      if (r.status === 'eligible') {
        eligibleCount++;
        totalAnnualBenefit += s.benefitAmount;
      } else if (r.status === 'likely') {
        likelyCount++;
      }
    }

    const label =
      axis === 'income'
        ? `₹${(val / 100000).toFixed(1)}L`
        : axis === 'age'
        ? `${val}y`
        : `${val}ha`;

    return { x: val, label, eligibleCount, likelyCount, totalAnnualBenefit };
  });
}

/**
 * Admin Quality: Check whether a rule tree is logically satisfiable (no contradictory bounds/sets on the same field under `all`)
 */
export function checkRuleSatisfiability(ruleTree: SchemeRuleTree): {
  satisfiable: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  const allLeaves: RuleLeaf[] = [];

  function collectTopAll(node: RuleNode) {
    if (isRuleLeaf(node)) {
      allLeaves.push(node);
      return;
    }
    if (node.all) {
      node.all.forEach(collectTopAll);
    }
  }
  collectTopAll(ruleTree);

  const byField = new Map<string, RuleLeaf[]>();
  for (const leaf of allLeaves) {
    const arr = byField.get(leaf.field) ?? [];
    arr.push(leaf);
    byField.set(leaf.field, arr);
  }

  for (const [field, leaves] of byField.entries()) {
    let minAllowed = -Infinity;
    let maxAllowed = Infinity;
    let allowedSet: Set<unknown> | null = null;

    for (const l of leaves) {
      if (l.op === 'gt' && typeof l.value === 'number') minAllowed = Math.max(minAllowed, l.value + 0.0001);
      if (l.op === 'gte' && typeof l.value === 'number') minAllowed = Math.max(minAllowed, l.value);
      if (l.op === 'lt' && typeof l.value === 'number') maxAllowed = Math.min(maxAllowed, l.value - 0.0001);
      if (l.op === 'lte' && typeof l.value === 'number') maxAllowed = Math.min(maxAllowed, l.value);
      if (l.op === 'between' && Array.isArray(l.value)) {
        minAllowed = Math.max(minAllowed, Number(l.value[0]));
        maxAllowed = Math.min(maxAllowed, Number(l.value[1]));
      }
      if (l.op === 'eq') {
        const s = new Set<unknown>([l.value]);
        allowedSet = allowedSet ? new Set<unknown>([...allowedSet].filter((x: unknown) => s.has(x))) : s;
      }
      if (l.op === 'in' && Array.isArray(l.value)) {
        const s = new Set<unknown>(l.value);
        allowedSet = allowedSet ? new Set<unknown>([...allowedSet].filter((x: unknown) => s.has(x))) : s;
      }
    }

    if (minAllowed > maxAllowed) {
      issues.push(`Contradictory numeric bounds on '${field}' (${minAllowed} > ${maxAllowed})`);
    }
    if (allowedSet && allowedSet.size === 0) {
      issues.push(`Contradictory equality/set constraints on '${field}'`);
    }
  }

  return { satisfiable: issues.length === 0, issues };
}
