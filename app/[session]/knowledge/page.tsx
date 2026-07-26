"use client";

import { useEffect, useState, useRef, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { useSession } from "../layout";
import SidebarRight from "@/components/SidebarRight";
import SidebarLeft from "@/components/SidebarLeft";
import type { Document } from "@/types/database";

const ALLOWED_EXTENSIONS = ["pdf", "pptx", "png", "jpg", "jpeg", "webp"];
const EXT_TO_LABEL: Record<string, string> = {
  pdf: "PDF", pptx: "PPTX", png: "PNG", jpg: "JPG", jpeg: "JPG", webp: "WebP",
};
const FILE_ICONS: Record<string, { bg: string; text: string; border: string }> = {
  PDF: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20" },
  PPTX: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20" },
  default: { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/20" },
};

interface UploadState {
  filename: string;
  progress: number;
  status: "pending" | "uploading" | "extracting" | "chunking" | "embedding" | "done" | "error" | "cancelled";
  error?: string;
  storagePath?: string;
  docId?: string;
  abortController?: AbortController;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function getExt(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() || "";
}

export default function SessionKnowledgePage({ params }: { params: Promise<{ session: string }> }) {
  const resolvedParams = use(params);
  const slug = resolvedParams.session;
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { session } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploads, setUploads] = useState<UploadState[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [viewingDoc, setViewingDoc] = useState<Document | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/");
  }, [user, authLoading, router]);

  const fetchDocuments = useCallback(async () => {
    if (!user || !session) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("documents")
      .select("*")
      .eq("user_id", user.id)
      .eq("session_id", session.id)
      .order("uploaded_at", { ascending: false });
    if (data) setDocuments(data as Document[]);
    setLoading(false);
  }, [user, session]);

  useEffect(() => {
    if (user) fetchDocuments();
  }, [user, fetchDocuments]);

  useEffect(() => {
    const hasTerminal = uploads.some((u) => u.status === "done" || u.status === "error" || u.status === "cancelled");
    if (!hasTerminal) return;
    const timer = setTimeout(() => {
      setUploads((prev) => prev.filter((u) => u.status !== "done" && u.status !== "error" && u.status !== "cancelled"));
    }, 3000);
    return () => clearTimeout(timer);
  }, [uploads]);

  const processFiles = useCallback(async (files: FileList | File[]) => {
    if (!user || !session) return;
    const supabase = createClient();
    const validFiles = Array.from(files).filter((f) => ALLOWED_EXTENSIONS.includes(getExt(f.name)));
    if (validFiles.length === 0) return;

    const newUploads: UploadState[] = validFiles.map((f) => ({
      filename: f.name,
      progress: 0,
      status: "pending" as const,
      abortController: new AbortController(),
    }));
    setUploads((prev) => [...prev, ...newUploads]);

    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      const uploadIdx = uploads.length + i;
      const ext = getExt(file.name);
      const label = EXT_TO_LABEL[ext] || ext.toUpperCase();
      const storagePath = `${user.id}/${Date.now()}_${file.name}`;

      setUploads((prev) => {
        const next = [...prev];
        if (next[uploadIdx]) next[uploadIdx] = { ...next[uploadIdx], status: "uploading", storagePath };
        return next;
      });

      try {
        const { error: uploadError } = await supabase.storage
          .from("user_documents")
          .upload(storagePath, file, { upsert: true });
        if (uploadError) throw new Error(uploadError.message);

        setUploads((prev) => {
          const next = [...prev];
          if (next[uploadIdx]) next[uploadIdx] = { ...next[uploadIdx], progress: 100, status: "extracting" };
          return next;
        });

        const { data: doc, error: insertError } = await supabase
          .from("documents")
          .insert({
            user_id: user.id,
            session_id: session.id,
            filename: file.name,
            file_type: label,
            file_size: file.size,
            storage_path: storagePath,
            status: "UPLOADING",
          })
          .select("id")
          .single();
        if (insertError) throw new Error(insertError.message);

        if (doc) {
          const updateStatus = (status: UploadState["status"], extra?: Partial<UploadState>) => {
            setUploads((prev) => {
              const next = [...prev];
              if (next[uploadIdx] && next[uploadIdx].status !== "cancelled") next[uploadIdx] = { ...next[uploadIdx], status, ...extra };
              return next;
            });
          };

          updateStatus("chunking", { docId: doc.id });
          try {
            const ingestRes = await fetch("/api/rag/ingest", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ document_id: doc.id, user_id: user.id, session_id: session.id }),
            });
            if (!ingestRes.ok) {
              updateStatus("error", { error: `Ingest failed (${ingestRes.status})` });
            } else {
              updateStatus("embedding");
              await ingestRes.json().catch(() => ({}));
              updateStatus("done");
            }
          } catch {
            updateStatus("error", { error: "Ingest request failed" });
          }
        }
      } catch (err) {
        setUploads((prev) => {
          const next = [...prev];
          if (next[uploadIdx]) next[uploadIdx] = { ...next[uploadIdx], status: "error", error: (err as Error).message };
          return next;
        });
      }
    }
    fetchDocuments();
  }, [user, session, uploads.length, fetchDocuments]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) processFiles(e.dataTransfer.files);
  }, [processFiles]);

  const onFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) processFiles(e.target.files);
    e.target.value = "";
  }, [processFiles]);

  const cancelUpload = useCallback((idx: number) => {
    setUploads((prev) => {
      const next = [...prev];
      if (next[idx]) {
        if (next[idx].abortController) next[idx].abortController!.abort();
        next[idx] = { ...next[idx], status: "cancelled" };
      }
      return next;
    });
  }, []);

  const deleteDocument = useCallback(async (doc: Document) => {
    if (!user) return;
    const supabase = createClient();
    try {
      await supabase.storage.from("user_documents").remove([doc.storage_path]);
      await supabase.from("document_chunks").delete().eq("document_id", doc.id);
      await supabase.from("documents").delete().eq("id", doc.id);
      fetchDocuments();
    } catch (err) {
      console.error("Delete error:", err);
    }
  }, [user, fetchDocuments]);

  const PROCESSING_STATUSES = ["UPLOADING", "EXTRACTING", "CHUNKING", "EMBEDDING"];
  const stats = {
    indexing: documents.filter((d) => PROCESSING_STATUSES.includes(d.status || "")).length + uploads.filter((u) => ["uploading", "pending", "extracting", "chunking", "embedding"].includes(u.status)).length,
    ready: documents.filter((d) => d.status === "READY" || !d.status).length,
    failed: documents.filter((d) => d.status === "FAILED").length + uploads.filter((u) => u.status === "error").length,
    total: documents.length,
  };

  const filteredDocs = filter === "all" ? documents
    : filter === "pdf" ? documents.filter((d) => d.file_type === "PDF")
    : filter === "slides" ? documents.filter((d) => d.file_type === "PPTX")
    : documents;

  function getFileUrl(doc: Document): string {
    const supabase = createClient();
    const { data } = supabase.storage.from("user_documents").getPublicUrl(doc.storage_path);
    return data.publicUrl;
  }

  function isImage(type: string): boolean {
    return ["PNG", "JPG", "WEBP"].includes(type);
  }

  function isPdf(type: string): boolean {
    return type === "PDF";
  }

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
      <SidebarLeft currentPage="knowledge" />

      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Hero Section */}
        <div className="h-[40vh] bg-cyber-yellow text-black p-12 liquid-wave relative overflow-hidden flex flex-col justify-end">
          <div className="absolute top-10 right-10 flex gap-4">
            <div className="bg-black text-white px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">STUDENT BRAIN</div>
            <div className="bg-black/10 border border-black/10 backdrop-blur-md px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">{stats.total} Files</div>
          </div>
          <div className="max-w-3xl mb-12">
            <p className="text-sm font-bold uppercase tracking-[0.3em] mb-4 opacity-70">Vault of Intelligence</p>
            <h1 className="text-7xl font-bold tracking-tighter leading-tight mb-4">Knowledge Base</h1>
            <p className="text-xl font-medium opacity-80">Your private library. Aether indexes every word to build your unique learning model.</p>
          </div>
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-black/5 rounded-full -mb-40 -mr-20" />
        </div>

        {/* Content */}
        <div className="flex-1 px-12 pb-24 overflow-y-auto space-y-10 relative z-10">
          <div className="grid grid-cols-3 gap-6">
            <div
              onDrop={onDrop}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onClick={() => fileInputRef.current?.click()}
              className={`col-span-2 glass-card rounded-[32px] p-8 border-2 border-dashed flex flex-col items-center justify-center text-center group cursor-pointer transition-all ${
                dragOver ? "border-cyber-yellow/40 bg-cyber-yellow/[0.03]" : "border-white/10 hover:border-cyber-yellow/30"
              }`}
            >
              <div className="w-16 h-16 bg-cyber-yellow rounded-full flex items-center justify-center text-black mb-4 shadow-[0_0_30px_rgba(253,224,71,0.2)] group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold">Drop files here to index</h3>
              <p className="text-sm text-white/40 mt-1">PDF, PPTX, PNG, JPG, WebP</p>
              <input ref={fileInputRef} type="file" multiple accept=".pdf,.pptx,.png,.jpg,.jpeg,.webp" className="hidden" onChange={onFileSelect} />
              <button type="button" className="mt-6 bg-white/5 border border-white/10 px-8 py-3 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-all">
                Browse Files
              </button>
            </div>

            <div className="glass-card rounded-[32px] p-8 flex flex-col justify-between">
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-widest text-cyber-yellow mb-4">Indexing Stats</h4>
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-xs text-white/60">Indexing</span>
                  <span className="text-sm font-bold">{stats.indexing}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-xs text-white/60">Ready</span>
                  <span className="text-sm font-bold text-green-400">{stats.ready}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-xs text-white/60">Failed</span>
                  <span className="text-sm font-bold text-red-400">{stats.failed}</span>
                </div>
              </div>
            </div>
          </div>

          {uploads.filter((u) => u.status !== "done" && u.status !== "cancelled").length > 0 && (
            <div className="space-y-3">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-cyber-yellow/60 pl-2">Processing</h4>
              {uploads.map((u, i) => {
                if (u.status === "done" || u.status === "cancelled") return null;
                const statusLabel: Record<string, string> = {
                  pending: "Queued", uploading: "Uploading to storage", extracting: "Extracting text content", chunking: "Splitting into chunks", embedding: "Generating embeddings", error: "Failed",
                };
                const statusColor: Record<string, string> = {
                  pending: "text-white/40", uploading: "text-blue-400", extracting: "text-amber-400", chunking: "text-purple-400", embedding: "text-cyan-400", error: "text-red-400",
                };
                return (
                  <div key={i} className="glass-card rounded-[28px] p-5 flex items-center justify-between">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400 border border-blue-500/20">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                          <path d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold">{u.filename}</h4>
                        <p className={`text-[10px] uppercase tracking-widest mt-1 ${statusColor[u.status] || "text-white/40"}`}>{statusLabel[u.status] || u.status}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {["uploading", "extracting", "chunking", "embedding"].includes(u.status) && (
                        <>
                          <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                          <button onClick={() => cancelUpload(i)} className="text-[10px] font-bold uppercase text-red-400 hover:text-red-300 cursor-pointer transition-colors">Cancel</button>
                        </>
                      )}
                      {u.status === "pending" && (
                        <button onClick={() => cancelUpload(i)} className="text-[10px] font-bold uppercase text-white/40 hover:text-red-400 cursor-pointer transition-colors">Cancel</button>
                      )}
                      {u.status === "error" && (
                        <span className="text-[10px] font-bold uppercase text-red-400">{u.error || "Failed"}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="flex gap-2">
              {[
                { key: "all", label: "All" },
                { key: "pdf", label: "PDFs" },
                { key: "slides", label: "Slides" },
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`px-6 py-2 rounded-full text-[10px] font-bold uppercase transition-all cursor-pointer ${
                    filter === f.key ? "bg-cyber-yellow text-black" : "bg-white/5 text-white/60 hover:bg-white/10"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="glass-card rounded-[28px] p-5 flex items-center justify-between animate-pulse">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-white/5 rounded-2xl" />
                    <div className="space-y-2">
                      <div className="w-48 h-4 bg-white/5 rounded" />
                      <div className="w-32 h-3 bg-white/5 rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="text-center py-16">
              <svg className="w-16 h-16 mx-auto text-white/10 mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
                <path d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              <p className="text-white/30 text-sm font-medium">No documents yet. Drop your files above.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredDocs.map((doc) => {
                const icon = FILE_ICONS[doc.file_type] || FILE_ICONS.default;
                return (
                  <div key={doc.id} onClick={() => setViewingDoc(doc)} className="glass-card rounded-[28px] p-5 flex items-center justify-between group transition-all hover:border-cyber-yellow/20 cursor-pointer">
                    <div className="flex items-center gap-5">
                      <div className={`w-14 h-14 ${icon.bg} rounded-2xl flex items-center justify-center ${icon.text} border ${icon.border}`}>
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                          <path d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold">{doc.filename}</h4>
                        <p className="text-[10px] text-white/40 uppercase tracking-widest mt-1">
                          {formatSize(doc.file_size)} &bull; {timeAgo(doc.uploaded_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {PROCESSING_STATUSES.includes(doc.status || "") ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                          <span className="text-[10px] font-bold uppercase text-blue-400">{doc.status?.toLowerCase()}</span>
                        </div>
                      ) : doc.status === "FAILED" ? (
                        <span className="text-[10px] font-bold uppercase text-red-400">Failed</span>
                      ) : (
                        <span className="bg-green-500/10 text-green-400 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase border border-green-500/20">Ready</span>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteDocument(doc); }}
                        className="opacity-0 group-hover:opacity-100 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-red-500/20 hover:text-red-400 transition-all cursor-pointer"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                          <path d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <SidebarRight />

      {/* File Viewer Modal */}
      {viewingDoc && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setViewingDoc(null)} />
          <div className="relative glass-card rounded-[32px] max-w-4xl w-full mx-4 z-10 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 ${(FILE_ICONS[viewingDoc.file_type] || FILE_ICONS.default).bg} rounded-xl flex items-center justify-center ${(FILE_ICONS[viewingDoc.file_type] || FILE_ICONS.default).text} border ${(FILE_ICONS[viewingDoc.file_type] || FILE_ICONS.default).border}`}>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-bold">{viewingDoc.filename}</h3>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest">{formatSize(viewingDoc.file_size)} &bull; {viewingDoc.file_type}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <a href={getFileUrl(viewingDoc)} target="_blank" rel="noopener noreferrer" className="bg-white/5 border border-white/10 text-white px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all">Open in Tab</a>
                <button onClick={() => setViewingDoc(null)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-2 min-h-[400px]">
              {isImage(viewingDoc.file_type) ? (
                <img src={getFileUrl(viewingDoc)} alt={viewingDoc.filename} className="w-full h-full object-contain rounded-2xl" />
              ) : isPdf(viewingDoc.file_type) ? (
                <iframe src={getFileUrl(viewingDoc)} className="w-full h-[70vh] rounded-2xl border-0" title={viewingDoc.filename} />
              ) : (
                <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                  <svg className="w-16 h-16 text-white/10 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
                    <path d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                  <p className="text-white/30 text-sm mb-2">Preview not available for {viewingDoc.file_type}</p>
                  <a href={getFileUrl(viewingDoc)} target="_blank" rel="noopener noreferrer" className="bg-cyber-yellow text-black px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest hover:scale-105 transition-all">Download to View</a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
