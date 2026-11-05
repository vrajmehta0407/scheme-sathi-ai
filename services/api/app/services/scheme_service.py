import json
import os
from typing import List, Optional, Dict, Any
from app.models.scheme import SchemeModel, SchemeCreateUpdateModel

DATA_FILE = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "../../../../data/seed_demo/schemes.json")
)

class SchemeService:
    _schemes_cache: List[SchemeModel] = []

    @classmethod
    def load_schemes(cls) -> List[SchemeModel]:
        if not cls._schemes_cache:
            if os.path.exists(DATA_FILE):
                with open(DATA_FILE, "r", encoding="utf-8") as f:
                    raw_data = json.load(f)
                    cls._schemes_cache = [SchemeModel(**item) for item in raw_data]
            else:
                cls._schemes_cache = []
        return cls._schemes_cache

    @classmethod
    def save_schemes(cls):
        with open(DATA_FILE, "w", encoding="utf-8") as f:
            json.dump([s.model_dump() for s in cls._schemes_cache], f, indent=2, ensure_ascii=False)

    @classmethod
    def get_all(
        cls,
        category: Optional[str] = None,
        level: Optional[str] = None,
        state_code: Optional[str] = None,
        search_query: Optional[str] = None,
        status: Optional[str] = "published"
    ) -> List[SchemeModel]:
        schemes = cls.load_schemes()
        results = []

        for s in schemes:
            if status and s.status != status and status != "all":
                continue
            if category and s.category != category:
                continue
            if level and s.level != level:
                continue
            if state_code and s.level == "state" and s.state_code and s.state_code != state_code:
                continue
            if search_query:
                q = search_query.lower()
                matches = (
                    q in s.name_en.lower() or
                    q in s.name_gu.lower() or
                    q in s.short_description_en.lower() or
                    q in s.short_description_gu.lower() or
                    any(q in tag.lower() for tag in (s.tags or []))
                )
                if not matches:
                    continue
            results.append(s)

        return results

    @classmethod
    def get_by_id(cls, scheme_id: str) -> Optional[SchemeModel]:
        schemes = cls.load_schemes()
        for s in schemes:
            if s.id == scheme_id or s.slug == scheme_id:
                return s
        return None

    @classmethod
    def update_status(cls, scheme_id: str, new_status: str) -> Optional[SchemeModel]:
        schemes = cls.load_schemes()
        for s in schemes:
            if s.id == scheme_id:
                s.status = new_status
                cls.save_schemes()
                return s
        return None

