from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List

router = APIRouter(tags=["Chat"])

class ChatMessage(BaseModel):
    role: str  # 'user' or 'assistant'
    content: str

class ChatRequest(BaseModel):
    message: str
    history: List[ChatMessage] = []

@router.post("/chat")
async def handle_chat(request: ChatRequest):
    """
    Endpoint to provide activity recommendations and answer Parkinson's related questions.
    """
    user_query = request.message.lower()
    
    # Simple logic for MVP recommendations
    # replace with llm later
    if "exercise" in user_query or "activity" in user_query:
        recommendation = "Based on your Parkinson's profile, light walking or Tai Chi is recommended to improve balance."
    else:
        recommendation = "I'm here to help with activity recommendations. How are you feeling today?"

    return {
        "role": "assistant",
        "content": recommendation
    }

