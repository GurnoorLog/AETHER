from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch, mm
from reportlab.lib.colors import HexColor, black, white
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, HRFlowable, KeepTogether
)
from reportlab.platypus.flowables import Flowable
from reportlab.graphics.shapes import Drawing, Rect, String, Line, Polygon
from reportlab.graphics import renderPDF
import os

DARK = HexColor("#0A0A0A")
YELLOW = HexColor("#CA8A04")  # darker yellow readable on white
GRAY = HexColor("#777777")
LIGHT_GRAY = HexColor("#CCCCCC")
TEXT = HexColor("#1A1A1A")
ACCENT = HexColor("#2563EB")  # darker blue readable on white

W, H = A4

OUTPUT = os.path.join(os.path.dirname(__file__), "Aether_Technical_Overview.pdf")

styles = getSampleStyleSheet()

styles.add(ParagraphStyle(
    "DocTitle", fontName="Helvetica-Bold", fontSize=28, textColor=YELLOW,
    leading=34, spaceAfter=6, alignment=TA_CENTER
))
styles.add(ParagraphStyle(
    "DocSubtitle", fontName="Helvetica", fontSize=14, textColor=HexColor("#555555"),
    leading=18, spaceAfter=20, alignment=TA_CENTER
))
styles.add(ParagraphStyle(
    "DocH1", fontName="Helvetica-Bold", fontSize=18, textColor=YELLOW,
    leading=24, spaceBefore=24, spaceAfter=10
))
styles.add(ParagraphStyle(
    "DocH2", fontName="Helvetica-Bold", fontSize=13, textColor=ACCENT,
    leading=18, spaceBefore=16, spaceAfter=6
))
styles.add(ParagraphStyle(
    "DocH3", fontName="Helvetica-Bold", fontSize=11, textColor=DARK,
    leading=15, spaceBefore=12, spaceAfter=4
))
styles.add(ParagraphStyle(
    "DocBody", fontName="Helvetica", fontSize=9.5, textColor=TEXT,
    leading=14, spaceAfter=6, alignment=TA_JUSTIFY
))
styles.add(ParagraphStyle(
    "DocCode", fontName="Courier", fontSize=8, textColor=HexColor("#B45309"),  # dark amber
    leading=12, spaceAfter=4, leftIndent=12, backColor=HexColor("#F5F5F5")
))
styles.add(ParagraphStyle(
    "DocBullet", fontName="Helvetica", fontSize=9.5, textColor=TEXT,
    leading=14, spaceAfter=3, leftIndent=20, bulletIndent=8,
    bulletFontName="Helvetica-Bold", bulletFontSize=9, bulletColor=YELLOW
))
styles.add(ParagraphStyle(
    "DocCaption", fontName="Helvetica-Oblique", fontSize=8, textColor=HexColor("#888888"),
    leading=11, spaceAfter=12, alignment=TA_CENTER
))
styles.add(ParagraphStyle(
    "DocSmall", fontName="Helvetica", fontSize=7.5, textColor=HexColor("#888888"),
    leading=10, spaceAfter=2
))

class GradientRect(Flowable):
    def __init__(self, w, h, c1=HexColor("#0A0A0A"), c2=HexColor("#1A1A1A")):
        super().__init__()
        self.width = w
        self.height = h
        self.c1 = c1
        self.c2 = c2
    def draw(self):
        self.canv.saveState()
        steps = 50
        for i in range(steps):
            r = self.c1.red + (self.c2.red - self.c1.red) * i / steps
            g = self.c1.green + (self.c2.green - self.c1.green) * i / steps
            b = self.c1.blue + (self.c2.blue - self.c1.blue) * i / steps
            self.canv.setFillColor(HexColor(f"#{int(r*255):02x}{int(g*255):02x}{int(b*255):02x}"))
            y = self.height * i / steps
            self.canv.rect(0, y, self.width, self.height / steps, stroke=0, fill=1)
        self.canv.restoreState()

