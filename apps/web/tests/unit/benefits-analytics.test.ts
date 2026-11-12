import { describe, expect, it } from 'vitest';
import { loadBundleDataFromDisk } from '@/lib/db/catalogue';
import {
  calculateBundleTotals,
  calculateHouseholdMatrix,
  calculateSchemeBenefit,
} from '@/lib/benefits';
import { buildMergedDocumentChecklist } from '@/lib/documents';
import { transitionApplication } from '@/lib/tracker';
import { computeAnalyticsOverview } from '@/lib/analytics';

const { schemes, documents } = loadBundleDataFromDisk();
const schemeMap = new Map(schemes.map((s) => [s.id, s]));

describe('Benefit Calculator, Document Agent, Tracker & Analytics Reconciliation', () => {
  it('computes all 5 benefit formula types deterministically', () => {
    const fixedYr = calculateSchemeBenefit(schemeMap.get('pm-kisan-samman')!, {});
    expect(fixedYr.annualEstimate).toBe(6000);
    expect(fixedYr.isEstimate).toBe(true);

    const fixedMo = calculateSchemeBenefit(schemeMap.get('atal-pension-yojana')!, {});
    expect(fixedMo.annualEstimate).toBe(60000);

    const oneTime = calculateSchemeBenefit(schemeMap.get('pmay-urban-housing')!, {});
    expect(oneTime.annualEstimate).toBe(250000);
    expect(oneTime.lifetimeEstimate).toBe(250000);

    const pctCap = calculateSchemeBenefit(schemeMap.get('gujarat-khedut-tractor')!, {});
    expect(pctCap.annualEstimate).toBe(60000);

    const slabLow = calculateSchemeBenefit(schemeMap.get('nsp-post-matric-sc-obc')!, {
      income: 80000,
    });
    const slabMid = calculateSchemeBenefit(schemeMap.get('nsp-post-matric-sc-obc')!, {
      income: 200000,
    });
    expect(slabLow.annualEstimate).toBe(18000);
    expect(slabMid.annualEstimate).toBe(12000);
  });

  it('avoids double-counting mutually exclusive schemes in bundle and household matrix', () => {
    const pmjay = schemeMap.get('ayushman-bharat-pmjay')!;
    const gujMa = schemeMap.get('gujarat-pmjay-ma')!;
    const bundle = calculateBundleTotals([pmjay, gujMa], { state: 'Gujarat', income: 150000 });
    expect(bundle.countedSchemeIds).toEqual(['gujarat-pmjay-ma']);
    expect(bundle.annualTotal).toBe(1000000);
    expect(bundle.excludedDueToOverlap.length).toBe(1);

    // Household matrix deduplicates household-level schemes across 2 family members
    const matrix = calculateHouseholdMatrix([pmjay], [
      { id: 'p1', label: 'Father', state: 'Gujarat', income: 120000, is_bpl: true, held_documents: [] },
      { id: 'p2', label: 'Mother', state: 'Gujarat', income: 120000, is_bpl: true, held_documents: [] },
    ]);
    expect(matrix.combinedAnnualEstimate).toBe(500000);
    expect(matrix.dedupedHouseholdSchemes).toContain('ayushman-bharat-pmjay');
  });

  it('dedupes documents and ranks next best document by scheme count', () => {
    const checklist = buildMergedDocumentChecklist(
      [schemeMap.get('pm-kisan-samman')!, schemeMap.get('pm-fasal-bima')!],
      documents,
      ['aadhaar']
    );
    expect(checklist.items.length).toBe(3);
    expect(checklist.readinessPct).toBe(33);
    expect(checklist.nextBestDoc?.unlocksCount).toBe(2);
  });

  it('enforces valid application state machine transitions', () => {
    const base = {
      id: 'a1',
      profileId: 'p1',
      schemeId: 'pm-kisan-samman',
      status: 'not_started' as const,
      updatedAt: '2026-11-01T00:00:00Z',
      remindOn: null,
      notes: '',
    };
    const invalid = transitionApplication(base, 'approved');
    expect(invalid.ok).toBe(false);

    const valid = transitionApplication(base, 'documents_ready');
    expect(valid.ok).toBe(true);
  });

  it('analytics state household totals reconcile to national total (20,000 synthetic)', () => {
    const ov = computeAnalyticsOverview({});
    expect(ov.isSynthetic).toBe(true);
    expect(ov.sampleSize).toBe(20000);
    const stateSum = ov.byState.reduce((sum, st) => sum + st.households, 0);
    expect(stateSum).toBe(ov.sampleSize);
  });
});

