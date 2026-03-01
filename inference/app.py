import os
from typing import List, Optional
import numpy as np
import tensorflow as tf
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from llama_cpp import Llama

from collections import deque
from datetime import datetime

LATEST_CTX = None
HISTORY = deque(maxlen=20)

app = FastAPI(title="Parkinson Activity & Chat Assistant")

import os
os.environ['TF_FORCE_GPU_ALLOW_GROWTH'] = 'true'
os.environ['HSA_OVERRIDE_GFX_VERSION'] = '10.3.0'

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
    llm_path = "./models/medgemma-4b-it-q8_0.gguf"
    if os.path.exists(llm_path):
        _LLM = Llama(model_path=llm_path, n_gpu_layers=-1, n_ctx=8192, verbose=False)


@app.get("/health")
def health():
    return {
        "ok": True,
        "device": _get_device(),
        "lstm_loaded": _MODEL is not None,
        "chat_loaded": _LLM is not None,
    }

from collections import deque
from datetime import datetime
import numpy as np
from fastapi import HTTPException

# Put these near your globals (top of file)
LATEST_CTX = None
HISTORY = deque(maxlen=20)

@app.post("/infer", response_model=InferResponse)
def infer(req: InferRequest):
    """Runs LSTM inference on a single IMU window (100x3), returns probs + prediction,
    and stores a compact context summary for the /chat endpoint to use.
    """
    global _MODEL, LATEST_CTX, HISTORY

    if _MODEL is None:
        raise HTTPException(status_code=500, detail="LSTM Model not loaded")

    x = np.asarray(req.x, dtype=np.float32)

    if x.ndim != 2:
        raise HTTPException(status_code=422, detail="x must be a 2D array shaped [seq_len][3]")
    if x.shape[1] != 3:
        raise HTTPException(
            status_code=422,
            detail=f"x must have 3 features per timestep (ax, ay, az). Got shape {list(x.shape)}",
        )
    if x.shape[0] != 100:
        raise HTTPException(status_code=422, detail=f"Expected seq_len=100 timesteps, got {x.shape[0]}")

    # Per-axis summary
    mean_xyz = x.mean(axis=0)                 # (3,)
    std_xyz = x.std(axis=0)                   # (3,)
    min_xyz = x.min(axis=0)                   # (3,)
    max_xyz = x.max(axis=0)                   # (3,)

    # Magnitude summary
    mag = np.linalg.norm(x, axis=1)           # (100,)
    mag_mean = float(mag.mean())
    mag_std = float(mag.std())
    mag_min = float(mag.min())
    mag_max = float(mag.max())

    stats = {
        "seq_len": int(x.shape[0]),
        "mean_xyz": mean_xyz.tolist(),
        "std_xyz": std_xyz.tolist(),
        "min_xyz": min_xyz.tolist(),
        "max_xyz": max_xyz.tolist(),
        "movement_mag_mean": mag_mean,
        "movement_mag_std": mag_std,
        "movement_mag_min": mag_min,
        "movement_mag_max": mag_max,
    }

    x_batched = np.expand_dims(x, axis=0)    
    probs = _MODEL.predict(x_batched, verbose=0)

    probs = np.asarray(probs, dtype=np.float32)
    if probs.ndim != 2 or probs.shape[0] != 1:
        raise HTTPException(status_code=500, detail=f"Unexpected model output shape: {list(probs.shape)}")

    probs_1d = probs[0]                        
    pred_index = int(np.argmax(probs_1d))

    try:
        pred_activity_id = int(ENCODER_CLASSES[pred_index])
    except Exception:
        pred_activity_id = pred_index  # fallback
    pred_label = ID_TO_LABEL.get(pred_activity_id, f"CLASS_{pred_activity_id}")

    topk = 3
    top_indices = np.argsort(-probs_1d)[:topk].tolist()
    top_activity_ids = [int(ENCODER_CLASSES[i]) for i in top_indices] if "ENCODER_CLASSES" in globals() else top_indices
    top_labels = [ID_TO_LABEL.get(aid, f"CLASS_{aid}") for aid in top_activity_ids]

    event = {
        "ts": datetime.utcnow().isoformat() + "Z",
        "pred_index": pred_index,
        "pred_activity_id": pred_activity_id,
        "pred_label": pred_label,
        "probs": probs_1d.tolist(),
        "top_indices": top_indices,
        "top_activity_ids": top_activity_ids,
        "top_labels": top_labels,
        "stats": stats,
    }
    LATEST_CTX = event
    HISTORY.append(event)

    return InferResponse(
        probs=probs_1d.tolist(),
        pred_index=pred_index,
        pred_activity_id=pred_activity_id,
        pred_label=pred_label,
    )

@app.post("/chat")
def chat(req: ChatRequest):
    if _LLM is None:
        raise HTTPException(status_code=500, detail="Chat model not loaded")

    global LATEST_CTX, HISTORY

    ctx = LATEST_CTX or {}
    recent = list(HISTORY)[-5:]  # last 5 events

    prompt = f"""<|system|>
    You are a Parkinson's assistant. Use the provided sensor inference context to give safe, practical suggestions.
    If context is missing, ask 1 clarifying question.
    You have to majorly answer based on a combination of latest research and the interpretation of the sensor
    statistics.
    </s>
    <|user|>
    User message: {req.message}

    Latest inference context (may be empty):
    {ctx}

    Recent history (last 5):
    {recent}

    Respond with:
    1) A short recommendation (1-2 sentences)
    2) A brief "why" grounded in the context
    </s>
    <|assistant|>
    """

    examples = """

    Here are some examples of how to respond:
    
    [Gait Training, 87% confident, history: Rest → Seated Exercise → Gait Training]
    User: My legs feel stiff, should I keep going?
    Assistant:
    1) Keep going but shorten your stride and slow down for a few minutes.
    2) You're transitioning from rest — your muscles are still warming up, pushing hard now raises fall risk.

    [UNCERTAIN: Gait/Balance/Stretching all ~30%]
    User: What should I do next?
    Assistant:
    1) Move into seated stretching — it's a safe next step regardless of what you were just doing.
    2) The sensor can't confidently distinguish your current activity, so bridging with low-intensity seated work is the safest call.

    [Medication Check, 91% confident, history: Gait Training → Balance Practice → Medication Check]
    User: I feel a bit off, not sure why.
    Assistant:
    1) Pause and check your last medication dose and timing.
    2) Feeling off after exercise in Parkinson's often tracks with dopamine timing — your session history and current pattern both point here.

    [Rest, 83% confident, history: Rest → Rest → Rest → Rest → Rest]
    User: I've just been sitting, is that okay?
    Assistant:
    1) Fine to rest, but try 5 minutes of seated arm circles or ankle rolls now.
    2) Five consecutive rest windows — prolonged inactivity increases rigidity risk.

    [NO CONTEXT]
    User: Can you help me plan my session?
    Assistant:
    1) Any tremor, stiffness, or balance issues this morning?
    2) No sensor data yet — your current symptom state will shape the safest plan.
    """

    prompt = prompt + examples

    output = _LLM(prompt, max_tokens=192, stop=["</s>"], echo=False)
    return {"role": "assistant", "content": output["choices"][0]["text"].strip()}
