from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from app.core.config import get_settings

settings = get_settings()

if settings.database_url.startswith("sqlite") and not settings.allow_sqlite_for_tests:
    raise RuntimeError(
        "SQLite database fallback is disabled for normal development. "
        "Set DATABASE_URL to a PostgreSQL connection string or ALLOW_SQLITE_FOR_TESTS=true for test-only runs."
    )

engine = create_engine(
    settings.database_url,
    connect_args={"check_same_thread": False} if settings.database_url.startswith("sqlite") else {},
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
