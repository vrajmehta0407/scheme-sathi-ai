import os
import json
import logging
from typing import List, Optional, Dict, Any
import httpx
from app.models.scheme import SchemeModel
from app.models.chat import (
    AssistantChatRequestModel,
    AssistantChatResponseModel,
    CitationItemModel
)
from app.services.scheme_service import SchemeService
from app.services.citation_validator import CitationValidator
from app.core.config import settings

logger = logging.getLogger("schemesathi.rag")

class RAGService:
    @classmethod
    def generate_response(
        cls,
        request: AssistantChatRequestModel
    ) -> AssistantChatResponseModel:
        lang = request.language
        query = request.query.strip().lower()

        # Step 1: Retrieve candidate schemes based on query & active scheme
        candidate_schemes: List[SchemeModel] = []
        if request.active_scheme_id:
            active_s = SchemeService.get_by_id(request.active_scheme_id)
            if active_s:
                candidate_schemes.append(active_s)

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

        raw_answer = ""

        # Step 2: If LLM_API_KEY is configured, call ChatGPT model (via OpenRouter)
        if settings.LLM_API_KEY:
            try:
                raw_answer = cls._call_llm(
                    query=request.query,
                    language=lang,
                    candidate_schemes=candidate_schemes,
                    profile_context=request.profile_context
                )
            except Exception as e:
                logger.warning(f"LLM API call failed, falling back to deterministic synthesis: {e}")
                raw_answer = ""

        # Step 3: Fallback synthesis if LLM returned empty or was disabled
        if not raw_answer:
            raw_answer = cls._fallback_synthesis(candidate_schemes, lang)

        # Step 4: Strict validation against hallucinated URLs and attach approved citation cards
        return CitationValidator.validate_and_sanitize(
            raw_answer=raw_answer,
            available_schemes=candidate_schemes,
            language=lang
        )

    @classmethod
    def _call_llm(
        cls,
        query: str,
        language: str,
        candidate_schemes: List[SchemeModel],
        profile_context: Optional[dict] = None
    ) -> str:
        # Build structured grounding context from official schemes
        grounding_data = []
        for s in candidate_schemes[:3]:
            grounding_data.append({
                "scheme_name_en": s.name_en,
                "scheme_name_gu": s.name_gu,
                "category": s.category,
                "issuing_authority": s.source_org,
                "official_portal": s.official_source_url,
                "benefit_summary_en": s.benefit_summary_en,
                "benefit_summary_gu": s.benefit_summary_gu,
                "benefit_amount_en": s.benefit_amount_text_en,
                "benefit_amount_gu": s.benefit_amount_text_gu,
                "rules": [
                    {
                        "criterion_en": r.criterion_name_en,
                        "criterion_gu": r.criterion_name_gu,
                        "operator": r.operator,
                        "required": r.required
                    }
                    for r in s.rules
                ],
                "documents": [
                    {
                        "name_en": d.name_en,
                        "name_gu": d.name_gu,
                        "mandatory": d.is_mandatory
                    }
                    for d in s.documents
                ],
                "application_steps": [
                    {
                        "step": st.step_number,
                        "title_en": st.title_en,
                        "title_gu": st.title_gu,
                        "description_en": st.description_en,
                        "description_gu": st.description_gu
                    }
                    for st in s.application_steps
                ],
                "official_source_excerpt": s.source_excerpt
            })

        system_prompt = f"""You are SchemeSathi AI, an expert, trustworthy, and empathetic public-service assistant for Indian central and Gujarat government welfare schemes.
Your task is to answer citizen questions about scheme eligibility, documentation, and application steps.

MANDATORY RULES:
1. Respond in the requested language: {'Gujarati (ગુજરાતી)' if language == 'gu' else 'English'}.
2. Base your answer STRICTLY on the verified government scheme data provided below.
3. NEVER fabricate or guess scheme names, benefit amounts, application deadlines, document requirements, or URLs.
4. If a piece of information is not present in the verified documentation, state that it needs to be verified on the official portal.
5. Clearly emphasize that you are an informational assistant and not an official government approval authority.
6. Format your answer with clean markdown bullet points for readability.

OFFICIAL VERIFIED SCHEME DATA:
{json.dumps(grounding_data, indent=2, ensure_ascii=False)}
"""

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Citizen query: {query}"}
        ]

        if profile_context:
            messages.insert(1, {
                "role": "system",
                "content": f"Citizen profile context: {json.dumps(profile_context)}"
            })

        headers = {
            "Authorization": f"Bearer {settings.LLM_API_KEY}",
            "HTTP-Referer": "https://schemesathi.ai",
            "X-Title": "SchemeSathi AI",
            "Content-Type": "application/json"
        }

        payload = {
            "model": settings.LLM_MODEL,
            "messages": messages,
            "temperature": 0.3,
            "max_tokens": 700
        }

        # Make synchronous request with 15s timeout
        with httpx.Client(timeout=15.0) as client:
            resp = client.post(
                f"{settings.LLM_BASE_URL.rstrip('/')}/chat/completions",
                headers=headers,
                json=payload
            )
            if resp.status_code == 200:
                data = resp.json()
                return data["choices"][0]["message"]["content"].strip()
            else:
                logger.warning(f"OpenRouter returned status {resp.status_code}: {resp.text}")
                return ""

    @classmethod
    def _fallback_synthesis(cls, candidate_schemes: List[SchemeModel], lang: str) -> str:
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

        return "\n".join(lines)
