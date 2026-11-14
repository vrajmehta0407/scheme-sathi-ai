import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCatalogueFromDb } from '@/lib/db/catalogue';
import { getSqliteDb } from '@/lib/db/sqlite';
import { runAdminQualityCheck } from '@/lib/admin';
import type { SchemeRecord, SchemeRuleTree } from '@/lib/types';

const upsertSchemeSchema = z.object({
  id: z.string().min(2),
  slug: z.string().min(2),
  nameEn: z.string().min(2),
  nameHi: z.string().min(1),
  nameGu: z.string().min(1),
  level: z.enum(['central', 'state']),
  state: z.string().min(1),
  category: z.enum([
    'farmers',
    'students',
    'women',
    'seniors',
    'workers',
    'entrepreneurs',
    'health',
    'housing',
  ]),
  benefitType: z.string().min(1),
  benefitAmount: z.number().min(0),
  benefitPeriod: z.enum(['yearly', 'monthly', 'one_time', 'subsidy']),
  summaryEn: z.string().min(5),
  summaryHi: z.string().min(1),
  summaryGu: z.string().min(1),
  deadline: z.string().nullable().optional(),
  officialUrl: z.string().url(),
  lastVerified: z.string().min(8),
  documents: z.array(z.string()).min(1),
  stepsEn: z.array(z.string()).min(1),
  ruleTree: z.record(z.string(), z.unknown()),
});

export async function GET() {
  const { schemes, documents } = getCatalogueFromDb();
  const report = runAdminQualityCheck(schemes);
  const db = getSqliteDb();
  const auditLogs = db
    .prepare('SELECT * FROM admin_audit ORDER BY at DESC LIMIT 30')
    .all();

  return NextResponse.json({
    schemes,
    documents,
    qualityReport: report,
    auditLogs,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = upsertSchemeSchema.parse(body);
    const { schemes } = getCatalogueFromDb();
    const db = getSqliteDb();

    const existing = schemes.find((s) => s.id === parsed.id);
    const nextVersion = (existing?.version ?? 0) + 1;
    const ruleTree: SchemeRuleTree = {
      ...(parsed.ruleTree as Record<string, unknown>),
      scheme_id: parsed.id,
    } as SchemeRuleTree;

    const candidateScheme: SchemeRecord = {
      id: parsed.id,
      slug: parsed.slug,
      nameEn: parsed.nameEn,
      nameHi: parsed.nameHi,
      nameGu: parsed.nameGu,
      level: parsed.level,
      state: parsed.state,
      category: parsed.category,
      benefitType: parsed.benefitType,
      benefitAmount: parsed.benefitAmount,
      benefitPeriod: parsed.benefitPeriod,
      benefitFormula: { type: 'fixed_per_year', amount: parsed.benefitAmount, years: 5 },
      exclusiveGroup: existing?.exclusiveGroup ?? null,
      isHouseholdLevel: existing?.isHouseholdLevel ?? false,
      popularityPrior: existing?.popularityPrior ?? 0.65,
      summaryEn: parsed.summaryEn,
      summaryHi: parsed.summaryHi,
      summaryGu: parsed.summaryGu,
      deadline: parsed.deadline ?? null,
      officialUrl: parsed.officialUrl,
      lastVerified: parsed.lastVerified,
      isSample: false,
      version: nextVersion,
      documents: parsed.documents,
      steps: {
        en: parsed.stepsEn,
        hi: parsed.stepsEn,
        gu: parsed.stepsEn,
      },
      ruleTree,
    };

    const nextCatalogue = [
      ...schemes.filter((s) => s.id !== parsed.id),
      candidateScheme,
    ];
    const qualityReport = runAdminQualityCheck(nextCatalogue);
    if (!qualityReport.passed) {
      return NextResponse.json(
        {
          error: 'Publish blocked by Admin Quality Agent.',
          qualityReport,
        },
        { status: 422 }
      );
    }

    db.exec('BEGIN TRANSACTION;');
    try {
      db.prepare(
        `INSERT OR REPLACE INTO schemes(id, slug, name_en, name_hi, name_gu, level, state, category, benefit_type, benefit_amount, benefit_period, benefit_formula_json, exclusive_group, is_household_level, popularity_prior, summary_en, summary_hi, summary_gu, deadline, official_url, last_verified, is_sample, version)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`
      ).run(
        candidateScheme.id,
        candidateScheme.slug,
        candidateScheme.nameEn,
        candidateScheme.nameHi,
        candidateScheme.nameGu,
        candidateScheme.level,
        candidateScheme.state,
        candidateScheme.category,
        candidateScheme.benefitType,
        candidateScheme.benefitAmount,
        candidateScheme.benefitPeriod,
        JSON.stringify(candidateScheme.benefitFormula),
        candidateScheme.exclusiveGroup,
        candidateScheme.isHouseholdLevel ? 1 : 0,
        candidateScheme.popularityPrior,
        candidateScheme.summaryEn,
        candidateScheme.summaryHi,
        candidateScheme.summaryGu,
        candidateScheme.deadline,
        candidateScheme.officialUrl,
        candidateScheme.lastVerified,
        candidateScheme.version
      );

      db.prepare('DELETE FROM scheme_rules WHERE scheme_id = ?').run(candidateScheme.id);
      db.prepare(
        'INSERT INTO scheme_rules(id, scheme_id, rule_json, version) VALUES (?, ?, ?, ?)'
      ).run(`${candidateScheme.id}-r${nextVersion}`, candidateScheme.id, JSON.stringify(ruleTree), nextVersion);

      db.prepare('DELETE FROM scheme_documents WHERE scheme_id = ?').run(candidateScheme.id);
      for (const docKey of candidateScheme.documents) {
        db.prepare(
          'INSERT OR IGNORE INTO scheme_documents(id, scheme_id, doc_key, required, hint_en, hint_hi, hint_gu) VALUES (?, ?, ?, 1, ?, ?, ?)'
        ).run(`${candidateScheme.id}-${docKey}`, candidateScheme.id, docKey, '', '', '');
      }

      db.prepare('DELETE FROM scheme_steps WHERE scheme_id = ?').run(candidateScheme.id);
      candidateScheme.steps.en.forEach((stepTxt, idx) => {
        db.prepare(
          'INSERT INTO scheme_steps(id, scheme_id, step_no, text_en, text_hi, text_gu) VALUES (?, ?, ?, ?, ?, ?)'
        ).run(`${candidateScheme.id}-s${idx + 1}`, candidateScheme.id, idx + 1, stepTxt, stepTxt, stepTxt);
      });

      db.prepare(
        'INSERT INTO admin_audit(id, actor, action, entity, before_json, after_json, at) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).run(
        `audit-${Date.now()}`,
        'local-admin',
        existing ? 'UPDATE_SCHEME' : 'CREATE_SCHEME',
        candidateScheme.id,
        existing ? JSON.stringify({ version: existing.version }) : null,
        JSON.stringify({ version: candidateScheme.version }),
        new Date().toISOString()
      );

      db.exec('DELETE FROM analytics_cache;');
      db.exec('COMMIT;');
    } catch (err) {
      db.exec('ROLLBACK;');
      throw err;
    }

    return NextResponse.json({
      scheme: candidateScheme,
      qualityReport,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Invalid scheme payload' },
      { status: 400 }
    );
  }
}

