import { sqliteTable, text, integer, real, primaryKey } from 'drizzle-orm/sqlite-core';

export const schemes = sqliteTable('schemes', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  nameEn: text('name_en').notNull(),
  nameHi: text('name_hi').notNull(),
  nameGu: text('name_gu').notNull(),
  level: text('level').notNull(), // 'central' | 'state'
  state: text('state').notNull(), // 'All' | 'Gujarat' | ...
  category: text('category').notNull(), // 'farmers' | 'students' | 'women' | 'seniors' | 'workers' | 'entrepreneurs' | 'health' | 'housing'
  benefitType: text('benefit_type').notNull(), // 'cash' | 'scholarship' | 'subsidy' | 'insurance' | 'pension' | 'loan' | 'training'
  benefitAmount: integer('benefit_amount').notNull(),
  benefitPeriod: text('benefit_period').notNull(), // 'yearly' | 'monthly' | 'one_time' | 'subsidy'
  benefitFormulaJson: text('benefit_formula_json').notNull(),
  exclusiveGroup: text('exclusive_group'),
  isHouseholdLevel: integer('is_household_level').notNull().default(0),
  popularityPrior: real('popularity_prior').notNull().default(0.5),
  summaryEn: text('summary_en').notNull(),
  summaryHi: text('summary_hi').notNull(),
  summaryGu: text('summary_gu').notNull(),
  deadline: text('deadline'), // ISO date YYYY-MM-DD or null for rolling
  officialUrl: text('official_url').notNull(),
  lastVerified: text('last_verified').notNull(),
  isSample: integer('is_sample').notNull().default(1),
  version: integer('version').notNull().default(1),
});

export const schemeRules = sqliteTable('scheme_rules', {
  id: text('id').primaryKey(),
  schemeId: text('scheme_id')
    .notNull()
    .references(() => schemes.id, { onDelete: 'cascade' }),
  ruleJson: text('rule_json').notNull(),
  version: integer('version').notNull().default(1),
});

export const documents = sqliteTable('documents', {
  docKey: text('doc_key').primaryKey(),
  nameEn: text('name_en').notNull(),
  nameHi: text('name_hi').notNull(),
  nameGu: text('name_gu').notNull(),
  whereToGetEn: text('where_to_get_en').notNull(),
  whereToGetHi: text('where_to_get_hi').notNull(),
  whereToGetGu: text('where_to_get_gu').notNull(),
  typicalDays: integer('typical_days').notNull().default(7),
  validityMonths: integer('validity_months'),
});

export const schemeDocuments = sqliteTable('scheme_documents', {
  id: text('id').primaryKey(),
  schemeId: text('scheme_id')
    .notNull()
    .references(() => schemes.id, { onDelete: 'cascade' }),
  docKey: text('doc_key')
    .notNull()
    .references(() => documents.docKey, { onDelete: 'cascade' }),
  required: integer('required').notNull().default(1),
  hintEn: text('hint_en').notNull(),
  hintHi: text('hint_hi').notNull(),
  hintGu: text('hint_gu').notNull(),
});

export const schemeSteps = sqliteTable('scheme_steps', {
  id: text('id').primaryKey(),
  schemeId: text('scheme_id')
    .notNull()
    .references(() => schemes.id, { onDelete: 'cascade' }),
  stepNo: integer('step_no').notNull(),
  textEn: text('text_en').notNull(),
  textHi: text('text_hi').notNull(),
  textGu: text('text_gu').notNull(),
});

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: text('role').notNull().default('citizen'), // 'citizen' | 'admin'
  createdAt: text('created_at').notNull(),
});

export const profiles = sqliteTable('profiles', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
  label: text('label').notNull(),
  dataJson: text('data_json').notNull(),
  createdAt: text('created_at').notNull(),
});

export const applications = sqliteTable('applications', {
  id: text('id').primaryKey(),
  profileId: text('profile_id').notNull(),
  schemeId: text('scheme_id')
    .notNull()
    .references(() => schemes.id, { onDelete: 'cascade' }),
  status: text('status').notNull(), // 'not_started' | 'documents_ready' | 'applied' | 'approved' | 'rejected'
  updatedAt: text('updated_at').notNull(),
  remindOn: text('remind_on'),
  notes: text('notes'),
});

export const bookmarks = sqliteTable(
  'bookmarks',
  {
    profileId: text('profile_id').notNull(),
    schemeId: text('scheme_id')
      .notNull()
      .references(() => schemes.id, { onDelete: 'cascade' }),
  },
  (table) => [primaryKey({ columns: [table.profileId, table.schemeId] })]
);

export const population = sqliteTable('population', {
  id: integer('id').primaryKey(),
  state: text('state').notNull(),
  districtType: text('district_type').notNull(), // 'rural' | 'semi_urban' | 'urban'
  age: integer('age').notNull(),
  gender: text('gender').notNull(), // 'male' | 'female' | 'other'
  category: text('category').notNull(), // 'General' | 'OBC' | 'SC' | 'ST' | 'EWS'
  income: integer('income').notNull(),
  occupation: text('occupation').notNull(),
  landHectares: real('land_hectares').notNull(),
  education: text('education').notNull(),
  familySize: integer('family_size').notNull(),
  disability: integer('disability').notNull(),
  docsJson: text('docs_json').notNull(),
  isSynthetic: integer('is_synthetic').notNull().default(1),
});

export const analyticsCache = sqliteTable('analytics_cache', {
  key: text('key').primaryKey(),
  paramsHash: text('params_hash').notNull(),
  resultJson: text('result_json').notNull(),
  computedAt: text('computed_at').notNull(),
});

export const adminAudit = sqliteTable('admin_audit', {
  id: text('id').primaryKey(),
  actor: text('actor').notNull(),
  action: text('action').notNull(),
  entity: text('entity').notNull(),
  beforeJson: text('before_json'),
  afterJson: text('after_json'),
  at: text('at').notNull(),
});

export const savedViews = sqliteTable('saved_views', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  filtersJson: text('filters_json').notNull(),
  createdAt: text('created_at').notNull(),
});

