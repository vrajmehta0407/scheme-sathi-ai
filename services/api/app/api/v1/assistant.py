from fastapi import APIRouter
from app.models.chat import AssistantChatRequestModel, AssistantChatResponseModel
from app.services.rag_service import RAGService

router = APIRouter(prefix="/assistant", tags=["Grounded AI Assistant"])

@router.post("/chat", response_model=AssistantChatResponseModel)
def chat_assistant(request: AssistantChatRequestModel):
    """
    Generate grounded responses based strictly on approved scheme records and citations.
    All claims are verified and unapproved URLs are redacted.
    """
    return RAGService.generate_response(request)
