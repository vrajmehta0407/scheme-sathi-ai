from app.api.v1.schemes import list_schemes, get_scheme_by_id
from app.api.v1.eligibility import evaluate_matches
from app.api.v1.assistant import chat_assistant
from app.api.v1.admin import admin_list_schemes, admin_update_scheme_status
from app.models.match import MatchRequestModel
from app.models.chat import AssistantChatRequestModel

def test_list_schemes():
    schemes = list_schemes(category=None, level=None, state_code=None, search=None)
    assert len(schemes) >= 1
    assert any("pm-kisan" in s.slug for s in schemes)

def test_get_scheme_by_id():
    scheme = get_scheme_by_id("scheme-pm-kisan-01")
    assert scheme is not None
    assert scheme.name_en.startswith("PM Kisan")

def test_eligibility_matches_endpoint():
    req = MatchRequestModel(
        profile={
            "state": "GJ",
            "occupation": "student",
            "income_bracket": "below_1_lakh"
        }
    )
    results = evaluate_matches(req)
    assert len(results) >= 1
    first = results[0]
    assert first.match_status in ["strong_match", "possible_match", "needs_more_info", "does_not_match"]
    assert len(first.matched_criteria) + len(first.unknown_criteria) + len(first.not_met_criteria) > 0

def test_assistant_chat_endpoint():
    req = AssistantChatRequestModel(
        query="Tell me about education scholarships",
        language="en"
    )
    res = chat_assistant(req)
    assert res.was_grounded is True
    assert len(res.citations) > 0
    assert "scholarship" in res.answer.lower() or "education" in res.answer.lower()

def test_admin_schemes_and_status_update():
    schemes = admin_list_schemes()
    assert len(schemes) >= 1
    scheme_id = schemes[0].id
    original_status = schemes[0].status

    res = admin_update_scheme_status(scheme_id=scheme_id, status="reviewed")
    assert res["status"] == "success"
    assert res["new_status"] == "reviewed"

    # revert back to original
    admin_update_scheme_status(scheme_id=scheme_id, status=original_status)
