# CureMotion
AI-driven activity recommendation system for Parkinson's disease patients.

## What It Does
Reads wearable sensor data in real time, detects freezing-of-gait (FOG) severity, and recommends the right activity for that moment. A TinyLlama chatbot explains the recommendation and answers follow-up questions in plain language.

## Tech Stack
- **Model** — Bidirectional LSTM trained on the Daphnet FOG clinical dataset
- **LLM** — TinyLlama via vLLM on AMD MI300X GPU
- **Backend** — FastAPI + SQLModel + SQLite
- **Frontend** — React Native (Expo)

<p align="center">
  <img src="system design.png" width="1000"/>
</p>

## Dataset
[Parkinson's Freezing of Gait Prediction](https://www.kaggle.com/competitions/tlvmc-parkinsons-freezing-gait-prediction) — clinical wearable accelerometer data with freezing-of-gait annotations. Underrepresented activity classes were balanced using Gaussian perturbation to generate synthetic samples.

## Running on AMD Developer Cloud

**1. SSH or open Web Console on your droplet**

**2. Clone the repo**
```bash
git clone https://github.com/your-repo/AI-Driven-Parkinsons-Actvity-Recommendation.git
cd AI-Driven-Parkinsons-Actvity-Recommendation
```

**3. Start vLLM**
```bash
docker run -it \
  --device=/dev/kfd \
  --device=/dev/dri \
  --network=host \
  vllm/vllm-rocm \
  python -m vllm.entrypoints.openai.api_server \
    --model TinyLlama/TinyLlama-1.1B-Chat-v1.0 \
    --host 0.0.0.0 \
    --port 8000
```

**4. Build and run the backend**
```bash
docker build -t parkinsons-backend ./inference
docker run --network=host -e VLLM_URL=http://localhost:8000 parkinsons-backend
```

Backend runs on `http://localhost:8080`
