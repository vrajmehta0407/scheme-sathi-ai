import pytest
from app.models.scheme import SchemeModel, EligibilityRuleModel
from app.services.eligibility_engine import EligibilityEngine

@pytest.fixture
def sample_scheme():
    return SchemeModel(
        id="test-scheme-01",
        slug="test-farmer-aid",
        name_en="Test Farmer Aid",
        name_gu="પરીક્ષણ ખેડૂત સહાય",
        short_description_en="Aid for farmers with low income",
        short_description_gu="ઓછી આવક ધરાવતા ખેડૂતો માટે સહાય",
        benefit_summary_en="₹5,000 subsidy",
        benefit_summary_gu="₹૫,૦૦૦ સહાય",
        category="agriculture",
        level="central",
        state_code=None,
        target_groups=["Farmers"],
        benefit_type="DBT",
        application_steps=[],
        documents=[],
        rules=[
            EligibilityRuleModel(
                id="r1",
                scheme_id="test-scheme-01",
                field_key="occupation",
                criterion_name_en="Farmer occupation",
                criterion_name_gu="ખેડૂત વ્યવસાય",
                operator="eq",
                value_json="farmer",
                required=True,
                unknown_behavior="mark_unknown"
            ),
            EligibilityRuleModel(
                id="r2",
                scheme_id="test-scheme-01",
                field_key="income_bracket",
                criterion_name_en="Income below 2.5 Lakh",
                criterion_name_gu="૨.૫ લાખથી ઓછી આવક",
                operator="lte",
                value_json="1_to_2.5_lakh",
                required=True,
                unknown_behavior="mark_unknown"
            )
        ],
        official_application_url="https://agricoop.nic.in/apply",
        official_source_url="https://agricoop.nic.in/",
        source_org="Ministry of Agriculture",
        source_domain="agricoop.nic.in",
        source_excerpt="Official guideline excerpt.",
        source_retrieved_at="2026-10-01T00:00:00Z",
        verified_at="2026-10-01T00:00:00Z",
        status="published",
        is_demo=True
    )

def test_full_match(sample_scheme):
    profile = {
        "occupation": "farmer",
        "income_bracket": "below_1_lakh"
    }
    result = EligibilityEngine.evaluate_scheme(sample_scheme, profile)
    assert result.match_status == "strong_match"
    assert len(result.matched_criteria) == 2
    assert len(result.not_met_criteria) == 0
    assert len(result.unknown_criteria) == 0

def test_unknown_profile_handling(sample_scheme):
    # When user skips income question
    profile = {
        "occupation": "farmer"
    }
    result = EligibilityEngine.evaluate_scheme(sample_scheme, profile)
    assert result.match_status == "possible_match"
    assert len(result.matched_criteria) == 1
    assert len(result.unknown_criteria) == 1
    assert result.unknown_criteria[0].field_key == "income_bracket"
    assert result.unknown_criteria[0].status == "unknown"

def test_not_met_profile_handling(sample_scheme):
    # Occupation doesn't match
    profile = {
        "occupation": "student",
        "income_bracket": "below_1_lakh"
    }
    result = EligibilityEngine.evaluate_scheme(sample_scheme, profile)
    assert result.match_status == "does_not_match"
    assert len(result.not_met_criteria) == 1
    assert result.not_met_criteria[0].field_key == "occupation"

def test_geographic_state_mismatch(sample_scheme):
    sample_scheme.level = "state"
    sample_scheme.state_code = "GJ"
    profile = {
        "state": "MH",
        "occupation": "farmer",
        "income_bracket": "below_1_lakh"
    }
    result = EligibilityEngine.evaluate_scheme(sample_scheme, profile)
    assert result.match_status == "does_not_match"
    assert "mismatch" in result.confidence_label_en.lower()

