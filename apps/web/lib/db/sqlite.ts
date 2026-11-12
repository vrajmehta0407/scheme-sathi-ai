import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';

let _db: DatabaseSync | null = null;

export function resolveDbPath(): string {
  const candidates = [
    path.resolve(process.cwd(), 'db/schemesathi.db'),
    path.resolve(process.cwd(), '../../db/schemesathi.db'),
  ];
  for (const p of candidates) {
    if (fs.existsSync(path.dirname(p))) {
      return p;
    }
  }
  const fallback = candidates[0];
  fs.mkdirSync(path.dirname(fallback), { recursive: true });
  return fallback;
}

export function getSqliteDb(): DatabaseSync {
  if (_db) return _db;
  const dbPath = resolveDbPath();
  _db = new DatabaseSync(dbPath);
  _db.exec('PRAGMA journal_mode = WAL;');
  _db.exec('PRAGMA foreign_keys = ON;');
  ensureSchema(_db);
  return _db;
}

export function ensureSchema(db: DatabaseSync): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schemes (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      name_en TEXT NOT NULL,
      name_hi TEXT NOT NULL,
      name_gu TEXT NOT NULL,
      level TEXT NOT NULL,
      state TEXT NOT NULL,
      category TEXT NOT NULL,
      benefit_type TEXT NOT NULL,
      benefit_amount INTEGER NOT NULL,
      benefit_period TEXT NOT NULL,
      benefit_formula_json TEXT NOT NULL,
      exclusive_group TEXT,
      is_household_level INTEGER NOT NULL DEFAULT 0,
      popularity_prior REAL NOT NULL DEFAULT 0.5,
      summary_en TEXT NOT NULL,
      summary_hi TEXT NOT NULL,
      summary_gu TEXT NOT NULL,
      deadline TEXT,
      official_url TEXT NOT NULL,
      last_verified TEXT NOT NULL,
      is_sample INTEGER NOT NULL DEFAULT 1,
      version INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS scheme_rules (
      id TEXT PRIMARY KEY,
      scheme_id TEXT NOT NULL REFERENCES schemes(id) ON DELETE CASCADE,
      rule_json TEXT NOT NULL,
      version INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS documents (
      doc_key TEXT PRIMARY KEY,
      name_en TEXT NOT NULL,
      name_hi TEXT NOT NULL,
      name_gu TEXT NOT NULL,
      where_to_get_en TEXT NOT NULL,
      where_to_get_hi TEXT NOT NULL,
      where_to_get_gu TEXT NOT NULL,
      typical_days INTEGER NOT NULL DEFAULT 7,
      validity_months INTEGER
    );

    CREATE TABLE IF NOT EXISTS scheme_documents (
      id TEXT PRIMARY KEY,
      scheme_id TEXT NOT NULL REFERENCES schemes(id) ON DELETE CASCADE,
      doc_key TEXT NOT NULL REFERENCES documents(doc_key) ON DELETE CASCADE,
      required INTEGER NOT NULL DEFAULT 1,
      hint_en TEXT NOT NULL,
      hint_hi TEXT NOT NULL,
      hint_gu TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS scheme_steps (
      id TEXT PRIMARY KEY,
      scheme_id TEXT NOT NULL REFERENCES schemes(id) ON DELETE CASCADE,
      step_no INTEGER NOT NULL,
      text_en TEXT NOT NULL,
      text_hi TEXT NOT NULL,
      text_gu TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'citizen',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      label TEXT NOT NULL,
      data_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS applications (
      id TEXT PRIMARY KEY,
      profile_id TEXT NOT NULL,
      scheme_id TEXT NOT NULL REFERENCES schemes(id) ON DELETE CASCADE,
      status TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      remind_on TEXT,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS bookmarks (
      profile_id TEXT NOT NULL,
      scheme_id TEXT NOT NULL REFERENCES schemes(id) ON DELETE CASCADE,
      PRIMARY KEY (profile_id, scheme_id)
    );

    CREATE TABLE IF NOT EXISTS population (
      id INTEGER PRIMARY KEY,
      state TEXT NOT NULL,
      district_type TEXT NOT NULL,
      age INTEGER NOT NULL,
      gender TEXT NOT NULL,
      category TEXT NOT NULL,
      income INTEGER NOT NULL,
      occupation TEXT NOT NULL,
      land_hectares REAL NOT NULL,
      education TEXT NOT NULL,
      family_size INTEGER NOT NULL,
      disability INTEGER NOT NULL,
      docs_json TEXT NOT NULL,
      is_synthetic INTEGER NOT NULL DEFAULT 1
    );

    CREATE INDEX IF NOT EXISTS idx_pop_state ON population(state);
    CREATE INDEX IF NOT EXISTS idx_pop_occ ON population(occupation);
    CREATE INDEX IF NOT EXISTS idx_pop_cat ON population(category);

    CREATE TABLE IF NOT EXISTS analytics_cache (
      key TEXT PRIMARY KEY,
      params_hash TEXT NOT NULL,
      result_json TEXT NOT NULL,
      computed_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS admin_audit (
      id TEXT PRIMARY KEY,
      actor TEXT NOT NULL,
      action TEXT NOT NULL,
      entity TEXT NOT NULL,
      before_json TEXT,
      after_json TEXT,
      at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS saved_views (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      filters_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);
}

