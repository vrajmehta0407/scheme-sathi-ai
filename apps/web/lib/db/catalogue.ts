import path from 'node:path';
import fs from 'node:fs';
import type { DocumentRecord, SchemeRecord, SchemeRuleTree } from '../types';
import { getSqliteDb } from './sqlite';

function resolveDataFile(filename: string): string {
  const candidates = [
    path.resolve(process.cwd(), 'data', filename),
    path.resolve(process.cwd(), '../../data', filename),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return candidates[0];
}

export function loadBundleDataFromDisk(): {
  schemes: SchemeRecord[];
  documents: DocumentRecord[];
} {
  const rawSchemes = JSON.parse(
    fs.readFileSync(resolveDataFile('schemes.sample.json'), 'utf8')
  ) as Array<Omit<SchemeRecord, 'ruleTree'>>;
  const rawRules = JSON.parse(
    fs.readFileSync(resolveDataFile('rules.sample.json'), 'utf8')
  ) as SchemeRuleTree[];
  const documents = JSON.parse(
    fs.readFileSync(resolveDataFile('documents.json'), 'utf8')
  ) as DocumentRecord[];

  const ruleMap = new Map(rawRules.map((r) => [r.scheme_id, r]));
  const schemes: SchemeRecord[] = rawSchemes.map((s) => ({
    ...s,
    ruleTree: ruleMap.get(s.id),
  }));

  return { schemes, documents };
}

export function getCatalogueFromDb(): {
  schemes: SchemeRecord[];
  documents: DocumentRecord[];
} {
  try {
    const db = getSqliteDb();
    const schemeRows = db.prepare('SELECT * FROM schemes ORDER BY popularity_prior DESC').all() as Array<
      Record<string, unknown>
    >;
    if (schemeRows.length === 0) {
      return loadBundleDataFromDisk();
    }

    const ruleRows = db.prepare('SELECT scheme_id, rule_json FROM scheme_rules').all() as Array<{
      scheme_id: string;
      rule_json: string;
    }>;
    const ruleMap = new Map(
      ruleRows.map((r) => [r.scheme_id, JSON.parse(r.rule_json) as SchemeRuleTree])
    );

    const docLinkRows = db
      .prepare('SELECT scheme_id, doc_key FROM scheme_documents')
      .all() as Array<{ scheme_id: string; doc_key: string }>;
    const docLinkMap = new Map<string, string[]>();
    for (const row of docLinkRows) {
      const arr = docLinkMap.get(row.scheme_id) ?? [];
      arr.push(row.doc_key);
      docLinkMap.set(row.scheme_id, arr);
    }

    const stepRows = db
      .prepare('SELECT scheme_id, step_no, text_en, text_hi, text_gu FROM scheme_steps ORDER BY step_no ASC')
      .all() as Array<{
      scheme_id: string;
      step_no: number;
      text_en: string;
      text_hi: string;
      text_gu: string;
    }>;
    const stepMap = new Map<string, { en: string[]; hi: string[]; gu: string[] }>();
    for (const st of stepRows) {
      const entry = stepMap.get(st.scheme_id) ?? { en: [], hi: [], gu: [] };
      entry.en.push(st.text_en);
      entry.hi.push(st.text_hi);
      entry.gu.push(st.text_gu);
      stepMap.set(st.scheme_id, entry);
    }

    const schemes: SchemeRecord[] = schemeRows.map((r) => ({
      id: String(r.id),
      slug: String(r.slug),
      nameEn: String(r.name_en),
      nameHi: String(r.name_hi),
      nameGu: String(r.name_gu),
      level: r.level as 'central' | 'state',
      state: String(r.state),
      category: r.category as SchemeRecord['category'],
      benefitType: String(r.benefit_type),
      benefitAmount: Number(r.benefit_amount),
      benefitPeriod: r.benefit_period as SchemeRecord['benefitPeriod'],
      benefitFormula: JSON.parse(String(r.benefit_formula_json)),
      exclusiveGroup: r.exclusive_group ? String(r.exclusive_group) : null,
      isHouseholdLevel: Boolean(r.is_household_level),
      popularityPrior: Number(r.popularity_prior),
      summaryEn: String(r.summary_en),
      summaryHi: String(r.summary_hi),
      summaryGu: String(r.summary_gu),
      deadline: r.deadline ? String(r.deadline) : null,
      officialUrl: String(r.official_url),
      lastVerified: String(r.last_verified),
      isSample: Boolean(r.is_sample),
      version: Number(r.version),
      documents: docLinkMap.get(String(r.id)) ?? [],
      steps: stepMap.get(String(r.id)) ?? { en: [], hi: [], gu: [] },
      ruleTree: ruleMap.get(String(r.id)),
    }));

    const docRows = db.prepare('SELECT * FROM documents').all() as Array<Record<string, unknown>>;
    const documents: DocumentRecord[] = docRows.map((d) => ({
      docKey: String(d.doc_key),
      nameEn: String(d.name_en),
      nameHi: String(d.name_hi),
      nameGu: String(d.name_gu),
      whereToGetEn: String(d.where_to_get_en),
      whereToGetHi: String(d.where_to_get_hi),
      whereToGetGu: String(d.where_to_get_gu),
      typicalDays: Number(d.typical_days),
      validityMonths: d.validity_months !== null ? Number(d.validity_months) : null,
    }));

    return { schemes, documents };
  } catch {
    return loadBundleDataFromDisk();
  }
}

