from fastapi import APIRouter
from typing import List, Dict, Any
from app.models.match import MatchRequestModel, MatchEvaluationResultModel
from app.models.profile import UserProfileModel
from app.services.scheme_service import SchemeService
from app.services.eligibility_engine import EligibilityEngine
from app.core.security import sanitize_profile_for_logging
import logging

router = APIRouter(prefix="/eligibility", tags=["Eligibility Engine"])
logger = logging.getLogger("schemesathi.eligibility")

@router.post("/matches", response_model=List[MatchEvaluationResultModel])
def evaluate_matches(request: MatchRequestModel):
    """
    Evaluate deterministic criteria for all published schemes against a normalized user profile.
    Unknown values evaluate to 'unknown', not failing or passing silently.
    """
    raw_profile = request.profile or {}
    logger.info("Evaluating eligibility for profile keys: %s", list(raw_profile.keys()))
    
    # Sanitize inputs
    sanitized_profile = sanitize_profile_for_logging(raw_profile)

    schemes = SchemeService.get_all(
        category=request.category_filter,
        state_code=request.state_filter,
        status="published"
    )

    results: List[MatchEvaluationResultModel] = []
    for s in schemes:
        eval_result = EligibilityEngine.evaluate_scheme(s, sanitized_profile)
        results.append(eval_result)

    # Sort results: strong_match first, then possible_match, then needs_more_info, then does_not_match
    order = {"strong_match": 0, "possible_match": 1, "needs_more_info": 2, "does_not_match": 3}
    results.sort(key=lambda r: order.get(r.match_status, 99))

    return results

