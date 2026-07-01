"""
BYOP Studio — IBPS SO (IT Officer)
FastAPI backend, single-file architecture.
"""

# ---------------------------------------------------------------------------
# 1. Imports & configuration
# ---------------------------------------------------------------------------
import os
import random
from datetime import date, timedelta, datetime, timezone
from fastapi import FastAPI, HTTPException, Query, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field, field_validator
import motor.motor_asyncio

import config
import utils
from syllabus import SECTIONS, PK_TOPICS, PK_SUBJECTS, PHASES, MARKS_CONFIG

app = FastAPI(title="BYOP Studio — IBPS SO", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# 2. Pydantic models
# ---------------------------------------------------------------------------

class QuestionIn(BaseModel):
    section: str
    subject: str | None = None
    topic: str | None = None
    statement: str
    options: dict  # {"A": "...", "B": "...", "C": "...", "D": "..."}
    correct_answer: str  # "A" | "B" | "C" | "D"
    explanation: str = ""
    notes: str = ""
    marks: int | None = None
    difficulty: str = "medium"
    phase: str = "both"
    exam_source: str = "IBPS"
    year: int | None = None

    @field_validator("section")
    @classmethod
    def section_must_exist(cls, v):
        if v not in SECTIONS:
            raise ValueError(f"Invalid section: {v}")
        return v

    @field_validator("topic")
    @classmethod
    def topic_must_exist(cls, v, info):
        if v and info.data.get("section") in PK_TOPICS:
            if v not in PK_TOPICS.get(info.data["section"], []):
                raise ValueError(f"Invalid topic '{v}' for section '{info.data['section']}'")
        return v

    @field_validator("correct_answer")
    @classmethod
    def answer_must_be_valid(cls, v):
        if v not in ("A", "B", "C", "D"):
            raise ValueError("correct_answer must be A, B, C, or D")
        return v


class AttemptIn(BaseModel):
    question_id: str
    selected_option: str | None = None
    confidence: int = 0
    time_taken_sec: int = 0
    practice_mode: str = "all"


class PracticeSubmitResponse(BaseModel):
    correct: bool
    correct_answer: str
    marks_earned: float
    penalty: float
    net_score: float
    accuracy_pct: float
    explanation: str
    total_attempts: int
    correct_attempts: int
    wrong_attempts: int
    avg_time_sec: float | None = None


class MockSectionConfig(BaseModel):
    key: str
    total_questions: int
    marks_per_question: int
    time_limit_minutes: int
    negative_marking: float = 0.25


class MockTestIn(BaseModel):
    phase: str
    title: str | None = None
    sections: list[MockSectionConfig] | None = None


class MockSectionAnswers(BaseModel):
    key: str
    answers: dict[str, str | None]  # question_id -> selected_option or null
    time_spent_sec: int
    marked_for_review: list[str] = []


class ExternalMockIn(BaseModel):
    source_name: str
    phase: str
    sections: list[dict]
    overall: dict
    taken_at: str


class SettingsIn(BaseModel):
    exam_date_prelims: str | None = None
    exam_date_mains: str | None = None
    daily_practice_target: int | None = None
    daily_mock_target: int | None = None
    daily_study_minutes_target: int | None = None
    phase_focus: str | None = None
    theme: str | None = None


class CoverageUpdate(BaseModel):
    section: str
    topic: str
    status: str = "not_started"
    lectures: int = 0
    notes: bool = False


# ---------------------------------------------------------------------------
# 3. MongoDB connection
# ---------------------------------------------------------------------------
db = None


async def get_db():
    if db is None:
        raise HTTPException(status_code=503, detail="Database not connected")
    return db


async def connect_db():
    global db
    use_mock = os.environ.get("MOCK_DB", "true").lower() == "true"
    if use_mock:
        from mongomock_motor import AsyncMongoMockClient
        client = AsyncMongoMockClient()
    else:
        client = motor.motor_asyncio.AsyncIOMotorClient(config.MONGO_URL)
    db = client[config.DB_NAME]

    # Ensure indexes
    await db.questions.create_index([("section", 1), ("subject", 1), ("topic", 1)])
    await db.questions.create_index("statement_hash", unique=True)
    await db.questions.create_index("bookmarked")
    await db.questions.create_index("phase")
    await db.attempts.create_index([("question_id", 1), ("created_at", -1)])
    await db.attempts.create_index([("section", 1), ("created_at", -1)])
    await db.attempts.create_index("mock_attempt_id")
    await db.study_logs.create_index([("date", -1)])
    await db.study_logs.create_index([("section", 1), ("date", -1)])
    await db.mock_attempts.create_index("mock_test_id")
    await db.mock_attempts.create_index([("completed_at", -1)])


@app.on_event("startup")
async def startup():
    await connect_db()


# ---------------------------------------------------------------------------
# 4. Route definitions
# ---------------------------------------------------------------------------

# -- Meta -------------------------------------------------------------------

@app.get("/api/ibps/meta")
async def get_meta():
    return {
        "sections": SECTIONS,
        "pk_subjects": PK_SUBJECTS,
        "pk_topics": PK_TOPICS,
        "phases": PHASES,
        "marks_config": MARKS_CONFIG,
    }


# -- Questions --------------------------------------------------------------

@app.get("/api/ibps/questions")
async def list_questions(
    section: str | None = Query(None),
    subject: str | None = Query(None),
    topic: str | None = Query(None),
    status: str | None = Query(None),
    search: str | None = Query(None),
    bookmarked: bool | None = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
):
    coll = (await get_db()).questions
    filt = {}
    if section:
        filt["section"] = section
    if subject:
        filt["subject"] = subject
    if topic:
        filt["topic"] = topic
    if bookmarked is not None:
        filt["bookmarked"] = bookmarked
    if search:
        filt["$or"] = [
            {"statement": {"$regex": search, "$options": "i"}},
            {"explanation": {"$regex": search, "$options": "i"}},
            {"notes": {"$regex": search, "$options": "i"}},
        ]

    # Status-based filtering
    if status:
        attempts_coll = (await get_db()).attempts
        if status == "attempted":
            qids_with_attempts = await attempts_coll.distinct("question_id", {"source": "practice"})
            filt["id"] = {"$in": qids_with_attempts}
        elif status == "unattempted":
            qids_with_attempts = await attempts_coll.distinct("question_id", {"source": "practice"})
            filt["id"] = {"$nin": qids_with_attempts}
        elif status == "correct":
            latest_pipeline = [
                {"$match": {"source": "practice"}},
                {"$sort": {"created_at": -1}},
                {"$group": {"_id": "$question_id", "correct": {"$first": "$correct"}}},
                {"$match": {"correct": True}},
            ]
            correct_qids = [d["_id"] for d in await attempts_coll.aggregate(latest_pipeline).to_list(None)]
            filt["id"] = {"$in": correct_qids}
        elif status == "wrong":
            latest_pipeline = [
                {"$match": {"source": "practice"}},
                {"$sort": {"created_at": -1}},
                {"$group": {"_id": "$question_id", "correct": {"$first": "$correct"}}},
                {"$match": {"correct": False}},
            ]
            wrong_qids = [d["_id"] for d in await attempts_coll.aggregate(latest_pipeline).to_list(None)]
            filt["id"] = {"$in": wrong_qids}
        # "bookmarked" is already handled by the bookmarked query param

    total = await coll.count_documents(filt)
    cursor = coll.find(filt, {"_id": 0}).skip((page - 1) * limit).limit(limit).sort("created_at", -1)
    questions = await cursor.to_list(limit)

    # Enrich with attempt stats (batch aggregation)
    if questions:
        qids = [q["id"] for q in questions]
        pipeline = [
            {"$match": {"question_id": {"$in": qids}}},
            {"$group": {
                "_id": "$question_id",
                "total_attempts": {"$sum": 1},
                "correct_count": {"$sum": {"$cond": ["$correct", 1, 0]}},
                "wrong_count": {"$sum": {"$cond": ["$correct", 0, 1]}},
                "avg_time": {"$avg": "$time_taken_sec"},
            }},
        ]
        attempts_coll = (await get_db()).attempts
        stats_list = await attempts_coll.aggregate(pipeline).to_list(None)
        stats_map = {s["_id"]: s for s in stats_list}

        # Latest attempt per question
        latest_pipeline = [
            {"$match": {"question_id": {"$in": qids}}},
            {"$sort": {"created_at": -1}},
            {"$group": {
                "_id": "$question_id",
                "correct": {"$first": "$correct"},
            }},
        ]
        latest_list = await attempts_coll.aggregate(latest_pipeline).to_list(None)
        latest_map = {l["_id"]: l["correct"] for l in latest_list}

        for q in questions:
            s = stats_map.get(q["id"], {})
            q["total_attempts"] = s.get("total_attempts", 0)
            q["correct_count"] = s.get("correct_count", 0)
            q["wrong_count"] = s.get("wrong_count", 0)
            q["avg_time_sec"] = round(s.get("avg_time", 0), 0) if s.get("avg_time") else None
            q["latest_attempt_correct"] = latest_map.get(q["id"])

    return {"items": questions, "total": total, "page": page, "limit": limit}


@app.post("/api/ibps/questions")
async def create_question(
    data: QuestionIn,
    force: bool = Query(False, description="Skip duplicate check and force create"),
):
    coll = (await get_db()).questions
    qid = utils.new_id()
    now = utils.now_iso()

    # Auto-set marks based on section if not provided
    marks = data.marks
    if marks is None:
        section_type = SECTIONS.get(data.section, {}).get("type", "non_pk")
        marks = MARKS_CONFIG["pk"] if section_type == "pk" else MARKS_CONFIG["non_pk"]

    subject = data.subject or data.section
    topic = data.topic or (None if SECTIONS.get(data.section, {}).get("has_topics") else None)

    # Duplicate check — return warning instead of error
    stmt_hash = utils.hash_statement(data.statement)
    existing = await coll.find_one({"statement_hash": stmt_hash})
    if existing and not force:
        return {
            "duplicate_warning": True,
            "existing": {
                "id": existing.get("id"),
                "statement": existing.get("statement")[:80],
                "section": existing.get("section"),
            },
            "message": "Similar question exists. Send force=true to create anyway.",
        }

    doc = {
        "id": qid,
        "section": data.section,
        "subject": subject,
        "topic": topic,
        "statement": data.statement,
        "statement_hash": stmt_hash,
        "question_type": "mcq",
        "options": data.options,
        "correct_answer": data.correct_answer,
        "explanation": data.explanation,
        "notes": data.notes,
        "marks": marks,
        "difficulty": data.difficulty,
        "phase": data.phase,
        "exam_source": data.exam_source,
        "year": data.year,
        "bookmarked": False,
        "created_at": now,
        "updated_at": now,
    }
    await coll.insert_one(doc)
    doc.pop("_id", None)
    return doc


@app.get("/api/ibps/questions/{qid}")
async def get_question(qid: str):
    coll = (await get_db()).questions
    doc = await coll.find_one({"id": qid}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Question not found")

    # Enrich with attempt stats
    attempts_coll = (await get_db()).attempts
    pipeline = [
        {"$match": {"question_id": qid}},
        {"$group": {
            "_id": None,
            "total_attempts": {"$sum": 1},
            "correct_count": {"$sum": {"$cond": ["$correct", 1, 0]}},
            "wrong_count": {"$sum": {"$cond": ["$correct", 0, 1]}},
            "avg_time": {"$avg": "$time_taken_sec"},
        }},
    ]
    stats = await attempts_coll.aggregate(pipeline).to_list(1)
    if stats:
        doc["total_attempts"] = stats[0].get("total_attempts", 0)
        doc["correct_count"] = stats[0].get("correct_count", 0)
        doc["wrong_count"] = stats[0].get("wrong_count", 0)
        doc["avg_time_sec"] = round(stats[0].get("avg_time", 0), 0) if stats[0].get("avg_time") else None
    else:
        doc["total_attempts"] = 0
        doc["correct_count"] = 0
        doc["wrong_count"] = 0
        doc["avg_time_sec"] = None

    doc["latest_attempt_correct"] = None
    latest = await attempts_coll.find_one({"question_id": qid}, sort=[("created_at", -1)])
    if latest:
        doc["latest_attempt_correct"] = latest.get("correct")

    return doc


@app.put("/api/ibps/questions/{qid}")
async def update_question(qid: str, data: QuestionIn):
    coll = (await get_db()).questions
    existing = await coll.find_one({"id": qid})
    if not existing:
        raise HTTPException(status_code=404, detail="Question not found")

    marks = data.marks
    if marks is None:
        section_type = SECTIONS.get(data.section, {}).get("type", "non_pk")
        marks = MARKS_CONFIG["pk"] if section_type == "pk" else MARKS_CONFIG["non_pk"]

    subject = data.subject or data.section
    topic = data.topic or (None if SECTIONS.get(data.section, {}).get("has_topics") else None)
    stmt_hash = utils.hash_statement(data.statement)

    await coll.update_one({"id": qid}, {"$set": {
        "section": data.section,
        "subject": subject,
        "topic": topic,
        "statement": data.statement,
        "statement_hash": stmt_hash,
        "options": data.options,
        "correct_answer": data.correct_answer,
        "explanation": data.explanation,
        "notes": data.notes,
        "marks": marks,
        "difficulty": data.difficulty,
        "phase": data.phase,
        "exam_source": data.exam_source,
        "year": data.year,
        "updated_at": utils.now_iso(),
    }})

    updated = await coll.find_one({"id": qid}, {"_id": 0})
    return updated


@app.delete("/api/ibps/questions/{qid}")
async def delete_question(qid: str):
    coll = (await get_db()).questions
    result = await coll.delete_one({"id": qid})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Question not found")
    # Cascade delete attempts
    await (await get_db()).attempts.delete_many({"question_id": qid})
    return {"deleted": True}


@app.post("/api/ibps/questions/bulk-create")
async def bulk_create_questions(rows: list[QuestionIn]):
    coll = (await get_db()).questions
    now = utils.now_iso()
    docs = []
    for data in rows:
        marks = data.marks
        if marks is None:
            section_type = SECTIONS.get(data.section, {}).get("type", "non_pk")
            marks = MARKS_CONFIG["pk"] if section_type == "pk" else MARKS_CONFIG["non_pk"]
        docs.append({
            "id": utils.new_id(),
            "section": data.section,
            "subject": data.subject or data.section,
            "topic": data.topic or (None if SECTIONS.get(data.section, {}).get("has_topics") else None),
            "statement": data.statement,
            "statement_hash": utils.hash_statement(data.statement),
            "question_type": "mcq",
            "options": data.options,
            "correct_answer": data.correct_answer,
            "explanation": data.explanation,
            "notes": data.notes,
            "marks": marks,
            "difficulty": data.difficulty,
            "phase": data.phase,
            "exam_source": data.exam_source,
            "year": data.year,
            "bookmarked": False,
            "created_at": now,
            "updated_at": now,
        })
    # Insert with ordered=False to skip duplicates
    result = await coll.insert_many(docs, ordered=False)
    return {"inserted": len(result.inserted_ids)}


@app.post("/api/ibps/questions/bulk-delete")
async def bulk_delete_questions(ids: list[str] = Body(..., embed=True)):
    coll = (await get_db()).questions
    result = await coll.delete_many({"id": {"$in": ids}})
    # Cascade delete attempts
    await (await get_db()).attempts.delete_many({"question_id": {"$in": ids}})
    return {"deleted": result.deleted_count}


@app.post("/api/ibps/questions/{qid}/bookmark")
async def toggle_bookmark(qid: str):
    coll = (await get_db()).questions
    q = await coll.find_one({"id": qid})
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    new_val = not q.get("bookmarked", False)
    await coll.update_one({"id": qid}, {"$set": {"bookmarked": new_val, "updated_at": utils.now_iso()}})
    return {"id": qid, "bookmarked": new_val}


@app.get("/api/ibps/questions/{qid}/attempts")
async def get_question_attempts(qid: str, limit: int = Query(10, ge=1, le=100)):
    coll = (await get_db()).attempts
    docs = await coll.find({"question_id": qid}, {"_id": 0}).sort("created_at", -1).to_list(limit)
    return {"items": docs}


# -- Practice ---------------------------------------------------------------

@app.get("/api/ibps/practice/next")
async def practice_next(
    section: str = Query(...),
    subject: str | None = Query(None),
    topic: str | None = Query(None),
    mode: str = Query("all"),
    exclude_ids: str = Query(""),
):
    """Get the next question for practice based on mode selection logic."""
    coll = (await get_db()).questions
    attempts_coll = (await get_db()).attempts
    excluded = exclude_ids.split(",") if exclude_ids else []

    filt = {}
    if section:
        filt["section"] = section
    if subject:
        filt["subject"] = subject
    if topic:
        filt["topic"] = topic

    if mode == "new":
        # Questions with zero attempts
        attempted_qids_docs = await attempts_coll.aggregate([
            {"$match": {"section": section, "source": "practice"}},
            {"$group": {"_id": "$question_id"}},
        ]).to_list(None)
        attempted_qids = {d["_id"] for d in attempted_qids_docs}
        filt["id"] = {"$nin": list(attempted_qids | set(excluded))}

    elif mode == "wrong":
        # Latest attempt per question where wrong
        latest_wrong = await attempts_coll.aggregate([
            {"$match": {"section": section, "source": "practice"}},
            {"$sort": {"created_at": -1}},
            {"$group": {"_id": "$question_id", "correct": {"$first": "$correct"}, "created_at": {"$first": "$created_at"}}},
            {"$match": {"correct": False}},
            {"$sort": {"created_at": 1}},
        ]).to_list(None)
        wrong_qids = [d["_id"] for d in latest_wrong if d["_id"] not in excluded]
        if not wrong_qids:
            raise HTTPException(status_code=404, detail="No wrong-answer questions found")
        target_qid = random.choice(wrong_qids)
        doc = await coll.find_one({"id": target_qid}, {"_id": 0})
        if not doc:
            raise HTTPException(status_code=404, detail="Question not found")
        return enrich_question(doc)

    elif mode == "weak":
        # Questions with >=3 attempts and <50% accuracy
        weak = await attempts_coll.aggregate([
            {"$match": {"section": section, "source": "practice"}},
            {"$group": {
                "_id": "$question_id",
                "total_attempts": {"$sum": 1},
                "correct_count": {"$sum": {"$cond": ["$correct", 1, 0]}},
            }},
            {"$match": {"total_attempts": {"$gte": 3}}},
            {"$project": {
                "accuracy_pct": {"$multiply": [{"$divide": ["$correct_count", "$total_attempts"]}, 100]},
            }},
            {"$match": {"accuracy_pct": {"$lt": 50.0}}},
            {"$sort": {"accuracy_pct": 1}},
        ]).to_list(None)
        weak_qids = [d["_id"] for d in weak if d["_id"] not in excluded]
        if not weak_qids:
            raise HTTPException(status_code=404, detail="No weak questions found")
        target_qid = random.choice(weak_qids)
        doc = await coll.find_one({"id": target_qid}, {"_id": 0})
        if not doc:
            raise HTTPException(status_code=404, detail="Question not found")
        return enrich_question(doc)

    elif mode == "bookmarked":
        filt["bookmarked"] = True
    elif mode == "mistakes":
        # Questions with at least one wrong attempt
        wrong_qids_docs = await attempts_coll.aggregate([
            {"$match": {"section": section, "source": "practice", "correct": False}},
            {"$group": {"_id": "$question_id"}},
        ]).to_list(None)
        mistake_qids = [d["_id"] for d in wrong_qids_docs if d["_id"] not in excluded]
        if not mistake_qids:
            raise HTTPException(status_code=404, detail="No mistake questions found")
        filt["id"] = {"$in": mistake_qids}

    if excluded and "id" not in filt:
        filt["id"] = {"$nin": excluded}

    cursor = coll.aggregate([
        {"$match": filt},
        {"$sample": {"size": 1}},
        {"$project": {"_id": 0}},
    ])
    docs = await cursor.to_list(1)
    if not docs:
        raise HTTPException(status_code=404, detail="No questions found for the given criteria")
    doc = docs[0]
    return enrich_question(doc)


def enrich_question(doc: dict) -> dict:
    """Attach attempt stats to a question document (placeholder for future enrichment)."""
    doc["total_attempts"] = 0
    doc["correct_count"] = 0
    doc["wrong_count"] = 0
    doc["avg_time_sec"] = None
    doc["latest_attempt_correct"] = None
    return doc


@app.post("/api/ibps/practice/submit")
async def practice_submit(data: AttemptIn):
    coll = (await get_db()).questions
    attempts_coll = (await get_db()).attempts

    question = await coll.find_one({"id": data.question_id}, {"_id": 0})
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    section = question["section"]
    is_correct = data.selected_option == question["correct_answer"]
    marks_earned = question["marks"] if is_correct else 0
    penalty = 0.25 if data.selected_option and not is_correct else 0

    now = utils.now_iso()
    attempt_doc = {
        "id": utils.new_id(),
        "question_id": data.question_id,
        "section": section,
        "subject": question.get("subject", section),
        "topic": question.get("topic"),
        "correct": is_correct,
        "selected_option": data.selected_option,
        "confidence": data.confidence,
        "time_taken_sec": data.time_taken_sec,
        "marks_earned": marks_earned,
        "penalty": penalty,
        "practice_mode": data.practice_mode,
        "source": "practice",
        "mock_attempt_id": None,
        "created_at": now,
    }
    await attempts_coll.insert_one(attempt_doc)

    net_score = marks_earned - penalty

    # Compute accuracy
    stats = await attempts_coll.aggregate([
        {"$match": {"question_id": data.question_id, "source": "practice"}},
        {"$group": {
            "_id": None,
            "total": {"$sum": 1},
            "correct": {"$sum": {"$cond": ["$correct", 1, 0]}},
            "wrong": {"$sum": {"$cond": ["$correct", 0, 1]}},
            "avg_time": {"$avg": "$time_taken_sec"},
        }},
    ]).to_list(1)

    total = stats[0]["total"] if stats else 1
    correct = stats[0]["correct"] if stats else (1 if is_correct else 0)
    wrong = stats[0]["wrong"] if stats else (0 if is_correct else 1)
    avg_time = round(stats[0]["avg_time"], 0) if stats and stats[0].get("avg_time") else None
    accuracy_pct = round((correct / total) * 100, 1) if total > 0 else 0.0

    return PracticeSubmitResponse(
        correct=is_correct,
        correct_answer=question["correct_answer"],
        marks_earned=marks_earned,
        penalty=penalty,
        net_score=net_score,
        accuracy_pct=accuracy_pct,
        explanation=question.get("explanation", ""),
        total_attempts=total,
        correct_attempts=correct,
        wrong_attempts=wrong,
        avg_time_sec=avg_time,
    )


class PracticeCompleteIn(BaseModel):
    section: str
    subject: str | None = None
    total_questions: int = 0
    total_time_sec: int = 0
    correct_count: int = 0
    wrong_count: int = 0
    practiced_at: str | None = None  # ISO date string


@app.post("/api/ibps/practice/complete")
async def practice_complete(data: PracticeCompleteIn):
    """Record a completed practice session as a study log entry."""
    coll = (await get_db()).study_logs
    today = data.practiced_at or date.today().isoformat()
    total = data.correct_count + data.wrong_count

    doc = {
        "id": utils.new_id(),
        "section": data.section,
        "subject": data.subject or data.section,
        "activity": "practice",
        "duration_min": max(1, round(data.total_time_sec / 60)),
        "questions_attempted": total,
        "questions_correct": data.correct_count,
        "questions_wrong": data.wrong_count,
        "accuracy_pct": round((data.correct_count / total) * 100, 1) if total > 0 else 0,
        "date": today,
        "created_at": utils.now_iso(),
    }
    await coll.insert_one(doc)
    doc.pop("_id", None)
    return doc


class PracticeAnswerIn(BaseModel):
    question_id: str
    selected_option: str | None = None
    time_taken_sec: int = 0


class PracticeBatchSubmitIn(BaseModel):
    section: str
    answers: list[PracticeAnswerIn]
    practice_mode: str = "all"


@app.get("/api/ibps/practice/questions")
async def practice_questions(
    section: str = Query(...),
    mode: str = Query("all"),
    count: int = Query(25, ge=1, le=100),
    exclude_ids: str = Query(""),
    difficulty: str | None = Query(None),
):
    """Return a batch of questions for a practice session."""
    coll = (await get_db()).questions
    attempts_coll = (await get_db()).attempts
    excluded = exclude_ids.split(",") if exclude_ids else []

    filt = {"section": section}
    if difficulty and difficulty != "any":
        filt["difficulty"] = difficulty

    if mode == "new":
        attempted = await attempts_coll.aggregate([
            {"$match": {"section": section, "source": "practice"}},
            {"$group": {"_id": "$question_id"}},
        ]).to_list(None)
        attempted_qids = {d["_id"] for d in attempted}
        filt["id"] = {"$nin": list(attempted_qids | set(excluded))}
    elif mode == "bookmarked":
        filt["bookmarked"] = True
    elif mode == "mistakes":
        wrong_ids = await attempts_coll.aggregate([
            {"$match": {"section": section, "source": "practice", "correct": False}},
            {"$group": {"_id": "$question_id"}},
        ]).to_list(None)
        mistake_qids = [d["_id"] for d in wrong_ids if d["_id"] not in excluded]
        filt["id"] = {"$in": mistake_qids} if mistake_qids else {"$in": []}
    elif mode == "wrong":
        latest_wrong = await attempts_coll.aggregate([
            {"$match": {"section": section, "source": "practice"}},
            {"$sort": {"created_at": -1}},
            {"$group": {"_id": "$question_id", "correct": {"$first": "$correct"}}},
            {"$match": {"correct": False}},
        ]).to_list(None)
        wrong_qids = [d["_id"] for d in latest_wrong if d["_id"] not in excluded]
        filt["id"] = {"$in": wrong_qids} if wrong_qids else {"$in": []}
    elif mode == "weak":
        weak = await attempts_coll.aggregate([
            {"$match": {"section": section, "source": "practice"}},
            {"$group": {"_id": "$question_id", "total": {"$sum": 1}, "correct": {"$sum": {"$cond": ["$correct", 1, 0]}}}},
            {"$match": {"total": {"$gte": 3}}},
            {"$project": {"accuracy": {"$multiply": [{"$divide": ["$correct", "$total"]}, 100]}}},
            {"$match": {"accuracy": {"$lt": 50.0}}},
        ]).to_list(None)
        weak_qids = [d["_id"] for d in weak if d["_id"] not in excluded]
        filt["id"] = {"$in": weak_qids} if weak_qids else {"$in": []}
    else:
        if excluded:
            filt["id"] = {"$nin": excluded}

    cursor = coll.aggregate([
        {"$match": filt},
        {"$sample": {"size": count}},
        {"$project": {"_id": 0}},
    ])
    questions = await cursor.to_list(count)
    total_available = await coll.count_documents(filt)

    for q in questions:
        q["total_attempts"] = 0
        q["correct_count"] = 0
        q["wrong_count"] = 0
        q["avg_time_sec"] = None

    return {"questions": questions, "total": min(total_available, count)}


@app.post("/api/ibps/practice/batch-submit")
async def practice_batch_submit(data: PracticeBatchSubmitIn):
    """Submit all answers from a completed practice session at once."""
    coll = (await get_db()).questions
    attempts_coll = (await get_db()).attempts
    now = utils.now_iso()
    results = []
    total_marks = 0
    total_penalty = 0.0
    correct_count = 0
    wrong_count = 0

    for ans in data.answers:
        question = await coll.find_one({"id": ans.question_id}, {"_id": 0})
        if not question:
            continue

        is_correct = ans.selected_option == question["correct_answer"]
        marks_earned = question["marks"] if is_correct else 0
        penalty = 0.25 if ans.selected_option and not is_correct else 0

        await attempts_coll.insert_one({
            "id": utils.new_id(),
            "question_id": ans.question_id,
            "section": data.section,
            "subject": question.get("subject", data.section),
            "topic": question.get("topic"),
            "correct": is_correct,
            "selected_option": ans.selected_option,
            "confidence": 3,
            "time_taken_sec": ans.time_taken_sec,
            "marks_earned": marks_earned,
            "penalty": penalty,
            "practice_mode": data.practice_mode,
            "source": "practice",
            "mock_attempt_id": None,
            "created_at": now,
        })

        results.append({
            "question_id": ans.question_id,
            "correct": is_correct,
            "correct_answer": question["correct_answer"],
            "marks_earned": marks_earned,
            "penalty": penalty,
            "explanation": question.get("explanation", ""),
        })
        total_marks += marks_earned
        total_penalty += penalty
        if is_correct:
            correct_count += 1
        else:
            wrong_count += 1

    # Log study session
    total_qs = correct_count + wrong_count
    if total_qs > 0:
        await (await get_db()).study_logs.insert_one({
            "id": utils.new_id(),
            "section": data.section,
            "subject": data.section,
            "activity": "practice",
            "duration_min": max(1, round(sum(a.time_taken_sec for a in data.answers) / 60)),
            "questions_attempted": total_qs,
            "questions_correct": correct_count,
            "questions_wrong": wrong_count,
            "accuracy_pct": round((correct_count / total_qs) * 100, 1),
            "date": date.today().isoformat(),
            "created_at": now,
        })

    return {
        "results": results,
        "summary": {
            "correct": correct_count,
            "wrong": wrong_count,
            "total_marks": total_marks,
            "total_penalty": round(total_penalty, 2),
            "net_score": round(total_marks - total_penalty, 2),
            "total_questions": total_qs,
        },
    }


# -- Mocks ------------------------------------------------------------------

@app.get("/api/ibps/mocks")
async def list_mocks():
    coll = (await get_db()).mock_tests
    docs = await coll.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return {"items": docs}


@app.post("/api/ibps/mocks")
async def create_mock(data: MockTestIn):
    if data.phase not in PHASES:
        raise HTTPException(status_code=400, detail="Invalid phase")

    phase_config = PHASES[data.phase]
    sections = data.sections
    if not sections:
        sections = []
        for sk in phase_config["sections"]:
            sc = phase_config["section_configs"][sk]
            sections.append(MockSectionConfig(
                key=sk,
                total_questions=sc["total_questions"],
                marks_per_question=sc["marks_per_question"],
                time_limit_minutes=sc["time_limit_minutes"],
                negative_marking=sc["negative_marking"],
            ))

    title = data.title or f"{data.phase.capitalize()} Mock #{await (await get_db()).mock_tests.count_documents({}) + 1}"

    doc = {
        "id": utils.new_id(),
        "phase": data.phase,
        "title": title,
        "sections": [s.model_dump() for s in sections],
        "total_questions": sum(s.total_questions for s in sections),
        "total_marks": sum(s.total_questions * s.marks_per_question for s in sections),
        "total_time_minutes": sum(s.time_limit_minutes for s in sections),
        "question_selection": {"strategy": "random"},
        "created_at": utils.now_iso(),
    }
    await (await get_db()).mock_tests.insert_one(doc)
    doc.pop("_id", None)
    return doc


@app.get("/api/ibps/mocks/results")
async def list_mock_results(source: str | None = Query(None)):
    coll = (await get_db()).mock_attempts
    filt = {"status": "completed"}
    if source and source != "all":
        filt["source"] = source
    docs = await coll.find(filt, {"_id": 0}).sort("completed_at", -1).to_list(100)
    return {"items": docs}


@app.post("/api/ibps/mocks/external")
async def log_external_mock(data: ExternalMockIn):
    coll = (await get_db()).mock_attempts
    doc = {
        "id": utils.new_id(),
        "source": "external",
        "source_name": data.source_name,
        "phase": data.phase,
        "sections": data.sections,
        "overall": data.overall,
        "taken_at": data.taken_at,
        "status": "completed",
        "completed_at": utils.now_iso(),
        "created_at": utils.now_iso(),
    }
    await coll.insert_one(doc)
    doc.pop("_id", None)
    return doc


@app.get("/api/ibps/mocks/{mid}")
async def get_mock(mid: str):
    doc = await (await get_db()).mock_tests.find_one({"id": mid}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Mock not found")
    return doc


@app.post("/api/ibps/mocks/{mid}/start")
async def start_mock(mid: str):
    """Start an internal mock attempt — select questions, return first section."""
    mock = await (await get_db()).mock_tests.find_one({"id": mid})
    if not mock:
        raise HTTPException(status_code=404, detail="Mock not found")

    questions_coll = (await get_db()).questions
    attempt_id = utils.new_id()
    section_questions = {}
    pk_subject_list = ["dbms", "cn", "os", "pds", "se", "infosec", "webtech", "coa", "cloud"]

    for section_conf in mock["sections"]:
        sk = section_conf["key"]
        count = section_conf["total_questions"]

        # For Mains PK section, distribute across 9 PK subjects proportionally
        if mock.get("phase") == "mains" and sk == "dbms" and len(mock["sections"]) == 4:
            # Proportional stratified sampling across PK subjects
            pk_questions = []
            total_pk_available = await questions_coll.count_documents({
                "section": {"$in": pk_subject_list},
                "phase": {"$in": ["mains", "both"]},
            })
            if total_pk_available > 0:
                for subj, weight in [
                    ("dbms", 8), ("cn", 8), ("os", 7), ("pds", 7), ("se", 5),
                    ("infosec", 5), ("webtech", 5), ("coa", 3), ("cloud", 2),
                ]:
                    subj_count = max(1, round(count * weight / 50))
                    qs = await questions_coll.aggregate([
                        {"$match": {"section": subj, "phase": {"$in": ["mains", "both"]}}},
                        {"$sample": {"size": subj_count}},
                        {"$project": {"_id": 0, "id": 1, "section": 1, "subject": 1, "statement": 1, "options": 1, "marks": 1}},
                    ]).to_list(subj_count)
                    pk_questions.extend(qs)
                qs = pk_questions[:count]
            else:
                qs = []
        else:
            qs = await questions_coll.aggregate([
                {"$match": {"section": sk, "phase": {"$in": [mock["phase"], "both"]}}},
                {"$sample": {"size": count}},
                {"$project": {"_id": 0, "id": 1, "section": 1, "subject": 1, "statement": 1, "options": 1, "marks": 1}},
            ]).to_list(count)
        section_questions[sk] = qs

    now = utils.now_iso()
    # Store sections as an object (keyed by section key) for easy $set updates
    sections_obj = {}
    section_order = []
    for s in mock["sections"]:
        sk = s["key"]
        section_order.append(sk)
        qs = section_questions.get(sk, [])
        sections_obj[sk] = {
            "key": sk,
            "label": SECTIONS.get(sk, {}).get("label", sk),
            "question_ids": [q["id"] for q in qs],
            "answers": {},
            "marked_for_review": [],
            "time_spent_sec": 0,
            "time_limit_sec": s["time_limit_minutes"] * 60,
            "marks_per_question": s["marks_per_question"],
            "negative_marking": s["negative_marking"],
        }

    attempt_doc = {
        "id": attempt_id,
        "mock_test_id": mid,
        "phase": mock["phase"],
        "status": "in_progress",
        "started_at": now,
        "sections": sections_obj,
        "section_order": section_order,
        "overall": {},
        "created_at": now,
    }
    await (await get_db()).mock_attempts.insert_one(attempt_doc)

    first_key = section_order[0]
    first_cfg = next(s for s in mock["sections"] if s["key"] == first_key)
    return {
        "mock_attempt_id": attempt_id,
        "mock_title": mock["title"],
        "section": {
            "key": first_key,
            "label": SECTIONS.get(first_key, {}).get("label", first_key),
            "total_questions": first_cfg["total_questions"],
            "time_limit_sec": first_cfg["time_limit_minutes"] * 60,
            "marks_per_question": first_cfg["marks_per_question"],
            "negative_marking": first_cfg["negative_marking"],
            "questions": section_questions.get(first_key, []),
        },
        "section_index": 0,
        "section_order": section_order,
        "total_sections": len(section_order),
    }


@app.post("/api/ibps/mocks/{mid}/submit-section")
async def submit_mock_section(mid: str, data: MockSectionAnswers):
    mock = await (await get_db()).mock_tests.find_one({"id": mid})
    if not mock:
        raise HTTPException(status_code=404, detail="Mock not found")

    attempts_coll = (await get_db()).mock_attempts
    attempt = await attempts_coll.find_one({"mock_test_id": mid, "status": "in_progress"})
    if not attempt:
        raise HTTPException(status_code=404, detail="No in-progress mock attempt found")

    questions_coll = (await get_db()).questions
    section_conf = None
    for s in mock["sections"]:
        if s["key"] == data.key:
            section_conf = s
            break
    if not section_conf:
        raise HTTPException(status_code=400, detail="Invalid section key")

    # Compute scores
    q_map = {}
    for qid in data.answers.keys():
        q = await questions_coll.find_one({"id": qid}, {"_id": 0, "correct_answer": 1, "marks": 1})
        if q:
            q_map[qid] = q

    correct_count = 0
    wrong_count = 0
    raw_marks = 0
    for qid, selected in data.answers.items():
        q = q_map.get(qid)
        if selected is None:
            continue
        if q and selected == q["correct_answer"]:
            correct_count += 1
            raw_marks += q.get("marks", 1)
        else:
            wrong_count += 1

    negative_marks = wrong_count * 0.25
    net_marks = raw_marks - negative_marks
    attempted = len([a for a in data.answers.values() if a is not None])
    skipped = len(data.answers) - attempted

    # Update the mock attempt section data (sections is a dict)
    section_data = {
        "key": data.key,
        "answers": data.answers,
        "marked_for_review": data.marked_for_review,
        "time_spent_sec": data.time_spent_sec,
        "time_limit_sec": section_conf["time_limit_minutes"] * 60,
        "marks_per_question": section_conf["marks_per_question"],
        "negative_marking": section_conf["negative_marking"],
        "raw_marks": raw_marks,
        "negative_marks": negative_marks,
        "net_marks": net_marks,
        "correct_count": correct_count,
        "wrong_count": wrong_count,
        "skipped_count": skipped,
        "attempted_count": attempted,
    }

    await attempts_coll.update_one(
        {"_id": attempt["_id"]},
        {"$set": {f"sections.{data.key}": section_data}},
    )

    # Find next section using section_order
    section_order = attempt.get("section_order", [s["key"] for s in mock["sections"]])
    current_idx = section_order.index(data.key)
    next_idx = current_idx + 1

    if next_idx >= len(section_order):
        return {"completed": True, "section_result": section_data, "next_section": None}

    next_key = section_order[next_idx]
    next_cfg = next(s for s in mock["sections"] if s["key"] == next_key)
    questions = await questions_coll.aggregate([
        {"$match": {"section": next_key, "phase": {"$in": [mock["phase"], "both"]}}},
        {"$sample": {"size": next_cfg["total_questions"]}},
        {"$project": {"_id": 0, "id": 1, "section": 1, "subject": 1, "statement": 1, "options": 1, "marks": 1}},
    ]).to_list(next_cfg["total_questions"])

    return {
        "completed": False,
        "section_result": section_data,
        "next_section": {
            "key": next_key,
            "label": SECTIONS.get(next_key, {}).get("label", next_key),
            "total_questions": next_cfg["total_questions"],
            "time_limit_sec": next_cfg["time_limit_minutes"] * 60,
            "marks_per_question": next_cfg["marks_per_question"],
            "negative_marking": next_cfg["negative_marking"],
            "questions": questions,
        },
        "section_index": next_idx,
        "section_order": section_order,
        "total_sections": len(section_order),
    }


@app.post("/api/ibps/mocks/{mid}/finish")
async def finish_mock(mid: str):
    attempts_coll = (await get_db()).mock_attempts
    attempt = await attempts_coll.find_one({"mock_test_id": mid, "status": "in_progress"})
    if not attempt:
        raise HTTPException(status_code=404, detail="No in-progress mock attempt found")

    # Aggregate all sections (sections is a dict keyed by section key)
    sections = attempt.get("sections", {})
    total_raw = 0
    total_negative = 0
    total_attempted = 0
    total_correct = 0
    total_wrong = 0
    total_skipped = 0
    total_qs = 0
    for sk, sec in sections.items():
        if isinstance(sec, dict) and sec.get("raw_marks") is not None:
            total_raw += sec["raw_marks"]
            total_negative += sec["negative_marks"]
            total_attempted += sec["attempted_count"]
            total_correct += sec["correct_count"]
            total_wrong += sec["wrong_count"]
            total_skipped += sec["skipped_count"]
            total_qs += len(sec.get("question_ids", []))

    total_net = total_raw - total_negative
    overall = {
        "raw_marks": total_raw,
        "negative_marks": total_negative,
        "net_marks": total_net,
        "total_marks": total_raw + total_negative,  # Approximate if not available from mock_test
        "total_questions": total_qs,
        "attempted_count": total_attempted,
        "correct_count": total_correct,
        "wrong_count": total_wrong,
        "skipped_count": total_skipped,
        "accuracy_pct": round((total_correct / total_attempted) * 100, 1) if total_attempted > 0 else 0,
        "attempt_rate_pct": round((total_attempted / total_qs) * 100, 1) if total_qs > 0 else 0,
    }

    now = utils.now_iso()
    await attempts_coll.update_one(
        {"_id": attempt["_id"]},
        {"$set": {"status": "completed", "completed_at": now, "overall": overall}},
    )

    return {"status": "completed", "overall": overall, "mock_attempt_id": attempt["id"]}


@app.get("/api/ibps/mocks/{mid}/result")
async def get_mock_result(mid: str):
    attempts_coll = (await get_db()).mock_attempts
    attempt = await attempts_coll.find_one({"mock_test_id": mid, "status": "completed"}, {"_id": 0})
    if not attempt:
        raise HTTPException(status_code=404, detail="Mock result not found")
    # Convert sections from dict to ordered array
    if isinstance(attempt.get("sections"), dict):
        order = attempt.get("section_order", [])
        attempt["sections"] = [attempt["sections"].get(k, {}) for k in order]
    return attempt

# -- Coverage ---------------------------------------------------------------

@app.get("/api/ibps/coverage")
async def get_coverage():
    coll = (await get_db()).topic_coverage
    doc = await coll.find_one({"id": "singleton"}, {"_id": 0})

    if not doc:
        coverage = {}
        for sk, sv in SECTIONS.items():
            if sv["has_topics"]:
                coverage[sk] = {t: {"status": "not_started", "lectures": 0, "notes": False, "updated_at": None} for t in PK_TOPICS.get(sk, [])}
            else:
                coverage[sk] = {"_section": {"status": "not_started", "lectures": 0, "notes": False, "updated_at": None}}
        doc = {"id": "singleton", "coverage": coverage}
        await coll.insert_one(doc)
        return doc

    # Migrate existing doc: fill in missing sections and missing topics
    coverage = dict(doc.get("coverage", {}))
    needs_update = False
    for sk, sv in SECTIONS.items():
        if sk not in coverage:
            needs_update = True
            if sv["has_topics"]:
                coverage[sk] = {t: {"status": "not_started", "lectures": 0, "notes": False, "updated_at": None} for t in PK_TOPICS.get(sk, [])}
            else:
                coverage[sk] = {"_section": {"status": "not_started", "lectures": 0, "notes": False, "updated_at": None}}
        elif sv["has_topics"]:
            for t in PK_TOPICS.get(sk, []):
                if t not in coverage[sk]:
                    needs_update = True
                    coverage[sk][t] = {"status": "not_started", "lectures": 0, "notes": False, "updated_at": None}

    if needs_update:
        await coll.update_one({"id": "singleton"}, {"$set": {"coverage": coverage}})
        doc["coverage"] = coverage

    return doc


@app.put("/api/ibps/coverage")
async def update_coverage(data: CoverageUpdate):
    coll = (await get_db()).topic_coverage
    now = utils.now_iso()

    topic_key = data.topic
    if SECTIONS.get(data.section, {}).get("has_topics"):
        if topic_key not in PK_TOPICS.get(data.section, []):
            raise HTTPException(status_code=400, detail=f"Invalid topic '{topic_key}' for section '{data.section}'")
    else:
        topic_key = "_section"

    await coll.update_one(
        {"id": "singleton"},
        {"$set": {
            f"coverage.{data.section}.{topic_key}": {
                "status": data.status,
                "lectures": data.lectures,
                "notes": data.notes,
                "updated_at": now,
            }
        }},
        upsert=True,
    )
    return {"updated": True}


@app.get("/api/ibps/coverage/summary")
async def get_coverage_summary():
    coll = (await get_db()).topic_coverage
    doc = await coll.find_one({"id": "singleton"}, {"_id": 0})
    if not doc:
        return {"overall": 0, "sections": {}}

    coverage = doc.get("coverage", {})
    result = {}
    total_covered = 0
    total_topics = 0

    for sk, sv in SECTIONS.items():
        section_coverage = coverage.get(sk, {})
        if sv["has_topics"]:
            topics = PK_TOPICS.get(sk, [])
            covered = sum(1 for t in topics if section_coverage.get(t, {}).get("status") in ("studied", "revised"))
            total = len(topics)
            result[sk] = {"covered": covered, "total": total, "pct": round((covered / total) * 100, 1) if total > 0 else 0}
            total_covered += covered
            total_topics += total
        else:
            status = section_coverage.get("_section", {}).get("status", "not_started")
            pct = 100 if status in ("studied", "revised") else 0
            result[sk] = {"covered": status in ("studied", "revised"), "status": status, "pct": pct}
            total_covered += 1 if status in ("studied", "revised") else 0
            total_topics += 1

    overall_pct = round((total_covered / total_topics) * 100, 1) if total_topics > 0 else 0
    return {"overall": overall_pct, "sections": result}


# -- Analytics --------------------------------------------------------------

@app.get("/api/ibps/analytics/dashboard")
async def get_dashboard():
    db_conn = await get_db()
    attempts_coll = db_conn.attempts
    study_logs_coll = db_conn.study_logs
    mock_attempts_coll = db_conn.mock_attempts

    # Query 1: Per-section attempt stats
    section_pipeline = [
        {"$match": {"source": "practice"}},
        {"$group": {
            "_id": "$section",
            "questions_solved": {"$sum": 1},
            "correct_count": {"$sum": {"$cond": ["$correct", 1, 0]}},
            "wrong_count": {"$sum": {"$cond": ["$correct", 0, 1]}},
            "total_time_sec": {"$sum": "$time_taken_sec"},
            "total_penalty": {"$sum": "$penalty"},
        }},
        {"$project": {
            "section": "$_id",
            "questions_solved": 1,
            "correct": "$correct_count",
            "wrong": "$wrong_count",
            "accuracy_pct": {
                "$cond": [
                    {"$gt": [{"$add": ["$correct_count", "$wrong_count"]}, 0]},
                    {"$round": [{"$multiply": [{"$divide": ["$correct_count", {"$add": ["$correct_count", "$wrong_count"]}]}, 100]}, 1]},
                    0,
                ]
            },
            "avg_time_sec": {"$cond": [{"$gt": ["$questions_solved", 0]}, {"$round": [{"$divide": ["$total_time_sec", "$questions_solved"]}, 0]}, 0]},
            "penalty": "$total_penalty",
        }},
    ]
    section_stats = await attempts_coll.aggregate(section_pipeline).to_list(None)

    # Query 2: Study time this week
    week_start = (date.today() - timedelta(days=date.today().weekday())).isoformat()
    study_pipeline = [
        {"$match": {"date": {"$gte": week_start}}},
        {"$group": {"_id": None, "total_minutes": {"$sum": "$duration_min"}}},
    ]
    study_stats = await study_logs_coll.aggregate(study_pipeline).to_list(None)

    # Query 3: Recent mock attempts
    recent_mocks = await mock_attempts_coll.find(
        {"status": "completed"},
        sort=[("completed_at", -1)],
        limit=3,
        projection={"_id": 0, "id": 1, "source": 1, "source_name": 1, "phase": 1, "overall": 1, "completed_at": 1, "taken_at": 1},
    ).to_list(3)

    # Compute weak sections
    weak_pipeline = [
        {"$match": {"source": "practice"}},
        {"$group": {
            "_id": "$section",
            "total_attempts": {"$sum": 1},
            "correct_count": {"$sum": {"$cond": ["$correct", 1, 0]}},
        }},
        {"$match": {"total_attempts": {"$gte": 20}}},
        {"$project": {
            "section": "$_id",
            "accuracy_pct": {"$round": [{"$multiply": [{"$divide": ["$correct_count", "$total_attempts"]}, 100]}, 1]},
        }},
        {"$match": {"accuracy_pct": {"$lt": 60.0}}},
    ]
    weak_sections = await attempts_coll.aggregate(weak_pipeline).to_list(None)

    # Compute totals
    total_solved = sum(s.get("questions_solved", 0) for s in section_stats)
    total_correct = sum(s.get("correct", 0) for s in section_stats)
    total_wrong = sum(s.get("wrong", 0) for s in section_stats)
    overall_accuracy = round((total_correct / (total_correct + total_wrong)) * 100, 1) if (total_correct + total_wrong) > 0 else 0
    study_minutes = study_stats[0]["total_minutes"] if study_stats else 0

    # Compute penalty this month
    month_start = date.today().replace(day=1).isoformat()
    penalty_pipeline = [
        {"$match": {"created_at": {"$gte": month_start}}},
        {"$group": {"_id": None, "total_penalty": {"$sum": "$penalty"}}},
    ]
    penalty_result = await attempts_coll.aggregate(penalty_pipeline).to_list(None)
    total_penalty = round(penalty_result[0]["total_penalty"], 2) if penalty_result else 0.0

    # Daily activity (last 14 days)
    fourteen_days_ago = (date.today() - timedelta(days=14)).isoformat()
    daily_pipeline = [
        {"$match": {"date": {"$gte": fourteen_days_ago}}},
        {"$group": {
            "_id": "$date",
            "minutes": {"$sum": "$duration_min"},
            "questions": {"$sum": "$questions_attempted"},
        }},
        {"$sort": {"_id": 1}},
    ]
    daily_activity = await study_logs_coll.aggregate(daily_pipeline).to_list(None)

    # Build section_stats map for lookups
    section_map = {s["section"]: s for s in section_stats}

    # ── Phase readiness ─────────────────────────────────────────────────
    # Fetch syllabus coverage
    coverage_doc = await db_conn.topic_coverage.find_one({"id": "singleton"}, {"_id": 0})
    coverage_data = coverage_doc.get("coverage", {}) if coverage_doc else {}

    # Compute syllabus coverage per section
    syllabus_pct = {}
    for sk, sv in SECTIONS.items():
        sec_cov = coverage_data.get(sk, {})
        if sv["has_topics"]:
            topics_list = PK_TOPICS.get(sk, [])
            covered = sum(1 for t in topics_list if sec_cov.get(t, {}).get("status") in ("studied", "revised"))
            total = len(topics_list)
            syllabus_pct[sk] = round((covered / total) * 100, 1) if total > 0 else 0
        else:
            status = sec_cov.get("_section", {}).get("status", "not_started")
            syllabus_pct[sk] = 100 if status in ("studied", "revised") else 0

    # Compute phase readiness
    phase_readiness = {}
    for phase_key, phase_cfg in PHASES.items():
        phase_sections = phase_cfg.get("sections", [])
        if not phase_sections:
            continue
        # Average accuracy across phase sections
        accuracies = [section_map.get(sk, {}).get("accuracy_pct", 0) for sk in phase_sections]
        avg_accuracy = sum(accuracies) / len(accuracies) if accuracies else 0
        # Average syllabus coverage
        coverages = [syllabus_pct.get(sk, 0) for sk in phase_sections]
        avg_coverage = sum(coverages) / len(coverages) if coverages else 0
        # Latest mock score
        phase_mocks = [
            m for m in recent_mocks
            if m.get("phase") == phase_key and m.get("overall", {}).get("raw_marks")
        ]
        mock_pct = 0
        if phase_mocks:
            latest = phase_mocks[0]
            total_m = latest.get("overall", {}).get("total_marks", 1)
            mock_pct = (latest["overall"]["raw_marks"] / total_m) * 100 if total_m else 0

        readiness = round(avg_accuracy * 0.4 + avg_coverage * 0.3 + mock_pct * 0.3, 1)
        sections_ready = sum(1 for sk in phase_sections if section_map.get(sk, {}).get("accuracy_pct", 0) >= 60)
        sections_at_risk = len(phase_sections) - sections_ready

        phase_readiness[phase_key] = {
            "readiness_pct": readiness,
            "sections_included": phase_sections,
            "sections_ready": sections_ready,
            "sections_at_risk": sections_at_risk,
            "mock_avg_score": round(phase_mocks[0]["overall"]["raw_marks"]) if phase_mocks else 0,
            "mock_avg_total": phase_mocks[0]["overall"]["total_marks"] if phase_mocks else 0,
            "syllabus_pct": round(avg_coverage, 1),
        }

    # ── Today's focus ──────────────────────────────────────────────────────
    today_focus = None
    if section_stats:
        # Score each section by low accuracy + low coverage + high penalty
        def section_score(s):
            acc = s.get("accuracy_pct", 0)
            cov = syllabus_pct.get(s["section"], 0)
            penalty = s.get("penalty", 0)
            return acc * 0.4 + cov * 0.3 - penalty * 2  # penalty reduces score

        sorted_sections = sorted(section_stats, key=section_score)
        worst = sorted_sections[0]
        worst_cov = syllabus_pct.get(worst["section"], 0)

        all_good = all(
            section_map.get(sk, {}).get("accuracy_pct", 0) > 70 and syllabus_pct.get(sk, 0) > 80
            for sk in ["english", "reasoning", "quant", "dbms"]
        )

        if all_good:
            today_focus = {
                "focus_section": None,
                "focus_reason": "All sections are in good shape. Take a mock test to assess readiness!",
                "suggested_action": "mock",
                "practice_mode": "all",
                "secondary_actions": [],
            }
        else:
            secondary = [
                f"Complete {sk.replace('_', ' ').title()} syllabus — {syllabus_pct.get(sk, 0)}% covered"
                for sk in sorted(syllabus_pct, key=lambda k: syllabus_pct[k])
                if syllabus_pct.get(sk, 100) < 50
            ][:2]
            if section_map.get(worst["section"], {}).get("wrong", 0) > 5:
                secondary.append(f"Review {worst['section']} mistakes ({section_map[worst['section']]['wrong']} wrong)")

            today_focus = {
                "focus_section": worst["section"],
                "focus_reason": f"Practice {SECTIONS.get(worst['section'], {}).get('label', worst['section'])} — {worst.get('accuracy_pct', 0)}% accuracy, {worst_cov}% syllabus covered.",
                "suggested_action": "practice",
                "practice_mode": "weak" if worst.get("questions_solved", 0) >= 3 else "all",
                "secondary_actions": secondary,
            }

    return {
        "overview": {
            "total_questions_solved": total_solved,
            "overall_accuracy_pct": overall_accuracy,
            "total_study_minutes_this_week": study_minutes,
        },
        "sections": section_stats,
        "total_penalty_this_month": total_penalty,
        "syllabus_coverage": {"overall_pct": round(sum(syllabus_pct.values()) / len(syllabus_pct), 1) if syllabus_pct else 0, "per_section": syllabus_pct},
        "phase_readiness": phase_readiness,
        "today_focus": today_focus,
        "recent_mocks": recent_mocks,
        "weak_sections": [w["section"] for w in weak_sections],
        "daily_activity": [{"date": d["_id"], "minutes": d["minutes"], "questions": d["questions"]} for d in daily_activity],
    }


# -- Settings ---------------------------------------------------------------

@app.get("/api/ibps/settings")
async def get_settings():
    coll = (await get_db()).settings
    doc = await coll.find_one({"id": "singleton"}, {"_id": 0})
    if not doc:
        doc = {
            "id": "singleton",
            "exam_date_prelims": config.PRELIMS_DATE_DEFAULT,
            "exam_date_mains": config.MAINS_DATE_DEFAULT,
            "daily_practice_target": 25,
            "daily_mock_target": 0,
            "daily_study_minutes_target": 120,
            "phase_focus": "prelims",
            "theme": "dark",
        }
        await coll.insert_one(doc)
        return doc

    # Migrate old exam_date -> exam_date_prelims
    if "exam_date" in doc and "exam_date_prelims" not in doc:
        doc["exam_date_prelims"] = doc.pop("exam_date")
        await coll.update_one({"id": "singleton"}, {"$set": {"exam_date_prelims": doc["exam_date_prelims"]}, "$unset": {"exam_date": ""}})
    return doc


@app.put("/api/ibps/settings")
async def update_settings(data: SettingsIn):
    coll = (await get_db()).settings
    updates = {k: v for k, v in data.model_dump().items() if v is not None}
    if updates:
        updates["updated_at"] = utils.now_iso()
        await coll.update_one({"id": "singleton"}, {"$set": updates}, upsert=True)
    doc = await coll.find_one({"id": "singleton"}, {"_id": 0})
    return doc


# -- Seed ------------------------------------------------------------------

@app.post("/api/ibps/seed")
async def seed_data():
    """Manually trigger database seeding with sample questions."""
    from seed import seed_database
    db_conn = await get_db()
    count = await seed_database(database=db_conn)
    return {"seeded": count, "message": f"Seeded {count} questions"}


@app.post("/api/ibps/clear")
async def clear_data():
    """Remove all questions, attempts, mocks, and coverage data."""
    db = await get_db()
    for coll_name in ["questions", "attempts", "mock_tests", "mock_attempts", "topic_coverage"]:
        await db[coll_name].delete_many({})
    return {"cleared": True, "message": "All data removed"}


# -- Health -----------------------------------------------------------------

@app.get("/api/")
async def health():
    return {
        "status": "ok",
        "app": "BYOP Studio — IBPS SO",
        "version": "1.0.0",
        "docs": "/docs",
    }


# -- SPA fallback (for production builds) -----------------------------------

# If a frontend build directory exists, serve it
frontend_dist = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")
if os.path.isdir(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="frontend")


# ---------------------------------------------------------------------------
# 5. Entry point
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=int(os.environ.get("PORT", 8000)), reload=True)
