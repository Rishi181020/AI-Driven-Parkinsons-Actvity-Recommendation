from fastapi import APIRouter
from pydantic import BaseModel
from llama_cpp import Llama

router = APIRouter(tags=["Chat"])

# Load the GGUF model
# n_gpu_layers=-1 tells llama.cpp to put EVERYTHING on the AMD GPU
llm = Llama(
    model_path="models/llama-3-8b-instruct.gguf",
    n_gpu_layers=-1, 
    n_ctx=2048
)

class ChatRequest(BaseModel):
    message: str

@router.post("/chat")
async def chat_with_llama(request: ChatRequest):
    # Standard Llama-3 prompt format
    prompt = f"<|begin_of_text|><|start_header_id|>user<|end_header_id|>\n\n{request.message}<|eot_id|><|start_header_id|>assistant<|end_header_id|>\n\n"
    
    response = llm(prompt, max_tokens=256, stop=["<|eot_id|>"], echo=False)
    
    return {
        "role": "assistant",
        "content": response["choices"][0]["text"].strip()
    }