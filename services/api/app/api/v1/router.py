from fastapi import APIRouter
from app.api.v1.schemes import router as schemes_router
from app.api.v1.eligibility import router as eligibility_router
from app.api.v1.assistant import router as assistant_router
from app.api.v1.feedback import router as feedback_router
from app.api.v1.admin import router as admin_router

api_v1_router = APIRouter()
api_v1_router.include_router(schemes_router)
api_v1_router.include_router(eligibility_router)
api_v1_router.include_router(assistant_router)
api_v1_router.include_router(feedback_router)
api_v1_router.include_router(admin_router)
