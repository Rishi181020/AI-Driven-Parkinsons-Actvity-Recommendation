import os
from typing import List, Optional
import numpy as np
import tensorflow as tf
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from llama_cpp import Llama

app = FastAPI(title="Parkinson Activity & Chat Assistant")

# --- 1. CONFIG & CLASSES ---
ENCODER_CLASSES = np.array([0, 1, 2, 3, 4, 6], dtype=np.int32)
ID_TO_LABEL = {
    0: "Rest", 1: "Seated Exercise", 2: "Gait Training",
    3: "Balance Practice", 4: "Stretching", 6: "Medication Check",
}

class InferRequest(BaseModel):
    x: List[List[float]] = Field(..., description="Windowed IMU features [seq_len][3]")

class InferResponse(BaseModel):
    probs: List[float]
    pred_index: int
    pred_activity_id: int
    pred_label: str

class ChatRequest(BaseModel):
    message: str

# --- 2. GLOBAL MODELS ---
_MODEL: Optional[tf.keras.Model] = None
_LLM: Optional[Llama] = None

def _get_device() -> str:
    gpus = tf.config.list_physical_devices("GPU")
    return f"GPU:{len(gpus)}" if gpus else "CPU"

@app.on_event("startup")
def startup_event():
    global _MODEL, _LLM
    
    # Load LSTM Model (TensorFlow)
    model_path = os.getenv("MODEL_PATH", "./fog_6class_lstm_patched.keras")
    if os.path.exists(model_path):
        _MODEL = tf.keras.models.load_model(model_path, safe_mode=False)
    
    # Load TinyLlama Model (llama-cpp)
    # Using n_gpu_layers=10 to save some VRAM for the LSTM model
    llm_path = "models/tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf"
    if os.path.exists(llm_path):
        _LLM = Llama(model_path=llm_path, n_gpu_layers=-1, n_ctx=2048, verbose=False)

# --- 3. ENDPOINTS ---

@app.get("/health")
def health():
    return {
        "ok": True,
        "device": _get_device(),
        "lstm_loaded": _MODEL is not None,
        "chat_loaded": _LLM is not None,
    }

@app.post("/infer", response_model=InferResponse)
def infer(req: InferRequest):
    if _MODEL is None:
        raise HTTPException(status_code=500, detail="LSTM Model not loaded")
    
    x = np.asarray(req.x, dtype=np.float32)
    if x.shape != (100, 3):
        raise HTTPException(status_code=422, detail="Expected shape [100, 3]")

    x = np.expand_dims(x, axis=0)
    probs = _MODEL.predict(x, verbose=0)[0]
    idx = int(np.argmax(probs))
    act_id = int(ENCODER_CLASSES[idx])

    return InferResponse(
        probs=probs.tolist(),
        pred_index=idx,
        pred_activity_id=act_id,
        pred_label=ID_TO_LABEL.get(act_id, "UNKNOWN")
    )

@app.post("/chat")
def chat(req: ChatRequest):
    if _LLM is None:
        raise HTTPException(status_code=500, detail="Chat model not loaded")

    # Prompt template for TinyLlama
    prompt = f"<|system|>\nYou are a Parkinson's assistant.</s>\n<|user|>\n{req.message}</s>\n<|assistant|>\n"
    
    output = _LLM(prompt, max_tokens=128, stop=["</s>"], echo=False)
    return {"role": "assistant", "content": output["choices"][0]["text"].strip()}