def header_footer(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(HexColor("#F5F5F5"))
    canvas.rect(0, H - 36, W, 36, stroke=0, fill=1)
    canvas.setFillColor(HexColor("#CA8A04"))
    canvas.setFont("Helvetica-Bold", 10)
    canvas.drawString(36, H - 24, "AETHER — Technical Architecture & AI Pipeline")
    canvas.setFillColor(HexColor("#999999"))
    canvas.setFont("Helvetica", 8)
    canvas.drawRightString(W - 36, H - 24, f"Page {doc.page}")
    canvas.setFillColor(HexColor("#F5F5F5"))
    canvas.rect(0, 0, W, 28, stroke=0, fill=1)
    canvas.setFillColor(HexColor("#999999"))
    canvas.setFont("Helvetica", 7)
    canvas.drawString(36, 10, "Confidential — Internal Technical Documentation")
    canvas.restoreState()

doc = SimpleDocTemplate(
    OUTPUT, pagesize=A4,
    leftMargin=36, rightMargin=36,
    topMargin=52, bottomMargin=44
)

def S(text, style="DocBody"):
    return Paragraph(text, styles[style])

def HR():
    return HRFlowable(width="100%", thickness=0.5, color=LIGHT_GRAY, spaceBefore=12, spaceAfter=12)

def bullet(text):
    return Paragraph(text, styles["DocBullet"], bulletText="▸")

def code_block(lines):
    data = [[S(line.replace("<", "&lt;").replace(">", "&gt;"), "DocCode")] for line in lines]
    t = Table(data, colWidths=[W - 96])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), HexColor("#F5F5F5")),
        ("BOX", (0, 0), (-1, -1), 0.5, HexColor("#DDDDDD")),
        ("TOPPADDING", (0, 0), (-1, -1), 2),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
    ]))
    return t

def tech_table(rows):
    data = [[S(c, "DocH3") if i == 0 else S(c, "DocSmall") for i, c in enumerate(r)] for r in rows]
    t = Table(data, colWidths=[120, W - 208])
    style_cmds = [
        ("BACKGROUND", (0, 0), (-1, 0), HexColor("#1A1A1A")),
        ("TEXTCOLOR", (0, 0), (-1, 0), HexColor("#FDE047")),
        ("BOX", (0, 0), (-1, -1), 0.5, HexColor("#DDDDDD")),
        ("INNERGRID", (0, 0), (-1, -1), 0.25, HexColor("#DDDDDD")),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("BACKGROUND", (0, 1), (-1, -1), HexColor("#FAFAFA")),
    ]
    t.setStyle(TableStyle(style_cmds))
    return t

elements = []

# ── TITLE PAGE ──
elements.append(Spacer(1, 120))
elements.append(S("AETHER", "DocTitle"))
elements.append(S("Technical Architecture & AI Pipeline", "DocSubtitle"))
elements.append(S("How the AI Tutor That Never Forgets actually works", "DocCaption"))
elements.append(Spacer(1, 12))
elements.append(S("Made by <b>Gurnoor Tamber</b>", "DocSubtitle"))
elements.append(Spacer(1, 20))
elements.append(HR())
elements.append(S("<b>Document Purpose:</b> This document explains the internal architecture of Aether — the AI-powered personalized tutoring platform. It covers the system design, AI pipeline (RAG), data flow, and key technical decisions for developers and technical stakeholders.", "DocBody"))
elements.append(Spacer(1, 8))
elements.append(S("<b>Stack Overview:</b> Next.js 16 · React 19 · TypeScript · Tailwind CSS · Supabase (PostgreSQL + Auth + Storage) · Google Gemini API · Deepgram · pgvector · Pyodide · KaTeX · Mermaid", "DocBody"))
elements.append(S("<b>Repository:</b> Private · Monorepo · Turbopack · ESLint 9", "DocBody"))
elements.append(Spacer(1, 40))
elements.append(S("Version 1.0 — July 2026", "DocSmall"))
elements.append(PageBreak())

