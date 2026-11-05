from pydantic import BaseModel, Field, field_validator
from typing import Optional

class UserProfileModel(BaseModel):
    state: Optional[str] = None
    district: Optional[str] = None
    age_band: Optional[str] = None
    occupation: Optional[str] = None
    student_status: Optional[bool] = None
    income_bracket: Optional[str] = None
    social_category: Optional[str] = None
    disability_status: Optional[bool] = None
    farmer_status: Optional[bool] = None
    education_level: Optional[str] = None
    gender: Optional[str] = None
    marital_status: Optional[str] = None
    landholding_hectares: Optional[float] = None

    @field_validator("*", mode="before")
    @classmethod
    def sanitize_strings(cls, v):
        if isinstance(v, str):
            v_clean = v.strip()
            # Safety reject if user pastes Aadhaar (12 digits) or sensitive tokens
            digits_only = "".join(filter(str.isdigit, v_clean))
            if len(digits_only) == 12 and "aadhaar" in v_clean.lower():
                raise ValueError("Personal Aadhaar numbers must not be submitted.")
            return v_clean
        return v
