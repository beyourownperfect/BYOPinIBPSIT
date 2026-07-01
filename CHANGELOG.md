# Changelog

## [1.0.0] — 2026-07-01 — RC1

### Added
- Dashboard with section readiness, syllabus coverage, study time tracking, and today's focus recommendations
- Question Repository with CRUD, CSV import/export, search/filter, bookmarking
- Practice engine with 6 modes (New/All/Wrong/Weak/Bookmarked/Mistakes), timed mode, confidence rating, keyboard shortcuts
- Mock engine — Prelims (100 Q, 80 min) and Mains (150 Q, 125 min) with sectional timers, auto-submit, question palette, mark-for-review, detailed results
- External mock logging for off-platform test series
- Syllabus tracking with topic-wise status cycling (Not Started → Studied → Revised)
- Analytics with per-section accuracy, time tracking, penalty aggregation
- Seed sample data and clear all data functionality

### Technical
- FastAPI backend with async MongoDB (Motor)
- React 18 + Vite + TailwindCSS + React Query
- Docker Compose for local development
- render.yaml for Render blueprint deployment
- MongoDB Atlas for production database
- Single 384 kB production JS bundle
