"use client";

import { Suspense, useEffect, useState, useCallback, useRef, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import katex from "katex";
import { useAuth } from "@/providers/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { useSession } from "../layout";
import type { Lesson } from "@/types/database";
import MermaidBlock from "@/components/MermaidBlock";


interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

interface Conversation {
  id: string;
  title: string;
  created_at: string;
}

interface ModuleContext {
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
  learning_objectives: string;
  key_concepts: string;
}

function generateTitle(text: string): string {
  const cleaned = text.replace(/\n/g, " ").trim();
  if (cleaned.length <= 50) return cleaned;
  return cleaned.slice(0, 50).trim() + "...";
}

function renderMarkdown(text: string): string {
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const blockParts: string[] = [];
  const blocks = html.split(/\n\n+/);
  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;

    if (/^#{1,6}\s/.test(trimmed)) {
      const level = trimmed.match(/^#{1,6}/)![0].length;
      const content = trimmed.replace(/^#{1,6}\s/, "");
      blockParts.push(`<h${level} class="font-black text-warm-ink text-lg mt-6 mb-3">${inlineMarkdown(content)}</h${level}>`);
    } else if (/^>\s/.test(trimmed)) {
      const quoteContent = trimmed.replace(/^>\s/gm, "").trim();
      blockParts.push(`<blockquote class="border-l-2 border-sage/40 pl-4 italic text-warm-ink-soft my-4">${inlineMarkdown(quoteContent)}</blockquote>`);
    } else if (/^[-*] /.test(trimmed) || /^\d+\.\s/.test(trimmed)) {
      const isOrdered = /^\d+\.\s/.test(trimmed);
      const tag = isOrdered ? "ol" : "ul";
      const items = trimmed.split("\n").filter(Boolean).map((line) => {
        const content = line.replace(/^(\d+\.|[-*])\s/, "");
        return `<li class="text-warm-ink-soft text-sm mb-1 flex items-start gap-2"><span class="text-sage mt-1 shrink-0">${isOrdered ? "" : "▸"}</span><span>${inlineMarkdown(content)}</span></li>`;
      }).join("");
      blockParts.push(`<${tag} class="list-inside my-4 space-y-1">${items}</${tag}>`);
    } else if (/^---$/.test(trimmed)) {
      blockParts.push(`<hr class="border-hairline-warm my-8" />`);
    } else {
      const lines = trimmed.split("\n").filter(Boolean);
      const formatted = lines.map((l) => `<p class="mb-2 last:mb-0">${inlineMarkdown(l)}</p>`).join("");
      blockParts.push(formatted);
    }
  }
  return blockParts.join("\n");
}

function inlineMarkdown(text: string): string {
  return text
    .replace(/~~(.*?)~~/g, "<del class='text-warm-ink-muted'>$1</del>")
    .replace(/`(.*?)`/g, '<code class="text-sage bg-sage/10 px-1.5 py-0.5 rounded text-xs font-mono">$1</code>')
    .replace(/\*\*(.*?)\*\*/g, "<strong class='text-warm-ink font-bold'>$1</strong>")
    .replace(/(?:^|(?<=\s))\*(?=\S)(.+?)\*/g, "<em class='italic text-warm-ink-soft'>$1</em>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-sage underline underline-offset-2 hover:brightness-110">$1</a>')
    .replace(/\$\$(.+?)\$\$/gs, (_, m) => { try { return katex.renderToString(m, { displayMode: true, throwOnError: false }); } catch { return `$$${m}$$`; } })
    .replace(/\$(.+?)\$/g, (_, m) => { try { return katex.renderToString(m, { displayMode: false, throwOnError: false }); } catch { return `$${m}$`; } });
}

function parseStructuredBlocks(content: string) {
  const blocks: { type: "text" | "visual" | "interactive" | "stepbystep" | "code" | "mermaid"; text: string }[] = [];
  const lines = content.split("\n");
  let currentType: "text" | "visual" | "interactive" | "stepbystep" | "code" | "mermaid" = "text";
  let buffer: string[] = [];
  let inCodeBlock = false;
  let codeFenceLang = "";

  for (const line of lines) {
    if (line.startsWith("```")) {
      if (inCodeBlock) {
        blocks.push({ type: codeFenceLang === "mermaid" ? "mermaid" : "code", text: buffer.join("\n") });
        buffer = [];
        inCodeBlock = false;
        codeFenceLang = "";
      } else {
        if (buffer.length > 0) blocks.push({ type: currentType, text: buffer.join("\n") });
        buffer = [];
        inCodeBlock = true;
        codeFenceLang = line.slice(3).trim();
      }
      continue;
    }
    if (inCodeBlock) {
      buffer.push(line);
      continue;
    }
    const lower = line.toLowerCase();
    if (lower.includes("**visual explanation**") || lower.includes("**visualizing")) {
      if (buffer.length > 0) blocks.push({ type: currentType, text: buffer.join("\n") });
      buffer = [];
      currentType = "visual";
      continue;
    }
    if (lower.includes("**interactive demo**") || lower.includes("**try it yourself**")) {
      if (buffer.length > 0) blocks.push({ type: currentType, text: buffer.join("\n") });
      buffer = [];
      currentType = "interactive";
      continue;
    }
    if (lower.includes("**step-by-step**") || lower.includes("**step by step**") || lower.includes("**walkthrough**")) {
      if (buffer.length > 0) blocks.push({ type: currentType, text: buffer.join("\n") });
      buffer = [];
      currentType = "stepbystep";
      continue;
    }
    buffer.push(line);
  }
  if (buffer.length > 0) blocks.push({ type: currentType, text: buffer.join("\n") });
  return blocks.filter((b) => b.text.trim());
}

export default function SessionChatPage({ params }: { params: Promise<{ session: string }> }) {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-full"><div className="w-6 h-6 border-2 border-sage border-t-transparent rounded-full animate-spin" /></div>}>
      <SessionChatInner params={params} />
    </Suspense>
  );
}

function SessionChatInner({ params }: { params: Promise<{ session: string }> }) {
  const resolvedParams = use(params);
  const slug = resolvedParams.session;
  const searchParams = useSearchParams();
  const moduleId = searchParams.get("module");

  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { session } = useSession();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [thinkingStatus, setThinkingStatus] = useState<string[]>([]);
  const [moduleContext, setModuleContext] = useState<ModuleContext | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mountedRef = useRef(false);
  const autoCreatedRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Attachment menu state
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showYouTubeModal, setShowYouTubeModal] = useState(false);
  const [showGDriveModal, setShowGDriveModal] = useState(false);
  const [youTubeUrl, setYouTubeUrl] = useState("");
  const [gDriveUrl, setGDriveUrl] = useState("");
  const [attaching, setAttaching] = useState(false);
  const [attachStatus, setAttachStatus] = useState<string | null>(null);

  // Voice input state
  const [isRecording, setIsRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const STORAGE_KEY = `aether_active_conversation_${slug}`;

  // Check speech recognition support
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        setSpeechSupported(true);
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = "en-US";
        recognition.onresult = (event: SpeechRecognitionEvent) => {
          const transcript = Array.from(event.results)
            .map((r) => r[0].transcript)
            .join("");
          setInputValue((prev) => transcript || prev);
        };
        recognition.onend = () => setIsRecording(false);
        recognition.onerror = () => setIsRecording(false);
        recognitionRef.current = recognition;
      }
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/");
  }, [user, authLoading, router]);

  // Load module context from DB
  useEffect(() => {
    if (!moduleId || !user || !session) return;
    let cancelled = false;
    const supabase = createClient();
    supabase
      .from("session_roadmap_modules")
      .select("*")
      .eq("id", moduleId)
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (cancelled || !data) return;
        let parsedLessons = data.lessons;
        if (typeof parsedLessons === "string") {
          try { parsedLessons = JSON.parse(parsedLessons); } catch { parsedLessons = []; }
        }
        setModuleContext({
          id: data.id,
          title: data.title,
          description: data.description || "",
          lessons: Array.isArray(parsedLessons) ? parsedLessons : [],
          learning_objectives: data.learning_objectives || "",
          key_concepts: data.key_concepts || "",
        });
      });
    return () => { cancelled = true; };
  }, [moduleId, user, session]);

  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setActiveConversation(saved);
  }, [STORAGE_KEY]);

  useEffect(() => {
    if (activeConversation) {
      localStorage.setItem(STORAGE_KEY, activeConversation);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [activeConversation, STORAGE_KEY]);

  const fetchConversations = useCallback(async () => {
    if (!user || !session) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("conversations")
      .select("id, title, created_at")
      .eq("user_id", user.id)
      .eq("session_id", session.id)
      .order("created_at", { ascending: false });
    if (data) setConversations(data as Conversation[]);
    setLoading(false);
  }, [user, session]);

  const fetchMessages = useCallback(async (convId: string) => {
    const supabase = createClient();
    const { data } = await supabase
      .from("chat_messages")
      .select("id, role, content, created_at")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true });
    if (data) setMessages(data as ChatMessage[]);
  }, []);

  useEffect(() => {
    if (user) fetchConversations();
  }, [user, fetchConversations]);

  const fetchMessagesRef = useRef(fetchMessages);
  fetchMessagesRef.current = fetchMessages;

  useEffect(() => {
    if (activeConversation) {
      let cancelled = false;
      fetchMessagesRef.current(activeConversation).then(() => {
        if (cancelled) setMessages([]);
      });
      return () => { cancelled = true; };
    } else {
      setMessages([]);
    }
  }, [activeConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!activeConversation || conversations.length === 0) return;
    const exists = conversations.some((c) => c.id === activeConversation);
    if (!exists) setActiveConversation(null);
  }, [conversations, activeConversation]);

  // Auto-create conversation when module is loaded and no active conversation
  useEffect(() => {
    if (moduleContext && !activeConversation && !autoCreatedRef.current && user && session) {
      autoCreatedRef.current = true;
      let cancelled = false;
      const title = `Module: ${moduleContext.title}`;
      const supabase = createClient();
      supabase
        .from("conversations")
        .insert({ user_id: user.id, session_id: session.id, title })
        .select("id, title, created_at")
        .single()
        .then(({ data }) => {
          if (cancelled || !data) return;
          setConversations((prev) => [data as Conversation, ...prev]);
          setActiveConversation(data.id);
          setMessages([]);
        });
      return () => { cancelled = true; };
    }
  }, [moduleContext, activeConversation, user, session]);

  const createConversation = useCallback(async () => {
    if (!user || !session) return;
    const supabase = createClient();
    const title = moduleContext ? `Module: ${moduleContext.title}` : "New Chat";
    const { data, error } = await supabase
      .from("conversations")
      .insert({ user_id: user.id, session_id: session.id, title })
      .select("id, title, created_at")
      .single();
    if (data && !error) {
      setConversations((prev) => [data as Conversation, ...prev]);
      setActiveConversation(data.id);
      setMessages([]);
    }
  }, [user, session, moduleContext]);

  const deleteConversation = useCallback(async (convId: string) => {
    if (!user) return;
    const supabase = createClient();
    await supabase.from("chat_messages").delete().eq("conversation_id", convId);
    await supabase.from("conversations").delete().eq("id", convId);
    setConversations((prev) => prev.filter((c) => c.id !== convId));
    if (activeConversation === convId) {
      setActiveConversation(null);
      setMessages([]);
    }
  }, [user, activeConversation]);

  const updateConversationTitle = useCallback(async (convId: string, title: string) => {
    const supabase = createClient();
    await supabase.from("conversations").update({ title }).eq("id", convId);
    setConversations((prev) => prev.map((c) => c.id === convId ? { ...c, title } : c));
  }, []);

  // Voice input
  const toggleRecording = useCallback(() => {
    if (!recognitionRef.current) return;
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      recognitionRef.current.start();
      setIsRecording(true);
    }
  }, [isRecording]);

  // Attachment handlers
  const handleImageUpload = useCallback(async (files: FileList | null) => {
    if (!files || !user || !session) return;
    setShowAttachMenu(false);
    setAttaching(true);
    setAttachStatus("Uploading image...");

    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("session_id", session.id);

      try {
        const res = await fetch("/api/knowledge/image", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (data.success) {
          setAttachStatus(`"${file.name}" added to knowledge base`);
          setTimeout(() => setAttachStatus(null), 3000);
        } else {
          setAttachStatus(`Failed: ${data.error}`);
        }
      } catch {
        setAttachStatus("Upload failed");
      }
    }
    setAttaching(false);
  }, [user, session]);

  const handleYouTubeSubmit = useCallback(async () => {
    if (!youTubeUrl.trim() || !session) return;
    setShowYouTubeModal(false);
    setAttaching(true);
    setAttachStatus("Extracting YouTube content...");

    try {
      const res = await fetch("/api/knowledge/youtube", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: youTubeUrl.trim(), session_id: session.id }),
      });
      const data = await res.json();
      if (data.success) {
        setAttachStatus(`"${data.title}" added to knowledge base`);
        setTimeout(() => setAttachStatus(null), 3000);
      } else {
        setAttachStatus(`Failed: ${data.error}`);
      }
    } catch {
      setAttachStatus("Failed to add YouTube link");
    }
    setAttaching(false);
    setYouTubeUrl("");
  }, [youTubeUrl, session]);

  const handleGDriveSubmit = useCallback(async () => {
    if (!gDriveUrl.trim() || !session) return;
    setShowGDriveModal(false);
    setAttaching(true);
    setAttachStatus("Adding Google Drive file...");

    try {
      const res = await fetch("/api/knowledge/gdrive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: gDriveUrl.trim(), session_id: session.id }),
      });
      const data = await res.json();
      if (data.success) {
        setAttachStatus("Added to knowledge base");
        setTimeout(() => setAttachStatus(null), 3000);
      } else {
        setAttachStatus(`Failed: ${data.error}`);
      }
    } catch {
      setAttachStatus("Failed to add Google Drive file");
    }
    setAttaching(false);
    setGDriveUrl("");
  }, [gDriveUrl, session]);

  const sendMessage = useCallback(async () => {
    if (!inputValue.trim() || sending || !activeConversation || !session) return;

    const isFirstMessage = messages.length === 0;
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: inputValue.trim(),
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setSending(true);
    setThinkingStatus([]);

    if (isFirstMessage && !moduleContext) {
      const title = generateTitle(userMsg.content);
      updateConversationTitle(activeConversation, title);
    }

    try {
      const body: Record<string, unknown> = {
        message: userMsg.content,
        conversation_id: activeConversation,
        session_id: session.id,
      };

      if (moduleContext) {
        body.module_context = {
          title: moduleContext.title,
          description: moduleContext.description,
          lessons: moduleContext.lessons,
          learning_objectives: moduleContext.learning_objectives,
          key_concepts: moduleContext.key_concepts,
        };
      }

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: "Request failed" }));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = "";
      let buffer = "";
      let messageId: string | null = null;

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const jsonStr = line.slice(6).trim();
            if (!jsonStr) continue;

            try {
              const event = JSON.parse(jsonStr);

              if (event.type === "status") {
                setThinkingStatus((prev) => [...prev, event.text]);
              } else if (event.type === "chunk") {
                fullText += event.text;
                setThinkingStatus([]);
                setMessages((prev) => {
                  const msgs = [...prev];
                  const lastMsg = msgs[msgs.length - 1];
                  if (lastMsg && lastMsg.role === "assistant" && lastMsg.id === "__streaming__") {
                    msgs[msgs.length - 1] = { ...lastMsg, content: fullText };
                  } else {
                    msgs.push({ id: "__streaming__", role: "assistant", content: fullText, created_at: new Date().toISOString() });
                  }
                  return msgs;
                });
              } else if (event.type === "done") {
                messageId = event.message_id;
              } else if (event.type === "error") {
                throw new Error(event.error);
              }
            } catch {
              // skip malformed events
            }
          }
        }
      }

      if (fullText) {
        setMessages((prev) => {
          const msgs = [...prev];
          const lastIdx = msgs.findIndex((m) => m.id === "__streaming__");
          if (lastIdx >= 0) {
            msgs[lastIdx] = { ...msgs[lastIdx], id: messageId || crypto.randomUUID() };
          }
          return msgs;
        });
      } else {
        throw new Error("No response received");
      }
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `Error: ${(err as Error).message}. Make sure you have documents uploaded in Knowledge and your Gemini API key is configured.`,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setSending(false);
      setThinkingStatus([]);
      inputRef.current?.focus();
    }
  }, [inputValue, sending, activeConversation, messages.length, updateConversationTitle, session, moduleContext]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (authLoading || !user || !session) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-6 h-6 border-2 border-sage border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
        {/* Header */}
        <header className="p-3 sm:p-4 lg:p-6 lg:pb-0">
          <div className="flex items-center justify-between glass-card-warm rounded-[32px] p-3 sm:p-4 lg:p-6 mb-8">
            <div className="flex items-center gap-6">
              {activeConversation && (
                <button
                  onClick={() => { setActiveConversation(null); setMessages([]); }}
                  className="w-10 h-10 rounded-xl bg-warm-ink/[0.03] flex items-center justify-center hover:bg-warm-ink/[0.05] transition-all cursor-pointer"
                >
                  <svg className="w-5 h-5 text-warm-ink-soft" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                  </svg>
                </button>
              )}
              <div className="relative">
                <div className="w-10 sm:w-12 lg:w-16 h-10 sm:h-12 lg:h-16 rounded-2xl bg-[#E8F0E5] flex items-center justify-center border-2 border-sage">
                  <svg className="w-6 lg:w-8 h-6 lg:h-8 text-sage" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-cream" />
              </div>
              <div>
                <h3 className="text-xl font-bold">
                  {moduleContext
                    ? moduleContext.title
                    : activeConversation
                      ? conversations.find((c) => c.id === activeConversation)?.title || "Chat"
                      : session.title}
                </h3>
                <div className="flex items-center gap-3 text-xs text-warm-ink-muted">
                  <span className="flex items-center gap-1 text-green-400">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                    Online
                  </span>
                  <span>•</span>
                  <span>{moduleContext ? "Module Tutor" : "RAG-powered"}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 lg:gap-3 flex-wrap justify-end">
              <Link
                href={`/${slug}/voice-tutor`}
                className="flex items-center gap-2 bg-warm-ink/[0.03] border border-hairline-warm text-xs font-bold px-2 lg:px-4 py-1.5 lg:py-2.5 rounded-full hover:bg-warm-ink/[0.05] hover:border-sage/30 transition-all cursor-pointer"
              >
                <svg className="w-4 h-4 text-sage" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                </svg>
                <span className="hidden lg:inline text-sage">Voice Mode</span>
              </Link>
              {activeConversation && (
                <button
                  onClick={() => deleteConversation(activeConversation)}
                  className="text-red-400/60 hover:text-red-400 text-xs font-bold px-3 lg:px-4 py-1.5 lg:py-2.5 rounded-full hover:bg-red-400/10 transition-all cursor-pointer"
                >
                  Delete
                </button>
              )}
              <button
                onClick={createConversation}
                className="bg-sage text-white text-xs font-bold px-3 lg:px-5 py-1.5 lg:py-2.5 rounded-full hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                + New Chat
              </button>
            </div>
          </div>
        </header>

        {!activeConversation ? (
          <div className="flex-1 overflow-y-auto px-3 sm:px-4 lg:px-8 pb-24">
            <div className="max-w-3xl mx-auto py-8">
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="glass-card-warm rounded-[28px] p-5 animate-pulse">
                      <div className="w-48 h-4 bg-warm-ink/[0.03] rounded" />
                    </div>
                  ))}
                </div>
              ) : conversations.length === 0 ? (
                <div className="text-center py-20">
                  <div className="w-16 lg:w-20 h-16 lg:h-20 mx-auto bg-sage/10 rounded-3xl flex items-center justify-center mb-6">
                    <svg className="w-10 h-10 text-sage" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                    </svg>
                  </div>
                  <h2 className="text-xl lg:text-2xl font-bold mb-3">Start a conversation</h2>
                  <p className="text-warm-ink-muted text-sm mb-8 max-w-md mx-auto">
                    Ask Aether anything about {session.subject || "this session"}. It retrieves context from your uploaded documents.
                  </p>
                  <button
                    onClick={createConversation}
                    className="bg-sage text-white text-sm font-bold px-8 py-3 rounded-full hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  >
                    New Chat
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-warm-ink-muted pl-2 mb-4">Recent Conversations</h4>
                  {conversations.map((conv) => (
                    <div
                      key={conv.id}
                      className="w-full glass-card-warm rounded-[28px] p-5 hover:border-sage/20 transition-all group"
                    >
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => setActiveConversation(conv.id)}
                          className="flex-1 flex items-center gap-4 text-left cursor-pointer"
                        >
                          <div className="w-10 h-10 rounded-xl bg-warm-ink/[0.03] flex items-center justify-center shrink-0">
                            <svg className="w-5 h-5 text-warm-ink-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                              <path d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                            </svg>
                          </div>
                          <div>
                            <h4 className="text-sm font-bold">{conv.title}</h4>
                            <p className="text-[10px] text-warm-ink-muted uppercase tracking-widest mt-1">
                              {new Date(conv.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </button>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id); }}
                            className="w-8 h-8 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-400/10 transition-all cursor-pointer"
                          >
                            <svg className="w-4 h-4 text-red-400/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                            </svg>
                          </button>
                          <svg className="w-4 h-4 text-warm-ink-faint" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-3 sm:px-4 lg:px-8 pb-28 lg:pb-32">
              <div className="max-w-4xl mx-auto space-y-8 py-6">
                {messages.length === 0 && moduleContext && (
                  <div className="glass-card-warm rounded-[32px] p-8 mb-8">
                    <div className="flex items-center gap-3 mb-4">
                      <svg className="w-6 h-6 text-sage" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                        <path d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
                      </svg>
                      <div>
                        <h3 className="text-lg font-bold">{moduleContext.title}</h3>
                        <p className="text-xs text-warm-ink-muted">{moduleContext.lessons?.length || 0} lessons in this module</p>
                      </div>
                    </div>
                    {moduleContext.description && (
                      <p className="text-sm text-warm-ink-soft mb-4">{moduleContext.description}</p>
                    )}
                    {moduleContext.learning_objectives && (
                      <div className="mb-4">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-warm-ink-muted mb-2">Learning Objectives</h4>
                        <div className="text-sm text-warm-ink-soft whitespace-pre-line">{moduleContext.learning_objectives}</div>
                      </div>
                    )}
                    <p className="text-xs text-sage font-bold">Aether will guide you through each lesson. Start chatting to begin!</p>
                  </div>
                )}

                {messages.length === 0 && !moduleContext && (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 mx-auto bg-sage/10 rounded-2xl flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-sage" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                        <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                      </svg>
                    </div>
                    <p className="text-warm-ink-faint text-sm">Ask something about your uploaded documents</p>
                  </div>
                )}

                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start items-start gap-4"}`}>
                    {msg.role === "assistant" && (
                      <div className="w-8 lg:w-10 h-8 lg:h-10 rounded-xl bg-sage flex-shrink-0 flex items-center justify-center text-white shadow-[0_0_15px_rgba(253,224,71,0.4)]">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                        </svg>
                      </div>
                    )}

                    <div className={`space-y-3 ${msg.role === "user" ? "max-w-[90%] sm:max-w-[85%] lg:max-w-[80%]" : "max-w-[95%] sm:max-w-[90%] lg:max-w-[85%]"}`}>
                      {msg.role === "user" ? (
                        <div className="rounded-[24px] rounded-tr-md p-4 lg:p-5 shadow-sm text-white" style={{ backgroundColor: "#6B8E61" }}>
                          <p className="text-sm leading-relaxed">{msg.content}</p>
                        </div>
                      ) : (
                        parseStructuredBlocks(msg.content).map((block, bi) => {
                          if (block.type === "mermaid") {
                            return <MermaidBlock key={bi} chart={block.text} />;
                          }
                          if (block.type === "code") {
                            return (
                              <div key={bi} className="glass-card-warm rounded-[28px] p-5">
                                <div className="bg-black/50 rounded-2xl p-4 border border-hairline-warm font-mono text-xs overflow-x-auto">
                                  <pre className="text-sage whitespace-pre-wrap">{block.text}</pre>
                                </div>
                              </div>
                            );
                          }
                          if (block.type === "visual") {
                            return (
                              <div key={bi} className="glass-card-warm rounded-[32px] p-6">
                                <div className="flex items-center gap-2 mb-4">
                                  <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                    <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  </svg>
                                  <span className="text-xs font-bold uppercase tracking-widest text-cyan-400">Visual Explanation</span>
                                </div>
                                <div className="text-sm leading-relaxed whitespace-pre-wrap text-warm-ink-soft">{block.text}</div>
                              </div>
                            );
                          }
                          if (block.type === "interactive") {
                            return (
                              <div key={bi} className="glass-card-warm rounded-[32px] p-6 shadow-2xl">
                                <div className="flex items-center gap-2 mb-4">
                                  <svg className="w-5 h-5 text-sage" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959V6a2.25 2.25 0 00-2.25-2.25H6A2.25 2.25 0 003.75 6v1.222c0 .355.186.676.401.959.221.29.349.634.349 1.003 0 1.036-1.007 1.875-2.25 1.875S0 10.235 0 11.2c0 .369.128.713.349 1.003.215.283.401.604.401.959V18a2.25 2.25 0 002.25 2.25h13.5A2.25 2.25 0 0021.75 18v-4.841c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959V18" />
                                  </svg>
                                  <span className="text-xs font-bold uppercase tracking-widest text-sage">Interactive Demo</span>
                                </div>
                                <div className="text-sm leading-relaxed whitespace-pre-wrap text-warm-ink-soft">{block.text}</div>
                              </div>
                            );
                          }
                          if (block.type === "stepbystep") {
                            return (
                              <div key={bi} className="glass-card-warm rounded-[32px] p-6">
                                <div className="flex items-center gap-2 mb-4">
                                  <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
                                  </svg>
                                  <span className="text-xs font-bold uppercase tracking-widest text-purple-400">Step-by-Step</span>
                                </div>
                                <div className="text-sm leading-relaxed whitespace-pre-wrap text-warm-ink-soft">{block.text}</div>
                              </div>
                            );
                          }
                          return (
                            <div key={bi} className="glass-card-warm rounded-[28px] rounded-tl-lg p-6">
                              <div className="text-sm leading-relaxed" dangerouslySetInnerHTML={{
                                __html: renderMarkdown(block.text)
                              }} />
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                ))}

                {sending && (
                  <div className="flex items-start gap-3 opacity-60">
                    <div className="w-10 h-10 rounded-full bg-sage/20 flex items-center justify-center shrink-0 mt-1">
                      <svg className="text-sage w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                      </svg>
                    </div>
                    <div className="space-y-1.5 pt-1">
                      {thinkingStatus.length === 0 ? (
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            <div className="w-1.5 h-1.5 bg-warm-ink/30 rounded-full typing-dot" style={{ animationDelay: "0s" }} />
                            <div className="w-1.5 h-1.5 bg-warm-ink/30 rounded-full typing-dot" style={{ animationDelay: "0.2s" }} />
                            <div className="w-1.5 h-1.5 bg-warm-ink/30 rounded-full typing-dot" style={{ animationDelay: "0.4s" }} />
                          </div>
                          <span className="text-xs text-warm-ink-muted">Initializing...</span>
                        </div>
                      ) : (
                        thinkingStatus.map((status, i) => (
                          <div key={i} className="flex items-center gap-2">
                            {i === thinkingStatus.length - 1 ? (
                              <>
                                <div className="w-1.5 h-1.5 bg-sage rounded-full animate-pulse" />
                                <span className="text-xs text-sage font-medium">{status}</span>
                              </>
                            ) : (
                              <>
                                <svg className="w-3 h-3 text-green-400/60 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                </svg>
                                <span className="text-xs text-warm-ink-faint line-through">{status}</span>
                              </>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Attach status toast */}
            {attachStatus && (
              <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[60]">
                <div className="bg-white border border-hairline-warm px-5 py-3 rounded-full flex items-center gap-3 shadow-[0_12px_36px_rgba(42,35,64,0.14)]">
                  <div className={`w-2 h-2 rounded-full ${attaching ? "bg-sage animate-pulse" : "bg-green-400"}`} />
                  <span className="text-xs font-medium text-warm-ink-soft">{attachStatus}</span>
                </div>
              </div>
            )}

            {/* Composer Bar */}
            <div className="absolute bottom-8 left-0 right-0 z-50 pointer-events-none px-2 sm:px-4 lg:px-12">
              <div className="pointer-events-auto">
                <div className="sticky bottom-8 max-w-4xl mx-auto px-4 w-full">
                  <div className="bg-white border border-hairline-warm rounded-full p-1 sm:p-2 flex items-center gap-2 pr-4 shadow-[0_8px_30px_rgba(42,35,64,0.10)] relative">
                    {/* Left: + button with attachment menu */}
                    <div className="relative">
                      <button
                        onClick={() => setShowAttachMenu(!showAttachMenu)}
                        className="w-10 lg:w-12 h-10 lg:h-12 shrink-0 rounded-full hover:bg-warm-ink/[0.05] transition-colors flex items-center justify-center text-warm-ink-muted cursor-pointer"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                      </button>

                      {/* Attachment dropdown menu */}
                      {showAttachMenu && (
                        <div className="absolute bottom-full left-0 mb-3 bg-white border border-hairline-warm rounded-2xl p-2 min-w-[220px] shadow-[0_16px_48px_rgba(42,35,64,0.16)] z-[60]">
                          <button
                            onClick={() => { fileInputRef.current?.click(); setShowAttachMenu(false); }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-warm-ink-soft hover:text-warm-ink hover:bg-warm-ink/[0.05] rounded-xl transition-all cursor-pointer"
                          >
                            <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                              <path d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a1.5 1.5 0 001.5-1.5V5.25a1.5 1.5 0 00-1.5-1.5H3.75a1.5 1.5 0 00-1.5 1.5v14.25a1.5 1.5 0 001.5 1.5z" />
                            </svg>
                            Attach Image
                          </button>
                          <button
                            onClick={() => { setShowYouTubeModal(true); setShowAttachMenu(false); }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-warm-ink-soft hover:text-warm-ink hover:bg-warm-ink/[0.05] rounded-xl transition-all cursor-pointer"
                          >
                            <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                              <path d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                            </svg>
                            Add YouTube Link
                          </button>
                          <button
                            onClick={() => { setShowGDriveModal(true); setShowAttachMenu(false); }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-warm-ink-soft hover:text-warm-ink hover:bg-warm-ink/[0.05] rounded-xl transition-all cursor-pointer"
                          >
                            <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                              <path d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375" />
                            </svg>
                            Add Google Drive File
                          </button>
                        </div>
                      )}
                    </div>

                    <input
                      ref={inputRef}
                      type="text"
                      placeholder={moduleContext ? `Ask about ${moduleContext.title}...` : "Ask Aether anything..."}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                      disabled={sending}
                      className="flex-1 bg-transparent border-none focus:ring-0 text-xs sm:text-sm py-2 sm:py-4 min-w-0 text-warm-ink placeholder-warm-ink-faint outline-none disabled:opacity-50"
                    />

                    {/* Right side: mic or send */}
                    <div className="flex items-center gap-2">
                      {inputValue.trim() ? (
                        <button
                          onClick={sendMessage}
                          disabled={sending}
                          className="w-10 lg:w-12 h-10 lg:h-12 shrink-0 rounded-full bg-sage text-white shadow-[0_0_20px_rgba(107,142,97,0.3)] hover:scale-110 active:scale-90 transition-all flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                          </svg>
                        </button>
                      ) : speechSupported ? (
                        <button
                          onClick={toggleRecording}
                          className={`w-10 lg:w-12 h-10 lg:h-12 shrink-0 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                            isRecording
                              ? "bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)] animate-pulse"
                              : "bg-[#E8F0E5] border border-hairline-warm hover:bg-[#DFEAD9] text-sage"
                          }`}
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                            <path d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                          </svg>
                        </button>
                      ) : (
                        <button
                          onClick={sendMessage}
                          disabled={!inputValue.trim() || sending}
                          className="w-10 lg:w-12 h-10 lg:h-12 shrink-0 rounded-full bg-sage text-white shadow-[0_0_20px_rgba(107,142,97,0.3)] hover:scale-110 active:scale-90 transition-all flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Hidden file input for images */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleImageUpload(e.target.files)}
            />

            {/* YouTube Modal */}
            {showYouTubeModal && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowYouTubeModal(false)} />
                <div className="relative glass-card-warm rounded-[32px] max-w-md w-full p-8 z-10">
                  <h3 className="text-xl font-bold mb-2">Add YouTube Video</h3>
                  <p className="text-sm text-warm-ink-muted mb-6">Paste a YouTube URL to extract its transcript and add it to your knowledge base.</p>
                  <input
                    type="url"
                    placeholder="https://youtube.com/watch?v=..."
                    value={youTubeUrl}
                    onChange={(e) => setYouTubeUrl(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleYouTubeSubmit()}
                    className="w-full bg-warm-ink/[0.03] border border-hairline-warm rounded-2xl px-5 py-4 text-sm text-warm-ink placeholder-warm-ink-faint outline-none focus:border-sage/50 transition-all mb-4"
                    autoFocus
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowYouTubeModal(false)}
                      className="flex-1 bg-warm-ink/[0.03] border border-hairline-warm py-3 rounded-full text-sm font-bold hover:bg-warm-ink/[0.05] transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleYouTubeSubmit}
                      disabled={!youTubeUrl.trim()}
                      className="flex-1 bg-sage text-white py-3 rounded-full text-sm font-bold hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                    >
                      Add to Knowledge
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Google Drive Modal */}
            {showGDriveModal && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowGDriveModal(false)} />
                <div className="relative glass-card-warm rounded-[32px] max-w-md w-full p-8 z-10">
                  <h3 className="text-xl font-bold mb-2">Add Google Drive File</h3>
                  <p className="text-sm text-warm-ink-muted mb-6">Paste a Google Drive share link to add the file to your knowledge base.</p>
                  <input
                    type="url"
                    placeholder="https://drive.google.com/file/d/..."
                    value={gDriveUrl}
                    onChange={(e) => setGDriveUrl(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleGDriveSubmit()}
                    className="w-full bg-warm-ink/[0.03] border border-hairline-warm rounded-2xl px-5 py-4 text-sm text-warm-ink placeholder-warm-ink-faint outline-none focus:border-sage/50 transition-all mb-4"
                    autoFocus
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowGDriveModal(false)}
                      className="flex-1 bg-warm-ink/[0.03] border border-hairline-warm py-3 rounded-full text-sm font-bold hover:bg-warm-ink/[0.05] transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleGDriveSubmit}
                      disabled={!gDriveUrl.trim()}
                      className="flex-1 bg-sage text-white py-3 rounded-full text-sm font-bold hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                    >
                      Add to Knowledge
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
    </>
  );
}
