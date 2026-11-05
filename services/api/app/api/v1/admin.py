from fastapi import APIRouter, Depends, HTTPException, Body
from typing import List, Literal
from app.models.scheme import SchemeModel
from app.services.scheme_service import SchemeService
from app.core.security import verify_admin_key

router = APIRouter(prefix="/admin", tags=["Admin Content Operations"], dependencies=[Depends(verify_admin_key)])

@router.get("/schemes", response_model=List[SchemeModel])
def admin_list_schemes():
    """List all schemes including drafts, reviewed, and archived."""
    return SchemeService.get_all(status="all")

@router.patch("/schemes/{scheme_id}/status")
def admin_update_scheme_status(
    scheme_id: str,
    status: Literal["draft", "reviewed", "published", "needs_verification", "archived"] = Body(..., embed=True)
):
    """Update scheme review lifecycle status."""
    updated = SchemeService.update_status(scheme_id, status)
    if not updated:
        raise HTTPException(status_code=404, detail="Scheme not found")
    return {"status": "success", "scheme_id": scheme_id, "new_status": status}

