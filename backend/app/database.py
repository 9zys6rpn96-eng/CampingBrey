import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://camping:camping@localhost:5432/camping",
)

# Only enable SQL logging in development
ENABLE_SQL_LOGGING = os.getenv("ENV", "production").lower() == "development"

engine = create_engine(
    DATABASE_URL,
    echo=ENABLE_SQL_LOGGING,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,  # Validate connections before using
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()
