export type Language = 'en' | 'gu';

export type SchemeLevel = 'central' | 'state';

export type SchemeStatus = 
  | 'draft' 
  | 'reviewed' 
  | 'published' 
  | 'needs_verification' 
  | 'archived';

export type SchemeCategory = 
  | 'education' 
  | 'agriculture' 
  | 'women_family' 
  | 'employment' 
  | 'housing' 
  | 'health' 
  | 'social_security';

export type MatchStatus = 
  | 'strong_match' 
  | 'possible_match' 
  | 'needs_more_info' 
  | 'does_not_match';

export type CriterionStatus = 
  | 'matched' 
  | 'not_met' 
  | 'unknown';

export type OperatorType = 
  | 'eq' 
  | 'neq' 
  | 'in' 
  | 'nin' 
  | 'gte' 
  | 'lte' 
  | 'between' 
  | 'contains' 
  | 'boolean';

export type UnknownBehavior = 
  | 'mark_unknown' 
  | 'exclude_from_match';

export interface EligibilityRule {
  id: string;
  scheme_id: string;
  field_key: string;
  criterion_name_en: string;
  criterion_name_gu: string;
  operator: OperatorType;
  value_json: any;
  required: boolean;
  unknown_behavior: UnknownBehavior;
  rule_notes?: string;
  source_reference?: string;
}

export interface SchemeDocument {
  name_en: string;
  name_gu: string;
  is_mandatory: boolean;
  notes?: string;
}

export interface ApplicationStep {
  step_number: number;
  title_en: string;
  title_gu: string;
  description_en: string;
  description_gu: string;
}

export interface Scheme {
  id: string;
  slug: string;
  name_en: string;
  name_gu: string;
  short_description_en: string;
  short_description_gu: string;
  benefit_summary_en: string;
  benefit_summary_gu: string;
  category: SchemeCategory;
  level: SchemeLevel;
  state_code?: string; // e.g. "GJ" for Gujarat, null for Central
  district_scope?: string[];
  target_groups: string[];
  benefit_type: string;
  benefit_amount_text_en?: string;
  benefit_amount_text_gu?: string;
  application_steps: ApplicationStep[];
  documents: SchemeDocument[];
  rules: EligibilityRule[];
  official_application_url: string;
  official_source_url: string;
  source_org: string;
  source_domain: string;
  source_excerpt: string;
  source_retrieved_at: string;
  verified_at: string;
  status: SchemeStatus;
  is_demo: boolean;
  freshness_policy_days: number;
  tags?: string[];
}

export interface UserProfile {
  state?: string;
  district?: string;
  age_band?: string; // e.g. "0-5", "6-14", "15-18", "18-25", "26-40", "41-60", "60+"
  occupation?: string; // e.g. "farmer", "student", "daily_wage", "self_employed", "unemployed", "salaried", "homemaker"
  student_status?: boolean;
  income_bracket?: string; // e.g. "below_1_lakh", "1_to_2.5_lakh", "2.5_to_5_lakh", "5_to_8_lakh", "above_8_lakh"
  social_category?: string; // e.g. "general", "obc", "sc", "st", "ews", "prefer_not_to_say"
  disability_status?: boolean;
  farmer_status?: boolean;
  education_level?: string; // e.g. "primary", "secondary", "higher_secondary", "diploma", "graduate", "post_graduate"
  gender?: string; // e.g. "female", "male", "other"
  marital_status?: string; // e.g. "unmarried", "married", "widow", "single_parent"
  landholding_hectares?: number;
}

export interface CriterionEvaluation {
  rule_id: string;
  field_key: string;
  criterion_name_en: string;
  criterion_name_gu: string;
  status: CriterionStatus;
  reasoning_en: string;
  reasoning_gu: string;
  source_reference?: string;
  is_exclusion_rule?: boolean;
}

export interface MatchEvaluationResult {
  scheme_id: string;
  scheme: Scheme;
  match_status: MatchStatus;
  confidence_label_en: string;
  confidence_label_gu: string;
  matched_criteria: CriterionEvaluation[];
  not_met_criteria: CriterionEvaluation[];
  unknown_criteria: CriterionEvaluation[];
  summary_reasoning_en: string;
  summary_reasoning_gu: string;
  source_verified_at: string;
  is_demo: boolean;
}

export interface CitationItem {
  citation_id: string;
  scheme_id: string;
  scheme_name: string;
  source_org: string;
  source_url: string;
  excerpt: string;
  verified_at: string;
}

export interface AssistantMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  citations?: CitationItem[];
  related_scheme_ids?: string[];
  created_at: string;
}

export interface AssistantChatRequest {
  query: string;
  profile_context?: UserProfile;
  active_scheme_id?: string;
  language: Language;
}

export interface AssistantChatResponse {
  answer: string;
  citations: CitationItem[];
  related_schemes: Scheme[];
  disclaimer: string;
  was_grounded: boolean;
}

export interface FeedbackSubmission {
  scheme_id?: string;
  rating?: 'helpful' | 'unhelpful';
  is_outdated_report?: boolean;
  comment?: string;
  page_url?: string;
}

export interface AdminReviewAction {
  action: 'approve' | 'request_changes' | 'publish' | 'archive' | 'mark_needs_verification';
  reviewer_id: string;
  notes?: string;
}
