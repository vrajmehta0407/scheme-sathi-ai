import os
from typing import List, Optional, Dict, Any
from app.models.scheme import SchemeModel
from app.models.chat import (
    AssistantChatRequestModel,
    AssistantChatResponseModel,
    CitationItemModel
)
from app.services.scheme_service import SchemeService
from app.services.citation_validator import CitationValidator
from app.services.eligibility_engine import EligibilityEngine
from app.core.config import settings

class RAGService:
    @classmethod
    def generate_response(
        cls,
        request: AssistantChatRequestModel
    ) -> AssistantChatResponseModel:
        lang = request.language
        query = request.query.strip().lower()

        # Step 1: Retrieve candidate schemes
        candidate_schemes: List[SchemeModel] = []
        if request.active_scheme_id:
            active_s = SchemeService.get_by_id(request.active_scheme_id)
            if active_s:
                candidate_schemes.append(active_s)

        # Retrieve relevant schemes by query or category
        all_schemes = SchemeService.get_all(status="published")
        for s in all_schemes:
            if s not in candidate_schemes:
                if (
                    any(word in s.name_en.lower() or word in (s.tags or []) for word in query.split()) or
                    (s.category in query)
                ):
                    candidate_schemes.append(s)

        if not candidate_schemes:
            candidate_schemes = all_schemes[:2]

        # Step 2: Formulate grounded answer from approved excerpts
        lines = []
        if lang == "gu":
            lines.append("અહીં તમારી પૂછપરછ અંગે મંજૂર સરકારી યોજના માર્ગદર્શિકામાંથી સત્તાવાર વિગતો છે:\n")
            for s in candidate_schemes[:2]:
                lines.append(f"**{s.name_gu}**:")
                lines.append(f"- લાભ: {s.benefit_summary_gu}")
                if s.benefit_amount_text_gu:
                    lines.append(f"- સહાય રકમ: {s.benefit_amount_text_gu}")
                lines.append(f"- સત્તાવાર સ્ત્રોત: {s.source_org} ({s.source_domain})\n")
            lines.append("વધુ માહિતી અથવા ઓનલાઈન અરજી કરવા માટે નીચે આપેલા સત્તાવાર પોર્ટલ બટનનો ઉપયોગ કરો.")
        else:
            lines.append("Based on verified official scheme documentation, here are the key details:\n")
            for s in candidate_schemes[:2]:
                lines.append(f"**{s.name_en}**:")
                lines.append(f"- Benefit: {s.benefit_summary_en}")
                if s.benefit_amount_text_en:
                    lines.append(f"- Financial Support: {s.benefit_amount_text_en}")
                lines.append(f"- Official Issuing Authority: {s.source_org} ({s.source_domain})\n")
            lines.append("You can inspect the required documents and application steps in the details card or proceed to the official portal.")

        raw_answer = "\n".join(lines)

        # Step 3: Pass through CitationValidator to guarantee strict grounding and no hallucinated URLs
        return CitationValidator.validate_and_sanitize(
            raw_answer=raw_answer,
            available_schemes=candidate_schemes,
            language=lang
        )
