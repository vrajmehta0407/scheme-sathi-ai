from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from app.models.scheme import SchemeModel
from app.services.scheme_service import SchemeService

router = APIRouter(prefix="/schemes", tags=["Schemes Catalog"])

@router.get("", response_model=List[SchemeModel])
def list_schemes(
    category: Optional[str] = Query(None, description="Filter by scheme category"),
    level: Optional[str] = Query(None, description="Filter by central or state"),
    state_code: Optional[str] = Query(None, description="Filter by state code e.g. 'GJ'"),
    search: Optional[str] = Query(None, description="Search term in title, summary or tags")
):
    """Retrieve verified and published government welfare schemes."""
    return SchemeService.get_all(
        category=category,
        level=level,
        state_code=state_code,
        search_query=search,
        status="published"
    )

@router.get("/{scheme_id}", response_model=SchemeModel)
def get_scheme_by_id(scheme_id: str):
    """Retrieve full details, criteria, required documents, and official source metadata for a specific scheme."""
    scheme = SchemeService.get_by_id(scheme_id)
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme not found")
    return scheme
