"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import SidebarRight from "@/components/SidebarRight";
import SidebarLeft from "@/components/SidebarLeft";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: { document: string; page: number; similarity: number }[];
  created_at: string;
}

interface Conversation {
  id: string;
  title: string;
  created_at: string;
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

export default function ChatPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/");
  }, [user, authLoading, router]);

  const fetchConversations = useCallback(async () => {
    if (!user) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("conversations")
      .select("id, title, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (data) setConversations(data as Conversation[]);
    setLoading(false);
  }, [user]);

  const fetchMessages = useCallback(async (convId: string) => {
    const supabase = createClient();
    const { data } = await supabase
      .from("chat_messages")
      .select("id, role, content, sources, created_at")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true });
    if (data) setMessages(data as ChatMessage[]);
  }, []);

  useEffect(() => {
    if (user) fetchConversations();
  }, [user, fetchConversations]);

  useEffect(() => {
    if (activeConversation) fetchMessages(activeConversation);
  }, [activeConversation, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const createConversation = useCallback(async () => {
    if (!user) return;
    const supabase = createClient();
    const { data, error } = await supabase
      .from("conversations")
      .insert({ user_id: user.id, title: "New Chat" })
      .select("id, title, created_at")
      .single();
    if (data && !error) {
      setConversations((prev) => [data as Conversation, ...prev]);
      setActiveConversation(data.id);
      setMessages([]);
    }
  }, [user]);

  const sendMessage = useCallback(async () => {
    if (!inputValue.trim() || sending || !activeConversation) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: inputValue.trim(),
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setSending(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg.content,
          conversation_id: activeConversation,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Chat failed");

      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.content,
        sources: data.chunks_used > 0 ? undefined : undefined,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
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
      inputRef.current?.focus();
    }
  }, [inputValue, sending, activeConversation]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (authLoading || !user) {
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
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-black flex items-center justify-center border-2 border-cyber-yellow">
                  <svg className="w-8 h-8 text-cyber-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-deep-onyx" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Aether Core</h3>
                <div className="flex items-center gap-3 text-xs text-white/50">
                  <span className="flex items-center gap-1 text-green-400">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                    Online
                  </span>
                  <span>•</span>
                  <span>RAG-powered</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={createConversation}
                className="bg-cyber-yellow text-black text-xs font-bold px-5 py-2.5 rounded-full hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                + New Chat
              </button>
            </div>
          </div>
        </header>

        {/* Conversation list or Chat */}
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
                    Ask Aether anything. It retrieves context from your uploaded documents to give grounded, sourced answers.
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
                    <button
                      key={conv.id}
                      onClick={() => setActiveConversation(conv.id)}
                      className="w-full text-left glass-card rounded-[28px] p-5 hover:border-cyber-yellow/20 transition-all cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
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
                        </div>
                        <svg className="w-4 h-4 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-8 pb-32">
              <div className="max-w-4xl mx-auto space-y-8 py-6">
                {messages.length === 0 && (
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
                  <div className="flex items-center gap-3 opacity-60">
                    <div className="w-10 h-10 rounded-full bg-cyber-yellow/20 flex items-center justify-center shrink-0">
                      <svg className="text-cyber-yellow w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                      </svg>
                    </div>
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-white rounded-full typing-dot" style={{ animationDelay: "0s" }} />
                      <div className="w-2 h-2 bg-white rounded-full typing-dot" style={{ animationDelay: "0.2s" }} />
                      <div className="w-2 h-2 bg-white rounded-full typing-dot" style={{ animationDelay: "0.4s" }} />
                    </div>
                    <span className="text-xs font-bold text-white/40 italic">Aether is thinking</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Composer */}
            <div className="absolute bottom-0 left-0 right-0 p-8 pt-0 bg-gradient-to-t from-deep-onyx via-deep-onyx/90 to-transparent">
              <div className="sticky bottom-8 max-w-4xl mx-auto px-4 w-full">
                <div className="glass-card-premium rounded-full p-2 flex items-center gap-2 pr-4 shadow-2xl">
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Ask Aether anything..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={sending}
                    className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-4 text-white placeholder-white/40 outline-none disabled:opacity-50"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!inputValue.trim() || sending}
                    className="w-12 h-12 rounded-full bg-cyber-yellow text-black shadow-[0_0_20px_rgba(253,224,71,0.3)] hover:scale-110 active:scale-90 transition-all flex items-center justify-center cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                    </svg>
                  </button>
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
