import type { CitizenProfile, SchemeRecord } from '../types';
import { checkRuleSatisfiability, evaluateScheme } from '../rules';

export interface ValidationIssue {
  schemeId: string;
  schemeName: string;
  severity: 'error' | 'warning';
  code: string;
  message: string;
}

export interface QualityReport {
  passed: boolean;
  checkedSchemes: number;
  errorCount: number;
  warningCount: number;
  issues: ValidationIssue[];
  goldenResults: Array<{ name: string; passed: boolean; details: string }>;
}

function tokenJaccard(a: string, b: string): number {
  const setA = new Set(a.toLowerCase().split(/\W+/).filter((t) => t.length > 2));
  const setB = new Set(b.toLowerCase().split(/\W+/).filter((t) => t.length > 2));
  if (setA.size === 0 || setB.size === 0) return 0;
  let inter = 0;
  for (const t of setA) if (setB.has(t)) inter++;
  return inter / (setA.size + setB.size - inter);
}

const GOLDEN_PROFILES: Array<{
  name: string;
  profile: Partial<CitizenProfile>;
  expectEligible: string[];
  expectNotEligible: string[];
}> = [
  {
    name: 'Gujarat Small Farmer (Ramesh, 45)',
    profile: {
      state: 'Gujarat',
      district_type: 'rural',
      age: 45,
      gender: 'male',
      occupation: 'farmer',
      land_hectares: 1.4,
      income: 160000,
      is_income_tax_payer: false,
      is_bpl: false,
      owns_pucca_house: false,
    },
    expectEligible: ['pm-kisan-samman', 'pm-fasal-bima', 'gujarat-khedut-tractor'],
    expectNotEligible: ['gujarat-namo-laxmi-girls', 'ignoaps-old-age-pension'],
  },
  {
    name: 'Gujarat OBC Female College Student (Anita, 19)',
    profile: {
      state: 'Gujarat',
      age: 19,
      gender: 'female',
      occupation: 'student',
      category: 'OBC',
      education: 'higher_secondary',
      income: 180000,
    },
    expectEligible: ['nsp-post-matric-sc-obc', 'gujarat-mysy-scholarship', 'aicte-pragati-girls'],
    expectNotEligible: ['pm-kisan-samman', 'pm-vaya-vandana-70-health'],
  },
  {
    name: 'Senior Citizen 72 BPL (Mr. Shah)',
    profile: {
      state: 'Gujarat',
      age: 72,
      gender: 'male',
      occupation: 'retired',
      income: 95000,
      is_bpl: true,
    },
    expectEligible: ['ignoaps-old-age-pension', 'pm-vaya-vandana-70-health', 'gujarat-vaya-vandana-senior'],
    expectNotEligible: ['atal-pension-yojana', 'pm-kisan-maandhan'],
  },
];

/**
 * Agent 11: Admin Quality Agent
 */
export function runAdminQualityCheck(
  schemes: SchemeRecord[],
  refDate = new Date()
): QualityReport {
  const issues: ValidationIssue[] = [];

  for (let i = 0; i < schemes.length; i++) {
    const s = schemes[i];

    if (!s.ruleTree) {
      issues.push({
        schemeId: s.id,
        schemeName: s.nameEn,
        severity: 'error',
        code: 'MISSING_RULES',
        message: 'Scheme has no eligibility rule tree.',
      });
    } else {
      const sat = checkRuleSatisfiability(s.ruleTree);
      if (!sat.satisfiable) {
        issues.push({
          schemeId: s.id,
          schemeName: s.nameEn,
          severity: 'error',
          code: 'UNSATISFIABLE_RULE',
          message: sat.issues.join('; '),
        });
      }
    }

    if (!s.documents || s.documents.length === 0) {
      issues.push({
        schemeId: s.id,
        schemeName: s.nameEn,
        severity: 'error',
        code: 'MISSING_DOCS',
        message: 'Scheme must list at least one required document.',
      });
    }

    if (!s.steps?.en?.length) {
      issues.push({
        schemeId: s.id,
        schemeName: s.nameEn,
        severity: 'error',
        code: 'MISSING_STEPS',
        message: 'Scheme must include application steps.',
      });
    }

    if (!s.officialUrl || !s.officialUrl.startsWith('https://')) {
      issues.push({
        schemeId: s.id,
        schemeName: s.nameEn,
        severity: 'error',
        code: 'MISSING_URL',
        message: 'Official HTTPS portal URL is required.',
      });
    }

    const daysOld = Math.floor(
      (refDate.getTime() - new Date(s.lastVerified).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (Number.isNaN(daysOld) || daysOld > 180) {
      issues.push({
        schemeId: s.id,
        schemeName: s.nameEn,
        severity: 'warning',
        code: 'STALE_VERIFICATION',
        message: `last_verified (${s.lastVerified}) is older than 180 days.`,
      });
    }

    if (!s.nameHi || !s.nameGu || !s.summaryHi || !s.summaryGu) {
      issues.push({
        schemeId: s.id,
        schemeName: s.nameEn,
        severity: 'error',
        code: 'MISSING_TRANSLATION',
        message: 'Hindi and Gujarati name & summary translations are required.',
      });
    }

    // Duplicate detection (fuzzy name match)
    for (let j = i + 1; j < schemes.length; j++) {
      const sim = tokenJaccard(s.nameEn, schemes[j].nameEn);
      if (sim >= 0.78) {
        issues.push({
          schemeId: s.id,
          schemeName: s.nameEn,
          severity: 'warning',
          code: 'FUZZY_DUPLICATE',
          message: `High name similarity (${Math.round(sim * 100)}%) with '${schemes[j].nameEn}'.`,
        });
      }
    }
  }

  // Golden profile regression checks
  const schemeMap = new Map(schemes.map((s) => [s.id, s]));
  const goldenResults = GOLDEN_PROFILES.map((gp) => {
    const failures: string[] = [];
    for (const id of gp.expectEligible) {
      const s = schemeMap.get(id);
      if (s?.ruleTree) {
        const res = evaluateScheme(s.ruleTree, gp.profile);
        if (res.status !== 'eligible') {
          failures.push(`Expected ${id} eligible, got ${res.status}`);
        }
      }
    }
    for (const id of gp.expectNotEligible) {
      const s = schemeMap.get(id);
      if (s?.ruleTree) {
        const res = evaluateScheme(s.ruleTree, gp.profile);
        if (res.status !== 'not_eligible') {
          failures.push(`Expected ${id} not_eligible, got ${res.status}`);
        }
      }
    }
    return {
      name: gp.name,
      passed: failures.length === 0,
      details: failures.length === 0 ? 'All assertions passed' : failures.join('; '),
    };
  });

  const errorCount = issues.filter((i) => i.severity === 'error').length;
  const warningCount = issues.filter((i) => i.severity === 'warning').length;
  const goldenFailed = goldenResults.some((g) => !g.passed);

  return {
    passed: errorCount === 0 && !goldenFailed,
    checkedSchemes: schemes.length,
    errorCount,
    warningCount,
    issues,
    goldenResults,
  };
}

