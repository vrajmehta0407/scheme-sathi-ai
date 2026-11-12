import type {
  CitizenProfile,
  DocumentRecord,
  NormalizedProfile,
  RankedScheme,
  SchemeRecord,
} from '../types';
import { normalizeProfile } from '../profile';
import { evaluateAllSchemes } from '../rules';
import { rankSchemes, solveOptimalBenefitBundle, type OptimalBundleResult } from '../recommender';
import { buildMergedDocumentChecklist } from '../documents';

export interface OrchestratedCitizenView {
  profile: NormalizedProfile;
  ranked: RankedScheme[];
  eligibleCount: number;
  likelyCount: number;
  notEligibleCount: number;
  optimalBundle: OptimalBundleResult;
  checklist: ReturnType<typeof buildMergedDocumentChecklist>;
  computeMs: number;
}

const memoCache = new Map<string, OrchestratedCitizenView>();

function simpleHash(input: string): string {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

/**
 * Agent 0: Orchestrator — coordinates Profile, Eligibility, Recommender,
 * Benefit Calculator, and Document Agent with input-hash caching.
 */
export function runCitizenOrchestrator(
  rawProfile: Partial<CitizenProfile>,
  schemes: SchemeRecord[],
  documents: DocumentRecord[],
  locale: 'en' | 'hi' | 'gu' = 'en'
): OrchestratedCitizenView {
  const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const key = simpleHash(
    JSON.stringify({
      rawProfile,
      schemeCount: schemes.length,
      schemeVersions: schemes.map((s) => `${s.id}:${s.version}`).join(','),
      locale,
    })
  );

  const cached = memoCache.get(key);
  if (cached) return cached;

  const profile = normalizeProfile(rawProfile);
  const evalMap = evaluateAllSchemes(schemes, profile);
  const ranked = rankSchemes(schemes, evalMap, profile, documents);
  const optimalBundle = solveOptimalBenefitBundle(ranked, false);

  const positiveSchemes = ranked
    .filter((r) => r.eligibility.status === 'eligible' || r.eligibility.status === 'likely')
    .slice(0, 12)
    .map((r) => r.scheme);

  const checklist = buildMergedDocumentChecklist(
    positiveSchemes,
    documents,
    profile.held_documents,
    locale,
    profile.doc_expiries
  );

  const t1 = typeof performance !== 'undefined' ? performance.now() : Date.now();

  const view: OrchestratedCitizenView = {
    profile,
    ranked,
    eligibleCount: ranked.filter((r) => r.eligibility.status === 'eligible').length,
    likelyCount: ranked.filter((r) => r.eligibility.status === 'likely').length,
    notEligibleCount: ranked.filter((r) => r.eligibility.status === 'not_eligible').length,
    optimalBundle,
    checklist,
    computeMs: Number((t1 - t0).toFixed(2)),
  };

  if (memoCache.size > 40) {
    const first = memoCache.keys().next().value;
    if (first) memoCache.delete(first);
  }
  memoCache.set(key, view);
  return view;
}

