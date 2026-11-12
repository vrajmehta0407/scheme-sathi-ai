import { describe, expect, it } from 'vitest';
import { loadBundleDataFromDisk } from '@/lib/db/catalogue';
import {
  checkRuleSatisfiability,
  evaluateAllSchemes,
  evaluateScheme,
  simulateWhatIf,
} from '@/lib/rules';
import { normalizeProfile } from '@/lib/profile';
import type { CitizenProfile, SchemeRuleTree } from '@/lib/types';

const { schemes } = loadBundleDataFromDisk();
const schemeMap = new Map(schemes.map((s) => [s.id, s]));

describe('Rules Engine: 160+ Golden Cases, Edge Boundaries & Property Tests', () => {
  it('evaluates all 54 sample schemes under 5ms on average', () => {
    const profile: Partial<CitizenProfile> = {
      state: 'Gujarat',
      district_type: 'rural',
      age: 45,
      gender: 'male',
      income: 160000,
      occupation: 'farmer',
      land_hectares: 1.5,
      is_income_tax_payer: false,
      is_bpl: true,
      owns_pucca_house: false,
    };
    // Warm up JIT
    evaluateAllSchemes(schemes, profile);
    const t0 = performance.now();
    const iters = 20;
    for (let i = 0; i < iters; i++) {
      evaluateAllSchemes(schemes, profile);
    }
    const avgMs = (performance.now() - t0) / iters;
    expect(avgMs).toBeLessThan(5);
  });

  it('never treats unknown/skipped fields as Eligible (always Likely)', () => {
    const emptyProfile: Partial<CitizenProfile> = { held_documents: [] };
    const map = evaluateAllSchemes(schemes, emptyProfile);
    for (const res of map.values()) {
      expect(res.status).not.toBe('eligible');
      expect(res.disclaimer.toLowerCase()).toContain('official portal');
    }
  });

  it('handles income band straddling conservatively as Likely', () => {
    // PM-KISAN cap is 600000; band 5l_to_8l spans 500001..800000 => straddles => likely
    const farmer = schemeMap.get('pm-kisan-samman')!;
    const res = evaluateScheme(farmer.ruleTree!, {
      occupation: 'farmer',
      land_hectares: 1.2,
      income_band: '5l_to_8l',
      is_income_tax_payer: false,
    });
    expect(res.status).toBe('likely');
  });

  it('handles exact boundary values (income at cap vs 1 over, age at min/max)', () => {
    const pmjay = schemeMap.get('ayushman-bharat-pmjay')!;
    const atCap = evaluateScheme(pmjay.ruleTree!, {
      income: 250000,
      is_bpl: true,
    });
    expect(atCap.status).toBe('eligible');

    const overByOne = evaluateScheme(pmjay.ruleTree!, {
      income: 250001,
      is_bpl: true,
    });
    expect(overByOne.status).toBe('not_eligible');
    expect(overByOne.near_miss?.field).toBe('income');
    expect(overByOne.near_miss?.distance).toBe(1);

    const vaya70 = schemeMap.get('pm-vaya-vandana-70-health')!;
    expect(evaluateScheme(vaya70.ruleTree!, { age: 69 }).status).toBe('not_eligible');
    expect(evaluateScheme(vaya70.ruleTree!, { age: 70 }).status).toBe('eligible');
  });

  it('computes near-miss distance when exactly one criterion fails', () => {
    const mysy = schemeMap.get('gujarat-mysy-scholarship')!;
    const res = evaluateScheme(mysy.ruleTree!, {
      state: 'Gujarat',
      occupation: 'student',
      education: 'higher_secondary',
      age: 19,
      income: 620000, // 20,000 over 600,000 cap
    });
    expect(res.status).toBe('not_eligible');
    expect(res.near_miss?.field).toBe('income');
    expect(res.near_miss?.distance).toBe(20000);
  });

  it('runs 162 golden profile-to-scheme assertions across 9 diverse citizen archetypes', () => {
    const goldenMatrix: Array<{
      label: string;
      profile: Partial<CitizenProfile>;
      expectations: Array<[string, 'eligible' | 'likely' | 'not_eligible']>;
    }> = [
      {
        label: '1. Gujarat Small Farmer',
        profile: {
          state: 'Gujarat',
          district_type: 'rural',
          age: 38,
          gender: 'male',
          occupation: 'farmer',
          land_hectares: 1.5,
          income: 150000,
          category: 'OBC',
          education: 'secondary',
          is_bpl: true,
          is_income_tax_payer: false,
          owns_pucca_house: false,
        },
        expectations: [
          ['pm-kisan-samman', 'eligible'],
          ['pm-fasal-bima', 'eligible'],
          ['kisan-credit-card', 'eligible'],
          ['pm-kisan-maandhan', 'eligible'],
          ['gujarat-khedut-tractor', 'eligible'],
          ['gujarat-drip-irrigation', 'eligible'],
          ['gujarat-kisan-sahay-crop', 'eligible'],
          ['animal-husbandry-kcc', 'eligible'],
          ['ayushman-bharat-pmjay', 'eligible'],
          ['gujarat-pmjay-ma', 'eligible'],
          ['pmay-gramin-housing', 'eligible'],
          ['mgnrega-wage-employment', 'eligible'],
          ['nsp-post-matric-sc-obc', 'not_eligible'],
          ['sukanya-samriddhi', 'not_eligible'],
          ['ignoaps-old-age-pension', 'not_eligible'],
          ['pm-vaya-vandana-70-health', 'not_eligible'],
          ['aicte-pragati-girls', 'not_eligible'],
          ['pmay-urban-housing', 'not_eligible'],
        ],
      },
      {
        label: '2. Gujarat Female OBC College Student',
        profile: {
          state: 'Gujarat',
          district_type: 'urban',
          age: 19,
          gender: 'female',
          occupation: 'student',
          category: 'OBC',
          education: 'higher_secondary',
          income: 180000,
          land_hectares: 0,
          is_bpl: false,
          is_income_tax_payer: false,
          owns_pucca_house: true,
        },
        expectations: [
          ['nsp-post-matric-sc-obc', 'eligible'],
          ['pm-yasasvi-scholarship', 'eligible'],
          ['aicte-pragati-girls', 'eligible'],
          ['gujarat-mysy-scholarship', 'eligible'],
          ['gujarat-digital-scholarship', 'eligible'],
          ['gujarat-namo-laxmi-girls', 'eligible'],
          ['pm-kaushal-vikas', 'eligible'],
          ['pm-daksh-skill-stipend', 'eligible'],
          ['pm-suraksha-bima', 'eligible'],
          ['pm-jeevan-jyoti-bima', 'eligible'],
          ['pm-surya-ghar-solar', 'eligible'],
          ['pm-kisan-samman', 'not_eligible'],
          ['ignoaps-old-age-pension', 'not_eligible'],
          ['mgnrega-wage-employment', 'not_eligible'],
          ['pm-shram-yogi-maandhan', 'not_eligible'],
          ['sukanya-samriddhi', 'not_eligible'],
          ['pmay-gramin-housing', 'not_eligible'],
          ['gujarat-khedut-tractor', 'not_eligible'],
        ],
      },
      {
        label: '3. Gujarat BPL Senior Citizen 72',
        profile: {
          state: 'Gujarat',
          district_type: 'rural',
          age: 72,
          gender: 'male',
          occupation: 'retired',
          category: 'General',
          income: 90000,
          land_hectares: 0,
          is_bpl: true,
          is_income_tax_payer: false,
          owns_pucca_house: false,
        },
        expectations: [
          ['ignoaps-old-age-pension', 'eligible'],
          ['rashtriya-vayoshri-yojana', 'eligible'],
          ['gujarat-vaya-vandana-senior', 'eligible'],
          ['senior-citizen-savings-bonus', 'eligible'],
          ['pm-vaya-vandana-70-health', 'eligible'],
          ['gujarat-pmjay-ma', 'eligible'],
          ['ayushman-bharat-pmjay', 'eligible'],
          ['pmay-gramin-housing', 'eligible'],
          ['swachh-bharat-toilet-grant', 'eligible'],
          ['atal-pension-yojana', 'not_eligible'],
          ['pm-kisan-samman', 'not_eligible'],
          ['pm-suraksha-bima', 'not_eligible'],
          ['pm-jeevan-jyoti-bima', 'not_eligible'],
          ['pm-kaushal-vikas', 'not_eligible'],
          ['gujarat-mysy-scholarship', 'not_eligible'],
          ['pm-matru-vandana', 'not_eligible'],
          ['pm-mudra-yojana', 'not_eligible'],
          ['pm-shram-yogi-maandhan', 'not_eligible'],
        ],
      },
      {
        label: '4. Gujarat Rural Widow Worker',
        profile: {
          state: 'Gujarat',
          district_type: 'rural',
          age: 44,
          gender: 'female',
          occupation: 'worker',
          category: 'SC',
          income: 120000,
          is_bpl: true,
          is_widow: true,
          is_income_tax_payer: false,
          owns_pucca_house: false,
          family_size: 4,
        },
        expectations: [
          ['indira-gandhi-widow-pension', 'eligible'],
          ['gujarat-ganga-swarupa', 'eligible'],
          ['lakhpati-didi-shg', 'eligible'],
          ['pm-ujjwala-yojana', 'eligible'],
          ['eshram-accident-cover', 'eligible'],
          ['mgnrega-wage-employment', 'eligible'],
          ['gujarat-shramik-annapurna', 'eligible'],
          ['pm-vishwakarma-artisan', 'eligible'],
          ['ayushman-bharat-pmjay', 'eligible'],
          ['gujarat-pmjay-ma', 'eligible'],
          ['gujarat-ambedkar-awas', 'eligible'],
          ['nfsa-antyodaya-food', 'eligible'],
          ['pm-kisan-samman', 'not_eligible'],
          ['pm-shram-yogi-maandhan', 'not_eligible'],
          ['ignoaps-old-age-pension', 'not_eligible'],
          ['sukanya-samriddhi', 'not_eligible'],
          ['pm-vaya-vandana-70-health', 'not_eligible'],
          ['gujarat-khedut-tractor', 'not_eligible'],
        ],
      },
      {
        label: '5. Maharashtra Urban Women Entrepreneur',
        profile: {
          state: 'Maharashtra',
          district_type: 'urban',
          age: 32,
          gender: 'female',
          occupation: 'entrepreneur',
          category: 'General',
          education: 'graduate',
          income: 280000,
          is_bpl: false,
          is_income_tax_payer: false,
          owns_pucca_house: false,
        },
        expectations: [
          ['pm-mudra-yojana', 'eligible'],
          ['pmegp-margin-subsidy', 'eligible'],
          ['stand-up-india-scst-women', 'eligible'],
          ['pm-svanidhi-street-vendor', 'eligible'],
          ['pm-vishwakarma-artisan', 'eligible'],
          ['pmay-urban-housing', 'eligible'],
          ['pm-suraksha-bima', 'eligible'],
          ['pm-jeevan-jyoti-bima', 'eligible'],
          ['pm-matru-vandana', 'eligible'],
          ['gujarat-vajpayee-bankable', 'not_eligible'],
          ['gujarat-pmjay-ma', 'not_eligible'],
          ['gujarat-vahli-dikri', 'not_eligible'],
          ['pm-kisan-samman', 'not_eligible'],
          ['mgnrega-wage-employment', 'not_eligible'],
          ['ignoaps-old-age-pension', 'not_eligible'],
          ['nsp-post-matric-sc-obc', 'not_eligible'],
          ['pmay-gramin-housing', 'not_eligible'],
          ['gujarat-shramik-annapurna', 'not_eligible'],
        ],
      },
      {
        label: '6. Girl Child Age 8 in Gujarat',
        profile: {
          state: 'Gujarat',
          district_type: 'semi_urban',
          age: 8,
          gender: 'female',
          occupation: 'student',
          category: 'EWS',
          income: 160000,
          is_bpl: false,
          is_income_tax_payer: false,
        },
        expectations: [
          ['sukanya-samriddhi', 'eligible'],
          ['gujarat-vahli-dikri', 'eligible'],
          ['gujarat-pmjay-ma', 'eligible'],
          ['ayushman-bharat-pmjay', 'eligible'],
          ['pm-suraksha-bima', 'not_eligible'],
          ['pm-jeevan-jyoti-bima', 'not_eligible'],
          ['pm-mudra-yojana', 'not_eligible'],
          ['nsp-post-matric-sc-obc', 'not_eligible'],
          ['gujarat-namo-laxmi-girls', 'not_eligible'],
          ['gujarat-mysy-scholarship', 'not_eligible'],
          ['pm-matru-vandana', 'not_eligible'],
          ['ignoaps-old-age-pension', 'not_eligible'],
          ['atal-pension-yojana', 'not_eligible'],
          ['pm-kisan-samman', 'not_eligible'],
          ['pm-kaushal-vikas', 'not_eligible'],
          ['mgnrega-wage-employment', 'not_eligible'],
          ['pm-vishwakarma-artisan', 'not_eligible'],
          ['pm-ujjwala-yojana', 'not_eligible'],
        ],
      },
      {
        label: '7. Divyang Artisan in Gujarat',
        profile: {
          state: 'Gujarat',
          district_type: 'semi_urban',
          age: 29,
          gender: 'male',
          occupation: 'artisan',
          category: 'OBC',
          disability: true,
          income: 130000,
          is_bpl: true,
          is_income_tax_payer: false,
          owns_pucca_house: false,
        },
        expectations: [
          ['niramaya-disability-health', 'eligible'],
          ['ignps-disability-pension', 'eligible'],
          ['pm-vishwakarma-artisan', 'eligible'],
          ['pm-shram-yogi-maandhan', 'eligible'],
          ['eshram-accident-cover', 'eligible'],
          ['gujarat-shramik-annapurna', 'eligible'],
          ['gujarat-manav-kalyan-toolkit', 'eligible'],
          ['pm-mudra-yojana', 'eligible'],
          ['atal-pension-yojana', 'eligible'],
          ['pm-daksh-skill-stipend', 'eligible'],
          ['ayushman-bharat-pmjay', 'eligible'],
          ['gujarat-pmjay-ma', 'eligible'],
          ['pm-suraksha-bima', 'eligible'],
          ['pm-jeevan-jyoti-bima', 'eligible'],
          ['pmay-urban-housing', 'eligible'],
          ['pm-kisan-samman', 'not_eligible'],
          ['aicte-pragati-girls', 'not_eligible'],
          ['pm-vaya-vandana-70-health', 'not_eligible'],
        ],
      },
      {
        label: '8. High-Income Salaried Taxpayer in Delhi',
        profile: {
          state: 'Delhi',
          district_type: 'urban',
          age: 38,
          gender: 'male',
          occupation: 'salaried',
          category: 'General',
          income: 1200000,
          land_hectares: 0,
          is_bpl: false,
          disability: false,
          is_income_tax_payer: true,
          owns_pucca_house: true,
        },
        expectations: [
          ['pm-surya-ghar-solar', 'eligible'],
          ['pm-suraksha-bima', 'eligible'],
          ['pm-jeevan-jyoti-bima', 'eligible'],
          ['pm-kisan-samman', 'not_eligible'],
          ['atal-pension-yojana', 'not_eligible'],
          ['ayushman-bharat-pmjay', 'not_eligible'],
          ['pmay-urban-housing', 'not_eligible'],
          ['pmay-gramin-housing', 'not_eligible'],
          ['ignoaps-old-age-pension', 'not_eligible'],
          ['pm-shram-yogi-maandhan', 'not_eligible'],
          ['nsp-post-matric-sc-obc', 'not_eligible'],
          ['gujarat-pmjay-ma', 'not_eligible'],
          ['mgnrega-wage-employment', 'not_eligible'],
          ['nfsa-antyodaya-food', 'not_eligible'],
          ['pm-ujjwala-yojana', 'not_eligible'],
          ['niramaya-disability-health', 'not_eligible'],
          ['stand-up-india-scst-women', 'not_eligible'],
          ['pm-vaya-vandana-70-health', 'not_eligible'],
        ],
      },
      {
        label: '9. Partial/Skipped Rural Youth Profile',
        profile: {
          state: 'Gujarat',
          occupation: 'unemployed',
          age: 22,
          // income, category, education skipped
        },
        expectations: [
          ['pm-kaushal-vikas', 'eligible'],
          ['pm-mudra-yojana', 'eligible'],
          ['pm-suraksha-bima', 'eligible'],
          ['pm-jeevan-jyoti-bima', 'eligible'],
          ['atal-pension-yojana', 'likely'],
          ['pmegp-margin-subsidy', 'likely'],
          ['gujarat-vajpayee-bankable', 'likely'],
          ['gujarat-manav-kalyan-toolkit', 'likely'],
          ['pm-daksh-skill-stipend', 'likely'],
          ['mgnrega-wage-employment', 'likely'],
          ['pm-kisan-samman', 'not_eligible'],
          ['ignoaps-old-age-pension', 'not_eligible'],
          ['pm-vaya-vandana-70-health', 'not_eligible'],
          ['nsp-post-matric-sc-obc', 'not_eligible'],
          ['gujarat-mysy-scholarship', 'not_eligible'],
          ['pm-shram-yogi-maandhan', 'not_eligible'],
          ['gujarat-khedut-tractor', 'not_eligible'],
          ['animal-husbandry-kcc', 'not_eligible'],
        ],
      },
    ];

    let totalAssertions = 0;
    for (const row of goldenMatrix) {
      for (const [schemeId, expectedStatus] of row.expectations) {
        const s = schemeMap.get(schemeId);
        expect(s, `Missing scheme ${schemeId}`).toBeDefined();
        const actual = evaluateScheme(s!.ruleTree!, row.profile).status;
        expect(actual, `${row.label} -> ${schemeId}`).toBe(expectedStatus);
        totalAssertions++;
      }
    }
    expect(totalAssertions).toBe(162);
  });

  it('property test: adding a failing criterion to any rule tree never turns Not eligible into Eligible', () => {
    const sampleProfile = normalizeProfile({
      state: 'Maharashtra',
      age: 50,
      income: 900000,
      occupation: 'salaried',
      is_income_tax_payer: true,
    });

    for (const s of schemes) {
      if (!s.ruleTree) continue;
      const before = evaluateScheme(s.ruleTree, sampleProfile);
      if (before.status !== 'not_eligible') continue;

      const augmented: SchemeRuleTree = {
        scheme_id: s.id,
        all: [s.ruleTree, { field: 'age', op: 'lt', value: 1 }],
      };
      const after = evaluateScheme(augmented, sampleProfile);
      expect(after.status).not.toBe('eligible');
      expect(after.status).toBe('not_eligible');
    }
  });

  it('verifies every scheme rule tree is logically satisfiable', () => {
    for (const s of schemes) {
      expect(s.ruleTree).toBeDefined();
      const sat = checkRuleSatisfiability(s.ruleTree!);
      expect(sat.satisfiable, `${s.id}: ${sat.issues.join(', ')}`).toBe(true);
    }
  });

  it('What-If simulator detects gained schemes when income decreases', () => {
    const diff = simulateWhatIf(
      schemes,
      { state: 'Gujarat', occupation: 'student', age: 19, category: 'OBC', education: 'higher_secondary', income: 700000 },
      { income: 180000 }
    );
    expect(diff.gained.some((g) => g.scheme.id === 'gujarat-mysy-scholarship')).toBe(true);
  });
});
