from pydantic import BaseModel, Field
from typing import List, Optional, Any, Literal
from datetime import datetime

SchemeLevel = Literal["central", "state"]
SchemeStatus = Literal["draft", "reviewed", "published", "needs_verification", "archived"]
SchemeCategory = Literal["education", "agriculture", "women_family", "employment", "housing", "health", "social_security"]
OperatorType = Literal["eq", "neq", "in", "nin", "gte", "lte", "between", "contains", "boolean"]
UnknownBehavior = Literal["mark_unknown", "exclude_from_match"]

class EligibilityRuleModel(BaseModel):
    id: str
    scheme_id: str
    field_key: str
    criterion_name_en: str
    criterion_name_gu: str
    operator: OperatorType
    value_json: Any
    required: bool = True
    unknown_behavior: UnknownBehavior = "mark_unknown"
    rule_notes: Optional[str] = None
    source_reference: Optional[str] = None

class SchemeDocumentModel(BaseModel):
    name_en: str
    name_gu: str
    is_mandatory: bool = True
    notes: Optional[str] = None

class ApplicationStepModel(BaseModel):
    step_number: int
    title_en: str
    title_gu: str
    description_en: str
    description_gu: str

class SchemeModel(BaseModel):
    id: str
    slug: str
    name_en: str
    name_gu: str
    short_description_en: str
    short_description_gu: str
    benefit_summary_en: str
    benefit_summary_gu: str
    category: SchemeCategory
    level: SchemeLevel
    state_code: Optional[str] = None
    district_scope: Optional[List[str]] = None
    target_groups: List[str] = Field(default_factory=list)
    benefit_type: str
    benefit_amount_text_en: Optional[str] = None
    benefit_amount_text_gu: Optional[str] = None
    application_steps: List[ApplicationStepModel] = Field(default_factory=list)
    documents: List[SchemeDocumentModel] = Field(default_factory=list)
    rules: List[EligibilityRuleModel] = Field(default_factory=list)
    official_application_url: str
    official_source_url: str
    source_org: str
    source_domain: str
    source_excerpt: str
    source_retrieved_at: str
    verified_at: str
    status: SchemeStatus = "published"
    is_demo: bool = False
    freshness_policy_days: int = 90
    tags: Optional[List[str]] = Field(default_factory=list)

class SchemeCreateUpdateModel(BaseModel):
    name_en: str
    name_gu: str
    short_description_en: str
    short_description_gu: str
    benefit_summary_en: str
    benefit_summary_gu: str
    category: SchemeCategory
    level: SchemeLevel
    state_code: Optional[str] = None
    district_scope: Optional[List[str]] = None
    target_groups: List[str] = Field(default_factory=list)
    benefit_type: str
    benefit_amount_text_en: Optional[str] = None
    benefit_amount_text_gu: Optional[str] = None
    official_application_url: str
    official_source_url: str
    source_org: str
    source_domain: str
    source_excerpt: str
    application_steps: List[ApplicationStepModel] = Field(default_factory=list)
    documents: List[SchemeDocumentModel] = Field(default_factory=list)
    rules: List[EligibilityRuleModel] = Field(default_factory=list)
    is_demo: bool = True

