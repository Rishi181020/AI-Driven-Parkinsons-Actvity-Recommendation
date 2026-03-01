# CureMotion
AI-driven activity recommendation system for Parkinson's disease patients.

## What It Does
Reads wearable sensor data in real time, detects freezing-of-gait (FOG) severity, and recommends the right activity for that moment. A MedGemma-4B chatbot explains the recommendation and answers follow-up questions in plain language.

## Tech Stack
- **Model** — Bidirectional LSTM trained on the Parkinson's FOG Prediction dataset
- **LLM** — MedGemma-4B running on AMD MI300X GPU via ROCm Docker
- **Backend** — FastAPI + SQLModel + SQLite
- **Frontend** — React Native (Expo)

## Dataset
[Parkinson's Freezing of Gait Prediction](https://www.kaggle.com/competitions/tlvmc-parkinsons-freezing-gait-prediction) — clinical wearable accelerometer data with freezing-of-gait annotations. Underrepresented activity classes were balanced using Gaussian perturbation to generate synthetic samples.

## Running on AMD Developer Cloud

**1. SSH or open Web Console on your droplet**

**2. Clone the repo**
```bash
git clone https://github.com/your-repo/AI-Driven-Parkinsons-Actvity-Recommendation.git
cd AI-Driven-Parkinsons-Actvity-Recommendation
```

**3. Start MedGemma-4B on ROCm**
```bash
docker run -it \
  --device=/dev/kfd \
  --device=/dev/dri \
  --network=host \
  rocm/pytorch:latest \
  python -m vllm.entrypoints.openai.api_server \
    --model google/medgemma-4b \
    --host 0.0.0.0 \
    --port 8000
```

**4. Build and run the backend**
```bash
docker build -t parkinsons-backend .
docker run --network=host -e VLLM_URL=http://localhost:8000 parkinsons-backend
```

Backend runs on `http://localhost:8080`
