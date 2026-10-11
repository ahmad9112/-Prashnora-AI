# Prashnora AI — Exam Practice Platform

React + Vite frontend, Express API and MongoDB question bank.

## What's added
- Exam/stage/subject/topic filters in Mock Test Centre.
- Configurable test length (5, 10, 20, 30, 50 or 100 questions).
- Question bank model with exam, stage, section, subject, topic, difficulty, explanation, source and duplicate fingerprint.
- Admin-only Gemini batch generation (1–50 questions per batch; repeated batches build the library over time).
- Admin JSON/CSV import and text-based PDF text extraction preview. PDF extraction does not automatically guarantee correct question parsing; verify and structure questions before publishing. Scanned PDFs require OCR.
- Sample seed questions across UPSC, SSC CGL, State PCS, GATE, JEE Main, NEET, IBPS PO and CAT to demonstrate exam-specific filtering.

## Install
Requires Node.js 20+ and a MongoDB database.

1. Extract this folder.
2. In `server`, copy `.env.example` to `.env` and fill `MONGODB_URI`, a new `JWT_SECRET`, `GEMINI_API_KEY`, and `ADMIN_EMAILS` (your sign-in email).
3. Install backend dependencies: `npm install` inside `server`.
4. Start backend: `npm run dev` inside `server`.
5. Install frontend dependencies: `npm install` inside `client`.
6. Start frontend: `npm run dev -- --host 127.0.0.1` inside `client`.

The client defaults to `http://localhost:5000/api`; set `VITE_API_URL` if your backend is hosted elsewhere.

## Admin question generation
Open Question Bank Admin after signing in with an email listed in `ADMIN_EMAILS`. Enter exam, stage/paper, subject, topic and batch size. The endpoint stores valid questions in MongoDB and skips duplicate fingerprints. Generate batches repeatedly until the required coverage is reached; 1,000 questions is a target, not preloaded content in this archive. Review generated questions for factual accuracy before selling or publishing them.

## Question import format
Use `client/public/question-template.json` as a template. `answer` is zero-based: 0 means option 1, 1 means option 2, and so on. CSV headers: `exam,stage,section,subject,topic,question,option1,option2,option3,option4,answer,explanation,difficulty`.

## Security / production checklist
- Never commit `.env` or API keys.
- Rotate credentials that have been pasted into chats or public logs.
- Configure a real admin email allowlist and HTTPS.
- Add rate limits, billing/quota controls, moderation, and an admin review/publish workflow before public launch.
- Do not label AI-generated practice items as verified PYQs unless their source is verified.
- PDF ingestion currently extracts text for preview and returns it for manual structuring; scanned PDFs need OCR and question/answer validation.
