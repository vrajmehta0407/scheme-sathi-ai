import type {
  BenefitEstimate,
  CitizenProfile,
  EligibilityResult,
  NormalizedProfile,
  SchemeRecord,
} from '../types';
import { normalizeProfile } from '../profile';
import { evaluateAllSchemes } from '../rules';

export function formatINR(amount: number): string {
  return 'Rs. ' + Math.round(amount).toLocaleString('en-IN');
}

export function calculateSchemeBenefit(
  scheme: SchemeRecord,
  profileInput: Partial<CitizenProfile> | NormalizedProfile
): BenefitEstimate {
  const profile =
    'knownFields' in profileInput ? profileInput : normalizeProfile(profileInput);
  const f = scheme.benefitFormula;

  let annual = 0;
  let lifetime = 0;
  let formulaLabel = '';

  switch (f.type) {
    case 'fixed_per_year': {
      annual = f.amount;
      lifetime = f.amount * (f.years ?? 5);
      formulaLabel = `${formatINR(f.amount)}/yr × ${f.years ?? 5} yrs (estimate)`;
      break;
    }
    case 'fixed_per_month': {
      annual = f.amount * 12;
      lifetime = annual * (f.years ?? 10);
      formulaLabel = `${formatINR(f.amount)}/mo × 12 × ${f.years ?? 10} yrs (estimate)`;
      break;
    }
    case 'one_time': {
      annual = f.amount;
      lifetime = f.amount;
      formulaLabel = `One-time grant ${formatINR(f.amount)} (estimate)`;
      break;
    }
    case 'percent_of_cost': {
      const raw = Math.round((f.costBasis * f.percent) / 100);
      const capped = Math.min(f.cap, raw);
      annual = capped;
      lifetime = capped * (f.years ?? 1);
      formulaLabel = `${f.percent}% of ${formatINR(f.costBasis)} capped at ${formatINR(f.cap)} (estimate)`;
      break;
    }
    case 'slab': {
      const fieldVal = (profile as unknown as Record<string, unknown>)[f.field];
      let matched = f.slabs[0]?.amount ?? scheme.benefitAmount;
      if (typeof fieldVal === 'number') {
        const hit = f.slabs.find(
          (s) =>
            (s.min === undefined || fieldVal >= s.min) &&
            (s.max === undefined || fieldVal <= s.max)
        );
        if (hit) matched = hit.amount;
      }
      annual = matched;
      lifetime = matched * (f.years ?? 4);
      formulaLabel = `Slab by ${f.field}: ${formatINR(matched)}/yr × ${f.years ?? 4} yrs (estimate)`;
      break;
    }
  }

  return {
    schemeId: scheme.id,
    annualEstimate: annual,
    lifetimeEstimate: lifetime,
    formulaLabel,
    isEstimate: true,
  };
}

/**
 * Sums benefits across a selected scheme bundle while avoiding double-counting
 * within the same `exclusiveGroup` (keeps the highest-value scheme in each exclusive group).
 */
export function calculateBundleTotals(
  schemes: SchemeRecord[],
  profileInput: Partial<CitizenProfile> | NormalizedProfile
): {
  annualTotal: number;
  lifetimeTotal: number;
  countedSchemeIds: string[];
  excludedDueToOverlap: Array<{ schemeId: string; group: string; supersededBy: string }>;
  isEstimate: true;
} {
  const bestInGroup = new Map<string, { scheme: SchemeRecord; est: BenefitEstimate }>();
  const nonExclusive: Array<{ scheme: SchemeRecord; est: BenefitEstimate }> = [];

  for (const s of schemes) {
    const est = calculateSchemeBenefit(s, profileInput);
    if (!s.exclusiveGroup) {
      nonExclusive.push({ scheme: s, est });
    } else {
      const existing = bestInGroup.get(s.exclusiveGroup);
      if (!existing || est.annualEstimate > existing.est.annualEstimate) {
        bestInGroup.set(s.exclusiveGroup, { scheme: s, est });
      }
    }
  }

  const counted = [...nonExclusive, ...bestInGroup.values()];
  const countedIds = new Set(counted.map((c) => c.scheme.id));
  const excludedDueToOverlap: Array<{
    schemeId: string;
    group: string;
    supersededBy: string;
  }> = [];

  for (const s of schemes) {
    if (s.exclusiveGroup && !countedIds.has(s.id)) {
      const winner = bestInGroup.get(s.exclusiveGroup);
      if (winner) {
        excludedDueToOverlap.push({
          schemeId: s.id,
          group: s.exclusiveGroup,
          supersededBy: winner.scheme.id,
        });
      }
    }
  }

  return {
    annualTotal: counted.reduce((sum, x) => sum + x.est.annualEstimate, 0),
    lifetimeTotal: counted.reduce((sum, x) => sum + x.est.lifetimeEstimate, 0),
    countedSchemeIds: [...countedIds],
    excludedDueToOverlap,
    isEstimate: true,
  };
}

/**
 * Extra Feature #8: Family Benefit Planner (Household Matrix)
 * Evaluates multiple saved family profiles together without double-counting household-level schemes.
 */
export interface HouseholdMemberSummary {
  profileId: string;
  label: string;
  eligibleCount: number;
  likelyCount: number;
  individualAnnualEstimate: number;
  topSchemeNames: string[];
}

export function calculateHouseholdMatrix(
  schemes: SchemeRecord[],
  members: CitizenProfile[]
): {
  memberSummaries: HouseholdMemberSummary[];
  combinedAnnualEstimate: number;
  combinedLifetimeEstimate: number;
  dedupedHouseholdSchemes: string[];
  isEstimate: true;
} {
  const seenHouseholdSchemes = new Set<string>();
  let combinedAnnual = 0;
  let combinedLifetime = 0;
  const dedupedHouseholdSchemes: string[] = [];

  const memberSummaries: HouseholdMemberSummary[] = members.map((member) => {
    const evalMap: Map<string, EligibilityResult> = evaluateAllSchemes(schemes, member);
    const eligibleSchemes = schemes.filter(
      (s) => evalMap.get(s.id)?.status === 'eligible'
    );
    const likelyCount = schemes.filter(
      (s) => evalMap.get(s.id)?.status === 'likely'
    ).length;

    const bundle = calculateBundleTotals(eligibleSchemes, member);
    let memberAnnual = 0;

    for (const id of bundle.countedSchemeIds) {
      const scheme = schemes.find((s) => s.id === id);
      if (!scheme) continue;
      const est = calculateSchemeBenefit(scheme, member);
      if (scheme.isHouseholdLevel) {
        if (seenHouseholdSchemes.has(scheme.id)) {
          dedupedHouseholdSchemes.push(scheme.id);
          continue;
        }
        seenHouseholdSchemes.add(scheme.id);
      }
      memberAnnual += est.annualEstimate;
      combinedAnnual += est.annualEstimate;
      combinedLifetime += est.lifetimeEstimate;
    }

    return {
      profileId: member.id,
      label: member.label,
      eligibleCount: eligibleSchemes.length,
      likelyCount,
      individualAnnualEstimate: memberAnnual,
      topSchemeNames: eligibleSchemes.slice(0, 3).map((s) => s.nameEn),
    };
  });

  return {
    memberSummaries,
    combinedAnnualEstimate: combinedAnnual,
    combinedLifetimeEstimate: combinedLifetime,
    dedupedHouseholdSchemes: [...new Set(dedupedHouseholdSchemes)],
    isEstimate: true,
  };
}

