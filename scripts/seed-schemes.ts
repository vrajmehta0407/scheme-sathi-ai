import fs from 'node:fs';
import path from 'node:path';
import { getSqliteDb } from '../apps/web/lib/db/sqlite';
import type { DocumentRecord, SchemeRecord, SchemeRuleTree } from '../apps/web/lib/types';

export function seedSchemes(): { schemeCount: number; docCount: number } {
  const db = getSqliteDb();
  const dataDir = path.resolve(process.cwd(), 'data');

  const docs = JSON.parse(
    fs.readFileSync(path.join(dataDir, 'documents.json'), 'utf8')
  ) as DocumentRecord[];
  const schemes = JSON.parse(
    fs.readFileSync(path.join(dataDir, 'schemes.sample.json'), 'utf8')
  ) as Array<Omit<SchemeRecord, 'ruleTree'>>;
  const rules = JSON.parse(
    fs.readFileSync(path.join(dataDir, 'rules.sample.json'), 'utf8')
  ) as SchemeRuleTree[];

  const ruleMap = new Map(rules.map((r) => [r.scheme_id, r]));

  db.exec('BEGIN TRANSACTION;');
  try {
    db.exec('DELETE FROM scheme_steps; DELETE FROM scheme_documents; DELETE FROM scheme_rules; DELETE FROM schemes; DELETE FROM documents;');

    const insertDoc = db.prepare(
      `INSERT INTO documents(doc_key, name_en, name_hi, name_gu, where_to_get_en, where_to_get_hi, where_to_get_gu, typical_days, validity_months)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    for (const d of docs) {
      insertDoc.run(
        d.docKey,
        d.nameEn,
        d.nameHi,
        d.nameGu,
        d.whereToGetEn,
        d.whereToGetHi,
        d.whereToGetGu,
        d.typicalDays,
        d.validityMonths ?? null
      );
    }

    const insertScheme = db.prepare(
      `INSERT INTO schemes(id, slug, name_en, name_hi, name_gu, level, state, category, benefit_type, benefit_amount, benefit_period, benefit_formula_json, exclusive_group, is_household_level, popularity_prior, summary_en, summary_hi, summary_gu, deadline, official_url, last_verified, is_sample, version)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const insertRule = db.prepare(
      `INSERT INTO scheme_rules(id, scheme_id, rule_json, version) VALUES (?, ?, ?, ?)`
    );
    const insertSchemeDoc = db.prepare(
      `INSERT INTO scheme_documents(id, scheme_id, doc_key, required, hint_en, hint_hi, hint_gu) VALUES (?, ?, ?, ?, ?, ?, ?)`
    );
    const insertStep = db.prepare(
      `INSERT INTO scheme_steps(id, scheme_id, step_no, text_en, text_hi, text_gu) VALUES (?, ?, ?, ?, ?, ?)`
    );

    const docLookup = new Map(docs.map((d) => [d.docKey, d]));

    for (const s of schemes) {
      insertScheme.run(
        s.id,
        s.slug,
        s.nameEn,
        s.nameHi,
        s.nameGu,
        s.level,
        s.state,
        s.category,
        s.benefitType,
        s.benefitAmount,
        s.benefitPeriod,
        JSON.stringify(s.benefitFormula),
        s.exclusiveGroup ?? null,
        s.isHouseholdLevel ? 1 : 0,
        s.popularityPrior ?? 0.5,
        s.summaryEn,
        s.summaryHi,
        s.summaryGu,
        s.deadline ?? null,
        s.officialUrl,
        s.lastVerified,
        s.isSample ? 1 : 0,
        s.version
      );

      const rule = ruleMap.get(s.id);
      if (rule) {
        insertRule.run(`${s.id}-r1`, s.id, JSON.stringify(rule), s.version);
      }

      for (const docKey of s.documents) {
        const docMeta = docLookup.get(docKey);
        insertSchemeDoc.run(
          `${s.id}-${docKey}`,
          s.id,
          docKey,
          1,
          docMeta?.whereToGetEn ?? '',
          docMeta?.whereToGetHi ?? '',
          docMeta?.whereToGetGu ?? ''
        );
      }

      s.steps.en.forEach((txt, idx) => {
        insertStep.run(
          `${s.id}-step-${idx + 1}`,
          s.id,
          idx + 1,
          txt,
          s.steps.hi[idx] ?? txt,
          s.steps.gu[idx] ?? txt
        );
      });
    }

    db.exec('COMMIT;');
  } catch (err) {
    db.exec('ROLLBACK;');
    throw err;
  }

  return { schemeCount: schemes.length, docCount: docs.length };
}

if (require.main === module) {
  const res = seedSchemes();
  console.log(`Seeded ${res.schemeCount} sample schemes and ${res.docCount} documents.`);
}

