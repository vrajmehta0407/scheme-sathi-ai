from fastapi import APIRouter
from app.models.chat import FeedbackModel

router = APIRouter(prefix="/feedback", tags=["Feedback"])

FEEDBACK_LOG = []

@router.post("")
def submit_feedback(feedback: FeedbackModel):
    """Log user feedback or outdated data report without recording any personal profile data."""
    FEEDBACK_LOG.append(feedback.model_dump())
    return {"status": "success", "message": "Thank you for helping improve scheme accuracy."}
