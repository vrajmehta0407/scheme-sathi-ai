export type Locale = 'en' | 'hi' | 'gu';

export type IncomeBandId =
  | 'below_1l'
  | '1l_to_2_5l'
  | '2_5l_to_5l'
  | '5l_to_8l'
  | 'above_8l';

export type OccupationType =
  | 'farmer'
  | 'student'
  | 'worker'
  | 'artisan'
  | 'entrepreneur'
  | 'salaried'
  | 'unemployed'
  | 'retired';

export type CategoryType = 'General' | 'OBC' | 'SC' | 'ST' | 'EWS';

export type DistrictType = 'rural' | 'semi_urban' | 'urban';

export type EducationLevel =
  | 'none'
  | 'primary'
  | 'secondary'
  | 'higher_secondary'
  | 'diploma'
  | 'graduate'
  | 'postgraduate';

export interface CitizenProfile {
  id: string;
  label: string;
  state?: string;
  district?: string;
  district_type?: DistrictType;
  age?: number;
  gender?: 'male' | 'female' | 'other';
  income_band?: IncomeBandId;
  income?: number; // exact override or derived midpoint
  occupation?: OccupationType;
  category?: CategoryType;
  disability?: boolean;
  family_size?: number;
  land_hectares?: number;
  education?: EducationLevel;
  is_bpl?: boolean;
  is_widow?: boolean;
  is_income_tax_payer?: boolean;
  owns_pucca_house?: boolean;
  held_documents: string[];
  doc_expiries?: Record<string, string>; // doc_key -> ISO expiry date
}

export interface NormalizedProfile extends CitizenProfile {
  knownFields: string[];
  unknownFields: string[];
  incomeRange: [number, number] | null;
  ageGroup: 'child' | 'youth' | 'adult' | 'senior' | 'unknown';
  isSenior: boolean | null;
}

export type RuleOp =
  | 'eq'
  | 'neq'
  | 'in'
  | 'nin'
  | 'lt'
  | 'lte'
  | 'gt'
  | 'gte'
  | 'between'
  | 'exists';

export interface RuleLeaf {
  field: string;
  op: RuleOp;
  value?: unknown;
}

export interface RuleGroup {
  all?: RuleNode[];
  any?: RuleNode[];
  none?: RuleNode[];
}

export type RuleNode = RuleLeaf | RuleGroup;

export interface SchemeRuleTree extends RuleGroup {
  scheme_id: string;
}

export type BenefitFormula =
  | { type: 'fixed_per_year'; amount: number; years?: number }
  | { type: 'fixed_per_month'; amount: number; years?: number }
  | { type: 'one_time'; amount: number }
  | { type: 'percent_of_cost'; percent: number; costBasis: number; cap: number; years?: number }
  | {
      type: 'slab';
      field: string;
      slabs: Array<{ min?: number; max?: number; amount: number }>;
      years?: number;
    };

export interface SchemeRecord {
  id: string;
  slug: string;
  nameEn: string;
  nameHi: string;
  nameGu: string;
  level: 'central' | 'state';
  state: string;
  category:
    | 'farmers'
    | 'students'
    | 'women'
    | 'seniors'
    | 'workers'
    | 'entrepreneurs'
    | 'health'
    | 'housing';
  benefitType: string;
  benefitAmount: number;
  benefitPeriod: 'yearly' | 'monthly' | 'one_time' | 'subsidy';
  benefitFormula: BenefitFormula;
  exclusiveGroup: string | null;
  isHouseholdLevel: boolean;
  popularityPrior: number;
  summaryEn: string;
  summaryHi: string;
  summaryGu: string;
  deadline: string | null;
  officialUrl: string;
  lastVerified: string;
  isSample: boolean;
  version: number;
  documents: string[];
  steps: {
    en: string[];
    hi: string[];
    gu: string[];
  };
  ruleTree?: SchemeRuleTree;
}

export interface DocumentRecord {
  docKey: string;
  nameEn: string;
  nameHi: string;
  nameGu: string;
  whereToGetEn: string;
  whereToGetHi: string;
  whereToGetGu: string;
  typicalDays: number;
  validityMonths: number | null;
}

export interface CriterionResult {
  field: string;
  op: RuleOp;
  expected: unknown;
  actual: unknown;
  passed: boolean | null; // null = unknown
  distance: number | null;
  unit?: string;
  hint: string;
}

export interface NearMissInfo {
  field: string;
  distance: number;
  unit: 'rs' | 'years' | 'hectares' | 'other';
  messageKey: string;
  actual: unknown;
  expected: unknown;
}

export type EligibilityStatus = 'eligible' | 'likely' | 'not_eligible';

export interface EligibilityResult {
  scheme_id: string;
  status: EligibilityStatus;
  criteria: CriterionResult[];
  near_miss: NearMissInfo | null;
  confidence: number;
  disclaimer: string;
}

export interface BenefitEstimate {
  schemeId: string;
  annualEstimate: number;
  lifetimeEstimate: number;
  formulaLabel: string;
  isEstimate: true;
}

export interface RankedScheme {
  scheme: SchemeRecord;
  eligibility: EligibilityResult;
  benefit: BenefitEstimate;
  score: number;
  heldDocCount: number;
  totalDocCount: number;
  readinessPct: number;
  missingDocs: string[];
  daysToReady: number;
}

export type ApplicationStatus =
  | 'not_started'
  | 'documents_ready'
  | 'applied'
  | 'approved'
  | 'rejected';

export interface ApplicationRecord {
  id: string;
  profileId: string;
  schemeId: string;
  status: ApplicationStatus;
  updatedAt: string;
  remindOn: string | null;
  notes: string;
  referenceNo?: string;
}

