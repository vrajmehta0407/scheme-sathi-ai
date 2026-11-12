import type {
  CitizenProfile,
  DocumentRecord,
  EligibilityResult,
  RankedScheme,
  SchemeRecord,
} from '../types';
import { calculateSchemeBenefit } from '../benefits';
import { normalizeProfile } from '../profile';

function computeDeadlineUrgency(deadline: string | null, refDate = new Date()): number {
  if (!deadline) return 0.35;
  const target = new Date(deadline);
  const diffDays = (target.getTime() - refDate.getTime()) / (1000 * 60 * 60 * 24);
  if (diffDays < 0) return 0.05;
  if (diffDays <= 14) return 1.0;
  if (diffDays <= 45) return 0.8;
  if (diffDays <= 90) return 0.55;
  return 0.35;
}

/**
 * Agent 4: Recommender Agent
 * Score: 0.35*benefit_value + 0.25*ease(documents held) + 0.20*deadline_urgency + 0.10*level_fit + 0.10*popularity_prior
 */
export function rankSchemes(
  schemes: SchemeRecord[],
  evalMap: Map<string, EligibilityResult>,
  profileInput: Partial<CitizenProfile>,
  allDocuments: DocumentRecord[]
): RankedScheme[] {
  const profile = normalizeProfile(profileInput);
  const heldSet = new Set(profile.held_documents);
  const docMap = new Map(allDocuments.map((d) => [d.docKey, d]));

  const maxAnnual = Math.max(
    1,
    ...schemes.map((s) => calculateSchemeBenefit(s, profile).annualEstimate)
  );

  const ranked: RankedScheme[] = schemes.map((scheme) => {
    const eligibility = evalMap.get(scheme.id) ?? {
      scheme_id: scheme.id,
      status: 'likely',
      criteria: [],
      near_miss: null,
      confidence: 0.5,
      disclaimer: 'Verify on the official portal.',
    };
    const benefit = calculateSchemeBenefit(scheme, profile);
    const totalDocs = Math.max(1, scheme.documents.length);
    const heldDocs = scheme.documents.filter((d) => heldSet.has(d)).length;
    const missingDocs = scheme.documents.filter((d) => !heldSet.has(d));

    const ease = heldDocs / totalDocs;
    const benefitNorm = Math.min(1, Math.log10(1 + benefit.annualEstimate) / Math.log10(1 + maxAnnual));
    const deadlineUrgency = computeDeadlineUrgency(scheme.deadline);
    const levelFit =
      scheme.level === 'state' && profile.state && scheme.state === profile.state
        ? 1.0
        : scheme.level === 'central'
        ? 0.8
        : 0.2;
    const popularity = scheme.popularityPrior ?? 0.5;

    let score =
      0.35 * benefitNorm +
      0.25 * ease +
      0.20 * deadlineUrgency +
      0.10 * levelFit +
      0.10 * popularity;

    // Status weighting keeps Eligible above Likely above Not Eligible while preserving tie-break ranking
    if (eligibility.status === 'eligible') score += 2.0;
    else if (eligibility.status === 'likely') score += 1.0;

    const daysToReady = missingDocs.reduce((maxDays, key) => {
      const d = docMap.get(key);
      return Math.max(maxDays, d?.typicalDays ?? 7);
    }, 0);

    return {
      scheme,
      eligibility,
      benefit,
      score: Number(score.toFixed(4)),
      heldDocCount: heldDocs,
      totalDocCount: scheme.documents.length,
      readinessPct: Math.round((heldDocs / totalDocs) * 100),
      missingDocs,
      daysToReady,
    };
  });

  return ranked.sort((a, b) => b.score - a.score);
}

/**
 * Extra Feature #5: Mutual-Exclusivity & Optimal Benefit Bundle Solver
 * Automatically picks the highest-value non-conflicting stack of Eligible (or Eligible + Likely) schemes.
 */
export interface OptimalBundleResult {
  selectedSchemes: RankedScheme[];
  skippedConflicts: Array<{
    scheme: RankedScheme;
    conflictGroup: string;
    chosenSchemeName: string;
  }>;
  annualTotal: number;
  lifetimeTotal: number;
  isEstimate: true;
}

export function solveOptimalBenefitBundle(
  ranked: RankedScheme[],
  includeLikely = false
): OptimalBundleResult {
  const candidates = ranked.filter((r) =>
    includeLikely
      ? r.eligibility.status === 'eligible' || r.eligibility.status === 'likely'
      : r.eligibility.status === 'eligible'
  );

  // Sort purely by annual benefit descending so greedy pick per exclusiveGroup is optimal
  const byValue = [...candidates].sort(
    (a, b) => b.benefit.annualEstimate - a.benefit.annualEstimate
  );

  const chosenGroupMap = new Map<string, RankedScheme>();
  const selectedSchemes: RankedScheme[] = [];
  const skippedConflicts: OptimalBundleResult['skippedConflicts'] = [];

  for (const item of byValue) {
    const group = item.scheme.exclusiveGroup;
    if (!group) {
      selectedSchemes.push(item);
      continue;
    }
    const existing = chosenGroupMap.get(group);
    if (!existing) {
      chosenGroupMap.set(group, item);
      selectedSchemes.push(item);
    } else {
      skippedConflicts.push({
        scheme: item,
        conflictGroup: group,
        chosenSchemeName: existing.scheme.nameEn,
      });
    }
  }

  return {
    selectedSchemes,
    skippedConflicts,
    annualTotal: selectedSchemes.reduce((s, x) => s + x.benefit.annualEstimate, 0),
    lifetimeTotal: selectedSchemes.reduce((s, x) => s + x.benefit.lifetimeEstimate, 0),
    isEstimate: true,
  };
}

