FROM rocm/dev-ubuntu-22.04:latest

WORKDIR /app

# 1. Added 'cmake' and 'build-essential' for the llama-cpp compilation
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    cmake \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt /app/

# 2. Compile llama-cpp for AMD ROCm
RUN CMAKE_ARGS="-DGGML_HIPBLAS=on" pip3 install --no-cache-dir llama-cpp-python

# 3. Install TensorFlow and other dependencies
RUN pip3 install --no-cache-dir -r requirements.txt

# 4. Copy EVERYTHING (this includes your models/ folder and app.py)
COPY . /app/

ENV HSA_OVERRIDE_GFX_VERSION=10.3.0

EXPOSE 8000
# 5. Keep uvicorn pointing to app:app since everything is in one file
CMD ["python3", "-m", "uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]