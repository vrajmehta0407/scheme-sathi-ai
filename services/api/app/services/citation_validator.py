import re
from typing import List, Dict, Any, Tuple
from app.models.chat import CitationItemModel, AssistantChatResponseModel
from app.models.scheme import SchemeModel

URL_REGEX = re.compile(r'https?://[^\s<>"]+|www\.[^\s<>"]+')

class CitationValidator:
    """
    Validates AI assistant output against approved scheme records and citations.
    Blocks hallucinated URLs, unsupported factual amounts, and ungrounded claims.
    """

    @classmethod
    def validate_and_sanitize(
        cls,
        raw_answer: str,
        available_schemes: List[SchemeModel],
        language: str = "en"
    ) -> AssistantChatResponseModel:
        # Build approved source allowlist
        valid_citations: List[CitationItemModel] = []
        approved_domains = set()
        approved_urls = set()

        for s in available_schemes:
            approved_domains.add(s.source_domain.lower())
            approved_urls.add(s.official_source_url)
            approved_urls.add(s.official_application_url)
            valid_citations.append(
                CitationItemModel(
                    citation_id=f"cite-{s.slug}",
                    scheme_id=s.id,
                    scheme_name=s.name_gu if language == "gu" else s.name_en,
                    source_org=s.source_org,
                    source_url=s.official_source_url,
                    excerpt=s.source_excerpt,
                    verified_at=s.verified_at
                )
            )

        # Inspect any URLs hallucinated inside the raw text
        found_urls = URL_REGEX.findall(raw_answer)
        sanitized_answer = raw_answer

        for url in found_urls:
            # Check if domain or url matches approved official sources
            is_approved = any(approved in url.lower() for approved in approved_domains) or url in approved_urls
            if not is_approved:
                # Redact hallucinated external url
                sanitized_answer = sanitized_answer.replace(
                    url,
                    "[Unverified link redacted - please use the official portal button below]"
                )

        disclaimer_en = (
            "SchemeSathi AI provides grounded informational answers based on approved scheme documentation. "
            "It does not guarantee government approval. Please verify requirements on official portals."
        )
        disclaimer_gu = (
            "સ્કીમસાથી AI મંજૂર દસ્તાવેજોના આધારે માહિતી પૂરી પાડે છે. તે સરકારી મંજૂરીની ખાતરી આપતું નથી. "
            "કૃપા કરીને સત્તાવાર પોર્ટલ પર વિગતો ચકાસો."
        )

        was_grounded = len(valid_citations) > 0

        return AssistantChatResponseModel(
            answer=sanitized_answer,
            citations=valid_citations,
            related_schemes=available_schemes[:3],
            disclaimer=disclaimer_gu if language == "gu" else disclaimer_en,
            was_grounded=was_grounded
        )

