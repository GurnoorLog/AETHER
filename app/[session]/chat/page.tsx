"use client";

import { useEffect, useState, useCallback, useRef, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { useSession } from "../layout";
import SidebarRight from "@/components/SidebarRight";
import SidebarLeft from "@/components/SidebarLeft";
import type { Lesson } from "@/types/database";

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

function parseStructuredBlocks(content: string) {
  const blocks: { type: "text" | "visual" | "interactive" | "stepbystep" | "code"; text: string }[] = [];
  const lines = content.split("\n");
  let currentType: "text" | "visual" | "interactive" | "stepbystep" | "code" = "text";
  let buffer: string[] = [];
  let inCodeBlock = false;

  for (const line of lines) {
    if (line.startsWith("```")) {
      if (inCodeBlock) {
        blocks.push({ type: "code", text: buffer.join("\n") });
        buffer = [];
        inCodeBlock = false;
      } else {
        if (buffer.length > 0) blocks.push({ type: currentType, text: buffer.join("\n") });
        buffer = [];
        inCodeBlock = true;
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

  const STORAGE_KEY = `aether_active_conversation_${slug}`;

  useEffect(() => {
    if (!authLoading && !user) router.replace("/");
  }, [user, authLoading, router]);

  // Load module context from DB
  useEffect(() => {
    if (!moduleId || !user || !session) return;
    const supabase = createClient();
    supabase
      .from("session_roadmap_modules")
      .select("*")
      .eq("id", moduleId)
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setModuleContext({
            id: data.id,
            title: data.title,
            description: data.description || "",
            lessons: typeof data.lessons === "string" ? JSON.parse(data.lessons) : (data.lessons || []),
            learning_objectives: data.learning_objectives || "",
            key_concepts: data.key_concepts || "",
          });
        }
      });
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

  useEffect(() => {
    if (activeConversation) {
      fetchMessages(activeConversation);
    } else {
      setMessages([]);
    }
  }, [activeConversation, fetchMessages]);

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
      const title = `Module: ${moduleContext.title}`;
      const supabase = createClient();
      supabase
        .from("conversations")
        .insert({ user_id: user.id, session_id: session.id, title })
        .select("id, title, created_at")
        .single()
        .then(({ data }) => {
          if (data) {
            setConversations((prev) => [data as Conversation, ...prev]);
            setActiveConversation(data.id);
            setMessages([]);
          }
        });
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
            } catch (parseErr) {
              if (parseErr instanceof Error && parseErr.message !== "Unexpected end of JSON input") {
                throw parseErr;
              }
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
      <div className="h-screen bg-deep-onyx text-white flex overflow-hidden">
        <div className="w-[15%] shrink-0 p-6 space-y-4">
          <div className="animate-pulse bg-white/5 rounded-2xl w-10 h-10" />
          <div className="animate-pulse bg-white/5 rounded-full h-10" />
        </div>
        <main className="flex-1 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-cyber-yellow border-t-transparent rounded-full animate-spin" />
        </main>
        <div className="w-[20%] shrink-0 p-6">
          <div className="animate-pulse bg-white/5 rounded-[32px] h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-deep-onyx text-white flex overflow-hidden">
      <SidebarLeft currentPage="tutor" />

      <main className="flex-1 flex flex-col relative z-0 min-w-0 h-screen overflow-hidden">
        {/* Header */}
        <header className="p-6 pb-0">
          <div className="flex items-center justify-between glass-card rounded-[32px] p-6 mb-8">
            <div className="flex items-center gap-6">
              {activeConversation && (
                <button
                  onClick={() => { setActiveConversation(null); setMessages([]); }}
                  className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all cursor-pointer"
                >
                  <svg className="w-5 h-5 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                  </svg>
                </button>
              )}
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-black flex items-center justify-center border-2 border-cyber-yellow">
                  <svg className="w-8 h-8 text-cyber-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-deep-onyx" />
              </div>
              <div>
                <h3 className="text-xl font-bold">
                  {moduleContext
                    ? moduleContext.title
                    : activeConversation
                      ? conversations.find((c) => c.id === activeConversation)?.title || "Chat"
                      : session.title}
                </h3>
                <div className="flex items-center gap-3 text-xs text-white/50">
                  <span className="flex items-center gap-1 text-green-400">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                    Online
                  </span>
                  <span>•</span>
                  <span>{moduleContext ? "Module Tutor" : "RAG-powered"}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {activeConversation && (
                <button
                  onClick={() => deleteConversation(activeConversation)}
                  className="text-red-400/60 hover:text-red-400 text-xs font-bold px-4 py-2.5 rounded-full hover:bg-red-400/10 transition-all cursor-pointer"
                >
                  Delete
                </button>
              )}
              <button
                onClick={createConversation}
                className="bg-cyber-yellow text-black text-xs font-bold px-5 py-2.5 rounded-full hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                + New Chat
              </button>
            </div>
          </div>
        </header>

        {!activeConversation ? (
          <div className="flex-1 overflow-y-auto px-8 pb-24">
            <div className="max-w-3xl mx-auto py-8">
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="glass-card rounded-[28px] p-5 animate-pulse">
                      <div className="w-48 h-4 bg-white/5 rounded" />
                    </div>
                  ))}
                </div>
              ) : conversations.length === 0 ? (
                <div className="text-center py-20">
                  <div className="w-20 h-20 mx-auto bg-cyber-yellow/10 rounded-3xl flex items-center justify-center mb-6">
                    <svg className="w-10 h-10 text-cyber-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold mb-3">Start a conversation</h2>
                  <p className="text-white/40 text-sm mb-8 max-w-md mx-auto">
                    Ask Aether anything about {session.subject || "this session"}. It retrieves context from your uploaded documents.
                  </p>
                  <button
                    onClick={createConversation}
                    className="bg-cyber-yellow text-black text-sm font-bold px-8 py-3 rounded-full hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  >
                    New Chat
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/40 pl-2 mb-4">Recent Conversations</h4>
                  {conversations.map((conv) => (
                    <div
                      key={conv.id}
                      className="w-full glass-card rounded-[28px] p-5 hover:border-cyber-yellow/20 transition-all group"
                    >
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => setActiveConversation(conv.id)}
                          className="flex-1 flex items-center gap-4 text-left cursor-pointer"
                        >
                          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                            <svg className="w-5 h-5 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                              <path d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                            </svg>
                          </div>
                          <div>
                            <h4 className="text-sm font-bold">{conv.title}</h4>
                            <p className="text-[10px] text-white/40 uppercase tracking-widest mt-1">
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
                          <svg className="w-4 h-4 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
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
            <div className="flex-1 overflow-y-auto px-8 pb-32">
              <div className="max-w-4xl mx-auto space-y-8 py-6">
                {messages.length === 0 && moduleContext && (
                  <div className="glass-card rounded-[32px] p-8 border-l-4 border-cyber-yellow mb-8">
                    <div className="flex items-center gap-3 mb-4">
                      <svg className="w-6 h-6 text-cyber-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                        <path d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
                      </svg>
                      <div>
                        <h3 className="text-lg font-bold">{moduleContext.title}</h3>
                        <p className="text-xs text-white/40">{moduleContext.lessons?.length || 0} lessons in this module</p>
                      </div>
                    </div>
                    {moduleContext.description && (
                      <p className="text-sm text-white/60 mb-4">{moduleContext.description}</p>
                    )}
                    {moduleContext.learning_objectives && (
                      <div className="mb-4">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Learning Objectives</h4>
                        <div className="text-sm text-white/70 whitespace-pre-line">{moduleContext.learning_objectives}</div>
                      </div>
                    )}
                    <p className="text-xs text-cyber-yellow font-bold">Aether will guide you through each lesson. Start chatting to begin!</p>
                  </div>
                )}

                {messages.length === 0 && !moduleContext && (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 mx-auto bg-cyber-yellow/10 rounded-2xl flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-cyber-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                        <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                      </svg>
                    </div>
                    <p className="text-white/30 text-sm">Ask something about your uploaded documents</p>
                  </div>
                )}

                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start items-start gap-4"}`}>
                    {msg.role === "assistant" && (
                      <div className="w-10 h-10 rounded-xl bg-cyber-yellow flex-shrink-0 flex items-center justify-center text-black shadow-[0_0_15px_rgba(253,224,71,0.4)]">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                        </svg>
                      </div>
                    )}

                    <div className={`space-y-3 ${msg.role === "user" ? "max-w-[80%]" : "max-w-[85%]"}`}>
                      {msg.role === "user" ? (
                        <div className="bg-white/5 border border-white/10 rounded-[28px] rounded-tr-lg p-5 shadow-lg">
                          <p className="text-sm leading-relaxed">{msg.content}</p>
                        </div>
                      ) : (
                        parseStructuredBlocks(msg.content).map((block, bi) => {
                          if (block.type === "code") {
                            return (
                              <div key={bi} className="glass-card rounded-[28px] p-5 border-l-4 border-cyber-yellow">
                                <div className="bg-black/50 rounded-2xl p-4 border border-white/10 font-mono text-xs overflow-x-auto">
                                  <pre className="text-cyber-yellow whitespace-pre-wrap">{block.text}</pre>
                                </div>
                              </div>
                            );
                          }
                          if (block.type === "visual") {
                            return (
                              <div key={bi} className="glass-card rounded-[32px] p-6 border-l-4 border-cyan-400 shadow-2xl">
                                <div className="flex items-center gap-2 mb-4">
                                  <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                    <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  </svg>
                                  <span className="text-xs font-bold uppercase tracking-widest text-cyan-400">Visual Explanation</span>
                                </div>
                                <div className="text-sm leading-relaxed whitespace-pre-wrap text-white/80">{block.text}</div>
                              </div>
                            );
                          }
                          if (block.type === "interactive") {
                            return (
                              <div key={bi} className="glass-card rounded-[32px] p-6 border-l-4 border-cyber-yellow shadow-2xl">
                                <div className="flex items-center gap-2 mb-4">
                                  <svg className="w-5 h-5 text-cyber-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959V6a2.25 2.25 0 00-2.25-2.25H6A2.25 2.25 0 003.75 6v1.222c0 .355.186.676.401.959.221.29.349.634.349 1.003 0 1.036-1.007 1.875-2.25 1.875S0 10.235 0 11.2c0 .369.128.713.349 1.003.215.283.401.604.401.959V18a2.25 2.25 0 002.25 2.25h13.5A2.25 2.25 0 0021.75 18v-4.841c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959V18" />
                                  </svg>
                                  <span className="text-xs font-bold uppercase tracking-widest text-cyber-yellow">Interactive Demo</span>
                                </div>
                                <div className="text-sm leading-relaxed whitespace-pre-wrap text-white/80">{block.text}</div>
                              </div>
                            );
                          }
                          if (block.type === "stepbystep") {
                            return (
                              <div key={bi} className="glass-card rounded-[32px] p-6 border-l-4 border-purple-400 shadow-2xl">
                                <div className="flex items-center gap-2 mb-4">
                                  <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
                                  </svg>
                                  <span className="text-xs font-bold uppercase tracking-widest text-purple-400">Step-by-Step</span>
                                </div>
                                <div className="text-sm leading-relaxed whitespace-pre-wrap text-white/80">{block.text}</div>
                              </div>
                            );
                          }
                          return (
                            <div key={bi} className="glass-card rounded-[28px] rounded-tl-lg p-6">
                              <div className="text-sm leading-relaxed whitespace-pre-wrap" dangerouslySetInnerHTML={{
                                __html: block.text
                                  .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                                  .replace(/`(.*?)`/g, '<code class="text-cyber-yellow bg-black/30 px-1.5 py-0.5 rounded text-xs">$1</code>')
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
                    <div className="w-10 h-10 rounded-full bg-cyber-yellow/20 flex items-center justify-center shrink-0 mt-1">
                      <svg className="text-cyber-yellow w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                      </svg>
                    </div>
                    <div className="space-y-1.5 pt-1">
                      {thinkingStatus.length === 0 ? (
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            <div className="w-1.5 h-1.5 bg-white/40 rounded-full typing-dot" style={{ animationDelay: "0s" }} />
                            <div className="w-1.5 h-1.5 bg-white/40 rounded-full typing-dot" style={{ animationDelay: "0.2s" }} />
                            <div className="w-1.5 h-1.5 bg-white/40 rounded-full typing-dot" style={{ animationDelay: "0.4s" }} />
                          </div>
                          <span className="text-xs text-white/40">Initializing...</span>
                        </div>
                      ) : (
                        thinkingStatus.map((status, i) => (
                          <div key={i} className="flex items-center gap-2">
                            {i === thinkingStatus.length - 1 ? (
                              <>
                                <div className="w-1.5 h-1.5 bg-cyber-yellow rounded-full animate-pulse" />
                                <span className="text-xs text-cyber-yellow font-medium">{status}</span>
                              </>
                            ) : (
                              <>
                                <svg className="w-3 h-3 text-green-400/60 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                </svg>
                                <span className="text-xs text-white/30 line-through">{status}</span>
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

        {/* Composer Bar */}
      <div className="absolute bottom-8 left-0 right-0 z-50 pointer-events-none px-12">
        <div className="pointer-events-auto">
          <div className="sticky bottom-8 max-w-4xl mx-auto px-4 w-full">
            <div className="bg-white/10 backdrop-blur-[24px] border border-white/20 rounded-full p-2 flex items-center gap-2 pr-4 shadow-2xl">
              <button
                onClick={createConversation}
                className="w-12 h-12 rounded-full hover:bg-white/10 transition-colors flex items-center justify-center text-white/40 cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </button>
              <input
                ref={inputRef}
                type="text"
                placeholder={moduleContext ? `Ask about ${moduleContext.title}...` : "Ask Aether anything..."}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={sending}
                className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-4 text-white placeholder-white/40 outline-none disabled:opacity-50"
              />
              <div className="flex items-center gap-2">
                <button className="w-12 h-12 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 flex items-center justify-center text-white cursor-pointer">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
                  </svg>
                </button>
                <button
                  onClick={sendMessage}
                  disabled={!inputValue.trim() || sending}
                  className="w-12 h-12 rounded-full bg-cyber-yellow text-black shadow-[0_0_20px_rgba(253,224,71,0.3)] hover:scale-110 active:scale-90 transition-all flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
          </>
        )}
      </main>

      <SidebarRight />
    </div>
  );
}