# ── TABLE OF CONTENTS ──
elements.append(S("Contents", "DocH1"))
elements.append(HR())
toc_items = [
    "1. System Architecture Overview",
    "2. Frontend Architecture",
    "3. Backend & Database Schema",
    "4. The RAG Pipeline (Core AI Flow)",
    "    4.1 Document Upload & Storage",
    "    4.2 Text Extraction",
    "    4.3 Chunking Strategy",
    "    4.4 Embedding Generation",
    "    4.5 Vector Search (pgvector)",
    "    4.6 Context Assembly & Prompt Construction",
    "    4.7 Streaming Response Generation",
    "    4.8 Client-Side Rendering",
    "5. Voice Tutor Architecture (Deepgram)",
    "6. Quiz & Challenge Engines",
    "7. Music Generation Pipeline",
    "8. Beta Gating & Usage Limits",
    "9. Key Technical Decisions",
]
for item in toc_items:
    elements.append(S(item, "DocBullet"))
elements.append(PageBreak())

# ── 1. SYSTEM ARCHITECTURE ──
elements.append(S("1. System Architecture Overview", "DocH1"))
elements.append(HR())
elements.append(S("Aether follows a modern JAMstack architecture with server-rendered React (Next.js App Router) backed by Supabase for database, authentication, and file storage. The AI layer is powered entirely by Google Gemini models, with Deepgram handling voice processing.", "DocBody"))

elements.append(S("High-Level Data Flow", "DocH2"))
elements.append(S("User (Browser) ←→ Next.js (Edge/Serverless) ←→ Supabase (PostgreSQL + Storage) ←→ Gemini API / Deepgram API", "DocCode"))
elements.append(Spacer(1, 6))
elements.append(S("Key architectural properties:", "DocBody"))
elements.append(bullet("Server-rendered React via Next.js App Router with streaming SSR"))
elements.append(bullet("Serverless API routes for Chat, TTS, Knowledge ingestion, Quiz generation, etc."))
elements.append(bullet("Row-Level Security (RLS) on every database table — users see only their own data"))
elements.append(bullet("Service role for privileged operations (usage increments, beta approval)"))
elements.append(bullet("All AI calls are server-side — API keys never reach the client"))
elements.append(bullet("Pyodide runs Python 100% in-browser for code challenges — zero server cost"))

elements.append(S("Tech Stack Summary", "DocH2"))
elements.append(tech_table([
    ["Layer", "Technology"],
    ["Framework", "Next.js 16.2.10 (App Router)"],
    ["Language", "TypeScript 5"],
    ["UI", "React 19.2.4, Tailwind CSS v4"],
    ["Fonts", "Inter, JetBrains Mono, Syne"],
    ["Icons", "lucide-react"],
    ["Database", "Supabase PostgreSQL + pgvector"],
    ["Auth", "Supabase Auth (email, magic link, OAuth)"],
    ["Storage", "Supabase Storage"],
    ["AI Chat", "Google Gemini Flash 2.0"],
    ["Embeddings", "Google Gemini Embedding"],
    ["Voice STT", "Deepgram (real-time)"],
    ["Voice TTS", "Web Speech API"],
    ["Math", "KaTeX"],
    ["Diagrams", "Mermaid.js"],
    ["Graphing", "Desmos API v1.9"],
    ["Code Exec", "Pyodide (WebAssembly)"],
    ["Music", "HeartMuLa Studio + MusicGen"],
    ["PDF Parsing", "pdf-parse"],
    ["PPTX Parsing", "JSZip + XML"],
    ["Deployment", "Vercel"],
]))

# ── 2. FRONTEND ──
elements.append(S("2. Frontend Architecture", "DocH1"))
elements.append(HR())
elements.append(S("The frontend is a Next.js 16 App Router application with React 19 and TypeScript. The design system is dark-themed glassmorphism with cyber-yellow (#FDE047) accents.", "DocBody"))

