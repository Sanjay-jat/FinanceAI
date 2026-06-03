import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import auth_routes, signal_routes
from ml.scheduler import start_scheduler

app = FastAPI(title="Finance Signal API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "https://finance-ai-eight-vert.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_routes.router)
app.include_router(signal_routes.router)

@app.on_event("startup")
async def startup():
    print("🚀 Starting FinanceAI backend...")
    print(f"📦 DATABASE_URL = {os.getenv('DATABASE_URL', 'NOT SET')[:50]}...")
    try:
        from database.connection import engine
        from database import models
        models.Base.metadata.create_all(bind=engine)
        print("✅ Database tables created / verified")
    except Exception as e:
        print(f"⚠️ Database connection failed: {e}")
        print("⚠️ App will start anyway — DB features may not work")
    start_scheduler()
    print("✅ Startup complete")

@app.get("/")
def root():
    return {"message": "Finance Signal API is running"}