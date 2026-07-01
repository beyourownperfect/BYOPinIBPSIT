# BYOP Studio — IBPS SO: Technical Reference

> A beginner-friendly walkthrough of every file, folder, API endpoint, component, data model, and how they all connect.

---

## Table of Contents

1. [Project Map](#1-project-map) — every file and folder explained
2. [How the App Starts](#2-how-the-app-starts) — from `git clone` to browser
3. [Backend Architecture](#3-backend-architecture) — FastAPI, routes, models, database
4. [Frontend Architecture](#4-frontend-architecture) — React, routing, components, API calls
5. [Data Flow: Request to Response](#5-data-flow-request-to-response) — what happens when you click a button
6. [Data Models](#6-data-models) — every collection and schema
7. [Database Queries Explained](#7-database-queries-explained) — how aggregation pipelines work
8. [State Machines](#8-state-machines) — how pages manage their screens
9. [Negative Marking Logic](#9-negative-marking-logic) — the scoring system
10. [Practice Modes: How Question Selection Works](#10-practice-modes-how-question-selection-works)
11. [Timers and Auto-Submit](#11-timers-and-auto-submit)
12. [Common Errors and Fixes](#12-common-errors-and-fixes)
13. [Deployment Checklist](#13-deployment-checklist)

---

## 1. Project Map

```
BYOPinIBPSIT/
│
├── backend/                          # Python FastAPI server
│   ├── server.py                     # THE MAIN FILE — routes, models, database setup, everything (~540 lines)
│   ├── syllabus.py                   # Exam data: 10 sections, PK topics, phase configs (Prelims/Mains)
│   ├── config.py                     # Environment variables with defaults
│   ├── utils.py                      # Tiny helper functions (generate IDs, hash statements, compute scores)
│   ├── seed.py                       # 140+ realistic IBPS SO practice questions
│   ├── requirements.txt              # Python packages needed
│   ├── .env.example                  # Template for environment variables
│   ├── Procfile                      # Render/Heroku start command
│   └── tests/
│       ├── conftest.py               # Test setup (creates a fake database for testing)
│       └── test_api.py               # 20+ tests for all API endpoints
│
├── frontend/                         # React + Vite web app
│   ├── index.html                    # The single HTML page that loads everything
│   ├── package.json                  # JavaScript packages needed
│   ├── vite.config.js                # Vite configuration (dev server, proxy to backend)
│   ├── tailwind.config.js            # TailwindCSS configuration (colors, fonts)
│   └── src/
│       ├── main.jsx                  # Entry point — renders the app, sets up React Query
│       ├── App.jsx                   # Router — maps URLs to pages, wraps with ErrorBoundary
│       ├── index.css                 # TailwindCSS imports + base styles
│       │
│       ├── pages/                    # One file per page
│       │   ├── Dashboard.jsx         # Home page — stats, section readiness, today's focus
│       │   ├── Repository.jsx        # Question bank — add/edit/delete/filter/import questions
│       │   ├── Practice.jsx          # Practice engine — answer questions with timers
│       │   └── Mocks.jsx             # Mock test system — full exam simulation
│       │
│       ├── components/               # Reusable UI pieces
│       │   ├── Layout.jsx            # Header with nav, theme toggle, help button
│       │   ├── ErrorBoundary.jsx     # Catches crashes, shows friendly error
│       │   ├── HelpModal.jsx         # Keyboard shortcuts + quick reference
│       │   ├── Timer.jsx             # Countdown/elapsed timer with color warnings
│       │   ├── ui/                   # Basic building blocks
│       │   │   ├── button.jsx        # Reusable button (primary/secondary/ghost/danger)
│       │   │   ├── card.jsx          # Card container with border
│       │   │   ├── badge.jsx         # Small label (section name, difficulty)
│       │   │   └── index.js          # Re-exports all UI components
│       │   └── modals/               # Popup windows
│       │       ├── QuestionFormModal.jsx    # Create/edit question form
│       │       └── QuestionDetailsModal.jsx # View question + attempt history
│       │
│       ├── lib/                      # Shared logic
│       │   ├── api.js                # All API calls as clean functions
│       │   ├── constants.js          # Sections list, practice modes, topic data
│       │   ├── ibpsSyllabus.js       # Re-exports constants (backup if API fails)
│       │   └── utils.js              # Date formatting, time formatting, class merging
│       │
│       └── hooks/                    # Custom React hooks
│           └── useTheme.js           # Dark/light theme with localStorage persistence
│
├── Dockerfile                        # Multi-stage build (Node builds frontend → Python serves it)
├── docker-compose.yml                # One-command startup (app + MongoDB)
├── render.yaml                       # Render.com deployment blueprint
├── README.md                         # Quick start guide
├── TECHNICAL_REFERENCE.md            # ← You are here
└── IBPS_SO_ARCHITECTURE.md           # Original product specification
```

### File Naming Conventions

| Pattern | Meaning | Example |
|---------|---------|---------|
| `*.jsx` | React component file | `Dashboard.jsx`, `Timer.jsx` |
| `*.py` | Python file | `server.py`, `seed.py` |
| `*.config.js` | Build/dev tool config | `vite.config.js`, `tailwind.config.js` |
| `*.yml` | Docker/Render config | `docker-compose.yml`, `render.yaml` |
| `*Modal` | Popup/dialog component | `QuestionFormModal.jsx` |
| `use*` | React hook | `useTheme.js` |

---

## 2. How the App Starts

### Development Mode (for coding)

```
Step 1: Start MongoDB
  > mongod
  (Or skip this — the app uses an in-memory fake database by default)

Step 2: Start the Backend
  > cd backend
  > pip install -r requirements.txt
  > uvicorn server:app --reload --port 8000
  ✓ API is live at http://localhost:8000
  ✓ Docs at http://localhost:8000/docs (interactive Swagger UI)

Step 3: Start the Frontend (in a second terminal)
  > cd frontend
  > npm install
  > npm run dev
  ✓ App opens at http://localhost:5173

Step 4: Seed Data
  Click any page → it will auto-seed with 140+ questions on first load
  OR: POST to http://localhost:5173/api/ibps/seed
  (The proxy in vite.config.js sends /api/* to the backend)
```

### Production Mode (deployed to Render)

```
Step 1: Build Frontend
  > cd frontend && npm ci && npm run build
  ✓ creates frontend/dist/ (HTML + CSS + JS files)

Step 2: Start Backend (serves frontend too)
  > uvicorn server:app --host=0.0.0.0 --port=8000
  When someone visits http://your-app.com:
    - The backend checks if it's an /api/* request → handles it
    - Everything else → serves frontend/dist/index.html (SPA fallback)
```

### The `vite.config.js` Proxy (Important!)

In development, the frontend runs on port 5173 and the backend on port 8000. Browsers don't allow cross-port requests. The proxy solves this:

```js
// frontend/vite.config.js
server: {
  proxy: {
    "/api": {
      target: "http://localhost:8000",  // Send /api/* to backend
      changeOrigin: true,
    },
  },
}
```

So when your React code calls `fetch("/api/ibps/meta")`, it actually goes to `http://localhost:8000/api/ibps/meta` even though the page is on port 5173. Magic.

In production, there's no port difference — the backend serves everything on one port. The proxy isn't needed. The backend mounts the frontend's `dist/` folder:

```python
# server.py (line near the bottom)
frontend_dist = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")
if os.path.isdir(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="frontend")
```

---

## 3. Backend Architecture

### Technology Stack

```
FastAPI ────> Python web framework (like Flask but faster, with automatic docs)
   │
   ├── Motor ──> Async MongoDB driver (non-blocking database calls)
   │
   ├── Pydantic ──> Data validation (ensures API receives correct data)
   │
   ├── mongomock_motor ──> Fake MongoDB for development (no installation needed)
   │
   └── uvicorn ──> Server that runs FastAPI (like how Node runs Express)
```

### `server.py` Internal Organization

The file is organized in sections, from top to bottom. Here's the map:

```
Lines 1-40     → Imports (Python libraries) + FastAPI app creation + CORS setup
Lines 42-180   → Pydantic Models (data schemas for every API request/response)
Lines 182-230  → MongoDB connection (how the app talks to the database)
Lines 232-280  → Meta Routes (just one: GET /api/ibps/meta)
Lines 282-470  → Question Routes (7 endpoints: CRUD + bulk operations)
Lines 472-540  → Practice Routes (3 endpoints: next question, submit answer, complete session)
Lines 542-890  → Mock Routes (10 endpoints: full mock lifecycle + external mocks)
Lines 892-980  → Coverage Routes (3 endpoints: syllabus tracking)
Lines 982-1150 → Analytics Routes (1 endpoint: dashboard data)
Lines 1152-1200 → Settings Routes (2 endpoints: get + update preferences)
Lines 1202-1220 → Seed + Health endpoints
Lines 1222-1230 → SPA fallback + entry point
```

**Why single file instead of splitting into folders?** The architecture document explains: ~20 endpoints and ~6 data models is too small for folders. Splitting into `routes/`, `models/`, `services/` adds ceremony. You'd spend more time opening/closing files than writing code. If it grows past 2000 lines, split by domain — not by layer.

### Route Naming Convention

All routes are mounted under `/api/ibps/`:

```
/api/ibps/meta                          # Returns exam configuration
/api/ibps/questions                     # Question bank
/api/ibps/practice/*                    # Practice flow
/api/ibps/mocks/*                       # Mock test system
/api/ibps/coverage/*                    # Syllabus tracking
/api/ibps/analytics/dashboard           # Dashboard data
/api/ibps/settings                      # User preferences
/api/ibps/seed                          # Fill database with sample data
/api/                                   # Health check
```

### The `@app.get` and `@app.post` Decorators

These are how FastAPI knows what to do with incoming requests:

```python
@app.get("/api/ibps/meta")             # Listen for GET requests at this URL
async def get_meta():                   # Function that runs when someone visits
    return {"sections": SECTIONS, ...}  # Returns JSON automatically

@app.post("/api/ibps/questions")       # Listen for POST requests
async def create_question(data: QuestionIn):  # data comes from request body
    # ... save to database ...
    return {"id": "abc", ...}
```

**Key difference from Express.js:**
- Express: `app.get("/api/meta", async (req, res) => { res.json(data) })`
- FastAPI: `@app.get("/api/meta")` then just `return data` — FastAPI automatically converts to JSON

### The `async/await` Pattern

Every route function is `async` because it waits for the database:

```python
async def list_questions():
    coll = await get_db()              # Wait for DB connection
    documents = await coll.find().to_list(100)  # Wait for query results
    return {"items": documents}
```

`await` means: "Pause this function, do other work while waiting, then come back when the data is ready." Without `async/await`, the server would freeze while waiting for the database.

### Pydantic Models — The Gatekeepers

Every API request is validated before it reaches your code:

```python
class QuestionIn(BaseModel):
    section: str                       # Required, must be a string
    statement: str                     # Required
    options: dict                      # Must be {"A": "...", "B": "...", ...}
    correct_answer: str                # Required
    marks: int | None = None           # Optional, must be int if provided

    @field_validator("section")        # Custom validation
    @classmethod
    def section_must_exist(cls, v):
        if v not in SECTIONS:          # "dbms" is valid, "cooking" is not
            raise ValueError(f"Invalid section: {v}")
        return v
```

If someone sends `{"section": "cooking", "statement": "..."}`, FastAPI automatically returns a 422 error with "Invalid section: cooking" — no need to write that check manually.

### MongoDB Operations (The 5 You'll See Everywhere)

```python
# 1. Find one document
doc = await collection.find_one({"id": "abc"}, {"_id": 0})

# 2. Find many documents (with filter, sort, pagination)
docs = await collection.find(
    {"section": "english"},             # WHERE section = 'english'
    {"_id": 0}                          # Don't include internal _id field
).sort("created_at", -1).limit(50).to_list(50)

# 3. Count documents
total = await collection.count_documents({"section": "english"})

# 4. Insert a document
await collection.insert_one({"id": "abc", "section": "english", ...})

# 5. Update a document
await collection.update_one(
    {"id": "abc"},                      # Find this document
    {"$set": {"section": "quant"}}     # Change this field
)
```

The `{"_id": 0}` pattern: MongoDB stores every document with an internal `_id` field. We don't want to send that to the frontend. `{"_id": 0}` means "exclude the _id field".

---

## 4. Frontend Architecture

### Technology Stack

```
React 18 ────> UI library (builds the interface from components)
   │
   ├── Vite ──> Development server + build tool (faster than Create React App)
   │
   ├── TailwindCSS ──> CSS framework (write styles in className, not separate CSS files)
   │
   ├── React Router ──> Navigation between pages without page reload
   │
   ├── React Query ──> Fetching data from API (caching, loading states, retry)
   │
   └── Axios ──> Making HTTP requests (like fetch() but with more features)
```

### How React Query Works

React Query replaces `useState + useEffect` for API calls:

```javascript
// Without React Query (the old way)
const [data, setData] = useState(null);
const [loading, setLoading] = useState(true);

useEffect(() => {
  fetch("/api/ibps/meta")
    .then(r => r.json())
    .then(d => { setData(d); setLoading(false); });
}, []);

// With React Query (the BYOP way)
const { data, isLoading } = useQuery({
  queryKey: ["meta"],                     // Unique key for caching
  queryFn: () => fetch("/api/ibps/meta").then(r => r.json()),
  staleTime: 30_000,                      // Don't refetch for 30 seconds
});
```

React Query automatically:
1. Shows `isLoading` while fetching
2. Caches the result (by `queryKey`)
3. Refetches when you `invalidateQueries` after a mutation
4. Retries on failure
5. Shares data between components

**For mutations** (creating/updating/deleting):

```javascript
const mutation = useMutation({
  mutationFn: (data) => questionsApi.create(data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["questions"] });  // Refresh the list
  },
});

// Call it:
mutation.mutate({ section: "english", statement: "...", ... });
```

### React Router — How Navigation Works

```javascript
// App.jsx
<BrowserRouter>
  <Routes>
    <Route element={<Layout />}>          // Layout wraps all pages
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/repository" element={<Repository />} />
      <Route path="/practice" element={<Practice />} />
      <Route path="/mocks" element={<Mocks />} />
      <Route path="*" element={<NotFound />} />  // 404 catch-all
    </Route>
  </Routes>
</BrowserRouter>
```

The `<Layout />` component renders the header with nav links, then shows the current page below it using `<Outlet />`:

```javascript
// Layout.jsx
<header> ...nav links with NavLink... </header>
<main>
  <Outlet />    ← The current page appears here (Dashboard, Repository, etc.)
</main>
```

### The API Client (`lib/api.js`)

Every backend endpoint has a corresponding function in `api.js`:

```javascript
import axios from "axios";

const API_BASE = "/api/ibps";
const client = axios.create({ baseURL: API_BASE });

export const questionsApi = {
  list: (params) => client.get("/questions", { params }).then(r => r.data),
  get: (id) => client.get(`/questions/${id}`).then(r => r.data),
  create: (data) => client.post("/questions", data).then(r => r.data),
  remove: (id) => client.delete(`/questions/${id}`).then(r => r.data),
  // ... etc
};
```

Then in a page component:

```javascript
import { questionsApi } from "../lib/api";

const { data } = useQuery({
  queryKey: ["questions", { section: "english" }],
  queryFn: () => questionsApi.list({ section: "english" }),
});
```

### State Management Rules

The app uses a strict policy for where state lives:

| Type of State | Where It Lives | Example |
|---|---|---|
| Server data (questions, stats, settings) | React Query cache | `useQuery(["questions"])` |
| URL filters (section, mode, page) | URL search params | `?section=english&page=2` |
| Theme preference | localStorage | `localStorage.getItem("theme")` |
| Timer persistence | sessionStorage | `sessionStorage.setItem(...)` |
| UI state (modal open/close, selected option) | React useState | `const [showForm, setShowForm]` |

**No Redux, no Zustand, no Context** — this app is too small to need a state management library.

---

## 5. Data Flow: Request to Response

Let's trace what happens when a user clicks "Submit" on a practice question:

```
1. User selects option "A" and clicks "Submit"
         │
         ▼
2. Practice.jsx calls: practiceApi.submit({
       question_id: "abc-123",
       selected_option: "A",
       confidence: 4,
       time_taken_sec: 32,
       practice_mode: "all"
   })
         │
         ▼
3. api.js sends: POST /api/ibps/practice/submit
   (Axios sends the JSON body to the Vite proxy)
         │
         ▼
4. Vite proxy (dev) forwards to: http://localhost:8000/api/ibps/practice/submit
   (In production, there is no proxy — the backend serves everything)
         │
         ▼
5. FastAPI receives the request
         │
         ▼
6. Pydantic validates the body — checks question_id is a string,
   selected_option is A/B/C/D, confidence is 0-5, etc.
         │
         ▼
7. server.py practice_submit() runs:
   a. Fetches the question from MongoDB by question_id
   b. Compares selected_option to correct_answer
   c. Computes marks_earned (question.marks if correct, 0 if wrong)
   d. Computes penalty (0.25 if wrong, 0 if correct)
   e. Saves the attempt to the attempts collection
   f. Computes total accuracy from all past attempts on this question
   g. Returns PracticeSubmitResponse
         │
         ▼
8. FastAPI converts the Python dict to JSON and sends it back
         │
         ▼
9. Practice.jsx receives the response:
   {
       correct: true,
       correct_answer: "A",
       marks_earned: 1,
       penalty: 0,
       net_score: 1.0,
       accuracy_pct: 72.0,
       explanation: "...",
       ...
   }
         │
         ▼
10. React re-renders — shows Feedback screen with green "Correct!" card
```

The same pattern applies to every action in the app:
- **Create question**: Form data → POST /api/ibps/questions → save to MongoDB → refresh list
- **Start mock**: Click button → POST /api/ibps/mocks → create test definition → POST /start → select random questions → show first section
- **Dashboard**: Page loads → GET /api/ibps/analytics/dashboard → 3 parallel aggregation queries → render stat cards

---

## 6. Data Models

### Questions Collection

Stores every practice question. 1000-5000 documents expected.

```javascript
{
  "id": "uuid-string",              // Unique identifier (generated by uuid4)
  "section": "dbms",                // One of 10 sections: english, reasoning, quant, dbms, cn, os, se, ds, coa, oops
  "subject": "dbms",                // Same as section for PK subjects
  "topic": "normalization",         // PK subjects only. null for non-PK
  "statement": "Which normal form...?",  // The question text
  "statement_hash": "sha256...",    // Hash for duplicate detection
  "question_type": "mcq",           // Always "mcq" for now ("descriptive" for essay questions)
  "options": {                      // Exactly 4 options
    "A": "1NF",
    "B": "2NF",
    "C": "3NF",                     // ← This one is correct
    "D": "BCNF"
  },
  "correct_answer": "C",            // Must be A, B, C, or D
  "explanation": "3NF eliminates...",  // Shown after answering
  "notes": "",                      // Personal notes (optional)
  "marks": 2,                       // 2 for PK, 1 for non-PK
  "difficulty": "medium",           // easy / medium / hard
  "phase": "both",                  // prelims / mains / both
  "exam_source": "IBPS",            // Where the question came from
  "year": 2024,                     // Exam year (optional)
  "bookmarked": false,              // Starred for later review
  "created_at": "2026-01-15T10:30:00Z",
  "updated_at": "2026-01-15T10:30:00Z"
}
```

**Indexes** (these make queries fast):
- `{ section: 1, subject: 1, topic: 1 }` — filter by section/subject/topic
- `{ statement_hash: 1 }` — unique index for duplicate detection
- `{ bookmarked: 1 }` — find bookmarked questions
- `{ phase: 1 }` — filter by prelims/mains/both

### Attempts Collection

Every single answer submission. Grows fastest — 10,000-50,000 documents.

```javascript
{
  "id": "uuid-string",
  "question_id": "uuid-string",     // Which question was answered
  "section": "english",
  "subject": "english",
  "topic": null,
  "correct": true,                  // Was the answer right?
  "selected_option": "A",           // What the user chose
  "confidence": 4,                  // 1-5 self-rated confidence
  "time_taken_sec": 32,             // Seconds spent on this question
  "marks_earned": 1,                // 2 for PK correct, 1 for non-PK correct, 0 for wrong
  "penalty": 0,                     // 0.25 for wrong, 0 for correct
  "practice_mode": "new",           // Which mode the user was practicing in
  "source": "practice",             // "practice" or "mock"
  "mock_attempt_id": null,          // If part of a mock, links to mock_attempts
  "created_at": "2026-04-14T15:30:00Z"
}
```

### Study Logs Collection

Records daily study activity. Used for the "Study Time" stat on the dashboard.

```javascript
{
  "id": "uuid-string",
  "section": "dbms",
  "subject": "dbms",
  "activity": "practice",           // "practice" or "mock"
  "duration_min": 25,               // How long was the session
  "questions_attempted": 15,
  "questions_correct": 12,
  "questions_wrong": 3,
  "accuracy_pct": 80,
  "date": "2026-04-14",             // Calendar date (for weekly aggregation)
  "created_at": "2026-04-14T15:55:00Z"
}
```

### Mock Tests Collection

Defines a mock test configuration. Created when user clicks "Start New Mock".

```javascript
{
  "id": "uuid-string",
  "phase": "prelims",               // "prelims" or "mains"
  "title": "Prelims Mock #5",
  "sections": [                     // Section configurations
    { "key": "english", "total_questions": 25, "marks_per_question": 1, "time_limit_minutes": 20, "negative_marking": 0.25 },
    { "key": "reasoning", ... },
    { "key": "quant", ... },
    { "key": "dbms", ... }
  ],
  "total_questions": 100,
  "total_marks": 125,
  "total_time_minutes": 80,
  "question_selection": { "strategy": "random" },
  "created_at": "2026-04-14T10:00:00Z"
}
```

### Mock Attempts Collection

Records one attempt of a mock test. Created when mock starts, updated as sections are submitted.

```javascript
{
  "id": "uuid-string",
  "mock_test_id": "uuid-string",
  "source": "internal",             // "internal" or "external"
  "source_name": null,              // Only for external mocks (e.g. "Testbook #12")
  "phase": "prelims",
  "status": "completed",            // "in_progress" → "completed"
  "started_at": "2026-04-14T10:00:00Z",
  "completed_at": "2026-04-14T11:25:00Z",
  "section_order": ["english", "reasoning", "quant", "dbms"],  // Order of sections
  "sections": {                     // Object (not array) for easy MongoDB updates
    "english": {
      "key": "english",
      "question_ids": ["q1", "q2", ...],
      "answers": { "q1": "A", "q2": "B", "q3": null, ... },
      "marked_for_review": ["q3"],
      "time_spent_sec": 1112,
      "time_limit_sec": 1200,
      "raw_marks": 18,
      "negative_marks": 1.0,
      "net_marks": 17.0,
      "correct_count": 18,
      "wrong_count": 4,
      "skipped_count": 3,
      "attempted_count": 22
    },
    "reasoning": { ... },
    "quant": { ... },
    "dbms": { ... }
  },
  "overall": {
    "raw_marks": 78,
    "negative_marks": 4.5,
    "net_marks": 73.5,
    "total_marks": 125,
    "attempted_count": 82,
    "correct_count": 64,
    "wrong_count": 18,
    "skipped_count": 18,
    "accuracy_pct": 78.0
  },
  "created_at": "2026-04-14T11:25:00Z"
}
```

**External mocks** (from Testbook, Adda247, etc.) use the same collection but with `source: "external"` and no question-level answers — just section scores:

```javascript
{
  "id": "uuid-string",
  "source": "external",
  "source_name": "Testbook #12",
  "phase": "prelims",
  "sections": [
    { "key": "english", "marks_obtained": 18, "total_marks": 25, "accuracy_pct": 72 },
    { "key": "reasoning", "marks_obtained": 15, "total_marks": 25, "accuracy_pct": 60 },
    ...
  ],
  "overall": { "raw_marks": 72, "total_marks": 125, "accuracy_pct": 64 },
  "taken_at": "2026-04-14",
  "status": "completed",
  "created_at": "2026-04-14T18:00:00Z"
}
```

### Settings Collection

Singleton — only one document with `id: "singleton"`.

```javascript
{
  "id": "singleton",
  "exam_date": "2026-08-29",          // Prelims date for countdown
  "daily_practice_target": 25,         // Questions per day goal
  "daily_study_minutes_target": 120,   // Minutes per day goal
  "phase_focus": "prelims",            // Which phase to prioritize
  "theme": "dark",                     // "dark" or "light"
  "updated_at": "2026-04-14T10:00:00Z"
}
```

### Topic Coverage Collection

Another singleton — tracks syllabus progress.

```javascript
{
  "id": "singleton",
  "coverage": {
    "dbms": {
      "er_diagram": { "status": "revised", "lectures": 3, "notes": true, "updated_at": "2026-04-10" },
      "relational_model": { "status": "studied", "lectures": 2, "notes": true, "updated_at": "2026-04-08" },
      "sql": { "status": "studied", "lectures": 4, "notes": false, "updated_at": "2026-04-12" },
      "normalization": { "status": "not_started", "lectures": 0, "notes": false, "updated_at": null }
    },
    "english": {
      "_section": { "status": "studied", "lectures": 5, "notes": true, "updated_at": "2026-04-05" }
    }
  }
}
```

Non-PK sections (English, Reasoning, Quant) have no sub-topics — just a single `_section` entry.
PK subjects have one entry per topic from `PK_TOPICS`.
`status` cycles through: `not_started` → `studied` → `revised` → `not_started`.

---

## 7. Database Queries Explained

### Simple Queries (find one, insert one, update one)

```python
# Find a question by ID
question = await db.questions.find_one({"id": "abc-123"}, {"_id": 0})
# Returns: {"id": "abc-123", "section": "dbms", "statement": "...", ...}

# Insert an attempt
await db.attempts.insert_one({
    "id": "xyz-789",
    "question_id": "abc-123",
    "correct": True,
    ...
})

# Update a setting
await db.settings.update_one(
    {"id": "singleton"},
    {"$set": {"theme": "light"}},
    upsert=True,  # Create if doesn't exist
)
```

### Aggregation Pipelines (the "GROUP BY" of MongoDB)

Aggregation pipelines are MongoDB's way of doing what SQL calls `GROUP BY`, `JOIN`, `SUM`, `AVG`. They're a series of stages that transform documents.

**Example 1: Per-section stats (used by dashboard)**

```python
pipeline = [
    # Stage 1: Only include practice attempts (not mock attempts)
    {"$match": {"source": "practice"}},

    # Stage 2: Group by section, compute aggregates
    {"$group": {
        "_id": "$section",                           # Group by section name
        "questions_solved": {"$sum": 1},              # Count total attempts
        "correct_count": {"$sum": {"$cond": ["$correct", 1, 0]}},  # Count correct
        "wrong_count": {"$sum": {"$cond": ["$correct", 0, 1]}},    # Count wrong
        "total_time_sec": {"$sum": "$time_taken_sec"},             # Sum of all times
        "total_penalty": {"$sum": "$penalty"},                     # Sum of all penalties
    }},

    # Stage 3: Compute percentages
    {"$project": {
        "section": "$_id",
        "questions_solved": 1,
        "accuracy_pct": {
            "$round": [
                {"$multiply": [
                    {"$divide": ["$correct_count", {"$add": ["$correct_count", "$wrong_count"]}]},
                    100
                ]},
                1  # Round to 1 decimal
            ]
        },
        "avg_time_sec": {"$round": [{"$divide": ["$total_time_sec", "$questions_solved"]}, 0]},
        "penalty": "$total_penalty",
    }},
]

section_stats = await db.attempts.aggregate(pipeline).to_list(None)
```

This produces:
```json
[
    {"section": "english", "questions_solved": 52, "accuracy_pct": 82.0, "avg_time_sec": 45, "penalty": 2.25},
    {"section": "quant", "questions_solved": 46, "accuracy_pct": 60.0, "avg_time_sec": 70, "penalty": 1.50},
    ...
]
```

**Example 2: Weak questions (used by "Weak" practice mode)**

```python
pipeline = [
    {"$match": {"section": "dbms", "source": "practice"}},
    {"$group": {
        "_id": "$question_id",
        "total_attempts": {"$sum": 1},
        "correct_count": {"$sum": {"$cond": ["$correct", 1, 0]}},
    }},
    {"$match": {"total_attempts": {"$gte": 3}}},        # At least 3 attempts
    {"$project": {
        "accuracy_pct": {"$multiply": [{"$divide": ["$correct_count", "$total_attempts"]}, 100]},
    }},
    {"$match": {"accuracy_pct": {"$lt": 50.0}}},        # Less than 50% accuracy
    {"$sort": {"accuracy_pct": 1}},                      # Worst first
]
```

**Example 3: Latest attempt per question (used by "Wrong" mode)**

```python
pipeline = [
    {"$match": {"section": "english", "source": "practice"}},
    {"$sort": {"created_at": -1}},                       # Newest first
    {"$group": {
        "_id": "$question_id",                           # Group by question
        "correct": {"$first": "$correct"},               # Take the first (newest) record
        "created_at": {"$first": "$created_at"},
    }},
    {"$match": {"correct": False}},                      # Only wrong answers
    {"$sort": {"created_at": 1}},                        # Oldest wrong first (prioritize)
]
```

The `$first` trick: by sorting by `created_at` descending before grouping, `$first` picks the most recent attempt for each question.

### Why Not SQL?

MongoDB (NoSQL) was chosen because:
1. **Schema flexibility** — the mock_attempts schema has different structures for internal vs external mocks
2. **Embedded documents** — mock sections with their answers live inside the mock_attempt document (no JOINs needed)
3. **Free tier** — MongoDB Atlas has a generous free tier (512MB)
4. **JSON-native** — data from the frontend is already JSON, no translation needed

---

## 8. State Machines

Pages that have multiple screens use a `screen` state variable to track which view to show.

### Practice Page States

```
┌──────────┐    Start     ┌──────────┐   submit   ┌──────────┐
│ Selector │ ──────────→  │ Question │ ─────────→ │ Feedback │
│ Screen   │              │ Screen   │            │ Screen   │
└──────────┘              └──────────┘            └──────────┘
                              ↑    │                  │
                         skip │    │ next        last │
                              │    │ question     Q?   │
                              │    ▼                  ▼
                              │ ┌──────────┐   ┌──────────┐
                              └─┤ Question │   │ Summary  │
                                │ Screen   │   │ Screen   │
                                └──────────┘   └──────────┘
```

```javascript
// Practice.jsx
const [screen, setScreen] = useState("select");
// "select" → SectionSelector
// "question" → QuestionScreen
// "feedback" → FeedbackScreen
// "summary" → SessionSummary

// Render based on screen state:
if (screen === "select") return <SectionSelector onStart={handleStart} />;
if (screen === "summary") return <SessionSummary stats={sessionStats} ... />;
if (screen === "feedback") return <FeedbackScreen feedback={feedback} ... />;
return <QuestionScreen ... />;
```

### Mocks Page States

```
┌──────┐  pick    ┌───────┐  create  ┌─────────┐  submit   ┌──────────┐
│ Home │ ──────→  │ Setup │ ───────→ │ Session │ ────────→ │Transition│
└──────┘          └───────┘          └─────────┘           └──────────┘
                                                               │
                                                     more secs │
                                                          ┌────┘
                                                          ▼
                                                    ┌─────────┐
                                                    │ Session │
                                                    │ (next)  │
                                                    └─────────┘
                                                               │
                                                     all done  │
                                                          ┌────┘
                                                          ▼
                                                    ┌──────────┐
                                                    │ Results  │
                                                    └──────────┘
```

```javascript
const [screen, setScreen] = useState("home");
switch (screen) {
  case "setup": return <MockSetup ... />;
  case "session": return <MockSession ... />;
  case "transition": return <SectionTransition ... />;
  case "results": return <MockResults ... />;
  default: return <MockHome ... />;
}
```

---

## 9. Negative Marking Logic

The scoring system is the same everywhere — practice, mocks, and analytics all use this formula:

```python
def compute_scores(question, selected_option):
    """
    Returns: { marks_earned, penalty, net_score }
    """
    if selected_option is None:
        # Skipped — no marks, no penalty
        return {"marks_earned": 0, "penalty": 0, "net_score": 0}

    is_correct = (selected_option == question["correct_answer"])

    if is_correct:
        marks_earned = question["marks"]   # 2 for PK, 1 for non-PK
        penalty = 0
    else:
        marks_earned = 0
        penalty = 0.25                     # Fixed -0.25 for every wrong answer

    net_score = marks_earned - penalty
    return {"marks_earned": marks_earned, "penalty": penalty, "net_score": net_score}
```

**Why -0.25 matters:** Over 252 questions total (100 Prelims + 152 Mains), getting 20 more wrong answers than someone else costs you 5 marks — often the difference between passing and failing.

**Mock scoring** aggregates all sections:

```python
overall = {
    "raw_marks": sum of all correct answers' marks,        # e.g., 78
    "negative_marks": wrong_count * 0.25,                  # e.g., 4.5
    "net_marks": raw_marks - negative_marks,                # e.g., 73.5
    "accuracy_pct": (correct / attempted) * 100,            # e.g., 78.0
    "attempt_rate_pct": (attempted / total_questions) * 100, # e.g., 82.0
}
```

---

## 10. Practice Modes: How Question Selection Works

Each mode has a different database query:

| Mode | What It Returns | Database Query |
|------|----------------|----------------|
| **New** | Questions with zero attempts | Find all questions → find all attempted question IDs → subtract attempted from all → pick random |
| **All** | Any question in the section | `db.questions.aggregate([{ $match: { section } }, { $sample: { size: 1 } }])` |
| **Wrong** | Questions where latest attempt was wrong | Find latest attempt per question → filter where `correct: false` → pick random |
| **Weak** | Questions with <50% accuracy and ≥3 attempts | Aggregate attempts by question → compute accuracy → filter <50% with ≥3 tries → sort by accuracy ascending |
| **Bookmarked** | Questions with `bookmarked: true` | `db.questions.find({ section, bookmarked: true })` → pick random |
| **Mistakes** | Questions with ANY wrong attempt | Find all distinct question IDs where `correct: false` → pick random |

The "exclude_ids" parameter is used to avoid showing the same question twice in one session. After answering a question, its ID is added to `excludedIds`, which gets sent as `exclude_ids=q1,q2,q3` on the next `GET /practice/next` call.

---

## 11. Timers and Auto-Submit

### Timer Component (`components/Timer.jsx`)

Two modes:

**Elapsed mode (untimed practice):**
- Starts at 0, counts up every second
- Shows `MM:SS` format
- No auto-submit — the user controls when to move on

**Countdown mode (timed practice + mocks):**
- Starts at the section's time limit (e.g., 20:00 for English)
- Counts down every second
- Color changes:
  - `< 50% remaining`: yellow/amber
  - `< 20% remaining`: red
  - `< 10% remaining`: red + pulse animation
- When it hits 0: calls `onExpire` callback which auto-submits the current answer
- Persists to `sessionStorage` so timer survives page refresh:

```javascript
function persist(sectionKey, state) {
  sessionStorage.setItem(`byop_practice_timer_${sectionKey}`, JSON.stringify(state));
}

function loadPersisted(sectionKey) {
  const raw = sessionStorage.getItem(`byop_practice_timer_${sectionKey}`);
  return raw ? JSON.parse(raw) : null;
}
```

### Mock Timer

The mock timer is built into the `MockSession` component using `useState` + `setInterval`:

```javascript
const [remaining, setRemaining] = useState(section.time_limit_sec);

useEffect(() => {
  const interval = setInterval(() => {
    setRemaining((prev) => {
      if (prev <= 1) {
        clearInterval(interval);
        handleSubmitSection();  // Auto-submit
        return 0;
      }
      return prev - 1;
    });
  }, 1000);
  return () => clearInterval(interval);
}, []);
```

When the timer expires during a mock, the entire section is submitted — all answered questions are scored, unanswered ones are marked as skipped.

---

## 12. Common Errors and Fixes

### "mongomock_motor is not installed"

```
Error: ModuleNotFoundError: No module named 'mongomock_motor'
```

**Fix:** `pip install -r requirements.txt`

### "No questions found for the given criteria"

This happens when you select a practice mode that has no matching questions:
- "Wrong" mode but all questions have been answered correctly
- "Weak" mode but no questions have ≥3 attempts
- "New" mode but all questions in that section have been attempted
- A section has no questions at all

**Fix:** Switch to "All" mode or add more questions to the repository.

### "400: Invalid section"

Happens when creating a question with an invalid section name.

**Fix:** Use one of the 10 valid section keys: `english`, `reasoning`, `quant`, `dbms`, `cn`, `os`, `se`, `ds`, `coa`, `oops`.

### "KeyError: 'sections'" in mock endpoints

Happens when the `submit-section` endpoint tries to update a section that hasn't been initialized. This was a bug where sections were stored as an array but the code tried to access them as a dict.

**Fix (already applied):** Sections are now stored as a dict `{ "english": {...}, "reasoning": {...} }` with a `section_order` array to preserve sequence.

### Frontend shows blank page

Check the browser console (F12 → Console tab).

Common causes:
1. Backend not running (`npm run dev` starts frontend but backend might be down)
2. Proxy not configured (in development, Vite proxy needs to point to correct backend port)
3. API returns 500 error (check backend terminal for Python traceback)

---

## 13. Deployment Checklist

### Before Deploying to Render

- [ ] `MONGO_URL` environment variable set to MongoDB Atlas connection string
- [ ] `MOCK_DB` set to `"false"` (otherwise it uses in-memory database and data resets on restart)
- [ ] Frontend build exists at `frontend/dist/` (Render's build command handles this)
- [ ] `CORS_ORIGINS` set to your domain (or `*` for development)

### Before Pushing to GitHub

- [ ] `.env` files are in `.gitignore` (they contain secrets)
- [ ] `backend/.env.example` has no real secrets
- [ ] `node_modules/` is not committed
- [ ] `backend/__pycache__/` is not committed

### Quick Commands Reference

```bash
# Start everything locally
cd backend && uvicorn server:app --reload --port 8000 &
cd frontend && npm run dev

# Run tests
cd backend && pytest tests/ -v

# Build frontend for production
cd frontend && npm run build

# Start production server
cd backend && uvicorn server:app --host=0.0.0.0 --port=8000

# Docker
docker compose up --build

# Deploy to Render
git add .
git commit -m "Update"
git push origin main
# Render auto-deploys from your GitHub repo
```

---

## Quick Reference: Key Design Decisions

| Decision | Why |
|---|---|
| **Single-file backend** | 20 endpoints, 6 models, ~540 lines — folders add ceremony without benefit |
| **No authentication** | Single-user app, runs on private URL. Login would add complexity for zero gain |
| **No spaced repetition** | The app is for speed + breadth. Weak/mistakes modes replace SRS |
| **mongomock for dev** | Zero setup. Clone repo, pip install, and it works. No MongoDB installation needed |
| **Sections as dict in mock_attempts** | MongoDB $set needs a dict key, not an array index. Simpler updates |
| **React Query over Redux** | This app has server state (questions, stats) and UI state (modals). React Query handles server state perfectly. Redux would be overkill |
| **Timed mode = sessionStorage** | Survives page refreshes. If the browser tab crashes, the timer resumes when they come back |
| **No pause/resume in mocks** | Real IBPS SO exam doesn't pause. Mimicking that builds discipline |

---

*End of Technical Reference v1.0. Questions? Ask the developer.*
