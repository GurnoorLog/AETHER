# Aether

**Aether** is an AI-powered learning platform that turns your study materials into a personalized tutoring experience. Upload your notes, PDFs, and links — Aether builds a custom roadmap, teaches you module by module, quizzes you, and adapts to how you learn.

## Features

- **AI Tutor Chat** — context-aware conversations over your own documents, with Mermaid diagrams and LaTeX math rendering built in.
- **Personalized Roadmaps** — Aether generates a structured learning plan (modules, lessons, objectives) from your session goals.
- **RAG Knowledge Base** — upload PDFs, images, Google Drive files, or YouTube links; Aether retrieves the right context for every answer.
- **Quizzes & Challenges** — auto-generated from your documents and roadmap modules, with scoring and progress tracking.
- **Voice Learning** — talk to Aether or listen to lessons read aloud (speech-to-text / text-to-speech).
- **AI Music Generation** — generate study tracks from a mood and instrument prompt.
- **Progress Tracking** — mastery levels per subject, analytics, and memory of where you left off.
- **Gamified Kingdom** — build and manage a learning kingdom as you complete modules.

## Access

Aether is currently in **beta** and gated by invitation. New sign-ups go through a request/approval flow before they can use the platform.

## Tech Stack

- **Framework:** Next.js (App Router, React)
- **Backend / Auth:** Supabase (Postgres, Auth with Google OAuth, storage, RLS)
- **AI:** Google Gemini (chat, roadmap generation, quiz generation) with streaming
- **RAG:** Vector embeddings + similarity search over uploaded documents
- **Misc:** KaTeX (LaTeX), Mermaid.js (diagrams), Deepgram (voice), Tailwind CSS

---

Please join us on this journey, gng. You won't regret it.

