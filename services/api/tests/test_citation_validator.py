from app.services.citation_validator import CitationValidator
from app.models.scheme import SchemeModel

def test_citation_validator_redacts_hallucinated_urls():
    mock_scheme = SchemeModel(
        id="s1",
        slug="pm-kisan",
        name_en="PM Kisan",
        name_gu="પીએમ કિસાન",
        short_description_en="aid",
        short_description_gu="સહાય",
        benefit_summary_en="benefit",
        benefit_summary_gu="લાભ",
        category="agriculture",
        level="central",
        target_groups=[],
        benefit_type="DBT",
        application_steps=[],
        documents=[],
        rules=[],
        official_application_url="https://pmkisan.gov.in/register",
        official_source_url="https://pmkisan.gov.in/",
        source_org="Ministry of Agriculture",
        source_domain="pmkisan.gov.in",
        source_excerpt="Source text",
        source_retrieved_at="2026-10-01",
        verified_at="2026-10-01",
        status="published",
        is_demo=True
    )

    # Raw answer has a legit URL and a fake / hallucinated URL
    raw_text = "Apply at https://pmkisan.gov.in/register or visit fake scam http://fake-grant-scam.xyz/claim for money."
    validated = CitationValidator.validate_and_sanitize(raw_text, [mock_scheme], language="en")
    
    assert "http://fake-grant-scam.xyz/claim" not in validated.answer
    assert "[Unverified link redacted" in validated.answer
    assert "https://pmkisan.gov.in/register" in validated.answer
    assert validated.was_grounded is True
    assert len(validated.citations) == 1
    assert validated.citations[0].source_org == "Ministry of Agriculture"

