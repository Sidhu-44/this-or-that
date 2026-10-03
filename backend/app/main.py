from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.config import settings
from app.database import engine, Base
from app.api import polls, admin
from app.timezone_utils import get_ist_now, get_current_ist_date
from sqlalchemy import text
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables on startup
    Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(
    title="ThisOrThat API",
    description="Backend API for ThisOrThat — a modern daily social voting app.",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for frontend clients
# Enable CORS for frontend clients

# Enable CORS for frontend clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://this-or-that-frontend.onrender.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Mount API Routers
app.include_router(polls.router)
app.include_router(admin.router)

@app.get("/health", tags=["system"])
def health_check():
    return {
        "status": "healthy",
        "app": "ThisOrThat",
        "ist_time": get_ist_now().isoformat(),
        "ist_date": str(get_current_ist_date())
    }
@app.get("/health/db")
def database_health():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e)
        }
    
@app.get("/", tags=["system"])
def root():
    return {
        "message": "Welcome to ThisOrThat API. Visit /docs for the interactive API documentation.",
        "today_ist": str(get_current_ist_date())
    }
