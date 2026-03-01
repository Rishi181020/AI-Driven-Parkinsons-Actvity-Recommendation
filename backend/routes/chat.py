from fastapi import APIRouter
from pydantic import BaseModel
from llama_cpp import Llama

router = APIRouter(tags=["Chat"])

# Load TinyLlama with GPU acceleration
llm = Llama(
    model_path="models/tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf",
    n_gpu_layers=-1, # Put all layers on the AMD GPU
    n_ctx=2048
)

class ChatRequest(BaseModel):
    message: str

@router.post("/chat")
async def chat_with_tinyllama(request: ChatRequest):
    # TinyLlama prompt format
    prompt = f"<|system|>\nYou are a Parkinson's assistant specialized in exercise advice.</s>\n<|user|>\n{request.message}</s>\n<|assistant|>\n"
    
    response = llm(prompt, max_tokens=256, stop=["</s>"], echo=False)
    
    return {
        "role": "assistant",
        "content": response["choices"][0]["text"].strip()
    }