import type { CitizenProfile, EligibilityResult, SchemeRecord } from '../types';

/**
 * Extra Feature #26 & #33: Multi-Year Lifetime Benefit Projection with optional CPI Inflation Adjustment
 */
export interface ProjectionYearRow {
  year: number;
  nominalRs: number;
  realRs: number;
  cumulativeNominalRs: number;
  cumulativeRealRs: number;
}

export function computeLifetimeProjection(params: {
  schemes: SchemeRecord[];
  evaluations: Map<string, EligibilityResult>;
  years?: number;
  inflationPct?: number;
}): { rows: ProjectionYearRow[]; totalNominalRs: number; totalRealRs: number } {
  const years = Math.min(15, Math.max(1, params.years ?? 5));
  const inf = Math.max(0, Math.min(15, params.inflationPct ?? 5)) / 100;

  let recurringAnnual = 0;
  let oneTimeYear1 = 0;

  for (const s of params.schemes) {
    const ev = params.evaluations.get(s.id);
    if (!ev || ev.status !== 'eligible') continue;
    if (s.benefitPeriod === 'one_time') oneTimeYear1 += s.benefitAmount;
    else if (s.benefitPeriod === 'monthly') recurringAnnual += s.benefitAmount * 12;
    else recurringAnnual += s.benefitAmount;
  }

  const rows: ProjectionYearRow[] = [];
  let cumNom = 0;
  let cumReal = 0;

  for (let y = 1; y <= years; y++) {
    const nominalRs = Math.round(recurringAnnual + (y === 1 ? oneTimeYear1 : 0));
    const discountFactor = Math.pow(1 + inf, y - 1);
    const realRs = Math.round(nominalRs / discountFactor);
    cumNom += nominalRs;
    cumReal += realRs;
    rows.push({
      year: y,
      nominalRs,
      realRs,
      cumulativeNominalRs: cumNom,
      cumulativeRealRs: cumReal,
    });
  }

  return { rows, totalNominalRs: cumNom, totalRealRs: cumReal };
}

/**
 * Extra Feature #27: Education Scholarship & Fee-Waiver Net Cost Estimator
 */
export function estimateEducationNetCost(params: {
  annualTuitionRs: number;
  hostelBooksRs: number;
  matchedEducationAnnualRs: number;
}): { grossCostRs: number; scholarshipOffsetRs: number; netOutOfPocketRs: number; coveredPct: number } {
  const grossCostRs = Math.max(0, Math.round(params.annualTuitionRs + params.hostelBooksRs));
  const scholarshipOffsetRs = Math.min(grossCostRs, Math.max(0, Math.round(params.matchedEducationAnnualRs)));
  const netOutOfPocketRs = Math.max(0, grossCostRs - scholarshipOffsetRs);
  const coveredPct = grossCostRs > 0 ? Number(((scholarshipOffsetRs / grossCostRs) * 100).toFixed(1)) : 0;
  return { grossCostRs, scholarshipOffsetRs, netOutOfPocketRs, coveredPct };
}

/**
 * Extra Feature #28: Farmer Input & Crop-Support Estimator
 */
export function estimateFarmerSupport(params: {
  landHectares: number;
  pmKisanAnnualRs?: number;
  stateInputPerHaRs?: number;
  cropInsuranceSubsidyPct?: number;
}): {
  pmKisanRs: number;
  inputSupportRs: number;
  insuranceSavedRs: number;
  totalAnnualSupportRs: number;
} {
  const ha = Math.max(0, params.landHectares);
  const pmKisanRs = ha > 0 && ha <= 5 ? (params.pmKisanAnnualRs ?? 6000) : 0;
  const cappedHa = Math.min(ha, 2); // typical small-farmer cap
  const inputSupportRs = Math.round(cappedHa * (params.stateInputPerHaRs ?? 4000));
  const basePremium = Math.round(ha * 1800);
  const insuranceSavedRs = Math.round(basePremium * ((params.cropInsuranceSubsidyPct ?? 65) / 100));
  return {
    pmKisanRs,
    inputSupportRs,
    insuranceSavedRs,
    totalAnnualSupportRs: pmKisanRs + inputSupportRs + insuranceSavedRs,
  };
}

/**
 * Extra Feature #29: Senior & Widow Monthly Pension Adequacy Calculator
 */
export function estimatePensionAdequacy(params: {
  monthlyExpensesRs: number;
  eligibleMonthlyPensionRs: number;
}): { monthlyExpensesRs: number; monthlyPensionRs: number; monthlyGapRs: number; adequacyPct: number } {
  const exp = Math.max(1, Math.round(params.monthlyExpensesRs));
  const pen = Math.max(0, Math.round(params.eligibleMonthlyPensionRs));
  return {
    monthlyExpensesRs: exp,
    monthlyPensionRs: pen,
    monthlyGapRs: Math.max(0, exp - pen),
    adequacyPct: Number(Math.min(100, (pen / exp) * 100).toFixed(1)),
  };
}

/**
 * Extra Feature #30: Micro-Enterprise Loan & Interest Subsidy (MUDRA / Vishwakarma / PMEGP)
 */