elements.append(S("Route Structure", "DocH2"))
elements.append(tech_table([
    ["Route", "Purpose"],
    ["/", "Landing page — hero, features, pricing, beta signup"],
    ["/dashboard", "Main dashboard — stats, recent docs, quick chat"],
    ["/hub", "Session hub — create/search/delete learning sessions"],
    ["/onboarding", "Conversational 7-step onboarding flow"],
    ["/[session]/dashboard", "Per-session dashboard with modules overview"],
    ["/[session]/chat", "AI chat with RAG, streaming, markdown, KaTeX, Mermaid"],
    ["/[session]/voice-tutor", "Real-time voice conversation (Deepgram)"],
    ["/[session]/roadmap", "Visual module sequence with progress"],
    ["/[session]/quizzes", "Generate and take AI quizzes"],
    ["/[session]/knowledge", "Document upload and management"],
    ["/[session]/progress", "Analytics — mastery, XP, strengths, milestones"],
    ["/[session]/music", "AI focus music generation and player"],
    ["/[session]/challenges", "Coding and math challenge hub"],
    ["/[session]/challenge-code/[id]", "In-browser Python code challenge"],
    ["/[session]/challenge-math/[id]", "Math challenge with Desmos graphing"],
]))

elements.append(S("Key UI Architecture Decisions", "DocH2"))
elements.append(bullet("Three-panel layout within sessions: SidebarLeft | Main Content | SidebarRight"))
elements.append(bullet("Auto-collapsible hero headers on roadmap/quizzes/progress pages — save screen space, expand on hover"))
elements.append(bullet("Streaming responses via ReadableStream with custom SSE-like parser — shows thinking status for every stage (searching, analyzing, generating)"))
elements.append(bullet("Structured block parsing in chat — AI can emit visual explanations, step-by-step walkthroughs, interactive demos, code blocks, and mermaid diagrams as distinct rendered sections"))
elements.append(bullet("Module context mode — chat can be scoped to a specific roadmap module, showing module info and lesson list"))

# ── 3. BACKEND ──
elements.append(S("3. Backend & Database Schema", "DocH1"))
elements.append(HR())
elements.append(S("The backend uses Supabase PostgreSQL with Row-Level Security. Key tables:", "DocBody"))

elements.append(S("Core Tables", "DocH2"))
elements.append(tech_table([
    ["Table", "Purpose"],
    ["user_profiles", "User name, onboarding status, preferences (JSON)"],
    ["beta_requests", "Beta signup queue — email + approved boolean"],
    ["user_usage", "Usage counters per user (chat, quiz, voice, challenge)"],
    ["sessions", "Learning sessions — title, subject, slug, user_id"],
    ["session_roadmap_modules", "Roadmap modules — title, status, lessons (JSON), learning objectives"],
    ["conversations", "Chat conversations — title, session_id, user_id"],
    ["chat_messages", "Individual messages — role, content, conversation_id"],
    ["session_quizzes", "Quiz records — questions (JSON), score, module_id"],
    ["documents", "Uploaded docs — filename, type, status, storage path"],
    ["document_chunks", "Text chunks with pgvector embeddings"],
    ["ai_memories", "Persisted AI outputs (challenges, etc.)"],
    ["progress_tracking", "Mastery levels per subject per user"],
]))

elements.append(S("Key Database Features", "DocH2"))
elements.append(bullet("pgvector extension for cosine similarity search via match_document_chunks RPC"))
elements.append(bullet("Row-Level Security (RLS) on every user-facing table — user_id must match auth.uid()"))
elements.append(bullet("increment_usage() SECURITY DEFINER function — service role bypasses RLS for counter updates"))
elements.append(bullet("delete_user_sessions() SECURITY DEFINER function — cleanup on account deletion"))

# ── 4. RAG PIPELINE ──
elements.append(S("4. The RAG Pipeline (Core AI Flow)", "DocH1"))
elements.append(HR())
elements.append(S("Retrieval-Augmented Generation (RAG) is the heart of Aether. It enables the AI to answer questions based on the user's own uploaded documents, rather than general knowledge. Below is the complete pipeline, stage by stage.", "DocBody"))

# 4.1
elements.append(S("4.1 Document Upload & Storage", "DocH2"))
elements.append(S("When a user uploads a file through the Knowledge page, the following sequence occurs:", "DocBody"))
elements.append(bullet("File is sent via FormData POST to /api/knowledge/image (for images) or the ingest pipeline"))
elements.append(bullet("File is uploaded to Supabase Storage under the user's session folder"))
elements.append(bullet("A record is inserted into the documents table with metadata (filename, size, type, status='pending')"))
elements.append(bullet("Supported formats: PDF (.pdf), PowerPoint (.pptx), Images (.png, .jpg, .jpeg, .webp), YouTube links, Google Drive links"))
elements.append(bullet("YouTube: /api/knowledge/youtube extracts transcript via youtube-transcript API"))
elements.append(bullet("Google Drive: /api/knowledge/gdrive downloads the file via Drive link, then processes as normal"))
elements.append(S("The upload UI shows real-time progress per file across 5 stages:", "DocBody"))
elements.append(S("<b>pending → uploading → extracting → chunking → embedding → done</b>", "DocCode"))

