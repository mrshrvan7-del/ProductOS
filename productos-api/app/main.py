from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.db.session import engine
from app.models.base import Base
from app.api.v1 import auth, projects, decisions, approvals

# Automatically create tables for SQLite/PostgreSQL on startup.
# In a full-blown production environment, Alembic migrations should be used.
# But for an out-of-the-box demo, auto-creating tables is extremely convenient.
try:
    Base.metadata.create_all(bind=engine)
    print("Database tables initialized successfully.")
except Exception as e:
    print(f"Error initializing database tables: {e}")

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For demo, allow all. In production, restrict to frontend URL.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
app.include_router(projects.router, prefix=f"{settings.API_V1_STR}/projects", tags=["projects"])
app.include_router(decisions.router, prefix=f"{settings.API_V1_STR}/decisions", tags=["decisions"])
app.include_router(approvals.router, prefix=f"{settings.API_V1_STR}/approvals", tags=["approvals"])

@app.get("/")
def read_root():
    return {
        "status": "online",
        "message": "ProductOS decision intelligence API is running.",
        "version": "v1"
    }