export function estimateLoanSubsidy(params: {
  loanAmountRs: number;
  tenureMonths: number;
  standardRatePct: number;
  subsidizedRatePct: number;
  marginGrantPct?: number;
}): {
  marginGrantRs: number;
  netLoanRs: number;
  standardEmiRs: number;
  subsidizedEmiRs: number;
  monthlyEmiSavedRs: number;
  totalInterestSavedRs: number;
} {
  const principal = Math.max(1000, params.loanAmountRs);
  const n = Math.max(6, Math.round(params.tenureMonths));
  const marginGrantRs = Math.round(principal * ((params.marginGrantPct ?? 15) / 100));
  const netLoanRs = Math.max(0, principal - marginGrantRs);

  const calcEmi = (p: number, annualPct: number) => {
    const r = annualPct / 12 / 100;
    if (r <= 0) return p / n;
    const f = Math.pow(1 + r, n);
    return (p * r * f) / (f - 1);
  };

  const stdEmi = calcEmi(principal, params.standardRatePct);
  const subEmi = calcEmi(netLoanRs, params.subsidizedRatePct);
  const stdTotal = stdEmi * n;
  const subTotal = subEmi * n;

  return {
    marginGrantRs,
    netLoanRs,
    standardEmiRs: Math.round(stdEmi),
    subsidizedEmiRs: Math.round(subEmi),
    monthlyEmiSavedRs: Math.max(0, Math.round(stdEmi - subEmi)),
    totalInterestSavedRs: Math.max(0, Math.round(stdTotal - subTotal - marginGrantRs)),
  };
}

/**
 * Extra Feature #31: Non-Cash Benefit Equivalent Value Breakdown
 */
export function estimateNonCashSavings(params: {
  schemes: SchemeRecord[];
  evaluations: Map<string, EligibilityResult>;
  familySize?: number;
}): {
  healthCoverRs: number;
  rationEquivalentRs: number;
  lpgSupportRs: number;
  insuranceCoverRs: number;
  totalAnnualInKindRs: number;
} {
  const members = Math.max(1, params.familySize ?? 4);
  let healthCoverRs = 0;
  let rationEquivalentRs = 0;
  let lpgSupportRs = 0;
  let insuranceCoverRs = 0;

  for (const s of params.schemes) {
    const ev = params.evaluations.get(s.id);
    if (!ev || ev.status !== 'eligible') continue;
    const id = s.id.toLowerCase();
    if (id.includes('pmjay') || id.includes('health')) {
      healthCoverRs = Math.max(healthCoverRs, s.benefitAmount);
    } else if (id.includes('nfsa') || id.includes('ration') || id.includes('annapurna')) {
      rationEquivalentRs += Math.min(18000, members * 2800);
    } else if (id.includes('ujjwala')) {
      lpgSupportRs += 3600;
    } else if (s.benefitType === 'insurance') {
      insuranceCoverRs += s.benefitAmount;
    }
  }

  return {
    healthCoverRs,
    rationEquivalentRs,
    lpgSupportRs,
    insuranceCoverRs,
    totalAnnualInKindRs: rationEquivalentRs + lpgSupportRs,
  };
}

/**
 * Extra Feature #32: Income-Tax vs Welfare-Cap Cliff Alert
 */
export interface WelfareCliffAlert {
  thresholdRs: number;
  schemesLostCount: number;
  annualBenefitLostRs: number;
  message: string;
}

export function detectWelfareCliffsForIncome(
  profile: Partial<CitizenProfile>,
  schemes: SchemeRecord[],
  evaluateFn: (s: SchemeRecord, p: Partial<CitizenProfile>) => EligibilityResult
): WelfareCliffAlert[] {
  const currentIncome = profile.income ?? 150000;
  const thresholds = [120000, 150000, 250000, 300000, 500000, 800000].filter(
    (t) => t >= currentIncome
  );
  const baseEligible = new Set<string>();
  const baseValue = new Map<string, number>();

  for (const s of schemes) {
    const ev = evaluateFn(s, { ...profile, income: currentIncome, income_band: undefined });
    if (ev.status === 'eligible') {
      baseEligible.add(s.id);
      baseValue.set(s.id, s.benefitPeriod === 'monthly' ? s.benefitAmount * 12 : s.benefitAmount);
    }
  }

  const alerts: WelfareCliffAlert[] = [];
  for (const t of thresholds) {
    const testIncome = t + 1;
    let lostCount = 0;
    let lostRs = 0;
    for (const s of schemes) {
      if (!baseEligible.has(s.id)) continue;
      const evAfter = evaluateFn(s, {
        ...profile,
        income: testIncome,
        income_band: undefined,
        is_income_tax_payer: testIncome > 700000 ? true : profile.is_income_tax_payer,
      });
      if (evAfter.status !== 'eligible') {
        lostCount++;
        lostRs += baseValue.get(s.id) ?? 0;
      }
    }
    if (lostCount > 0) {
      alerts.push({
        thresholdRs: t,
        schemesLostCount: lostCount,
        annualBenefitLostRs: lostRs,
        message: `Crossing Rs. ${t.toLocaleString('en-IN')}/yr causes ${lostCount} scheme(s) to drop (~Rs. ${lostRs.toLocaleString('en-IN')}/yr).`,
      });
    }
  }
  return alerts;
}