# 4.2
elements.append(S("4.2 Text Extraction", "DocH2"))
elements.append(S("Each file type uses a different extraction strategy:", "DocBody"))
elements.append(bullet("<b>PDF:</b> pdf-parse library extracts text page by page. Preserves paragraph structure, discards layout formatting."))
elements.append(bullet("<b>PPTX:</b> File is unzipped via JSZip. Each slide XML is parsed for text content in text runs. Combines all slide text sequentially."))
elements.append(bullet("<b>Images:</b> Sent to Gemini Vision API for OCR — the model transcribes visible text from the image."))
elements.append(bullet("<b>YouTube:</b> youtube-transcript API fetches the video's closed caption / transcript as timed text."))
elements.append(bullet("<b>Google Drive:</b> File is downloaded, then routed to the appropriate extractor based on extension."))
elements.append(S("Extracted raw text is stored temporarily for the next stage. The document status updates to 'extracting' during this phase.", "DocBody"))

# 4.3
elements.append(S("4.3 Chunking Strategy", "DocH2"))
elements.append(S("Raw document text is too long for a single embedding (and would lose granularity). We split it into overlapping chunks:", "DocBody"))
elements.append(bullet("Chunk size: 500-1000 characters per chunk"))
elements.append(bullet("Overlap: 100 characters between consecutive chunks"))
elements.append(bullet("Overlap ensures concepts that span chunk boundaries aren't lost"))
elements.append(bullet("Chunks are created by splitting on paragraph breaks first, then splitting oversized paragraphs on sentence boundaries"))
elements.append(bullet("Each chunk is stored as a row in document_chunks with: document_id, chunk_index, content, and a NULL embedding column (filled next step)"))
elements.append(bullet("Document status updates to 'chunking'"))

# 4.4
elements.append(S("4.4 Embedding Generation", "DocH2"))
elements.append(S("Every chunk is converted into a vector embedding — a numerical representation of its semantic meaning:", "DocBody"))
elements.append(bullet("Each chunk is sent to the <b>Gemini Embedding model</b> via the Google AI SDK"))
elements.append(bullet("The model returns a 768-dimensional vector (array of floats)"))
elements.append(bullet("Output dimensionality is model-dependent — Gemini uses 768 dimensions"))
elements.append(bullet("The vector is stored in the embedding column of document_chunks (pgvector data type)"))
elements.append(bullet("An IVFFlat index on the embedding column accelerates nearest-neighbor search"))
elements.append(bullet("Document status updates to 'done' when all chunks are embedded"))
elements.append(S("The entire pipeline (upload → extract → chunk → embed) runs synchronously in the API route. For large documents, this can take 10-60 seconds. The UI shows real-time progress so the user knows the system is working.", "DocBody"))

# 4.5
elements.append(S("4.5 Vector Search (pgvector)", "DocH2"))
elements.append(S("At query time, when a user asks a question in chat, the following search process runs:", "DocBody"))
elements.append(bullet("The user's question text is sent to the same Gemini Embedding model → query vector"))
elements.append(bullet("A PostgreSQL function match_document_chunks is called:"))
elements.append(code_block([
    "function match_document_chunks(",
    "  query_embedding vector(768),",
    "  match_threshold float,",
    "  match_count int,",
    "  session_id uuid",
    ") returns table(id bigint, content text, similarity float)",
    "language sql stable",
    "as $$",
    "  select dc.id, dc.content,",
    "    1 - (dc.embedding <=> query_embedding) as similarity",
    "  from document_chunks dc",
    "  join documents d on d.id = dc.document_id",
    "  where d.session_id = session_id",
    "    and dc.embedding is not null",
    "    and 1 - (dc.embedding <=> query_embedding) > match_threshold",
    "  order by dc.embedding <=> query_embedding",
    "  limit match_count;",
    "$$;",
]))
elements.append(bullet("Uses <=> operator (cosine distance) — converts to similarity via 1 - distance"))
elements.append(bullet("Filters by session_id — only searches documents belonging to this session"))
elements.append(bullet("Threshold: typically 0.7 — chunks below this similarity are discarded"))
elements.append(bullet("Top 5-10 chunks are returned, ordered by similarity descending"))
elements.append(bullet("Search is scoped to the current session — documents from other sessions are invisible"))

