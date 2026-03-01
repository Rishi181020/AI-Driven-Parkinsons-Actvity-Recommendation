FROM rocm/dev-ubuntu-22.04:latest

WORKDIR /app
RUN apt-get update && apt-get install -y python3 python3-pip && rm -rf /var/lib/apt/lists/*
COPY requirements.txt /app/
RUN pip3 install --no-cache-dir -r requirements.txt

COPY app.py /app/
COPY fog_6class_lstm.keras /app/fog_6class_lstm.keras

EXPOSE 8000
CMD ["python3", "-m", "uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]