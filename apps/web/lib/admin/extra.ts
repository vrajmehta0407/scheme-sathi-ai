import type { CitizenProfile, EligibilityStatus, SchemeRecord } from '../types';
import { evaluateScheme } from '../rules';

/**
 * Extra Feature #54: Expanded 9-Archetype Regression Suite Runner for Admin Console
 */
export interface AdminRegressionRow {
  archetype: string;
  schemeId: string;
  expected: EligibilityStatus;
  actual: EligibilityStatus | 'missing';
  passed: boolean;
}

const ARCHETYPE_CHECKS: Array<{
  archetype: string;
  profile: Partial<CitizenProfile>;
  expectations: Array<[string, EligibilityStatus]>;
}> = [
  {
    archetype: 'Gujarat Small Farmer (45, 1.4 ha, Rs. 1.6L)',
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
    expectations: [
      ['pm-kisan-samman', 'eligible'],
      ['pm-fasal-bima', 'eligible'],
      ['gujarat-khedut-tractor', 'eligible'],
      ['aicte-pragati-girls', 'not_eligible'],
    ],
  },
  {
    archetype: 'OBC Female College Student (19, Gujarat, Rs. 1.8L)',
    profile: {
      state: 'Gujarat',
      age: 19,
      gender: 'female',
      occupation: 'student',
      category: 'OBC',
      education: 'higher_secondary',
      income: 180000,
    },
    expectations: [
      ['nsp-post-matric-sc-obc', 'eligible'],
      ['gujarat-mysy-scholarship', 'eligible'],
      ['aicte-pragati-girls', 'eligible'],
      ['pm-kisan-samman', 'not_eligible'],
    ],
  },
  {
    archetype: 'Senior Citizen 72 BPL (Gujarat, Rs. 95k)',
    profile: {
      state: 'Gujarat',
      age: 72,
      gender: 'male',
      occupation: 'retired',
      income: 95000,
      is_bpl: true,
    },
    expectations: [
      ['ignoaps-old-age-pension', 'eligible'],
      ['pm-vaya-vandana-70-health', 'eligible'],
      ['atal-pension-yojana', 'not_eligible'],
    ],
  },
  {
    archetype: 'Gujarat Rural Widow Worker (42, BPL)',
    profile: {
      state: 'Gujarat',
      district_type: 'rural',
      age: 42,
      gender: 'female',
      occupation: 'worker',
      is_widow: true,
      is_bpl: true,
      is_income_tax_payer: false,
      income: 84000,
      owns_pucca_house: false,
    },
    expectations: [
      ['indira-gandhi-widow-pension', 'eligible'],
      ['gujarat-ganga-swarupa', 'eligible'],
      ['eshram-accident-cover', 'eligible'],
      ['pm-kisan-samman', 'not_eligible'],
    ],
  },
  {
    archetype: 'Salaried Urban Taxpayer (34, Rs. 11L, Pucca House)',
    profile: {
      state: 'Maharashtra',
      district_type: 'urban',
      age: 34,
      gender: 'male',
      occupation: 'salaried',
      category: 'General',
      income: 1100000,
      is_income_tax_payer: true,
      is_bpl: false,
      owns_pucca_house: true,
      disability: false,
    },
    expectations: [
      ['atal-pension-yojana', 'not_eligible'],
      ['ayushman-bharat-pmjay', 'not_eligible'],
    ],
  },
];

export function runAdminRegressionSuite(schemes: SchemeRecord[]): {
  total: number;
  passed: number;
  rows: AdminRegressionRow[];
} {
  const byId = new Map(schemes.map((s) => [s.id, s]));
  const rows: AdminRegressionRow[] = [];
  for (const arc of ARCHETYPE_CHECKS) {
    for (const [schemeId, expected] of arc.expectations) {
      const s = byId.get(schemeId);
      if (!s || !s.ruleTree) {
        rows.push({
          archetype: arc.archetype,
          schemeId,
          expected,
          actual: 'missing',
          passed: false,
        });
        continue;
      }
      const actual = evaluateScheme(s.ruleTree, arc.profile).status;
      rows.push({
        archetype: arc.archetype,
        schemeId,
        expected,
        actual,
        passed: actual === expected,
      });
    }
  }
  return {
    total: rows.length,
    passed: rows.filter((r) => r.passed).length,
    rows,
  };
}