# 4.6
elements.append(S("4.6 Context Assembly & Prompt Construction", "DocH2"))
elements.append(S("Retrieved chunks are assembled into a structured prompt:", "DocBody"))
elements.append(bullet("The system prompt defines Aether's behavior: friendly tutor, uses analogies, references documents, can use LaTeX and Mermaid"))
elements.append(bullet("Retrieved chunks are formatted as a 'Retrieved Context' section with source document references"))
elements.append(bullet("Conversation history (last N messages) is appended for multi-turn continuity"))
elements.append(bullet("If module context is active (chatting from a roadmap module), the module's title, description, learning objectives, and lesson list are injected"))
elements.append(bullet("The user's current question is appended at the end"))
elements.append(S("The full prompt typically consumes 4,000-12,000 tokens depending on context length.", "DocBody"))

# 4.7
elements.append(S("4.7 Streaming Response Generation", "DocH2"))
elements.append(S("The assembled prompt is sent to Gemini Flash with streaming enabled:", "DocBody"))
elements.append(bullet("POST to Gemini API with stream: true"))
elements.append(bullet("Response is a ReadableStream of chunks"))
elements.append(bullet("Each chunk from Gemini is forwarded to the client as an SSE event"))
elements.append(bullet("Three event types: status (thinking indicator), chunk (text token), done (final message ID)"))
elements.append(bullet("Status events are emitted before the first token — 'Analyzing documents...', 'Searching knowledge base...', 'Formulating response...', etc."))
elements.append(bullet("Chunk events accumulate into a full response text on the client"))
elements.append(bullet("On 'done', the accumulated text is saved to chat_messages with the final message ID"))
elements.append(S("The response is streamed through Vercel Edge functions for minimal latency. Connection stays open until the full response is delivered.", "DocBody"))

# 4.8
elements.append(S("4.8 Client-Side Rendering Pipeline", "DocH2"))
elements.append(S("As the stream arrives, the client parses and renders in real time:", "DocBody"))
elements.append(bullet("Raw SSE data lines are parsed — type field determines handler"))
elements.append(bullet("Accumulated text is split into structured blocks by the parseStructuredBlocks() function"))
elements.append(bullet("Block detection logic:"))
elements.append(code_block([
    "// Detected by scanning for keywords in the text:",
    "'**Visual Explanation**' or '**Visualizing' → type='visual'",
    "'**Interactive Demo**' or '**Try It Yourself**' → type='interactive'",
    "'**Step-by-Step**' or '**Walkthrough**' → type='stepbystep'",
    "``` fences with 'mermaid' → type='mermaid'",
    "``` fences with any other lang → type='code'",
    "Everything else → type='text'",
]))
elements.append(bullet("Each block type renders differently:"))
elements.append(bullet("<b>text:</b> renderMarkdown() converts markdown → HTML. Sub-steps: escape HTML chars → split by paragraphs → detect headings, blockquotes, lists, HRs → apply inlineMarkdown() for bold, italic, code, links, LaTeX → dangerouslySetInnerHTML"))
elements.append(bullet("<b>LaTeX:</b> inlineMarkdown() applies two regex passes: $$...$$ → display math (KaTeX renderToString with displayMode:true), then $...$ → inline math. Errors fall back to raw LaTeX text."))
elements.append(bullet("<b>mermaid:</b> MermaidBlock component initializes mermaid module once (mermaid.initialize()), calls mermaid.render(id, chartText) to get SVG string, then sets innerHTML on a div. Hidden until render completes."))
elements.append(bullet("<b>code:</b> Pre block with monospace font, yellow text, dark background, overflow-x-auto scroll"))
elements.append(bullet("<b>visual:</b> Glass card with cyan header icon + 'Visual Explanation' label"))
elements.append(bullet("<b>interactive:</b> Glass card with yellow header icon + 'Interactive Demo' label"))
elements.append(bullet("<b>stepbystep:</b> Glass card with purple header icon + 'Step-by-Step' label"))
elements.append(bullet("Each message bubble shows: role (user/assistant), timestamp, structured content"))
elements.append(bullet("User messages: right-aligned, subtle glass card, no special rendering"))
elements.append(bullet("Assistant messages: left-aligned with Aether avatar (yellow sparkle icon), full structured rendering"))

