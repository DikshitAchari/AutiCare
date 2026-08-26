from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.database.connection import Base, engine
from app.models import user  # noqa: F401
from app.routes.assessment import router as assessment_router
from app.routes.auth import router as auth_router
from app.routes.chat import router as chat_router
from app.routes.prediction import router as prediction_router
from app.routes.users import router as users_router

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    description="AutiCare backend API for autism screening, child profile management, and prediction services.",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

app.include_router(auth_router)
app.include_router(users_router)
app.include_router(assessment_router)
app.include_router(prediction_router)
app.include_router(chat_router)


@app.get("/health")
def health_check():
    return {"status": "ok", "app": settings.app_name}
