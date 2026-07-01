# BYOP Studio — IBPS SO (IT Officer)

> **Be Your Own Perfect** — A lightweight, single-user study companion for the IBPS SO IT Officer exam.

Track syllabus coverage, practice questions with timed enforcement, simulate full mocks with negative marking, and get data-driven recommendations on what to study next — all from a single dashboard.

---

## Quick Start (Local Dev)

### Prerequisites

- Python 3.11+
- Node.js 20+
- MongoDB 7+ (optional — dev mode uses in-memory mongomock)

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn server:app --reload --port 8000
```

The API starts at `http://localhost:8000`. API docs at `http://localhost:8000/docs`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Opens at `http://localhost:5173`. The Vite dev server proxies `/api` requests to the backend.

### Seed Data

Hit `POST /api/ibps/seed` to populate the database with 140+ sample questions across all 10 sections. Or click "Import CSV" on the empty-state Dashboard.

---

## Docker

```bash
docker compose up --build
```

App at `http://localhost:8000`. Includes MongoDB service. The frontend build is baked into the container image and served by FastAPI.

---

## Deploy to Render

1. Push this repo to GitHub
2. Create a new **Web Service** on Render, connected to your repo
3. Set:
   - **Runtime**: Python
   - **Build Command**: `cd frontend && npm ci && npm run build && cd .. && pip install -r backend/requirements.txt`
   - **Start Command**: `cd backend && uvicorn server:app --host=0.0.0.0 --port=$PORT`
4. Add environment variable:
   - `MONGO_URL` — your MongoDB Atlas connection string
   - `MOCK_DB=false`

The `render.yaml` blueprint is also provided for automatic setup.

---

## Architecture

| | |
|---|---|
| **Backend** | FastAPI + Motor (async MongoDB) + mongomock_motor (dev fallback) |
| **Frontend** | React 18 + Vite + TailwindCSS + React Query + Radix UI |
| **Database** | MongoDB 7+ (Atlas M0 free tier for production) |
| **Pages** | 4 (Dashboard, Repository, Practice, Mocks) |
| **Sections** | 10 (English, Reasoning, Quant, DBMS, CN, OS, SE, DS, COA, OOPs) |
| **PK Subjects** | 7 with topic-wise practice |
| **Backend file** | Single `server.py` (~540 lines) |

### Negative Marking

- **Professional Knowledge**: +2 correct, -0.25 wrong
- **Non-PK (English/Reasoning/Quant)**: +1 correct, -0.25 wrong
- No penalty for skipped questions

### Practice Modes

| Mode | Behavior |
|---|---|
| **New** | Unattempted questions only |
| **All** | Random from full pool |
| **Wrong** | Questions where latest attempt was wrong |
| **Weak** | <50% accuracy with ≥3 attempts |
| **Bookmarked** | Saved questions |
| **Mistakes** | Any wrong attempt in history |

### Mock System

- **Prelims**: 4 sections, 100 questions, 80 minutes
- **Mains**: 4 sections, 150 questions, 125 minutes
- Hard sectional timers with auto-submit
- Mark for Review per question
- Question palette navigation
- Results: per-section breakdown, time analysis, attempt strategy, negative marking aggregation
- External mock logging for off-platform test series

### Keyboard Shortcuts (Practice)

| Key | Action |
|---|---|
| A / B / C / D | Select option |
| 1 – 5 | Set confidence |
| Enter | Submit answer |
| → | Skip |
| ← | Previous |
| ? | Toggle help |

---

## Testing

```bash
cd backend
pip install -r requirements.txt
pytest tests/ -v
```

Tests cover all endpoints — CRUD, practice submission with negative marking, mock lifecycle, coverage tracking, analytics aggregation. Uses mongomock for isolated test runs (no MongoDB required).

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `MONGO_URL` | `mongodb://localhost:27017` | MongoDB connection string |
| `DB_NAME` | `byopstudio_ibps` | Database name |
| `MOCK_DB` | `true` (dev) | Use in-memory mongomock instead of real MongoDB |
| `CORS_ORIGINS` | `*` | Comma-separated allowed origins |
| `PORT` | `8000` | Server port |

---

## License

Private — personal study tool.
