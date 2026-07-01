"""Shared utility functions."""

import uuid
import hashlib
import re
from datetime import datetime, timezone


def new_id() -> str:
    return str(uuid.uuid4())


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def strip_id(doc: dict | None) -> dict | None:
    if doc and "_id" in doc:
        doc.pop("_id")
    return doc


def hash_statement(statement: str) -> str:
    normalized = re.sub(r"\s+", " ", statement.lower().strip())
    return hashlib.sha256(normalized.encode()).hexdigest()


def compute_net_score(raw_marks: float, wrong_count: int, rate: float = 0.25) -> float:
    return raw_marks - (wrong_count * rate)
