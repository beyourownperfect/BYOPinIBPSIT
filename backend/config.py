"""Application configuration from environment variables."""

import os

MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "byopstudio_ibps")
CORS_ORIGINS = os.environ.get("CORS_ORIGINS", "*").split(",")
EXAM_DATE_DEFAULT = "2026-08-29"
NEGATIVE_MARKING_RATE = 0.25
PK_MARKS = 2
NON_PK_MARKS = 1
