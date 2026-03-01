FROM rocm/dev-ubuntu-22.04:latest

WORKDIR /app
RUN apt-get update && apt-get install -y \
    python3 python3-pip \
    cmake ninja-build build-essential pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements from the inference/ folder (because build context is repo root)
COPY inference/requirements.txt /app/requirements.txt

# Install python deps (do llama-cpp either CPU or ROCm, see notes below)
RUN pip3 install --no-cache-dir -r /app/requirements.txt

# Copy app.py and the TF model
COPY inference/app.py /app/app.py
COPY inference/fog_6class_lstm_patched.keras /app/fog_6class_lstm_patched.keras

# (Optional) copy models into image, but you're mounting it anyway
# COPY models /app/models

ENV HSA_OVERRIDE_GFX_VERSION=10.3.0

EXPOSE 8000
CMD ["python3", "-m", "uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]