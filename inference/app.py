import os
from typing import List, Optional

import numpy as np
import tensorflow as tf
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

app = FastAPI()

# Your training used LabelEncoder on y values like [0,1,2,3,4,6],
# so model output index 5 maps back to original activity ID 6.
ENCODER_CLASSES = np.array([0, 1, 2, 3, 4, 6], dtype=np.int32)

ID_TO_LABEL = {
    0: "Rest",
    1: "Seated Exercise",
    2: "Gait Training",
    3: "Balance Practice",
    4: "Stretching",
    6: "Medication Check",
}

class InferRequest(BaseModel):
    x: List[List[float]] = Field(..., description="Windowed IMU features shaped [seq_len][3]")

class InferResponse(BaseModel):
    probs: List[float]
    pred_index: int          # 0..5 (model output index)
    pred_activity_id: int    # 0,1,2,3,4,6 (original label ID)
    pred_label: str

_MODEL: Optional[tf.keras.Model] = None


def _get_device() -> str:
    gpus = tf.config.list_physical_devices("GPU")
    return f"GPU:{len(gpus)}" if gpus else "CPU"


@app.on_event("startup")
def _load_model() -> None:
    global _MODEL
    model_path = os.getenv("MODEL_PATH", "./fog_6class_lstm_patched.keras")

    # Check existence BEFORE loading
    if not os.path.exists(model_path):
        raise RuntimeError(
            f"Model file not found at '{model_path}'. Set MODEL_PATH or copy fog_6class_lstm_patched.keras into the container."
        )

    _MODEL = tf.keras.models.load_model(model_path, safe_mode=False)


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
        raise HTTPException(
            status_code=422,
            detail=f"x must have 3 features per timestep, got shape {list(x.shape)}"
        )

    # If you trained on fixed windows of 100, enforce it to avoid weird results
    expected_len = 100
    if x.shape[0] != expected_len:
        raise HTTPException(status_code=422, detail=f"x must have seq_len={expected_len}, got {x.shape[0]}")

    x = np.expand_dims(x, axis=0)  # [1, seq_len, 3]

    probs = _MODEL.predict(x, verbose=0)
    probs = np.asarray(probs, dtype=np.float32)

    if probs.ndim != 2 or probs.shape[0] != 1:
        raise HTTPException(status_code=500, detail=f"Unexpected model output shape: {list(probs.shape)}")

    probs_1d = probs[0]
    pred_index = int(np.argmax(probs_1d))                 # 0..5
    pred_activity_id = int(ENCODER_CLASSES[pred_index])   # 0,1,2,3,4,6
    pred_label = ID_TO_LABEL.get(pred_activity_id, f"UNKNOWN_{pred_activity_id}")

    return InferResponse(
        probs=probs_1d.tolist(),
        pred_index=pred_index,
        pred_activity_id=pred_activity_id,
        pred_label=pred_label,
    )
    