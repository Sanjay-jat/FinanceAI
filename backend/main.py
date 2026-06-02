import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database.connection import engine
from database import models
from routes import auth_routes, signal_routes
from ml.scheduler import start_scheduler

# Create all database tables
models.Base.metadata.create_all(bind=engine)
start_scheduler()


app = FastAPI(title="Finance Signal API", version="1.0.0")

# CORS settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        os.getenv("FRONTEND_URL", ""),  # your Vercel URL goes in .env
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(auth_routes.router)
app.include_router(signal_routes.router)

@app.get("/")
def root():
    return {"message": "Finance Signal API is running"}