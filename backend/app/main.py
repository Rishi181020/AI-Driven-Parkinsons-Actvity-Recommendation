from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from websockets import route

from routes import users
from routes import predict
from routes import chat
from db.init_db import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Starting up...")
    init_db()
    yield
    print("Shutting down...")


app = FastAPI(
    title="Parkinson Activity Recommender MVP",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "ok"}

app.include_router(users.router, prefix="/v1")
app.include_router(predict.router, prefix="/v1") 
app.include_router(chat.router,    prefix="/v1") 