# ── 5. VOICE ──
elements.append(S("5. Voice Tutor Architecture (Deepgram)", "DocH1"))
elements.append(HR())
elements.append(S("The Voice Tutor provides real-time conversational tutoring using Deepgram for speech-to-text and the browser's Web Speech API for text-to-speech.", "DocBody"))

elements.append(S("Data Flow", "DocH2"))
elements.append(bullet("User speaks into microphone → browser MediaStream → Deepgram real-time STT API"))
elements.append(bullet("Deepgram returns transcribed text → sent to /api/chat (same endpoint as text chat) → receives streaming response"))
elements.append(bullet("Response text → Web Speech API (SpeechSynthesisUtterance) → spoken back to user"))
elements.append(bullet("Full conversation history is saved to chat_messages in Supabase"))
elements.append(bullet("When user returns to text chat, all voice conversation history is visible"))

elements.append(S("UI Components", "DocH2"))
elements.append(bullet("Center: pulsing yellow circle with glow effect — pulses faster when Aether is speaking"))
elements.append(bullet("13 animated waveform bars that dance when connected"))
elements.append(bullet("Call timer (MM:SS) in header"))
elements.append(bullet("User transcription panel (left) — shows transcribed text with character avatar"))
elements.append(bullet("AI response panel (right) — shows Aether's spoken response with typing cursor"))
elements.append(bullet("Footer controls: mic toggle (yellow=on, red=muted), volume slider, speaker grid toggle, output mute, red 'End Session' button"))

# ── 6. QUIZZES & CHALLENGES ──
elements.append(S("6. Quiz & Challenge Engines", "DocH1"))
elements.append(HR())

elements.append(S("Quiz Engine", "DocH2"))
elements.append(bullet("Generation: POST /api/quizzes/generate with session_id + module_id → Gemini generates 5 MCQ questions with 4 options each, correct answer index, and explanation"))
elements.append(bullet("Storage: session_quizzes table — questions stored as JSON array, linked to module via module_id"))
elements.append(bullet("Taking: client-side state machine (list → taking → results). User selects answer per question, can skip, reviews all at end"))
elements.append(bullet("Scoring: percentage + XP calculation. Per-question review shows user's answer vs correct answer with AI explanation"))
elements.append(bullet("Results saved to progress_tracking for mastery calculation"))

elements.append(S("Code Challenge Engine", "DocH2"))
elements.append(bullet("Generation: POST /api/challenges/generate with subject + topic + type:'code' → Gemini generates a coding problem with starter code, test cases, and solution"))
elements.append(bullet("Storage: sessionStorage + ai_memories table (JSON serialized)"))
elements.append(bullet("Execution: Pyodide (Python compiled to WebAssembly) runs in the browser. No server-side execution. Code is evaluated in a sandboxed Python interpreter."))
elements.append(bullet("UI: multiple code cells, each with run button. Output displayed per cell. Test cases shown at bottom."))

elements.append(S("Math Challenge Engine", "DocH2"))
elements.append(bullet("Generation: similar to code challenges but type:'math' → Gemini generates problem with LaTeX expression and answer"))
elements.append(bullet("Desmos Integration: DesmosGraph component loads Desmos API v1.9 from CDN, creates a Calculator instance in a div. Challenge's LaTeX expression is plotted. User can interact with the graph (zoom, pan, click)."))
elements.append(bullet("Answer checking: case-insensitive, whitespace-normalized string comparison. Hints shown on wrong answer."))

