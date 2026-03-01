import os
from typing import List, Optional

import numpy as np
import tensorflow as tf
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

app = FastAPI()

class InferRequest(BaseModel):
    x: List[List[float]] = Field(..., description="Windowed IMU features shaped [seq_len][3]")

class InferResponse(BaseModel):
    probs: List[float]
    pred_class: int

_MODEL: Optional[tf.keras.Model] = None

def _get_device() -> str:
    gpus = tf.config.list_physical_devices("GPU")
    if gpus:
        return f"GPU:{len(gpus)}"
    return "CPU"


@app.on_event("startup")
def _load_model() -> None:
    global _MODEL

    model_path = os.getenv("MODEL_PATH", "./fog_6class_lstm_patched.keras")
    _MODEL = tf.keras.models.load_model(model_path, safe_mode=False)
    if not os.path.exists(model_path):
        raise RuntimeError(
            f"Model file not found at '{model_path}'. Set MODEL_PATH or copy fog_6class_lstm.keras into the container."
        )


@app.get("/health")
def health():
    return {
        "ok": True,
        "device": _get_device(),
        "tf_version": tf.__version__,
        "model_loaded": _MODEL is not None,
    }


@app.post("/infer", response_model=InferResponse)
def infer(req: InferRequest):
    if _MODEL is None:
        raise HTTPException(status_code=500, detail="Model not loaded")

    x = np.asarray(req.x, dtype=np.float32)

    if x.ndim != 2:
        raise HTTPException(status_code=422, detail="x must be a 2D array shaped [seq_len][3]")

    if x.shape[1] != 3:
        raise HTTPException(status_code=422, detail=f"x must have 3 features per timestep, got shape {list(x.shape)}")

    x = np.expand_dims(x, axis=0)  # [1, seq_len, 3]

    probs = _MODEL.predict(x, verbose=0)
    probs = np.asarray(probs, dtype=np.float32)

    if probs.ndim != 2 or probs.shape[0] != 1:
        raise HTTPException(status_code=500, detail=f"Unexpected model output shape: {list(probs.shape)}")

    probs_1d = probs[0]
    pred_class = int(np.argmax(probs_1d))

    return InferResponse(probs=probs_1d.tolist(), pred_class=pred_class)
