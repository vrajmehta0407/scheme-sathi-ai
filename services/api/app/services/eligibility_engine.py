from typing import Dict, Any, List, Tuple
from app.models.scheme import SchemeModel, EligibilityRuleModel
from app.models.match import (
    MatchStatus,
    CriterionStatus,
    CriterionEvaluationModel,
    MatchEvaluationResultModel
)

INCOME_RANK = {
    "below_1_lakh": 1,
    "1_to_2.5_lakh": 2,
    "2.5_to_5_lakh": 3,
    "5_to_8_lakh": 4,
    "above_8_lakh": 5,
}

AGE_BAND_RANK = {
    "0-5": 1,
    "6-14": 2,
    "15-18": 3,
    "18-25": 4,
    "26-40": 5,
    "41-59": 6,
    "60+": 7,
}

class EligibilityEngine:
    """
    Deterministic rule evaluation engine for government welfare schemes.
    LLMs are NEVER used to decide eligibility. Unknown fields evaluate to 'unknown'.
    """

    @classmethod
    def evaluate_criterion(
        cls,
        rule: EligibilityRuleModel,
        profile: Dict[str, Any]
    ) -> CriterionEvaluationModel:
        field_key = rule.field_key
        user_val = profile.get(field_key)
        rule_val = rule.value_json
        op = rule.operator

        # Check if user value is unknown
        if user_val is None or user_val == "" or user_val == "unknown":
            return CriterionEvaluationModel(
                rule_id=rule.id,
                field_key=field_key,
                criterion_name_en=rule.criterion_name_en,
                criterion_name_gu=rule.criterion_name_gu,
                status="unknown",
                reasoning_en=f"Information for '{rule.criterion_name_en}' was not provided.",
                reasoning_gu=f"'{rule.criterion_name_gu}' માટે માહિતી આપવામાં આવી નથી.",
                source_reference=rule.source_reference,
                is_exclusion_rule=rule.unknown_behavior == "exclude_from_match"
            )

        # Evaluate based on operator
        matched = False
        reasoning_en = ""
        reasoning_gu = ""

        try:
            if op == "eq":
                matched = str(user_val).strip().lower() == str(rule_val).strip().lower()
                reasoning_en = f"Matches requirement: {rule_val}" if matched else f"Requires {rule_val}, provided {user_val}"
                reasoning_gu = f"જરૂરિયાત મુજબ: {rule_val}" if matched else f"{rule_val} જરૂરી છે, આપેલ: {user_val}"

            elif op == "neq":
                matched = str(user_val).strip().lower() != str(rule_val).strip().lower()
                reasoning_en = f"Excluded criteria not present." if matched else f"Cannot be {rule_val}"
                reasoning_gu = f"બાકાત માપદંડ મળતો નથી." if matched else f"{rule_val} હોવું જોઈએ નહીં."

            elif op == "in":
                # Rule val is a list of allowed values
                allowed = [str(v).lower() for v in (rule_val if isinstance(rule_val, list) else [rule_val])]
                matched = str(user_val).strip().lower() in allowed
                reasoning_en = f"Meets category requirement: {user_val}" if matched else f"Must be one of: {', '.join(allowed)}"
                reasoning_gu = f"કેટેગરી જરૂરિયાત પૂર્ણ કરે છે: {user_val}" if matched else f"આમાંથી હોવું જોઈએ: {', '.join(allowed)}"

            elif op == "nin":
                disallowed = [str(v).lower() for v in (rule_val if isinstance(rule_val, list) else [rule_val])]
                matched = str(user_val).strip().lower() not in disallowed
                reasoning_en = f"Not in excluded list." if matched else f"Excluded category: {user_val}"
                reasoning_gu = f"બાકાત શ્રેણીમાં નથી." if matched else f"બાકાત શ્રેણી: {user_val}"

            elif op == "boolean":
                matched = bool(user_val) == bool(rule_val)
                reasoning_en = f"Condition confirmed: {rule.criterion_name_en}" if matched else f"Requires {rule_val}"
                reasoning_gu = f"શરત પુષ્ટિ થયેલ છે: {rule.criterion_name_gu}" if matched else f"જરૂરી: {rule_val}"

            elif op == "lte":
                # Check for income ranking
                if field_key == "income_bracket" and isinstance(user_val, str) and isinstance(rule_val, str):
                    u_rank = INCOME_RANK.get(user_val, 99)
                    r_rank = INCOME_RANK.get(rule_val, 0)
                    matched = u_rank <= r_rank
                elif field_key == "age_band" and isinstance(user_val, str) and isinstance(rule_val, str):
                    u_rank = AGE_BAND_RANK.get(user_val, 99)
                    r_rank = AGE_BAND_RANK.get(rule_val, 0)
                    matched = u_rank <= r_rank
                else:
                    matched = float(user_val) <= float(rule_val)
                reasoning_en = f"Meets ceiling requirement: at or below {rule_val}" if matched else f"Exceeds ceiling requirement of {rule_val}"
                reasoning_gu = f"મહત્તમ મર્યાદામાં છે: {rule_val}" if matched else f"{rule_val} ની મર્યાદાથી વધુ છે"

            elif op == "gte":
                if field_key == "age_band" and isinstance(user_val, str) and isinstance(rule_val, str):
                    u_rank = AGE_BAND_RANK.get(user_val, 0)
                    r_rank = AGE_BAND_RANK.get(rule_val, 99)
                    matched = u_rank >= r_rank
                else:
                    matched = float(user_val) >= float(rule_val)
                reasoning_en = f"Meets minimum threshold: {rule_val}" if matched else f"Below minimum threshold of {rule_val}"
                reasoning_gu = f"લઘુત્તમ શરત પૂર્ણ કરે છે: {rule_val}" if matched else f"લઘુત્તમ {rule_val} થી ઓછું છે"

            elif op == "between":
                if isinstance(rule_val, list) and len(rule_val) == 2:
                    min_val, max_val = float(rule_val[0]), float(rule_val[1])
                    val = float(user_val)
                    matched = min_val <= val <= max_val
                    reasoning_en = f"Value {user_val} is within range [{min_val}, {max_val}]" if matched else f"Outside range [{min_val}, {max_val}]"
                    reasoning_gu = f"મૂલ્ય {user_val} મર્યાદામાં છે [{min_val}, {max_val}]" if matched else f"મર્યાદા બહાર છે [{min_val}, {max_val}]"

            elif op == "contains":
                matched = str(rule_val).lower() in str(user_val).lower()
                reasoning_en = f"Requirement satisfied" if matched else f"Does not contain required pattern"
                reasoning_gu = f"જરૂરિયાત સંતોષાયેલ છે" if matched else f"જરૂરી વિગતો મળતી નથી"

            else:
                matched = False
                reasoning_en = f"Unsupported operator: {op}"
                reasoning_gu = f"બિનસહાયિત ઓપરેટર: {op}"

        except Exception as ex:
            matched = False
            reasoning_en = f"Validation check failed: {str(ex)}"
            reasoning_gu = f"ચકાસણી નિષ્ફળ રહી."

        status: CriterionStatus = "matched" if matched else "not_met"

        return CriterionEvaluationModel(
            rule_id=rule.id,
            field_key=field_key,
            criterion_name_en=rule.criterion_name_en,
            criterion_name_gu=rule.criterion_name_gu,
            status=status,
            reasoning_en=reasoning_en,
            reasoning_gu=reasoning_gu,
            source_reference=rule.source_reference,
            is_exclusion_rule=rule.unknown_behavior == "exclude_from_match"
        )

    @classmethod
    def evaluate_scheme(
        cls,
        scheme: SchemeModel,
        profile: Dict[str, Any]
    ) -> MatchEvaluationResultModel:
        # Check geographic scope first
        user_state = profile.get("state")
        if scheme.level == "state" and scheme.state_code:
            if user_state and user_state != scheme.state_code:
                # State mismatch
                return MatchEvaluationResultModel(
                    scheme_id=scheme.id,
                    scheme=scheme,
                    match_status="does_not_match",
                    confidence_label_en="Geographic scope mismatch",
                    confidence_label_gu="ભૌગોલિક વિસ્તાર મેળ ખાતો નથી",
                    matched_criteria=[],
                    not_met_criteria=[
                        CriterionEvaluationModel(
                            rule_id=f"{scheme.id}-geo",
                            field_key="state",
                            criterion_name_en=f"Applicable to {scheme.state_code} residents only",
                            criterion_name_gu=f"ફક્ત {scheme.state_code} ના રહેવાસીઓ માટે",
                            status="not_met",
                            reasoning_en=f"Scheme applies to {scheme.state_code}, but profile state is {user_state}.",
                            reasoning_gu=f"આ યોજના {scheme.state_code} માટે છે, જ્યારે તમારી પ્રોફાઇલ {user_state} છે.",
                            is_exclusion_rule=True
                        )
                    ],
                    unknown_criteria=[],
                    summary_reasoning_en=f"This scheme is specific to residents of state code '{scheme.state_code}'.",
                    summary_reasoning_gu=f"આ યોજના ફક્ત '{scheme.state_code}' રાજ્યના રહેવાસીઓ માટે છે.",
                    source_verified_at=scheme.verified_at,
                    is_demo=scheme.is_demo
                )

        matched_list: List[CriterionEvaluationModel] = []
        not_met_list: List[CriterionEvaluationModel] = []
        unknown_list: List[CriterionEvaluationModel] = []

        has_hard_exclusion_unmet = False

        for rule in scheme.rules:
            eval_res = cls.evaluate_criterion(rule, profile)
            if eval_res.status == "matched":
                matched_list.append(eval_res)
            elif eval_res.status == "not_met":
                not_met_list.append(eval_res)
                if eval_res.is_exclusion_rule:
                    has_hard_exclusion_unmet = True
            else:
                unknown_list.append(eval_res)

        # Decide Match Status
        if has_hard_exclusion_unmet or len(not_met_list) > 0:
            match_status: MatchStatus = "does_not_match"
            conf_en = "Does not appear to match"
            conf_gu = "મેળ ખાતું નથી"
            summary_en = f"You do not meet {len(not_met_list)} mandatory requirement(s)."
            summary_gu = f"તમે {len(not_met_list)} ફરજિયાત જરૂરિયાતો પૂર્ણ કરતા નથી."

        elif len(unknown_list) > 0 and len(matched_list) == 0:
            match_status = "needs_more_info"
            conf_en = "Need more details"
            conf_gu = "વધુ વિગતો જરૂરી છે"
            summary_en = f"Provide additional profile details ({len(unknown_list)} criteria pending) to assess eligibility."
            summary_gu = f"પાત્રતા ચકાસવા માટે વધુ વિગતો આપો ({len(unknown_list)} માપદંડ બાકી)."

        elif len(unknown_list) > 0 and len(matched_list) > 0:
            match_status = "possible_match"
            conf_en = "Possible match"
            conf_gu = "સંભવિત મેળ"
            summary_en = f"You meet {len(matched_list)} known criteria, but {len(unknown_list)} criteria require additional confirmation."
            summary_gu = f"તમે {len(matched_list)} જાણીતા માપદંડો પૂર્ણ કરો છો, પરંતુ {len(unknown_list)} માપદંડો માટે વધુ પુષ્ટિ જરૂરી છે."

        else:
            match_status = "strong_match"
            conf_en = "Potential match"
            conf_gu = "પ્રબળ સંભવિત પાત્રતા"
            summary_en = f"You appear to meet all {len(matched_list)} verified criteria for this scheme."
            summary_gu = f"તમે આ યોજના માટેના તમામ {len(matched_list)} ચકાસાયેલ માપદંડો પૂર્ણ કરતા જણાય છે."

        return MatchEvaluationResultModel(
            scheme_id=scheme.id,
            scheme=scheme,
            match_status=match_status,
            confidence_label_en=conf_en,
            confidence_label_gu=conf_gu,
            matched_criteria=matched_list,
            not_met_criteria=not_met_list,
            unknown_criteria=unknown_list,
            summary_reasoning_en=summary_en,
            summary_reasoning_gu=summary_gu,
            source_verified_at=scheme.verified_at,
            is_demo=scheme.is_demo
        )

