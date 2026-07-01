# BYOP Studio — IBPS SO (IT Officer)

## Architecture & Product Specification v1.0

> **Be Your Own Perfect — IBPS SO (IT Officer)**
>
> A lightweight, single-user Study Operating System for the IBPS SO IT Officer examination.
>
> Built for speed, breadth, timed execution, and mock performance — not deep conceptual learning.

---

## Table of Contents

1. [Product Philosophy](#1-product-philosophy)
2. [Exam Architecture](#2-exam-architecture)
3. [Product Design](#3-product-design)
4. [Data Model](#4-data-model)
5. [Backend Architecture](#5-backend-architecture)
6. [Frontend Architecture](#6-frontend-architecture)
7. [UX Principles](#7-ux-principles)
8. [Professional Knowledge Strategy](#8-professional-knowledge-strategy)
9. [Build Roadmap](#9-build-roadmap)
10. [Verification Checklist](#10-verification-checklist)

---

## 1. Product Philosophy

### 1.1 What This Application Is

BYOP Studio — IBPS SO is a **single-user study operating system** for the IBPS SO (IT Officer) examination. It replaces physical planners, notebooks, and spreadsheets with a focused digital workspace optimized for:

- **Speed**: Build per-question answering speed through timed practice.
- **Breadth**: Cover all 10 sections without neglecting any.
- **Timed execution**: Master sectional time limits (20/25/35/40 minutes per section).
- **Mock performance**: Simulate the real exam with hard time enforcement and negative marking.
- **Daily consistency**: Track study volume and accuracy without complex metrics.

### 1.2 What This Application Is Not

- **Not a learning platform**: No video lectures, no interactive tutorials, no AI tutor.
- **Not a social platform**: Single-user. No leaderboards, no peer comparison, no sharing.
- **No complex revision engines**: No spaced repetition, no calendar timelines, no daily priority queues, no lecture tracking, no subject completion checklists. The app relies on simple attempt-history analysis (accuracy thresholds) for weakness detection.

### 1.3 Design Rationale

The IBPS SO (IT Officer) exam has specific characteristics that drive the architecture:

- **252 questions across 2 phases** (100 Prelims + 152 Mains) with hard sectional time limits. This makes speed and time management more critical than spaced repetition.
- **Uniform -0.25 negative marking** for every wrong answer. This makes penalty awareness a first-class feature — not an afterthought.
- **MCQ-only format** (except Descriptive English in Mains). No need for multi-select or numerical answer type support.
- **10 sections** with only 7 requiring topic-level granularity (PK subjects). English, Reasoning, and Quant are broad-skill sections that benefit from volume practice, not topic tracking.
- **Fixed exam dates** (Prelims 29 Aug, Mains 1 Nov). This means countdown-based urgency and phase readiness are more useful than open-ended mastery metrics.
- **External resources dominate**: Most aspirants take lectures and mocks from coaching centers, test series, and YouTube. The app must be an **anchor** — a place to log external activity and get directional guidance — not an all-in-one platform.

These constraints lead to a lean architecture: 4 pages, 6 collections, ~20 backend endpoints, no SRS, no calendar, no AI. The mock engine is the most important feature because it's the one thing the app provides that external resources cannot.

### 1.4 Guiding Principles

1. **One primary action per page** — every page has a single dominant CTA. Everything else is visually secondary.
2. **Minimal clicks to start practicing** — the fastest path from opening the app to answering a question is 2 clicks.
3. **High information density** — show useful data without scrolling. No empty whitespace, no decorative elements.
4. **Consistency over heroics** — the app rewards showing up daily. Study streaks and simple volume tracking > complex mastery metrics.
5. **Mocks are the core** — the mock engine is the most important feature. It must closely simulate the real exam.
6. **PK gets topic-wise practice, non-PK gets volume** — Professional Knowledge benefits from topic-level granularity because it's concept-based. English/Reasoning/Quant improve through varied practice volume alone. No spaced repetition — weak detection uses attempt count + accuracy only.

---

## 2. Exam Architecture

### 2.1 Exam Structure

#### Preliminary Examination

| Section | Questions | Marks | Time | Marks per Q | Negative |
|---------|-----------|-------|------|-------------|----------|
| English Language | 25 | 25 | 20 min | +1 | -0.25 |
| Reasoning | 25 | 25 | 20 min | +1 | -0.25 |
| Quantitative Aptitude | 25 | 25 | 20 min | +1 | -0.25 |
| Professional Knowledge | 25 | **50** | 20 min | **+2** | -0.25 |
| **Total** | **100** | **125** | **80 min** | | |

#### Main Examination

| Section | Questions | Marks | Time | Marks per Q | Negative |
|---------|-----------|-------|------|-------------|----------|
| English Language | 30 | 30 | 25 min | +1 | -0.25 |
| Reasoning | 40 | 40 | 35 min | +1 | -0.25 |
| Quantitative Aptitude | 30 | 30 | 25 min | +1 | -0.25 |
| Professional Knowledge | 50 | **100** | 40 min | **+2** | -0.25 |
| Descriptive English | 2 | 25 | 30 min | Subjective | N/A |
| **Total** | **152** | **225** | **155 min** | | |

### 2.2 Section Registry

The application defines exactly 10 sections:

```
SECTIONS = {
    "english":    { "label": "English Language",       "type": "non_pk", "has_topics": false },
    "reasoning":  { "label": "Reasoning",              "type": "non_pk", "has_topics": false },
    "quant":      { "label": "Quantitative Aptitude",  "type": "non_pk", "has_topics": false },
    "dbms":       { "label": "Database Management Systems", "type": "pk", "has_topics": true },
    "cn":         { "label": "Computer Networks",           "type": "pk", "has_topics": true },
    "os":         { "label": "Operating Systems",           "type": "pk", "has_topics": true },
    "se":         { "label": "Software Engineering",        "type": "pk", "has_topics": true },
    "ds":         { "label": "Data Structures",             "type": "pk", "has_topics": true },
    "coa":        { "label": "Computer Organization & Architecture", "type": "pk", "has_topics": true },
    "oops":       { "label": "Object-Oriented Programming", "type": "pk", "has_topics": true },
}
```

### 2.3 Professional Knowledge Topics

Each PK subject has a defined topic list. These are used for topic-wise practice and weak-topic detection.

```
PK_TOPICS = {
    "dbms": [
        "er_diagram", "relational_model", "sql", "normalization",
        "transactions", "concurrency_control", "indexing", "file_organization"
    ],
    "cn": [
        "osi_model", "tcp_ip", "routing", "ip_addressing",
        "data_link_layer", "network_security", "application_layer"
    ],
    "os": [
        "process_management", "cpu_scheduling", "memory_management",
        "file_systems", "deadlocks", "synchronization"
    ],
    "se": [
        "sdlc", "agile", "requirements", "design",
        "testing", "maintenance", "project_management"
    ],
    "ds": [
        "arrays", "linked_lists", "stacks_queues", "trees",
        "graphs", "sorting", "searching", "hashing"
    ],
    "coa": [
        "number_systems", "boolean_algebra", "cpu_organization",
        "memory_organization", "io_organization", "pipelines"
    ],
    "oops": [
        "classes_objects", "inheritance", "polymorphism",
        "encapsulation", "abstraction", "uml"
    ]
}
```

Non-PK sections (English, Reasoning, Quant) do not have sub-topics. Questions are tagged only at the section level.

### 2.4 Section Configuration

Each section in a mock test or practice session carries:

```json
{
  "key": "english",
  "label": "English Language",
  "total_questions": 25,
  "marks_per_question": 1,
  "time_limit_minutes": 20,
  "negative_marking": -0.25
}
```

Phase configurations (Prelims, Mains) define the standard section lineup:

```json
{
  "prelims": {
    "sections": ["english", "reasoning", "quant", "dbms"],
    "total_questions": 100,
    "total_marks": 125,
    "total_time_minutes": 80
  },
  "mains": {
    "sections": ["english", "reasoning", "quant", "dbms"],
    "total_questions": 150,
    "total_marks": 200,
    "total_time_minutes": 125,
    "has_descriptive": true,
    "descriptive_marks": 25,
    "descriptive_time_minutes": 30
  }
}
```

Note: Mains PK uses all 7 PK subjects aggregated under "dbms" as the section key for the objective paper. Each PK subject contributes questions proportionally.

---

## 3. Product Design

### 3.1 Page Architecture

The application has exactly **4 primary pages**:

```
/                     → Redirect to /dashboard
/dashboard            → One-screen overview
/repository           → Question bank
/practice             → Sectional practice
/mocks                → Mock test center
```

Everything else is a modal, component, or utility.

### 3.2 Dashboard (`/dashboard`)

**Primary action**: "Practice a Section" button (prominent, top-right).

**Layout** (top to bottom):

```
┌──────────────────────────────────────────────────────────────┐
│ Header: Logo | BYOP Studio · IBPS SO | Countdown: 47d | ⚙   │
├──────────────────────────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────┐                      │
│ │Questions │ │Accuracy  │ │Study Time│                      │
│ │Solved    │ │ 68%      │ │ 24h 30m  │                      │
│ │  247     │ │ ↗ +3%    │ │ this week│                      │
│ └──────────┘ └──────────┘ └──────────┘                      │
├──────────────────────────────────────────────────────────────┤
│ Today's Focus                                                 │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ 🎯 Practice QUANT — 60% accuracy · 0% syllabus covered │  │
│ │    47 days until exam. Start with Weak mode.           │  │
│ │    → Also: Complete CN syllabus (28%), review Reasoning│  │
│ │      mistakes (9 wrong this month).                    │  │
│ │    [Practice Quant Now]                                │  │
│ └────────────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────────────┤
│ Phase Readiness                                              │
│ ┌────────────────────┐ ┌────────────────────┐               │
│ │ Prelims Readiness  │ │ Mains Readiness    │               │
│ │ ██████████░░░ 68%  │ │ ████████░░░░░ 55%  │               │
│ │ Sections: 2/4 ready│ │ Sections: 1/4 ready│               │
│ │ Mock avg: 72/125   │ │ Mock avg: 141/225  │               │
│ │ Syllabus: 62%      │ │ Syllabus: 45%      │               │
│ └────────────────────┘ └────────────────────┘               │
├──────────────────────────────────────────────────────────────┤
│ Section Readiness                                            │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ Non-PK Sections                                        │  │
│ │ English    ████████░░ 82% · 52 solved · 45s · −1.00 ✅│  │
│ │ Reasoning  ██████░░░░ 65% · 38 solved · 55s · −1.75 ⚠️│  │
│ │ Quant      ██████░░░░ 60% · 46 solved · 70s · −1.50 🔴│  │
│ │ ▼ click to see topics...                               │  │
│ │                                                       │  │
│ │ Professional Knowledge                                 │  │
│ │ DBMS       ████████░░ 80% · 32 solved · 50s · −0.50 ✅│  │
│ │ CN         █████░░░░░ 52% · 28 solved · 60s · −2.00 🔴│  │
│ │ ...                                                   │  │
│ │                                                       │  │
│ │ Total penalty this month: −18.75 marks                │  │
│ └────────────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────────────┤
│ Recent Mocks                                                 │
│ ┌────────────────┐ ┌────────────────┐ ┌────────────────┐    │
│ │ Testbook #12   │ │ Prelims Mock #3│ │ Mains Mock #1  │    │
│ │ External       │ │ Internal       │ │ Internal        │    │
│ │ 72/125 · 64%   │ │ 78/125 · 64%   │ │ 141/225 · 63%  │    │
│ │ 14 Apr         │ │ 15 Apr         │ │ 10 Apr         │    │
│ └────────────────┘ └────────────────┘ └────────────────┘    │
└──────────────────────────────────────────────────────────────┘
```

**Data sources** (single API call `/api/ibps/analytics/dashboard`):
- Questions solved: count of attempts
- Accuracy: correct / (correct + wrong) across all attempts
- Study time: sum of study_logs.duration_min (this week)
- Days active: consecutive days with any activity
- Section readiness: per-section accuracy + question count + avg time + penalty total
- Syllabus coverage: from topic_coverage singleton (studied + revised topics / total topics, per section and overall)
- Phase readiness: composite of section accuracy (40%) + syllabus coverage (30%) + mock performance (30%), computed for Prelims and Mains separately
- Today's focus: lowest-ranked section by accuracy + coverage + penalty, with suggested action
- Recent mocks: last 3 mock_attempts (internal + external) ordered by taken_at desc

**Empty state**: Single card: "Welcome to BYOP Studio — IBPS SO. Import questions, log an external mock, or start your first practice session." Three buttons: [Import CSV] [Log External Mock] [Practice First Section].

### 3.3 Repository (`/repository`)

**Primary action**: "Add Question" button.

**Layout**:

```
┌──────────────────────────────────────────────────────────────┐
│ Header: Repository                        [Add Question] [+] │
├──────────────────────────────────────────────────────────────┤
│ Filters: [Section ▼] [Subject ▼] [Topic ▼] [Status ▼] [🔍] │
│       Also: Bookmarks · Mistakes · Wrong · Weak              │
├──────────────────────────────────────────────────────────────┤
│ ┌───┬─────────┬───────────┬────────────────────┬────┬──────┐│
│ │ ☐ │ Section │ Statement │ Topics             │Marks│🔥    ││
│ ├───┼─────────┼───────────┼────────────────────┼────┼──────┤│
│ │ ☐ │ DBMS    │ What is   │ Normalization      │ +2 │ ⭐   ││
│ │   │         │ 3NF?      │                    │    │      ││
│ │ ☐ │ English │ Choose    │ —                  │ +1 │      ││
│ │   │         │ correct.. │                    │    │      ││
│ │ ☐ │ Quant   │ If x=5..  │ —                  │ +1 │ ⭐   ││
│ └───┴─────────┴───────────┴────────────────────┴────┴──────┘│
│ [Bulk Delete]  Showing 1-25 of 247                  [< 1 2 3 >]│
├──────────────────────────────────────────────────────────────┤
│ Import/Export: [Import CSV] [Export CSV] [OCR Import]        │
└──────────────────────────────────────────────────────────────┘
```

**Filters**:
- **Section** dropdown: All, English, Reasoning, Quant, PK, DBMS, CN, OS, SE, DS, COA, OOPs
- **Subject**: Only visible when section is "PK" or a specific PK subject — shows PK subject sub-filter
- **Topic**: Only visible when a PK subject is selected — shows that subject's topics
- **Status**: All, Attempted, Unattempted, Correct, Wrong, Bookmarked
- **Search**: Full-text search across statement, explanation, notes, topics

**Status chips** (quick filter toggles):
- Bookmarks (⭐)
- Mistakes (✗) — questions with at least one wrong attempt
- Wrong (✗) — questions where latest attempt was wrong
- Weak (< 50% accuracy with ≥ 3 attempts)

**Row actions** (per row):
- Double-click → Question Details Modal
- Bookmark toggle
- Practice now (navigates to practice with this question)
- Edit
- Delete

**Question Form Modal** (create/edit):
- Section: dropdown (required)
- Subject: visible only when section = PK or a PK subject selected
- Topic: visible only when PK subject selected
- Question type: MCQ only (dropdown, single correct answer)
- Phase: Prelims, Mains, Both
- Statement: Markdown textarea with paste-image support
- Options: A/B/C/D text inputs (4 options, required)
- Correct answer: A/B/C/D radio
- Marks: auto-filled based on section (PK=2, non-PK=1), editable
- Explanation: Markdown textarea (optional, rich explanation)
- Notes: Markdown textarea (optional, personal notes)
- Difficulty: Easy/Medium/Hard
- Exam source: IBPS Prelims, IBPS Mains, IBPS (general)
- Year (optional)

**Question Details Modal** (read-only):
- Full statement rendered with Markdown/LaTeX
- Options displayed with correct answer highlighted
- Explanation rendered with Markdown/LaTeX
- Attempt history: last 10 attempts with date, correct/wrong, time taken
- Per-question stats: total attempts, correct %, avg time
- Bookmark toggle
- Practice this question button

**OCR Import**:
- Open OCR modal → paste a screenshot image
- Copy AI-friendly prompt to clipboard
- Prompt includes the expected format (statement, options, correct answer, explanation)
- User pastes into any AI chat, gets structured output, enters manually or via JSON import

**CSV Workflow**:
- Import: Upload CSV → parse with Papaparse → validate rows → bulk insert
- Export: Download all questions as CSV
- Import Guide: Modal showing required columns + sample row
- Required CSV columns: `section`, `statement`, `option_a`, `option_b`, `option_c`, `option_d`, `correct_answer`
- Optional CSV columns: `subject`, `topic`, `explanation`, `notes`, `difficulty`, `year`, `phase`, `marks`

**Duplicate Detection**:
- On create/import, hash the statement (normalized: lowercase, trimmed, spaces collapsed)
- If hash matches existing question, show warning: "Similar question exists: [statement preview]"
- Allow force-create anyway (user confirms)
- Duplicate index: `{ statement_hash: 1 }` on questions collection

### 3.4 Practice (`/practice`)

**Primary action**: "Start" button in the section selector.

**Flow**: Section selector → Start → Question → Submit → Feedback → Next

#### Section Selector Screen

```
┌──────────────────────────────────────────────────────────────┐
│ Practice                                      [Back to Home] │
├──────────────────────────────────────────────────────────────┤
│ Select Section                                               │
│                                                              │
│ Non-PK:                                                      │
│ [English]    [Reasoning]    [Quant]                          │
│                                                              │
│ Professional Knowledge:                                      │
│ [DBMS]  [Networking]  [OS]  [Software Eng]  [DS]  [COA]   │
│ [OOPs]                                                       │
│                                                              │
│ Mode: ○ Timed (sectional limit)  ◎ Untimed                   │
│ Questions: [10] [25] [50] [All]                              │
│ Difficulty: [Any] [Easy] [Medium] [Hard]                     │
│                                                              │
│ [Start Practice]                                             │
└──────────────────────────────────────────────────────────────┘
```

When a PK subject is selected, an optional Topic dropdown appears.

When "Timed" mode is on, the sectional timer for that section is shown and enforced. When it reaches 0, the session auto-submits whatever has been answered.

#### Question Screen

```
┌──────────────────────────────────────────────────────────────┐
│ English · Q 7/25       [⏱ 15:32]    [+1 / -0.25]     [✕]  │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ Choose the most appropriate word to fill in the blank:       │
│                                                              │
│ The committee has _____ the new policy effective immediately.│
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐  │
│ │ ○ A) enacted                                           │  │
│ │ ○ B) acted                                             │  │
│ │ ○ C) reacted                                           │  │
│ │ ○ D) interacted                                        │  │
│ └─────────────────────────────────────────────────────────┘  │
│                                                              │
│ Confidence: [1] [2] [3] [4] [5]                              │
│         Guess  Unsure  Mixed  Confident  Certain             │
│                                                              │
│ [Submit]                    [Skip →]  [Bookmark ⭐]          │
└──────────────────────────────────────────────────────────────┘
```

Keyboard shortcuts: A/D → select option, 1-5 → confidence, Enter → submit, → → skip, ← → previous.

#### Feedback Screen

```
┌──────────────────────────────────────────────────────────────┐
│ ✅ Correct!                                                   │
├──────────────────────────────────────────────────────────────┤
│ Marks: +1.00 (net +0.75 after penalty balancing)             │
│ Time: 32 seconds                                             │
│                                                              │
│ Correct Answer: A) enacted                                   │
│                                                              │
│ Explanation:                                                 │
│ "Enacted" means to put into law or make official.            │
│ "Acted" is intransitive. "Reacted" and "interacted"          │
│ don't fit the legislative context.                           │
│                                                              │
│ [Next →]  [Bookmark ⭐]  [Revisit Later]                     │
└──────────────────────────────────────────────────────────────┘
```

If wrong:

```
┌──────────────────────────────────────────────────────────────┐
│ ❌ Incorrect                        Penalty: -0.25 applied   │
├──────────────────────────────────────────────────────────────┤
│ You answered: B) acted                                       │
│ Correct answer: A) enacted                                   │
│                                                              │
│ Explanation: [same as above]                                 │
│                                                              │
│ [Next →]  [Bookmark ⭐]  [Revisit Later]                     │
└──────────────────────────────────────────────────────────────┘
```

#### Session Summary Screen

Shown when all questions in the session are exhausted:

```
┌──────────────────────────────────────────────────────────────┐
│ Session Complete — English                                    │
├──────────────────────────────────────────────────────────────┤
│ Attempted: 25/25  |  Correct: 18  |  Wrong: 7               │
│ Raw Score: 18/25  |  Penalty: -1.75  |  Net: 16.25/25       │
│ Accuracy: 72%     |  Avg Time: 42s  |  Total: 17m 30s       │
│                                                              │
│ Weak areas: Fill in the blanks (3/7 wrong)                   │
│                                                              │
│ [Practice More English]  [Review Mistakes]  [Dashboard]      │
└──────────────────────────────────────────────────────────────┘
```

#### Practice Modes

The mode selector lets the user choose the question source:

| Mode | Source | Behavior |
|------|--------|----------|
| **New** | Questions with zero attempts | Random selection from untried pool |
| **All** | All questions in section/subject | Random selection from entire pool |
| **Wrong** | Questions where latest attempt was wrong | Prioritizes fixing mistakes |
| **Weak** | Questions with < 50% accuracy and ≥ 3 attempts | Targets persistent weak spots |
| **Bookmarked** | Bookmarked questions | Review saved questions |
| **Mistakes** | Questions with any wrong attempt | Comprehensive error review |

Non-PK sections use all 6 modes. PK sections additionally allow topic-filtering within each mode. There is no "Due" mode — revision scheduling is not part of the practice system. Instead, the "Weak" mode (accuracy < 50% with ≥ 3 attempts) serves as the implicit revision mechanism for all sections.

#### Timer Behavior

- **Untimed mode**: Timer visible but non-enforced. Shows elapsed time per question and total session time.
- **Timed mode**: Shows countdown for the section's time limit (e.g., 20:00 for English). When timer reaches 0:
  - Session auto-submits all answered questions
  - Unanswered questions marked as unattempted
  - Session summary displayed
- Timer persists across page refresh (sessionStorage)

#### Marks Feedback Logic

On every submit, the response includes:

```json
{
  "correct": true,
  "marks_earned": 1,
  "penalty_applied": 0,
  "net_score_contribution": 0.75,
  "accuracy_pct": 72
}
```

`net_score_contribution = marks_earned - (penalty_applied × national_average_penalty_rate)` — a simplified display showing the real impact of negative marking on final score.

For a correct PK question: `marks_earned: 2, penalty_applied: 0, net: 1.75`
For a wrong question: `marks_earned: 0, penalty_applied: 0.25, net: -0.25`

### 3.5 Mock Test Center (`/mocks`)

**Primary action**: "Start New Mock" button.

This is the most important page in the application. It must closely simulate the real IBPS SO examination experience.

#### Mock Home Screen

```
┌──────────────────────────────────────────────────────────────┐
│ Mock Tests                                     [Start New Mock]│
├──────────────────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────────────────────┐  │
│ │ Start New Mock                                         │  │
│ │                                                        │  │
│ │ Phase: ○ Prelims (100 Q · 80 min)  ◎ Mains (152 Q ·   │  │
│ │                                       155 min)         │  │
│ │ Section Selection: [All sections] or [Customize...]    │  │
│ │ Question Count: [Standard] [Random subset]             │  │
│ │                                                        │  │
│ │ [Start Mock]                                           │  │
│ └────────────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────────────┤
│ Past Mocks                                                   │
│ ┌──────┬──────────┬───────┬────────┬────────┬─────────────┐ │
│ │ Mock │ Phase    │ Score │ Acc    │ Rank*  │ Date        │ │
│ ├──────┼──────────┼───────┼────────┼────────┼─────────────┤ │
│ │ #5   │ Prelims  │ 78/125│ 65%    │ Top 30%│ 14 Apr 2026 │ │
│ │ #4   │ Mains    │ 142/  │ 63%    │ Top 35%│ 10 Apr 2026 │ │
│ │      │          │ 225   │        │        │             │ │
│ │ #3   │ Prelims  │ 65/125│ 58%    │ Top 50%│ 5 Apr 2026  │ │
│ └──────┴──────────┴───────┴────────┴────────┴─────────────┘ │
│ *Estimated percentile based on historical IBPS SO cutoffs    │
└──────────────────────────────────────────────────────────────┘
```

#### Mock Execution Flow

**Step 1: Phase Selection** → Choose Prelims or Mains → auto-configures sections

**Step 2: Section Start** — the first section begins with its timer counting down:

```
┌──────────────────────────────────────────────────────────────┐
│ Prelims Mock #5 · Section 1/4                                 │
│ English Language                         ⏱ 19:47 remaining   │
├──────────────────────────────────────────────────────────────┤
│ Question 3/25                                                  │
│ ┌─────────────────────────────────────────────────────────┐  │
│ │ Statement + options (same as Practice question card)     │  │
│ └─────────────────────────────────────────────────────────┘  │
│                                                              │
│ Progress: ██░░░░░░░░░░░░░░░░░░░░ 3/25                       │
│                                                              │
│ [Skip]  [Mark for Review 🔖]  [Clear Answer]  [Next →]      │
└──────────────────────────────────────────────────────────────┘
```

**Step 3: Section Transition** — When timer expires or user finishes all questions:

```
┌──────────────────────────────────────────────────────────────┐
│ Section 1 Complete — English Language                         │
├──────────────────────────────────────────────────────────────┤
│ Attempted: 22/25  |  Marked for Review: 3                    │
│                                                              │
│ Time spent: 18:32 of 20:00                                   │
│                                                              │
│ [Review Answers]  [Next Section →]                           │
└──────────────────────────────────────────────────────────────┘
```

**Step 4: All Sections Complete** → Redirect to results:

```
┌──────────────────────────────────────────────────────────────┐
│ 🎯 Mock Complete — Prelims Mock #5                           │
├──────────────────────────────────────────────────────────────┤
│ Overall Score: 78/125                                        │
│ Attempted: 82/100  |  Correct: 64  |  Wrong: 18  |  Skipped: 18│
│ Raw Marks: 78  |  Negative: -4.50  |  Net: 73.50            │
│ Accuracy: 78%                                                │
├──────────────────────────────────────────────────────────────┤
│ Section Breakdown                                            │
│ ┌──────────┬─────┬────┬────┬──────┬──────┬──────┬─────────┐ │
│ │ Section  │ Qs  │Att │Cor │Wrong │Marks │ Neg  │ Acc     │ │
│ ├──────────┼─────┼────┼────┼──────┼──────┼──────┼─────────┤ │
│ │ English  │ 25  │ 22 │ 18 │  4   │ 18   │-1.00 │ 82%     │ │
│ │ Reasoning│ 25  │ 20 │ 13 │  7   │ 13   │-1.75 │ 65%     │ │
│ │ Quant    │ 25  │ 18 │ 12 │  6   │ 12   │-1.50 │ 67%     │ │
│ │ PK       │ 25  │ 22 │ 21 │  1   │ 42   │-0.25 │ 95%     │ │
│ ├──────────┼─────┼────┼────┼──────┼──────┼──────┼─────────┤ │
│ │ Total    │ 100 │ 82 │ 64 │ 18   │ 78   │-4.50 │ 78%     │ │
│ └──────────┴─────┴────┴────┴──────┴──────┴──────┴─────────┘ │
├──────────────────────────────────────────────────────────────┤
│ Weak Sections (by accuracy): Reasoning (65%), Quant (67%)    │
│                                                              │
│ Time Analysis:                                               │
│   English: 18:32/20:00 ✅                                    │
│   Reasoning: 19:15/20:00 ✅                                  │
│   Quant: 17:45/20:00 ✅                                      │
│   PK: 20:00/20:00 ⚠️ (ran out of time)                      │
│                                                              │
│ Attempt Strategy:                                            │
│   You attempted 82% of questions. At 78% accuracy,           │
│   attempting more would increase score.                      │
│   Target: 90% attempt rate with 75%+ accuracy.               │
│                                                              │
│ [Practice Weak Sections]  [View All Mocks]  [Dashboard]      │
└──────────────────────────────────────────────────────────────┘
```

**Key mock behaviors**:
- **Section locking**: Once a section's timer expires or user moves to next, the section is locked. Answers cannot be changed.
- **Auto-submit**: When timer reaches 00:00, current section auto-submits. Any unanswered questions are marked as skipped.
- **Mark for review**: Questions flagged for review are noted but not separately reviewed — this matches the real exam where there is no separate review screen.
- **Time enforcement**: The timer is enforced server-side. The frontend sends answers periodically (every 30s) as a heartbeat, so server can close the section even if the browser tab is closed.
- **Pause/resume**: Not supported. Mimics the real exam — once started, it runs continuously.

#### Negative Marking Logic

```python
def compute_net_score(section_answers):
    """
    section_answers: list of { question_id, selected_option, correct_option, marks_per_q }
    Returns: { raw, negative, net, attempted, correct, wrong, skipped }
    """
    raw = 0
    wrong_count = 0
    for ans in section_answers:
        if ans["selected_option"] is None:
            continue  # skipped, no penalty
        if ans["selected_option"] == ans["correct_option"]:
            raw += ans["marks_per_q"]
        else:
            wrong_count += 1
    negative = wrong_count * 0.25
    return {
        "raw": raw,
        "negative": negative,
        "net": raw - negative,
        "attempted": len([a for a in section_answers if a["selected_option"] is not None]),
        "correct": len([a for a in section_answers if a["selected_option"] == a["correct_option"]]),
        "wrong": wrong_count,
        "skipped": len([a for a in section_answers if a["selected_option"] is None]),
    }
```

#### Mock Result Persistence

Each mock attempt is stored permanently. Results are used for:
- Dashboard "Recent Mocks" cards
- Dashboard "Weak Sections" detection (sections with consistently low mock scores)
- Mock score trends over time
- Section-level accuracy comparison (mock vs practice)

---

## 4. Data Model

### 4.1 Collections Overview

| Collection | Purpose | Document Count (est.) |
|-----------|---------|----------------------|
| `questions` | Question bank for all 10 sections | 1000-5000 |
| `attempts` | Every practice answer submission | 10,000-50,000 |
| `study_logs` | Daily study activity records | 200-1000 |
| `mock_tests` | Mock test definitions | 10-100 |
| `mock_attempts` | Internal + external mock attempt records | 50-500 |
| `settings` | Singleton app preferences | 1 |
| `topic_coverage` | Singleton syllabus coverage map | 1 |

### 4.2 Question Schema

```json
{
  "_id": 0,
  "id": "uuid-string",
  "section": "dbms",
  "subject": "dbms",
  "topic": "normalization",
  "statement": "Which normal form eliminates transitive dependencies?",
  "statement_hash": "sha256-of-normalized-statement",
  "question_type": "mcq",
  "options": {
    "A": "1NF",
    "B": "2NF",
    "C": "3NF",
    "D": "BCNF"
  },
  "correct_answer": "C",
  "explanation": "3NF eliminates transitive dependencies...",
  "notes": "",
  "marks": 2,
  "difficulty": "medium",
  "phase": "both",
  "exam_source": "IBPS",
  "year": 2024,
  "bookmarked": false,
  "created_at": "2026-01-15T10:30:00Z",
  "updated_at": "2026-01-15T10:30:00Z"
}
```

**Field rules**:
- `id`: UUID v4 string, generated on creation
- `section`: Must be one of the 10 defined section keys
- `subject`: For PK sections, same as section key. For non-PK, same as section key (always matches section).
- `topic`: Only for PK sections. Must belong to that subject's topic list. Empty string or null for non-PK.
- `statement_hash`: SHA-256 of lowercase, trimmed, whitespace-normalized statement. Used for duplicate detection.
- `question_type`: Always `"mcq"` for objective questions. `"descriptive"` for descriptive English questions.
- `marks`: 2 for PK sections, 1 for non-PK. Auto-set on creation based on section, manually overridable.
- `phase`: `"prelims"`, `"mains"`, or `"both"`. Controls which mocks this question appears in.
- `bookmarked`: Direct boolean on the document for fast filtering.

**Indexes**:
```json
{ "section": 1, "subject": 1, "topic": 1 }
{ "statement_hash": 1, "unique": true }
{ "bookmarked": 1 }
{ "phase": 1 }
```

### 4.3 Attempt Schema

```json
{
  "_id": 0,
  "id": "uuid-string",
  "question_id": "uuid-string",
  "section": "english",
  "subject": "english",
  "topic": null,
  "correct": true,
  "selected_option": "A",
  "confidence": 4,
  "time_taken_sec": 32,
  "marks_earned": 1,
  "penalty": 0,
  "practice_mode": "new",
  "source": "practice",
  "mock_attempt_id": null,
  "created_at": "2026-04-14T15:30:00Z"
}
```

**Field rules**:
- `source`: `"practice"` or `"mock"` — distinguishes between practice sessions and mock attempts
- `mock_attempt_id`: Set when this attempt is part of a mock test. Null for practice sessions.
- `section/subject/topic`: Copied from the question at time of attempt (denormalized for analytics queries).
- `marks_earned`: The raw marks for a correct answer (2 for PK, 1 for non-PK). 0 for wrong.
- `penalty`: 0.25 for wrong answers, 0 for correct or skipped.

**Indexes**:
```json
{ "question_id": 1, "created_at": -1 }
{ "section": 1, "created_at": -1 }
{ "mock_attempt_id": 1 }
{ "source": 1, "section": 1 }
```

### 4.4 Study Log Schema

```json
{
  "_id": 0,
  "id": "uuid-string",
  "section": "dbms",
  "subject": "dbms",
  "activity": "practice",
  "duration_min": 25,
  "questions_attempted": 15,
  "questions_correct": 12,
  "questions_wrong": 3,
  "accuracy_pct": 80,
  "date": "2026-04-14",
  "created_at": "2026-04-14T15:55:00Z"
}
```

When activity is `"mock"`:
```json
{
  "activity": "mock",
  "mock_attempt_id": "uuid",
  "mock_phase": "prelims",
  "duration_min": 80,
  "questions_attempted": 82,
  "questions_correct": 64,
  "questions_wrong": 18,
  "accuracy_pct": 78,
  "date": "2026-04-14"
}
```

**Indexes**:
```json
{ "date": -1 }
{ "section": 1, "date": -1 }
```

### 4.5 Mock Test Schema

```json
{
  "_id": 0,
  "id": "uuid-string",
  "phase": "prelims",
  "title": "Prelims Mock #5",
  "sections": [
    {
      "key": "english",
      "total_questions": 25,
      "marks_per_question": 1,
      "time_limit_minutes": 20,
      "negative_marking": 0.25
    },
    {
      "key": "reasoning",
      "total_questions": 25,
      "marks_per_question": 1,
      "time_limit_minutes": 20,
      "negative_marking": 0.25
    },
    {
      "key": "quant",
      "total_questions": 25,
      "marks_per_question": 1,
      "time_limit_minutes": 20,
      "negative_marking": 0.25
    },
    {
      "key": "dbms",
      "total_questions": 25,
      "marks_per_question": 2,
      "time_limit_minutes": 20,
      "negative_marking": 0.25
    }
  ],
  "total_questions": 100,
  "total_marks": 125,
  "total_time_minutes": 80,
  "question_selection": {
    "strategy": "random",
    "subject_distribution": {
      "english": { "count": 25 },
      "reasoning": { "count": 25 },
      "quant": { "count": 25 },
      "dbms": { "count": 25 }
    }
  },
  "created_at": "2026-04-14T10:00:00Z"
}
```

For Mains PK, the `subject_distribution` under `dbms` distributes the 50 questions across the 7 PK subjects:

```json
{
  "question_selection": {
    "strategy": "random",
    "subject_distribution": {
      "english": { "count": 30 },
      "reasoning": { "count": 40 },
      "quant": { "count": 30 },
      "dbms": {
        "count": 50,
        "sub_distribution": {
          "dbms": 10, "cn": 8, "os": 8, "se": 6, "ds": 7, "coa": 6, "oops": 5
        }
      }
    }
  }
}
```

### 4.6 Mock Attempt Schema

```json
{
  "_id": 0,
  "id": "uuid-string",
  "mock_test_id": "uuid",
  "phase": "prelims",
  "started_at": "2026-04-14T10:00:00Z",
  "completed_at": "2026-04-14T11:25:00Z",
  "status": "completed",
  "sections": [
    {
      "key": "english",
      "question_ids": ["q1", "q2", ..., "q25"],
      "answers": {
        "q1": "A",
        "q2": "B",
        "q3": null,
        ...
      },
      "marked_for_review": ["q3", "q18"],
      "time_spent_sec": 1112,
      "time_limit_sec": 1200,
      "raw_marks": 18,
      "negative_marks": 1.0,
      "net_marks": 17.0,
      "correct_count": 18,
      "wrong_count": 4,
      "skipped_count": 3,
      "attempted_count": 22
    }
  ],
  "overall": {
    "raw_marks": 78,
    "negative_marks": 4.5,
    "net_marks": 73.5,
    "total_marks": 125,
    "attempted_count": 82,
    "correct_count": 64,
    "wrong_count": 18,
    "skipped_count": 18,
    "accuracy_pct": 78.0,
    "attempt_rate_pct": 82.0
  },
  "created_at": "2026-04-14T11:25:00Z"
}
```

**Indexes**:
```json
{ "mock_test_id": 1 }
{ "completed_at": -1 }
```

### 4.7 Settings Schema

```json
{
  "_id": 0,
  "id": "singleton",
  "exam_date": "2026-08-29",
  "daily_practice_target": 25,
  "daily_mock_target": 0,
  "daily_study_minutes_target": 120,
  "phase_focus": "prelims",
  "theme": "dark",
  "updated_at": "2026-04-14T10:00:00Z"
}
```

Singleton pattern: only one document with `id: "singleton"` exists. Upsert on every update.

### 4.8 Topic Coverage Schema (The Syllabus Map)

This is the feature that transforms the app from a question-practice tool into a complete preparation anchor. It answers: *"What portion of the syllabus have I actually studied?"*

```json
{
  "_id": 0,
  "id": "singleton",
  "coverage": {
    "dbms": {
      "er_diagram": { "status": "revised", "lectures": 3, "notes": true, "updated_at": "2026-04-10" },
      "relational_model": { "status": "studied", "lectures": 2, "notes": true, "updated_at": "2026-04-08" },
      "sql": { "status": "studied", "lectures": 4, "notes": false, "updated_at": "2026-04-12" },
      "normalization": { "status": "not_started", "lectures": 0, "notes": false, "updated_at": null },
      "transactions": { "status": "not_started", "lectures": 0, "notes": false, "updated_at": null }
    },
    "english": {
      "_section": { "status": "studied", "lectures": 5, "notes": true, "updated_at": "2026-04-05" }
    }
  }
}
```

**Rules**:
- Non-PK sections (English, Reasoning, Quant) have no sub-topics — a single `_section` entry captures the entire section.
- PK subjects have one entry per topic from `PK_TOPICS`.
- `status`: `"not_started"` | `"studied"` | `"revised"` . Three states only — no percentages, no dates (except updated_at), no SRS.
- `lectures`: integer count of how many lecture sessions spent on this topic (user-entered, not auto-computed).
- `notes`: boolean — has the user made notes for this topic?
- Stored as a singleton document (same pattern as settings). Single atomic update on every change.
- UI: accessible by clicking any section row in the Dashboard's Section Readiness list. Opens an inline expansion showing topics with status toggles (Not Started → Studied → Revised).

**Derived metric**: Syllabus Coverage % = (topics with status "studied" or "revised") / (total topics). Calculated client-side from the coverage map.

### 4.9 External Mock Result Schema

Because the user takes mocks from test series, coaching centers, and previous year papers. This app must be where all results — internal and external — are aggregated.

```json
{
  "_id": 0,
  "id": "uuid-string",
  "source": "external",
  "source_name": "Testbook #12",
  "phase": "prelims",
  "sections": [
    { "key": "english", "marks_obtained": 18, "total_marks": 25, "accuracy_pct": 72 },
    { "key": "reasoning", "marks_obtained": 15, "total_marks": 25, "accuracy_pct": 60 },
    { "key": "quant", "marks_obtained": 16, "total_marks": 25, "accuracy_pct": 64 },
    { "key": "dbms", "marks_obtained": 23, "total_marks": 50, "accuracy_pct": 58 }
  ],
  "overall": {
    "raw_marks": 72,
    "total_marks": 125,
    "accuracy_pct": 64,
    "notes": "Ran out of time in Quant. Need to improve speed."
  },
  "taken_at": "2026-04-14",
  "created_at": "2026-04-14T18:00:00Z"
}
```

**Rules**:
- `source_name`: free-text — user enters wherever they took the mock.
- Sections mirror the phase structure (4 sections for Prelims, 4 + Descriptive for Mains).
- No negative marking calculation for external mocks (assumes the external source reports net marks already).
- Stored alongside internal mock results in the same mock_attempts collection. Distinguished by `source: "external"` vs `source: "internal"`.
- Dashboard treats both sources equally in "Recent Mocks" and "Mock Score Trends."

---

## 5. Backend Architecture

### 5.1 Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | FastAPI | Python 3.11+ |
| ASGI Server | Uvicorn | 0.25+ |
| Database | MongoDB | 7.0+ (Atlas M0 free tier) |
| Driver | Motor | Async |
| Validation | Pydantic v2 | — |
| Mock DB (dev) | mongomock_motor | — |

### 5.2 File Structure

```
backend/
├── server.py              # Single file: all routes, models, business logic (~1500 lines)
├── syllabus.py            # IBPS_SECTIONS, PK_TOPICS, phase configs (data only)
├── config.py              # Environment variables, defaults
├── utils.py               # strip_id, now_iso, hash_statement (shared helpers)
├── seed.py                # Seed script: populates 100+ sample questions across all sections
├── tests/
│   ├── test_api.py        # All endpoint tests in one file
│   └── conftest.py        # Test fixtures (async MongoDB mock)
├── requirements.txt
├── .env.example
└── Procfile
```

**Why single-file?** This application has ~20 endpoints and ~6 data models — roughly 1500 lines of total backend logic. Splitting into `routes/` + `services/` + `models/` adds ceremony without benefit. A single `server.py` is faster to navigate, edit, and deploy. If the codebase grows past 2000 lines, split by domain (e.g., `mocks.py`, `questions.py`) — not by architectural layer.

**`server.py` internal organization** (sections in order):
1. Imports & configuration
2. Pydantic models (Question, Attempt, StudyLog, MockTest, MockAttempt, Settings)
3. Syllabus data import
4. MongoDB connection (Motor + mongomock_motor fallback)
5. Route definitions grouped by domain (meta → questions → practice → mocks → analytics → settings)
6. SPA fallback (serve React build)
7. Entry point (uvicorn.run)

### 5.3 Route Specification

All routes are mounted under `/api/ibps/`.

#### Meta

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/meta` | Return all sections, PK subjects, topics, phase configs |

Response:
```json
{
  "sections": { ... },
  "pk_subjects": ["dbms", "cn", ...],
  "pk_topics": { ... },
  "phases": { "prelims": { ... }, "mains": { ... } },
  "marks_config": { "pk": 2, "non_pk": 1, "negative": 0.25 }
}
```

#### Questions

| Method | Path | Description | Query Params |
|--------|------|-------------|-------------|
| `GET` | `/questions` | List questions with filters | `section`, `subject`, `topic`, `status`, `search`, `bookmarked`, `page`, `limit` |
| `POST` | `/questions` | Create question | — |
| `GET` | `/questions/{id}` | Get question details | — |
| `PUT` | `/questions/{id}` | Update question | — |
| `DELETE` | `/questions/{id}` | Delete question + cascade attempts | — |
| `POST` | `/questions/bulk-create` | CSV import | — |
| `POST` | `/questions/bulk-delete` | Bulk delete by IDs | — |

**GET /questions enrichment pattern**: For each question, attach computed stats from attempts collection (total_attempts, correct_count, wrong_count, avg_time, latest_attempt_correct). Use batch aggregation — one query for all question IDs, not N+1.

#### Practice

| Method | Path | Description | Query Params |
|--------|------|-------------|-------------|
| `GET` | `/practice/next` | Get next question for practice | `section`, `subject`, `topic`, `mode`, `exclude_ids` |
| `POST` | `/practice/submit` | Submit answer | — |

**POST /practice/submit request**:
```json
{
  "question_id": "uuid",
  "selected_option": "A",
  "confidence": 4,
  "time_taken_sec": 32,
  "practice_mode": "new"
}
```

**POST /practice/submit response**:
```json
{
  "correct": true,
  "correct_answer": "A",
  "marks_earned": 1,
  "penalty": 0,
  "net_score": 0.75,
  "accuracy_pct": 72,
  "explanation": "...",
  "total_attempts": 5,
  "correct_attempts": 4,
  "wrong_attempts": 1,
  "avg_time_sec": 38
}
```

**Question selection logic** (GET /practice/next):

```
For mode = "new":
  → Find question IDs with zero attempts in this section/subject
  → Exclude exclude_ids
  → Pick random

For mode = "all":
  → All question IDs in this section/subject
  → Exclude exclude_ids
  → Pick random

For mode = "wrong":
  → Find latest attempt per question where correct=false
  → Filter to this section/subject
  → Pick random (weighted: older attempts first)

For mode = "weak":
  → Find questions with ≥3 attempts and <50% accuracy
  → Filter to this section/subject
  → Sort by accuracy ascending, pick top

For mode = "bookmarked":
  → Questions where bookmarked=true in this section/subject
  → Pick random

For mode = "mistakes":
  → Questions with at least one wrong attempt
  → Filter to this section/subject
  → Pick random
```

#### Mocks

| Method | Path | Description | Notes |
|--------|------|-------------|-------|
| `GET` | `/mocks` | List saved mock definitions | — |
| `POST` | `/mocks` | Create a new mock definition | Body: `{ phase, sections?, title? }` |
| `GET` | `/mocks/{id}` | Get mock config | Returns section timings, question counts |
| `POST` | `/mocks/{id}/start` | Start an internal mock attempt | Selects questions, returns first section |
| `POST` | `/mocks/{id}/submit-section` | Submit one section's answers | Body: `{ section_key, answers, time_spent_sec }` |
| `POST` | `/mocks/{id}/finish` | Finalize mock, compute full results | — |
| `GET` | `/mocks/{id}/result` | Get full result breakdown | Returns per-section + overall |
| `GET` | `/mocks/results` | List all past mock results (internal + external) | Latest first, paginated. `?source=internal\|external\|all` |
| `POST` | `/mocks/external` | Log an external mock result | Body: `{ source_name, phase, sections[], overall, taken_at }`. Creates a mock_attempt with `source: "external"`. No question-level data needed — just section scores. |

**POST /mocks/external request**:
```json
{
  "source_name": "Testbook #12",
  "phase": "prelims",
  "sections": [
    { "key": "english", "marks_obtained": 18, "total_marks": 25, "accuracy_pct": 72 },
    { "key": "reasoning", "marks_obtained": 15, "total_marks": 25, "accuracy_pct": 60 },
    { "key": "quant", "marks_obtained": 16, "total_marks": 25, "accuracy_pct": 64 },
    { "key": "dbms", "marks_obtained": 23, "total_marks": 50, "accuracy_pct": 58 }
  ],
  "overall": { "raw_marks": 72, "total_marks": 125, "accuracy_pct": 64, "notes": "Ran out of time in Quant." },
  "taken_at": "2026-04-14"
}
```

#### Coverage (Topic Syllabus Tracking)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/coverage` | Get full topic coverage map (singleton document) |
| `PUT` | `/coverage` | Update one topic's status | Body: `{ section, topic, status, lectures?, notes? }` |
| `GET` | `/coverage/summary` | Get syllabus coverage % per section and overall |

**PUT /coverage request**:
```json
{
  "section": "dbms",
  "topic": "normalization",
  "status": "studied",
  "lectures": 2,
  "notes": true
}
```

Non-PK sections use `"_section"` as the topic key:
```json
{
  "section": "english",
  "topic": "_section",
  "status": "revised",
  "lectures": 5,
  "notes": true
}
```

**GET /coverage/summary response**:
```json
{
  "overall": 62.5,
  "sections": {
    "english": { "covered": true, "status": "revised", "pct": 100 },
    "reasoning": { "covered": true, "status": "studied", "pct": 100 },
    "quant": { "covered": false, "status": "not_started", "pct": 0 },
    "dbms": { "covered": 4, "total": 8, "pct": 50 },
    "cn": { "covered": 2, "total": 7, "pct": 28.6 },
    ...
  }
}
```

**POST /mocks/{id}/start workflow**:
1. Select questions for each section based on `question_selection` strategy
2. Random pick from matching questions (same section, phase) in the repository
3. Create `mock_attempts` document with status="in_progress"
4. Return first section config + question IDs
5. Server records start time for total duration tracking

**POST /mocks/{id}/submit-section workflow**:
1. Receive section key + answers map + time_spent
2. Validate all question IDs belong to this section
3. Compute raw marks, negative marks, net marks per section
4. Save answers to the section in mock_attempts
5. Create attempt documents for each answered question (for analytics)
6. Return section result + next section config (or null if all done)

**POST /mocks/{id}/finish workflow**:
1. Aggregate all sections into overall result
2. Create study_log for this mock session
3. Set status="completed"
4. Return full result

**GET /mocks/{id}/result response**:
```json
{
  "overall": {
    "raw_marks": 78,
    "negative_marks": 4.5,
    "net_marks": 73.5,
    "total_marks": 125,
    "accuracy_pct": 78,
    "attempt_rate_pct": 82,
    "attempted": 82,
    "correct": 64,
    "wrong": 18,
    "skipped": 18,
    "total_time_sec": 4800
  },
  "sections": [
    {
      "key": "english",
      "raw_marks": 18,
      "negative_marks": 1.0,
      "net_marks": 17.0,
      "marks_per_question": 1,
      "accuracy_pct": 82,
      "attempted": 22,
      "correct": 18,
      "wrong": 4,
      "skipped": 3,
      "time_spent_sec": 1112,
      "time_limit_sec": 1200,
      "time_used_pct": 92.7
    }
  ],
  "comparison": {
    "rank_estimate": "Top 30%",
    "previous_best": 72,
    "previous_avg": 68,
    "trend": "improving"
  },
  "weak_sections": ["quant", "reasoning"],
  "recommendations": [
    "Practice Reasoning — 65% accuracy needs improvement",
    "Improve attempt rate — skipped 18% of questions"
  ]
}
```

#### Analytics

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/analytics/dashboard` | All dashboard stats — section readiness, phase readiness, today's focus, recent mocks |

**GET /analytics/dashboard** returns:
```json
{
  "overview": {
    "total_questions_solved": 247,
    "overall_accuracy_pct": 68,
    "total_study_minutes_this_week": 1470,
    "days_active_this_week": 5
  },
  "sections": [
    {
      "key": "english",
      "accuracy_pct": 82,
      "questions_solved": 52,
      "avg_time_sec": 45,
      "correct": 43,
      "wrong": 9,
      "penalty": 2.25
    }
  ],
  "total_penalty_this_month": 18.75,
  "syllabus_coverage": {
    "overall_pct": 62.5,
    "per_section": {
      "english": 100,
      "reasoning": 100,
      "quant": 0,
      "dbms": 50,
      "cn": 28.6
    }
  },
  "phase_readiness": {
    "prelims": {
      "readiness_pct": 68,
      "sections_included": ["english", "reasoning", "quant", "dbms"],
      "sections_ready": 2,
      "sections_at_risk": 2,
      "mock_avg_score": 72,
      "mock_avg_total": 125,
      "syllabus_pct": 62.5
    },
    "mains": {
      "readiness_pct": 55,
      "sections_included": ["english", "reasoning", "quant", "dbms"],
      "sections_ready": 1,
      "sections_at_risk": 3,
      "mock_avg_score": 141,
      "mock_avg_total": 225,
      "syllabus_pct": 45
    }
  },
  "today_focus": {
    "focus_section": "quant",
    "focus_reason": "Lowest accuracy (60%) and syllabus untouched (0%). 47 days until exam.",
    "suggested_action": "practice",
    "practice_mode": "weak",
    "secondary_actions": [
      "Complete CN syllabus — 28% covered",
      "Review Reasoning mistakes — 9 wrong answers this month"
    ]
  },
  "recent_mocks": [
    {
      "id": "uuid",
      "source": "internal",
      "title": "Prelims Mock #5",
      "phase": "prelims",
      "score": 78,
      "total_marks": 125,
      "accuracy_pct": 78,
      "completed_at": "2026-04-14T11:25:00Z"
    }
  ],
  "weak_sections": ["se", "cn"],
  "daily_activity": [
    { "date": "2026-04-14", "minutes": 80, "questions": 25 },
    { "date": "2026-04-13", "minutes": 0, "questions": 0 }
  ]
}
```

**Phase readiness computation**:
```
phase_readiness = (section_accuracy_weight × 0.4) + (syllabus_coverage_weight × 0.3) + (mock_performance_weight × 0.3)

Where:
- section_accuracy_weight = average accuracy across all sections in that phase
- syllabus_coverage_weight = average syllabus coverage across all sections in that phase
- mock_performance_weight = (latest mock score / latest mock total) × 100, or 0 if no mocks taken
```

**Today's focus computation**:
1. Find the section with the lowest combined score of: low accuracy + low syllabus coverage + high penalty
2. If all sections are in good shape (>70% accuracy, >80% coverage), suggest "Take a mock test — Prelims is near!"
3. If exam is within 30 days, prioritize mock performance and sectional timing practice over syllabus coverage
4. Generate secondary actions from: sections with <50% syllabus coverage, sections with >5 wrong answers this month
5. The countdown on the dashboard and in the Today's Focus card always counts toward the Prelims date (29 Aug 2026) — this is the first checkpoint. The Mains date is available in settings for context but the primary focus is Prelims readiness.

#### Settings

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/settings` | Get current settings |
| `PUT` | `/settings` | Update settings |

### 5.4 Business Logic

#### Weak Topic Detection (Replaces SRS)

No spaced repetition. Weakness is determined purely by attempt history:

```python
def detect_weak_questions(section_key, min_attempts=3, accuracy_threshold=50.0):
    """
    Find questions in a section where the user has:
    - At least `min_attempts` total attempts
    - Accuracy below `accuracy_threshold`
    
    Returns questions sorted by weakness (lowest accuracy first).
    Used by "Weak" practice mode and Dashboard weak-section detection.
    """
    pipeline = [
        {"$match": {"section": section_key, "source": "practice"}},
        {"$group": {
            "_id": "$question_id",
            "total_attempts": {"$sum": 1},
            "correct_count": {"$sum": {"$cond": ["$correct", 1, 0]}},
            "wrong_count": {"$sum": {"$cond": ["$correct", 0, 1]}},
            "latest_attempt": {"$max": "$created_at"}
        }},
        {"$match": {"total_attempts": {"$gte": min_attempts}}},
        {"$project": {
            "question_id": "$_id",
            "total_attempts": 1,
            "correct_count": 1,
            "wrong_count": 1,
            "accuracy_pct": {"$multiply": [{"$divide": ["$correct_count", "$total_attempts"]}, 100]}
        }},
        {"$match": {"accuracy_pct": {"$lt": accuracy_threshold}}},
        {"$sort": {"accuracy_pct": 1}}
    ]
    return await db.attempts.aggregate(pipeline).to_list(None)


def compute_weak_sections(min_attempts=20, accuracy_threshold=60.0):
    """
    Identify entire sections where the user is underperforming.
    A section is "weak" if overall accuracy < threshold with sufficient volume.
    Used by Dashboard to flag sections needing attention.
    """
    pipeline = [
        {"$match": {"source": "practice"}},
        {"$group": {
            "_id": "$section",
            "total_attempts": {"$sum": 1},
            "correct_count": {"$sum": {"$cond": ["$correct", 1, 0]}}
        }},
        {"$match": {"total_attempts": {"$gte": min_attempts}}},
        {"$project": {
            "section": "$_id",
            "total_attempts": 1,
            "accuracy_pct": {"$round": [{"$multiply": [{"$divide": ["$correct_count", "$total_attempts"]}, 100]}, 1]}
        }},
        {"$match": {"accuracy_pct": {"$lt": accuracy_threshold}}}
    ]
    return await db.attempts.aggregate(pipeline).to_list(None)
```

This replaces any need for SRS state tracking, interval computation, or "due" mode. The system never needs to know *when* a question should be reviewed next — it only needs to know whether the user's historical performance on that question is weak.

#### Dashboard Computation

Single endpoint aggregates from multiple collections in 3 parallel queries:

**Query 1: Per-section attempt stats (includes penalty)**
```python
pipeline = [
    {"$match": {"source": "practice"}},
    {"$group": {
        "_id": "$section",
        "questions_solved": {"$sum": 1},
        "correct_count": {"$sum": {"$cond": ["$correct", 1, 0]}},
        "wrong_count": {"$sum": {"$cond": ["$correct", 0, 1]}},
        "total_time_sec": {"$sum": "$time_taken_sec"},
        "total_penalty": {"$sum": "$penalty"}
    }},
    {"$project": {
        "section": "$_id",
        "questions_solved": 1,
        "correct": "$correct_count",
        "wrong": "$wrong_count",
        "accuracy_pct": {"$round": [{"$multiply": [{"$divide": ["$correct_count", {"$add": ["$correct_count", "$wrong_count"]}]}, 100]}, 1]},
        "avg_time_sec": {"$round": [{"$divide": ["$total_time_sec", "$questions_solved"]}, 0]},
        "penalty": "$total_penalty"
    }}
]
section_stats = await db.attempts.aggregate(pipeline).to_list(None)
```

**Query 2: Study time (this week)**
```python
week_start = (date.today() - timedelta(days=date.today().weekday())).isoformat()
pipeline = [
    {"$match": {"date": {"$gte": week_start}}},
    {"$group": {"_id": None, "total_minutes": {"$sum": "$duration_min"}}}
]
study_stats = await db.study_logs.aggregate(pipeline).to_list(None)
```

**Query 3: Recent mock attempts**
```python
recent_mocks = await db.mock_attempts.find(
    {"status": "completed"},
    sort=[("completed_at", -1)], limit=3,
    projection={"_id": 0, "id": 1, "mock_test_id": 1, "phase": 1, "overall": 1, "completed_at": 1}
).to_list(3)
```

**Response assembly**:
```python
{
  "overview": {
    "total_questions_solved": sum(s["questions_solved"] for s in section_stats),
    "overall_accuracy_pct": computed_accuracy,
    "total_study_minutes_this_week": study_stats[0]["total_minutes"] if study_stats else 0,
    "days_active_this_week": computed_active_days
  },
  "sections": section_stats,          # each section includes penalty field
  "total_penalty_this_month": computed_penalty_30d,
  "recent_mocks": recent_mocks,
  "weak_sections": compute_weak_sections(),
  "daily_activity": computed_last_14_days
}
```

### 5.5 Configuration

```python
# config.py
import os

MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "byopstudio_ibps")
CORS_ORIGINS = os.environ.get("CORS_ORIGINS", "*").split(",")
EXAM_DATE_DEFAULT = "2026-08-29"
NEGATIVE_MARKING_RATE = 0.25
PK_MARKS = 2
NON_PK_MARKS = 1
```

### 5.6 Shared Utilities

```python
# utils.py
import uuid, hashlib, re
from datetime import datetime

def new_id():
    return str(uuid.uuid4())

def now_iso():
    return datetime.utcnow().isoformat()

def strip_id(doc):
    if doc and "_id" in doc:
        doc.pop("_id")
    return doc

def hash_statement(statement):
    normalized = re.sub(r'\s+', ' ', statement.lower().strip())
    return hashlib.sha256(normalized.encode()).hexdigest()

def compute_net_score(raw_marks, wrong_count, rate=0.25):
    return raw_marks - (wrong_count * rate)
```

---

## 6. Frontend Architecture

### 6.1 Technology Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18+ |
| Routing | react-router-dom v6+ |
| Data Fetching | @tanstack/react-query v5+ |
| Styling | TailwindCSS v3+ |
| UI Primitives | Radix UI (dialog, select, dropdown, checkbox, tabs, tooltip, toast) |
| Icons | lucide-react |
| Markdown/LaTeX | react-markdown + rehype-katex + remark-math |
| CSV | papaparse |
| HTTP | axios |
| Build | Create React App + craco (or Vite) |

### 6.2 Folder Structure

```
frontend/
├── public/
│   └── index.html
├── src/
│   ├── index.js
│   ├── index.css          # Tailwind directives + CSS variables
│   ├── App.js             # Router + Layout
│   │
│   ├── pages/
│   │   ├── Dashboard.jsx
│   │   ├── Repository.jsx
│   │   ├── Practice.jsx
│   │   └── Mocks.jsx
│   │
│   ├── components/
│   │   ├── Layout.jsx         # Header, nav, theme toggle
│   │   ├── StatCard.jsx       # Reusable metric card
│   │   ├── SectionProgress.jsx # Section readiness row
│   │   ├── QuestionCard.jsx   # Statement + options renderer
│   │   ├── FeedbackCard.jsx   # Correct/wrong feedback
│   │   ├── SessionSummary.jsx # End-of-session stats
│   │   ├── MockResultCard.jsx # Mock result summary
│   │   ├── PhaseReadinessCard.jsx # Prelims/Mains readiness pair
│   │   ├── TodayFocusCard.jsx  # Daily guidance widget
│   │   ├── Timer.jsx          # Countdown / elapsed timer
│   │   ├── SectionSelect.jsx  # Section picker with PK sub-filter
│   │   ├── StudyTimer.jsx     # Stopwatch/countdown study timer
│   │   ├── Latex.jsx          # KaTeX wrapper
│   │   ├── MarkdownRenderer.jsx # Markdown + LaTeX
│   │   ├── HelpButton.jsx     # Contextual help
│   │   └── Modal.jsx          # Generic modal
│   │
│   ├── components/ui/         # 20-25 Radix UI wrappers (as needed)
│   │   ├── button.jsx
│   │   ├── card.jsx
│   │   ├── dialog.jsx
│   │   ├── select.jsx
│   │   ├── input.jsx
│   │   ├── badge.jsx
│   │   ├── checkbox.jsx
│   │   ├── tabs.jsx
│   │   └── tooltip.jsx
│   │
│   ├── lib/
│   │   ├── api.js             # Axios client + all API methods
│   │   ├── constants.js       # Sections, subjects, topics, phase configs
│   │   ├── ibpsSyllabus.js    # Frontend copy of syllabus data
│   │   ├── dateUtils.js       # Date formatting
│   │   └── utils.js           # General utilities
│   │
│   └── hooks/
│       ├── useTheme.js
│       └── useTimer.js        # Shared timer logic
│
├── package.json
├── tailwind.config.js
└── craco.config.js
```

### 6.3 Routing

```jsx
// App.js
<BrowserRouter>
  <Routes>
    <Route element={<Layout />}>
      <Route path="/" element={<Navigate to="/dashboard" />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/repository" element={<Repository />} />
      <Route path="/practice" element={<Practice />} />
      <Route path="/mocks" element={<Mocks />} />
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Route>
  </Routes>
</BrowserRouter>
```

### 6.4 Layout Component

```
┌──────────────────────────────────────────────────────────────┐
│ Logo: BYOP Studio · IBPS SO     [Dashboard] [Repository]     │
│       ⚡ v1.0                                [Practice] [Mocks]│
│                                              [🌙] [Help] [?] │
└──────────────────────────────────────────────────────────────┘
│                                                              │
│  <Outlet /> — page content                                   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

- 4 primary nav items in header: Dashboard, Repository, Practice, Mocks
- Theme toggle (dark/light)
- Help button with contextual content per page
- No Command Palette, no countdown in header (countdown only on Dashboard)
- Mobile: hamburger menu with same 4 items

### 6.5 State Management

No state management library. Use:
- **React Query** for all server state (questions, attempts, analytics, mocks)
- **URL search params** for filter state (section, mode, subject, topic, page)
- **localStorage** for theme preference, timer state persistence
- **React state (useState)** for UI state (modal open/close, selected option, form input)

Benefits: minimal dependencies, no boilerplate, cache invalidation via React Query's `invalidateQueries`.

### 6.6 API Client

```javascript
// lib/api.js
import axios from "axios";

const API_BASE = "/api/ibps";
const client = axios.create({ baseURL: API_BASE, headers: { "Content-Type": "application/json" } });

export const metaApi = {
  get: () => client.get("/meta").then(r => r.data),
};

export const questionsApi = {
  list: (params) => client.get("/questions", { params }).then(r => r.data),
  get: (id) => client.get(`/questions/${id}`).then(r => r.data),
  create: (data) => client.post("/questions", data).then(r => r.data),
  update: (id, data) => client.put(`/questions/${id}`, data).then(r => r.data),
  remove: (id) => client.delete(`/questions/${id}`).then(r => r.data),
  bulkCreate: (rows) => client.post("/questions/bulk-create", { rows }).then(r => r.data),
  bulkDelete: (ids) => client.post("/questions/bulk-delete", { ids }).then(r => r.data),
};

export const practiceApi = {
  next: (params) => client.get("/practice/next", { params }).then(r => r.data),
  submit: (data) => client.post("/practice/submit", data).then(r => r.data),
};

export const mocksApi = {
  list: () => client.get("/mocks").then(r => r.data),
  create: (data) => client.post("/mocks", data).then(r => r.data),
  get: (id) => client.get(`/mocks/${id}`).then(r => r.data),
  start: (id) => client.post(`/mocks/${id}/start`).then(r => r.data),
  submitSection: (id, data) => client.post(`/mocks/${id}/submit-section`, data).then(r => r.data),
  finish: (id) => client.post(`/mocks/${id}/finish`).then(r => r.data),
  result: (id) => client.get(`/mocks/${id}/result`).then(r => r.data),
  results: () => client.get("/mocks/results").then(r => r.data),
};

export const analyticsApi = {
  dashboard: () => client.get("/analytics/dashboard").then(r => r.data),
};

export const coverageApi = {
  get: () => client.get("/coverage").then(r => r.data),
  update: (section, topic, data) => client.put("/coverage", { section, topic, ...data }).then(r => r.data),
  summary: () => client.get("/coverage/summary").then(r => r.data),
};

export const settingsApi = {
  get: () => client.get("/settings").then(r => r.data),
  update: (data) => client.put("/settings", data).then(r => r.data),
};
```

### 6.7 Key Component Specifications

#### QuestionCard

Props: `question`, `selectedOption`, `onSelect`, `disabled`

Renders:
- Statement via MarkdownRenderer
- 4 option buttons (A/B/C/D) with radio-style selection
- Highlights selected option
- Keyboard: A/D to select, Enter to confirm
- Disabled state during submission

#### FeedbackCard

Props: `result`, `question`, `onNext`, `onBookmark`, `onRevisit`

Renders:
- Correct/wrong indicator with color (green/red)
- Marks earned + penalty display
- Correct answer highlighted
- Explanation via MarkdownRenderer
- Next button, Bookmark toggle, Revisit button

#### Timer

Props: `totalSeconds`, `mode` (countdown / elapsed), `onExpire`

Renders:
- MM:SS format
- Color changes when < 20% time remaining (amber → red)
- Flashes when < 10% remaining
- onExpire callback when countdown reaches 0
- Persists to sessionStorage for crash recovery

#### SectionSelect

Props: `value`, `onChange`, `showSubject`, `showTopic`

Renders:
- Section dropdown: English, Reasoning, Quant, PK, then each PK subject individually
- When PK is selected and showSubject=true, shows a second dropdown listing all 7 PK subjects
- When a PK subject is selected and showTopic=true, shows a third dropdown with that subject's topics
- Each section has a icon/color indicator

### 6.8 Page State Machines

#### Dashboard

```
┌─────────┐   fetch   ┌──────────┐   error   ┌─────────┐
│ Loading  │ ───────→ │  Data    │ ───────→  │  Error  │
│ (skeleton)│          │  Fetched │           │  State  │
└─────────┘           └──────────┘           └─────────┘
                           │
                           ▼
                     ┌──────────┐
                     │  Rendered│
                     │  Widgets │
                     └──────────┘
```

#### Practice

```
┌──────────┐   select    ┌──────────┐  start   ┌──────────┐
│ Section  │ ─────────→ │  Mode    │ ───────→ │ Question │
│ Selector │            │  Select  │          │  Screen  │
└──────────┘            └──────────┘          └──────────┘
                                                  │
                                             submit │
                                                  ▼
                                          ┌──────────┐
                                          │ Feedback │
                                          │  Screen  │
                                          └──────────┘
                                            │      │
                                      next  │      │  all done
                                            ▼      ▼
                                     ┌──────────┐ ┌──────────┐
                                     │ Question │ │ Session  │
                                     │  Screen  │ │ Summary  │
                                     └──────────┘ └──────────┘
```

Each screen is a state within the Practice page — not separate routes.

#### Mocks

```
┌──────────┐  create   ┌──────────┐  start   ┌──────────┐
│ Mock     │ ───────→ │  Mock    │ ───────→ │ Section  │
│ Home     │           │  Setup   │          │ 1 of N   │
└──────────┘           └──────────┘          └──────────┘
                                                │
                                          submit │
                                                ▼
                                        ┌──────────┐   more    ┌──────────┐
                                        │ Section  │ ──────→  │ Section  │
                                        │ Complete │           │ N+1      │
                                        │ (review) │           └──────────┘
                                        └──────────┘
                                              │  all done
                                              ▼
                                        ┌──────────┐
                                        │  Mock    │
                                        │ Results  │
                                        └──────────┘
```

### 6.9 Responsive Behavior

| Breakpoint | Layout |
|-----------|--------|
| < 640px (mobile) | Single column, hamburger nav, stacked cards, full-width tables scroll horizontally |
| 640-1024px (tablet) | 2-column grid on dashboard, side-by-side stat cards |
| > 1024px (desktop) | Full layout with max-width 1400px centered |

- Dashboard section list uses collapsible groups (Non-PK, PK) on all sizes
- Repository table is horizontally scrollable on mobile with sticky first column
- Practice question card is full-width at all sizes
- Mock execution is full-width at all sizes (critical focus mode)

---

## 7. UX Principles

### 7.1 One Primary Action Per Page

Every page has exactly one visually dominant button:

| Page | Primary Action | Button Style |
|------|---------------|-------------|
| Dashboard | "Practice a Section" | Filled, accent color, top-right |
| Repository | "Add Question" | Filled, accent color |
| Practice | "Start" (in section selector) | Filled, large, centered |
| Mocks | "Start New Mock" | Filled, large, centered |

All other actions are secondary (outline, ghost, or icon buttons).

### 7.2 High Information Density

- Show data without requiring scroll for common cases
- Use compact table rows with truncated text (expand on click)
- Color-coded status indicators instead of text labels where possible
- Progress bars with numeric overlays
- Section cards show 3-4 metrics in minimal space
- No redundant whitespace or decorative elements

### 7.3 Minimal Clicks

- Fastest path to answering a question: Dashboard → click section → Start → Question (3 clicks)
- Fastest path to mock: Dashboard → "Start New Mock" → configure → Start (3 clicks)
- Bookmark toggle: single click on star icon
- Filter change: single selection from dropdown, no "Apply" button needed

### 7.4 Empty States

Every page has a purposeful empty state:

| Page | Empty State |
|------|------------|
| Dashboard | "Welcome! Start by importing questions, logging an external mock, or taking your first practice session." + [Import CSV] [Log External Mock] [Practice First Section] |
| Repository | "No questions yet. Add your first question or import from CSV." + [Add Question] [Import CSV] |
| Practice | "Add questions to the repository before practicing." + [Go to Repository] |
| Mocks | "No mock tests yet. Create your first mock to simulate the real exam." + [Start New Mock] |

### 7.5 Loading States

- Dashboard: skeleton cards (grey placeholder rectangles)
- Repository: skeleton table rows (6 rows of grey bars)
- Practice: centered spinner on section selector, skeleton question card
- Mocks: skeleton cards for mock list, full-screen loading overlay during mock start
- All data fetches use React Query's `isLoading` and `isFetching` states

### 7.6 Accessibility

- All interactive elements are keyboard-navigable
- Focus indicators are visible (2px ring in accent color)
- Color is never the sole indicator (use text + icon + color)
- Form inputs have associated labels
- Dialogs trap focus and close on Escape
- Timer warnings are both visual (color change) and announced (aria-live region)
- All icons have aria-labels

### 7.7 Visual Design

- **Color scheme**: Dark mode default. Warm accent (amber/copper/orange) — no blue. Light mode uses off-white/cream backgrounds.
- **Borders**: Strong 2px borders on cards and containers (neo-brutalist influence).
- **Spacing**: Consistent 4px grid. 16px default padding, 24px card padding, 8px between compact elements.
- **Typography**: Monospace for data/numbers, sans-serif for body text.
- **Transitions**: Subtle 150ms ease-in-out on hover/active states. No decorative animations.
- **Icons**: lucide-react, minimal set (bookmark, clock, target, bar-chart, plus, chevron, etc.)

---

## 8. Professional Knowledge Strategy

### 8.1 Why PK Is Treated Differently

Professional Knowledge (DBMS, CN, OS, SE, DS, COA, OOPs) is fundamentally different from English, Reasoning, and Quant:

| Dimension | PK Subjects | Non-PK Sections |
|-----------|-------------|-----------------|
| Nature | Knowledge-based (concepts, definitions, facts) | Skill-based (language, logic, numeracy) |
| Question variety | Finite: standard question types per topic | Infinite: any passage, puzzle, or calculation |
| Improvement path | Learn topics → practice → reinforce | Practice volume → pattern recognition → speed |
| Topic granularity | Well-defined topics with syllabi | Broad skills, no sub-topics |
| Weak detection | Per-topic accuracy (fine-grained) | Per-section accuracy (coarse) |

### 8.2 PK Features

1. **Topic-wise practice**: Select a specific topic (e.g., "Normalization" under DBMS) and practice only questions on that topic. This is the primary PK-specific feature.
2. **Topic weakness detection**: Dashboard shows per-topic accuracy and question count for each PK subject. A topic is "weak" when accuracy < 50% with ≥ 3 attempts. Detected automatically via the `detect_weak_questions()` aggregation pipeline — no SRS state needed.
3. **Subject-level readiness**: Each PK subject shows overall accuracy, question count, avg time, and penalty in the Section Readiness list (same as non-PK sections).

### 8.3 Non-PK Strategy

1. **Section-based only**: No topic drill-down. Practice is always "English", "Reasoning", or "Quant."
2. **Volume-focused**: Track total questions solved per section. Improvement comes from exposure to varied question types and timed practice.
3. **Weak detection at section level**: A non-PK section is flagged as weak when overall accuracy < 60% with ≥ 20 attempts.

### 8.4 Common Approach (PK + Non-PK)

Both PK and non-PK sections use the same underlying mechanism — there is no separate revision system:

| Mechanism | PK | Non-PK |
|-----------|----|--------|
| Practice mode selection | New, All, Wrong, Weak, Bookmarked, Mistakes | New, All, Wrong, Weak, Bookmarked, Mistakes |
| Topic filter | Yes (by topic) | No |
| Weak detection granularity | Per-topic (≥3 attempts, <50% accuracy) | Per-section (≥20 attempts, <60% accuracy) |
| "Due" revision mode | None | None |
| SRS state tracking | None | None |
| Implicit revision | Weak mode + Mistakes mode | Weak mode + Mistakes mode |

### 8.5 Descriptive English (Mains)

Descriptive English is a separate concern from the MCQ practice system. It is **25 marks in Mains** with a 30-minute time limit.

#### Workflow

1. **Prompt bank**: A curated list of 20-30 essay/letter/precis prompts relevant to IBPS SO. Stored in the syllabus data. Each prompt has:
   - `id`: unique key
   - `type`: "essay" | "letter" | "precis" | "report"
   - `title`: Short prompt title
   - `description`: Full prompt text
   - `word_limit`: Expected word count (e.g., 250 words)
   - `tips`: Optional bullet-point guidance

2. **Practice mode**: In the Practice page, a "Descriptive" card appears alongside section buttons (only for Mains phase). Clicking it shows the prompt bank.

3. **Answer entry**: A full-screen text editor with:
   - Prompt displayed at top (referenceable during writing)
   - Rich textarea (monospace font, word counter, timer)
   - Timer: 30-minute countdown per essay
   - Auto-save: every 30 seconds to localStorage

4. **Self-scoring rubric**: After submission, the user rates their own answer on 4 criteria:

| Criterion | Scale | Description |
|-----------|-------|-------------|
| Content relevance | 1-5 | Does the answer address the prompt directly? |
| Structure & organization | 1-5 | Clear introduction, body, conclusion? Logical flow? |
| Language & grammar | 1-5 | Correct grammar, appropriate vocabulary, clarity |
| Word count adherence | 1-5 | Within ±10% of the suggested word limit |

Total score = (sum of 4 criteria / 20) × 25 = score out of 25.

5. **Storage**: Each Descriptive attempt is stored as:

```json
{
  "id": "uuid",
  "prompt_id": "essay_01",
  "user_answer": "Full text of the essay...",
  "scores": { "content": 4, "structure": 3, "language": 4, "word_count": 5 },
  "total_score": 20,
  "total_out_of": 25,
  "time_taken_sec": 1680,
  "word_count": 248,
  "created_at": "2026-04-14T16:00:00Z"
}
```

6. **Non-impact on readiness**: Descriptive English practice results do not affect Dashboard readiness metrics, section accuracy calculations, or any analytics. Descriptive English is tracked purely as a standalone practice record — it exists for the user's reference only. No "Descriptive readiness" bar, no penalty aggregation, no weak detection. It is invisible to the preparation engine.

7. **Mock integration**: During a Mains mock, after all objective sections are complete, the Descriptive section presents one randomly selected prompt with a 30-minute countdown. The result is stored as part of the mock_attempt (with the user's self-score).

---

## 9. Build Roadmap

### Phase 1: Foundation (Build Order: 1)

**Objective**: Establish the project scaffolding, data model, seed data, and core backend.

**Backend**:
- [ ] Create project structure (`server.py`, `syllabus.py`, `config.py`, `utils.py`, `seed.py`)
- [ ] Implement `syllabus.py` with all 10 sections, PK topics, phase configs
- [ ] Implement `config.py` and `utils.py`
- [ ] Implement all Pydantic models in `server.py` (Question, Attempt, StudyLog, MockTest, MockAttempt, Settings)
- [ ] Implement meta endpoint and settings endpoint in `server.py`
- [ ] Set up MongoDB connection with mongomock_motor fallback
- [ ] Set up CORS, static file serving, Procfile
- [ ] Implement `seed.py` — creates 10-15 sample questions per section (100-150 total) so the app is usable immediately on first launch. Questions cover all 10 sections with realistic IBPS SO content. Seed runs on first request (if questions collection is empty).
- [ ] Add a "seed demo data" button in the app's empty state (same pattern: POST /api/seed)

**Frontend**:
- [ ] Create React project with Tailwind + craco
- [ ] Implement `App.js` with router and 4 routes
- [ ] Implement `Layout.jsx` with 4 nav items + theme toggle
- [ ] Implement `ibpsSyllabus.js` with section data
- [ ] Implement `api.js` with all API method stubs
- [ ] Implement `useTheme.js` hook
- [ ] Implement basic Radix UI wrappers (button, card, dialog, select, input, badge, tabs, tooltip)

**Verification**: App loads, shows 4 nav items, theme toggle works, /api/ibps/meta returns correct data.

---

### Phase 2: Repository + Syllabus Map (Build Order: 2)

**Objective**: Question CRUD with filtering, search, CSV import/export. Topic syllabus tracking (this is what makes the app an anchor — the user can mark what they've studied even if they haven't practiced it yet).

**Backend**:
- [ ] Implement question routes in `server.py` — all 7 question routes (CRUD + bulk)
- [ ] Add attempt count aggregation for enrichment
- [ ] Implement coverage routes — `GET /coverage`, `PUT /coverage`, `GET /coverage/summary`. Singleton document, ~30 lines total. No separate service file.

**Frontend**:
- [ ] Implement Repository page with filter bar (Section, Subject, Topic, Status, Search)
- [ ] Implement compact question table with section badge, statement preview, marks, bookmark, actions
- [ ] Implement QuestionFormModal (create/edit) with conditional subject/topic fields
- [ ] Implement QuestionDetailsModal (read-only with attempt history)
- [ ] Implement CSV import/export modal with Import Guide
- [ ] Implement OCR prompt modal
- [ ] Implement status chip filters (Bookmarks, Mistakes, Wrong, Weak)
- [ ] Implement bulk delete with undo toast
- [ ] Implement empty state
- [ ] **New: Syllabus coverage inline panel** — clicking a section row in the Dashboard's Section Readiness list expands to show topics with 3-state toggles (Not Started → Studied → Revised) + lecture count + notes checkbox. Not a separate page — an inline expansion that collapses back. One PUT request per toggle. Stored in the singleton coverage document.

**Verification**: Create/edit/delete questions, filter by section/subject/topic/status/search, import/export CSV, duplicate detection works. Mark a topic as "Studied" → Dashboard syllabus coverage % updates. Mark all PK topics for a subject → that subject shows 100% coverage.

---

### Phase 3: Practice (Build Order: 3)

**Objective**: Sectional practice with timing, marks feedback, and negative marking.

**Backend**:
- [ ] Implement practice routes in `server.py` — GET /practice/next, POST /practice/submit (all logic in-line, not in a separate service file)
- [ ] Question selection: 6 modes (New, All, Wrong, Weak, Bookmarked, Mistakes) — all use attempt aggregation, no SRS state
- [ ] Weak mode uses the `detect_weak_questions()` aggregation pipeline (≥3 attempts, <50% accuracy)
- [ ] Auto-create study_log on practice session completion

**Frontend**:
- [ ] Implement Section Selector screen with section buttons, mode/timer/quantity options
- [ ] Implement QuestionCard with statement rendering, 4 option buttons, keyboard shortcuts
- [ ] Implement FeedbackCard with marks display, explanation, penalty indication
- [ ] Implement Timer component (elapsed + countdown modes)
- [ ] Implement SessionSummary screen
- [ ] Implement 6 practice modes (New, All, Wrong, Weak, Bookmarked, Mistakes) — no "Due" mode
- [ ] Implement confidence scale (1-5)
- [ ] Implement bookmark toggle during practice
- [ ] Implement skip/previous navigation

**Verification**: Select section → practice questions → submit → see marks impact → wrong answers tracked → Weak mode returns low-accuracy questions → study_log created → timer enforcement works.

---

### Phase 4: Mocks (Build Order: 4)

**Objective**: Full mock test system with sectional timing enforcement, detailed results, and external mock logging.

**Backend**:
- [ ] Implement mock routes in `server.py` — all internal mock endpoints (CRUD, start, submit-section, finish, results) + the single `POST /mocks/external` route (~20 lines)
- [ ] Proportional stratified sampling for question selection: if user has 100 DBMS questions and 50 SE questions, the 50 PK questions in a Mains mock are distributed proportional to repository counts
- [ ] Implement heartbeat endpoint for section timer enforcement
- [ ] Auto-create attempt records + study_log on mock completion
- [ ] `GET /mocks/results` returns both internal and external results, sorted by date desc

**Frontend**:
- [ ] Implement Mock Home screen with phase selector and past results table
- [ ] Implement Mock Setup screen (phase → section configuration)
- [ ] Implement Mock Session screen with:
  - Current question display (reuses QuestionCard)
  - Section timer (hard countdown)
  - Progress bar (current question / total in section)
  - Skip / Mark for Review / Clear Answer buttons
  - Section navigation (next question)
- [ ] Implement Section Transition screen (quick stats between sections)
- [ ] Implement Mock Results screen with:
  - Overall score card (raw, negative, net, accuracy, attempt rate)
  - Per-section breakdown table
  - Time analysis per section
  - Attempt strategy analysis
  - Weak section recommendations
  - Action buttons (Practice weak sections, View all mocks, Dashboard)
- [ ] Implement Mock Result Card component (reused on Dashboard)

**Verification**: Create mock → start → answer questions in section 1 → timer expires → auto-submit → move to section 2 → complete all → see detailed results with negative marking → results appear on Dashboard.

---

### Phase 5: Dashboard + Analytics (Build Order: 5)

**Objective**: One-screen dashboard that answers "Where do I stand?" and "What should I do today?".

**Backend**:
- [ ] Implement dashboard endpoint in `server.py` — `GET /analytics/dashboard` (3 parallel aggregation queries + phase readiness formula + today's focus heuristic — ~80 lines total)
- [ ] Phase readiness: weighted combo of section accuracy (40%) + syllabus coverage (30%) + mock performance (30%). Computed separately for Prelims and Mains.
- [ ] Today's focus: finds lowest-ranked section by accuracy + coverage + penalty. If all sections >70% accuracy and >80% coverage, suggests "Take a mock."
- [ ] Implement 5-second in-memory cache for dashboard response (invalidate on new attempt/study_log/mock/coverage update)

**Frontend**:
- [ ] Implement Dashboard page with widgets:
  - Stat cards row (Questions Solved, Accuracy, Study Time this week)
  - Section Readiness list (grouped: Non-PK, PK) with progress bars, accuracy, avg time, penalty per section
  - Total penalty summary at bottom of Section Readiness list
  - Phase Readiness cards: two compact cards showing Prelims Readiness % and Mains Readiness %, each with key metrics
  - Today's Focus card: one dominant action with reason + 1-2 secondary suggestions
  - Recent Mocks cards (last 3, mixed internal + external)
- [ ] Implement StatCard, SectionProgress, MockResultCard, PhaseReadinessCard, TodayFocusCard components
- [ ] Implement empty state (onboarding for new users)
- [ ] Implement countdown to exam date
- [ ] Implement loading skeleton

**Verification**: Dashboard shows correct stats, section readiness includes penalty data, phase readiness scores update when syllabus coverage changes, today's focus points to weakest section, recent mocks appear with both internal and external results, empty state shows for fresh install.

---

### Phase 6: Polish (Build Order: 6)

**Objective**: Edge cases, mobile responsiveness, performance.

**Tasks**:
- [ ] Implement error boundaries on all pages
- [ ] Implement 404 page
- [ ] Implement mobile-responsive layout for all 4 pages
- [ ] Add smooth transitions between pages (optional, framer-motion)
- [ ] Implement loading skeletons for all data-fetching states
- [ ] Implement empty states for all list views
- [ ] Add keyboard shortcuts documentation (help modal)
- [ ] Performance: lazy-load React Query, memoize expensive components
- [ ] Performance: paginate repository (server-side)
- [ ] Add aria labels to all interactive elements
- [ ] Test with screen reader (basic navigation)
- [ ] Test with screen reader (basic navigation)
- [ ] Create .env.example and deployment guide

**Verification**: All states handled (loading/empty/error), responsive at 320px/768px/1280px, keyboard navigable, performs well with 1000+ questions.

---

## 10. Verification Checklist

### 10.1 Functional Verification

- [ ] **Meta**: /api/ibps/meta returns all 10 sections, 7 PK subjects with topics, phase configs, marks config
- [ ] **Questions**: Create/read/update/delete questions in every section. Filter by section, subject, topic, status, search. Bulk import/export CSV. Duplicate detection catches exact statement matches. Bookmark toggle persists.
- [ ] **Practice**: All 6 modes return correct questions. Section selection works. PK subject selection works. PK topic filter works. Timed mode enforces section limit. Untimed mode shows elapsed timer. Marks feedback shows +2/-0.25 for PK, +1/-0.25 for non-PK. Confidence scale submits correctly. Keyboard shortcuts work. Weak mode returns questions with < 50% accuracy and ≥ 3 attempts. Skip/previous navigation works. No "Due" mode exists anywhere in the UI.
- [ ] **Mocks**: Create Prelims mock → correct section config. Create Mains mock → correct section config with proportional stratified PK distribution (e.g., if DBMS has 30 questions and CN has 10, the 50 PK questions are distributed ~38 DBMS + ~12 CN, not 25 + 25). Per-section timer counts down. Auto-submit fires on timer expiry. Section transition shows quick stats. All sections complete → full results with negative marking. Results show per-section breakdown. Weak sections detected. Attempt strategy analysis shown. Results persist and appear in Dashboard "Recent Mocks."
- [ ] **Dashboard**: 3 stat cards show correct numbers (Questions Solved, Accuracy, Study Time). Today's Focus card shows the weakest section with a reason. Phase Readiness shows two composite scores for Prelims and Mains. Section readiness list shows each section's accuracy, question count, avg time, and penalty. Clicking a section row expands to show topic coverage with status toggles. Total penalty line at bottom. Recent mocks show internal + external results. Empty state shows on fresh install with 3 action buttons. Countdown shows correct days until exam.
- [ ] **Coverage**: Mark a PK topic as "Studied" → syllabus coverage % updates. Mark all topics for a section → section shows 100%. Non-PK sections show a single toggle. Topic status persists across page reload.
- [ ] **External mocks**: `POST /mocks/external` creates a mock_attempt with `source: "external"`. It appears in Dashboard "Recent Mocks" with an "External" badge. It appears in `GET /mocks/results` alongside internal mocks.
- [ ] **Settings**: Exam date updates countdown. Phase focus persists. Theme toggle works across sessions.

### 10.2 Performance Verification

- [ ] Dashboard loads in < 500ms with 500+ attempts and 1000+ questions (with cache)
- [ ] Practice next-question response < 200ms
- [ ] Repository page with 1000 questions loads in < 1s (paginated at 50/page)
- [ ] Mock submission processes in < 300ms
- [ ] All list endpoints paginated or limited
- [ ] No N+1 queries in any route
- [ ] React Query stale times configured appropriately (dashboard: 30s, repository: 60s, practice: 0s)

### 10.3 Responsiveness Verification

- [ ] Dashboard renders correctly at 320px width (single column, stacked cards)
- [ ] Repository table horizontally scrollable on mobile with sticky first column
- [ ] Practice question card full-width on mobile, readable at 320px
- [ ] Mock execution full-width on all sizes, timer visible without scrolling
- [ ] Nav collapses to hamburger on mobile
- [ ] All modals render correctly on mobile (full-screen on < 640px)
- [ ] No horizontal overflow on any page

### 10.4 Testing Verification

- [ ] Backend: pytest tests for all services (question CRUD, practice submission, mock scoring, analytics aggregation)
- [ ] Backend: test with empty database (edge cases)
- [ ] Backend: test negative marking computation at scale
- [ ] Frontend: component smoke tests for all major components
- [ ] Frontend: integration test for practice flow (select section → answer → submit → see feedback)
- [ ] Frontend: integration test for mock flow (create → start → answer → submit section → see results)

### 10.5 Build Verification

- [ ] Backend: `pip install -r requirements.txt` installs without errors
- [ ] Backend: `uvicorn server:app` starts without errors
- [ ] Backend: all routes respond with correct status codes (200, 201, 404, 422)
- [ ] Frontend: `npm run build` completes without errors
- [ ] Frontend: production build served by FastAPI static file mount loads correctly
- [ ] Frontend: no console errors in production build

### 10.6 Deployment Readiness

- [ ] `.env.example` documents all required environment variables (MONGO_URL, DB_NAME, CORS_ORIGINS)
- [ ] Render/Heroku-ready `Procfile` and `render.yaml` or equivalent
- [ ] MongoDB Atlas connection string documented in deployment guide
- [ ] No hardcoded secrets or URLs
- [ ] Health check endpoint: GET /api/ (returns status ok)
- [ ] Single-command deploy: `git push` triggers build + deploy

---

## Appendix A: Quick Reference Card

| Item | Value |
|------|-------|
| Application name | BYOP Studio — IBPS SO (IT Officer) |
| Pages | 4 (Dashboard, Repository, Practice, Mocks) |
| Sections | 10 (Eng, Reas, Quant, DBMS, CN, OS, SE, DS, COA, OOPs) |
| PK subjects | 7 (with topic-wise practice) |
| Non-PK sections | 3 (section-based only) |
| Marks: PK | +2 per correct, -0.25 per wrong |
| Marks: Non-PK | +1 per correct, -0.25 per wrong |
| Backend endpoints | ~20 total |
| Python backend | FastAPI + Motor + MongoDB |
| React frontend | React 18 + Tailwind + Radix + React Query |
| Mock phases | 2 (Prelims, Mains) |
| Mock sections (Prelims) | English (25), Reasoning (25), Quant (25), PK (25) |
| Mock sections (Mains) | English (30), Reasoning (40), Quant (30), PK (50), Descriptive (2) |
| CSS aesthetic | Neo-brutalist, warm accents, dark-first |
| Auth | None (single-user, private deploy) |
| Data strategy | Single-file backend → split by domain at ~2000 lines |

---

*End of Architecture & Product Specification v1.0*
