from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from app.models.scheme import SchemeModel

LanguageType = Literal["en", "gu"]

class CitationItemModel(BaseModel):
    citation_id: str
    scheme_id: str
    scheme_name: str
    source_org: str
    source_url: str
    excerpt: str
    verified_at: str

class AssistantChatRequestModel(BaseModel):
    query: str = Field(..., min_length=2, max_length=500)
    profile_context: Optional[dict] = None
    active_scheme_id: Optional[str] = None
    language: LanguageType = "en"

class AssistantChatResponseModel(BaseModel):
    answer: str
    citations: List[CitationItemModel] = Field(default_factory=list)
    related_schemes: List[SchemeModel] = Field(default_factory=list)
    disclaimer: str
    was_grounded: bool

class FeedbackModel(BaseModel):
    scheme_id: Optional[str] = None
    rating: Optional[Literal["helpful", "unhelpful"]] = None
    is_outdated_report: bool = False
    comment: Optional[str] = Field(None, max_length=1000)
    page_url: Optional[str] = None
