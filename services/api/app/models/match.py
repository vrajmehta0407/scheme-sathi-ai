from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from app.models.scheme import SchemeModel

MatchStatus = Literal["strong_match", "possible_match", "needs_more_info", "does_not_match"]
CriterionStatus = Literal["matched", "not_met", "unknown"]

class CriterionEvaluationModel(BaseModel):
    rule_id: str
    field_key: str
    criterion_name_en: str
    criterion_name_gu: str
    status: CriterionStatus
    reasoning_en: str
    reasoning_gu: str
    source_reference: Optional[str] = None
    is_exclusion_rule: bool = False

class MatchEvaluationResultModel(BaseModel):
    scheme_id: str
    scheme: SchemeModel
    match_status: MatchStatus
    confidence_label_en: str
    confidence_label_gu: str
    matched_criteria: List[CriterionEvaluationModel]
    not_met_criteria: List[CriterionEvaluationModel]
    unknown_criteria: List[CriterionEvaluationModel]
    summary_reasoning_en: str
    summary_reasoning_gu: str
    source_verified_at: str
    is_demo: bool

class MatchRequestModel(BaseModel):
    profile: Optional[dict] = None
    state_filter: Optional[str] = None
    category_filter: Optional[str] = None