# ── 7. MUSIC ──
elements.append(S("7. Music Generation Pipeline", "DocH1"))
elements.append(HR())
elements.append(bullet("Two provider options: HeartMuLa Studio (primary) and MusicGen (via Colab API ngrok tunnel)"))
elements.append(bullet("User selects mood (Focused, Calm, Energetic, Dreamy, Dark) and instrument (Ambient Synth, Piano, Guitar, Drums, Strings, Bass, Flute, Saxophone)"))
elements.append(bullet("Optional: 'Enhance Prompt' button sends mood + instrument to Gemini → generates rich music prompt text"))
elements.append(bullet("Prompt is sent to the provider API → returns audio URL"))
elements.append(bullet("Track is saved to generated_tracks table"))
elements.append(bullet("Full music player via PlayerProvider React context: play/pause, seek, next/prev, queue management, volume"))
elements.append(bullet("Playlists: create, name, add/remove tracks"))

# ── 8. BETA ──
elements.append(S("8. Beta Gating & Usage Limits", "DocH1"))
elements.append(HR())
elements.append(bullet("Users sign up via landing page beta form → email inserted into beta_requests with approved=false"))
elements.append(bullet("Admin dashboard (local-admin/, not deployed) lets admins approve/reject/delete requests"))
elements.append(bullet("On sign in, server checks if user's email has approved=true in beta_requests"))
elements.append(bullet("Usage limits: enforced in lib/usage.ts — LIMITS = { chat: 10, quiz: 10, voice: 10, challenge: 10 }"))
elements.append(bullet("checkUsage() reads from user_usage table, incrementUsage() calls SECURITY DEFINER RPC to bypass RLS"))
elements.append(bullet("UsageIndicator component shows remaining count per type in the UI"))

# ── 9. KEY DECISIONS ──
elements.append(S("9. Key Technical Decisions", "DocH1"))
elements.append(HR())
decisions = [
    ["Why pgvector over a dedicated vector DB?", "Keeps infrastructure simple — no external Pinecone/Weaviate. Everything lives in Postgres with the rest of the data. One less network hop, one less API key. IVFFlat indexes are fast enough for <100K chunks."],
    ["Why Gemini over OpenAI?", "Gemini Flash offers the best latency/cost tradeoff for streaming chat. Gemini Embedding is tightly integrated. The 1M-token context window (on Pro) allows massive context assembly without chunking."],
    ["Why Pyodide for code execution?", "Zero server cost. Code runs entirely in the user's browser via WebAssembly. No sandboxing concerns, no cold starts, no timeouts. Limited to Python but sufficient for educational challenges."],
    ["Why Deepgram over alternatives?", "Real-time streaming STT with low latency. The @deepgram/agents library provides turn-based conversation management out of the box. Competitive pricing for educational use."],
    ["Why local admin dashboard?", "Security — the admin panel is not deployed or accessible via the public URL. It's a standalone Node server that connects to Supabase via service_role key. Starts with start.bat, only accessible on localhost."],
    ["Why KaTeX over MathJax?", "KaTeX is ~10x faster. MathJax is more feature-complete but for inline math in chat messages, KaTeX's speed is critical. The synchronous renderToString API integrates cleanly with markdown parsing."],
    ["Chunk size of 500-1000 chars?", "Large enough to contain a coherent concept, small enough that cosine similarity is meaningful. 100-char overlap prevents boundary issues. This is a standard range in production RAG systems."],
    ["SSE streaming vs WebSocket?", "SSE is simpler — unidirectional server→client is all we need. No reconnection logic, no state synchronization. The client opens a fetch with ReadableStream, parses newline-delimited JSON events."],
]
for title, desc in decisions:
    elements.append(S(f"<b>{title}</b>", "DocH3"))
    elements.append(S(desc, "DocBody"))

elements.append(Spacer(1, 30))
elements.append(HR())
elements.append(S("End of Document", "DocCaption"))

# Build
doc.build(elements, onFirstPage=header_footer, onLaterPages=header_footer)
print(f"PDF generated: {OUTPUT}")

