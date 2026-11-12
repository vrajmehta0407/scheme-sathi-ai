import { describe, expect, it } from 'vitest';
import {
  buildCitizenPassGrid,
  composePlainTextSummary,
  computeUnlockRoadmap,
  expandSmartQuery,
  exportSchemesCsv,
  generateCitizenLetter,
  getDeadlineUrgency,
} from '../../lib/citizen/tools';
import {
  computeLifetimeProjection,
  detectWelfareCliffsForIncome,
  estimateEducationNetCost,
  estimateFarmerSupport,
  estimateLoanSubsidy,
  estimateNonCashSavings,
  estimatePensionAdequacy,
} from '../../lib/calculators';
import {
  auditCatalogueCoverage,
  buildBlockerRoi,
  buildCategoryEquity,
  buildStateScorecards,
  inspectRuleComplexity,
} from '../../lib/analytics/extra';
import { runAdminRegressionSuite } from '../../lib/admin/extra';
import { getCatalogueFromDb } from '../../lib/db/catalogue';
import { evaluateAllSchemes, evaluateScheme } from '../../lib/rules';
import { computeAnalyticsOverview } from '../../lib/analytics';

describe('Extra Citizen Tools, Calculators & Admin/Analytics Modules', () => {
  const { schemes } = getCatalogueFromDb();

  it('expands Hinglish/Gujarati phonetic synonyms and computes deadline urgency', () => {
    const q = expandSmartQuery('kisan vidhwa');
    expect(q).toContain('farmer');
    expect(q).toContain('widow');

    expect(getDeadlineUrgency('Rolling').urgencyLevel).toBe('rolling');
    const in10d = new Date(Date.now() + 10 * 86_400_000).toISOString().slice(0, 10);
    expect(getDeadlineUrgency(in10d).urgencyLevel).toBe('urgent');
  });

  it('generates EN/HI/GU citizen letters, QR pass grid, SMS summary, and RFC-4180 CSV', () => {
    const rti = generateCitizenLetter({
      kind: 'rti',
      locale: 'en',
      citizenName: 'Ramesh Patel',
      state: 'Gujarat',
      schemeName: 'PM-KISAN',
      applicationRef: 'PMK-101',
    });
    expect(rti).toContain('Section 6(1)');
    expect(rti).toContain('PMK-101');

    const grid = buildCitizenPassGrid('test-seed-123');
    expect(grid.length).toBe(15);
    expect(grid[0][0]).toBe(true);

    const csv = exportSchemesCsv([{ scheme: schemes[0] }]);
    expect(csv).toContain('SAMPLE_VERIFY_BEFORE_USE');

    const sms = composePlainTextSummary({
      locale: 'hi',
      profile: { id: 'p1', label: 'Anita', held_documents: ['aadhaar'] },
      eligibleSchemes: [schemes[0]],
      missingDocs: ['income_certificate'],
    });
    expect(sms).toContain('Anita');
  });

  it('computes 5-year inflation projection, life-stage calculators, and welfare cliff alerts', () => {
    const profile = {
      id: 'calc-test',
      label: 'Test Farmer',
      state: 'Gujarat',
      occupation: 'farmer' as const,
      income: 160000,
      age: 45,
      land_hectares: 1.5,
      is_income_tax_payer: false,
      held_documents: ['aadhaar'],
    };
    const evaluations = evaluateAllSchemes(schemes, profile);

    const proj = computeLifetimeProjection({ schemes, evaluations, years: 5, inflationPct: 5 });
    expect(proj.rows.length).toBe(5);
    expect(proj.totalRealRs).toBeLessThanOrEqual(proj.totalNominalRs);

    const edu = estimateEducationNetCost({
      annualTuitionRs: 40000,
      hostelBooksRs: 10000,
      matchedEducationAnnualRs: 25000,
    });
    expect(edu.netOutOfPocketRs).toBe(25000);
    expect(edu.coveredPct).toBe(50);

    const farm = estimateFarmerSupport({ landHectares: 1.5 });
    expect(farm.pmKisanRs).toBe(6000);
    expect(farm.totalAnnualSupportRs).toBeGreaterThan(6000);

    const pen = estimatePensionAdequacy({ monthlyExpensesRs: 5000, eligibleMonthlyPensionRs: 2000 });
    expect(pen.adequacyPct).toBe(40);

    const loan = estimateLoanSubsidy({
      loanAmountRs: 100000,
      tenureMonths: 24,
      standardRatePct: 12,
      subsidizedRatePct: 5,
    });
    expect(loan.subsidizedEmiRs).toBeLessThan(loan.standardEmiRs);

    const nonCash = estimateNonCashSavings({ schemes, evaluations, familySize: 4 });
    expect(nonCash.totalAnnualInKindRs).toBeGreaterThanOrEqual(0);

    const cliffs = detectWelfareCliffsForIncome(profile, schemes, (s, p) =>
      evaluateScheme(s.ruleTree!, p)
    );
    expect(Array.isArray(cliffs)).toBe(true);

    const roadmap = computeUnlockRoadmap(schemes, evaluations);
    expect(Array.isArray(roadmap)).toBe(true);
  });

  it('builds analytics scorecards, catalogue audit, and admin regression suite', () => {
    const ov = computeAnalyticsOverview({});
    const scorecards = buildStateScorecards(ov);
    expect(scorecards.length).toBe(ov.byState.length);

    const blockerRoi = buildBlockerRoi(ov);
    expect(blockerRoi.length).toBe(ov.blockers.length);

    const catEq = buildCategoryEquity(ov);
    expect(catEq.length).toBe(ov.byCategory.length);

    const audit = auditCatalogueCoverage(schemes);
    expect(audit.totalSchemes).toBe(schemes.length);
    expect(audit.govInUrlCount).toBeGreaterThan(0);

    const complexity = inspectRuleComplexity(schemes[0]);
    expect(complexity.leafCount).toBeGreaterThan(0);

    const reg = runAdminRegressionSuite(schemes);
    expect(reg.total).toBeGreaterThan(10);
    expect(reg.passed).toBe(reg.total);
  });
});

