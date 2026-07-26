"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import type { Document } from "@/types/database";
import SidebarRight from "@/components/SidebarRight";
import SidebarLeft from "@/components/SidebarLeft";

const ALLOWED_EXTENSIONS = ["pdf", "pptx", "png", "jpg", "jpeg", "webp"];

const EXT_TO_LABEL: Record<string, string> = {
  pdf: "PDF",
  pptx: "PPTX",
  png: "PNG",
  jpg: "JPG",
  jpeg: "JPG",
  webp: "WebP",
};

const FILE_ICONS: Record<string, { bg: string; text: string; border: string }> = {
  PDF: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20" },
  PPTX: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20" },
  default: { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/20" },
};

interface UploadState {
  filename: string;
  progress: number;
  status: "pending" | "uploading" | "indexing" | "done" | "error";
  error?: string;
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
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function getExt(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() || "";
}

export default function KnowledgePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploads, setUploads] = useState<UploadState[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/");
  }, [user, authLoading, router]);

  const fetchDocuments = useCallback(async () => {
    if (!user) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("documents")
      .select("*")
      .eq("user_id", user.id)
      .order("uploaded_at", { ascending: false });
    if (data) setDocuments(data as Document[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) fetchDocuments();
  }, [user, fetchDocuments]);

  const processFiles = useCallback(async (files: FileList | File[]) => {
    if (!user) return;
    const supabase = createClient();

    const validFiles = Array.from(files).filter((f) => {
      const ext = getExt(f.name);
      return ALLOWED_EXTENSIONS.includes(ext);
    });

    if (validFiles.length === 0) return;

    const newUploads: UploadState[] = validFiles.map((f) => ({
      filename: f.name,
      progress: 0,
      status: "pending" as const,
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
        if (next[uploadIdx]) next[uploadIdx] = { ...next[uploadIdx], status: "uploading" };
        return next;
      });

      try {
        const { error: uploadError } = await supabase.storage
          .from("user_documents")
          .upload(storagePath, file, { upsert: true });

        if (uploadError) throw new Error(uploadError.message);

        setUploads((prev) => {
          const next = [...prev];
          if (next[uploadIdx]) next[uploadIdx] = { ...next[uploadIdx], progress: 100, status: "indexing" };
          return next;
        });

        const { data: doc, error: insertError } = await supabase
          .from("documents")
          .insert({
            user_id: user.id,
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
          fetch("/api/rag/ingest", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ document_id: doc.id, user_id: user.id }),
          }).catch(console.error);
        }

        setUploads((prev) => {
          const next = [...prev];
          if (next[uploadIdx]) next[uploadIdx] = { ...next[uploadIdx], status: "done" };
          return next;
        });
      } catch (err) {
        console.error("Upload error:", err);
        setUploads((prev) => {
          const next = [...prev];
          if (next[uploadIdx]) next[uploadIdx] = { ...next[uploadIdx], status: "error", error: (err as Error).message };
          return next;
        });
      }
    }

    fetchDocuments();
  }, [user, uploads.length, fetchDocuments]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) processFiles(e.dataTransfer.files);
  }, [processFiles]);

  const onFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) processFiles(e.target.files);
    e.target.value = "";
  }, [processFiles]);

  const PROCESSING_STATUSES = ["UPLOADING", "EXTRACTING", "CHUNKING", "EMBEDDING"];

  const stats = {
    indexing: documents.filter((d) => PROCESSING_STATUSES.includes(d.status || "")).length + uploads.filter((u) => u.status === "uploading" || u.status === "pending" || u.status === "indexing").length,
    ready: documents.filter((d) => d.status === "READY" || !d.status).length,
    failed: documents.filter((d) => d.status === "FAILED").length,
    total: documents.length,
  };

  const filteredDocs = filter === "all"
    ? documents
    : filter === "pdf"
      ? documents.filter((d) => d.file_type === "PDF")
      : filter === "notes"
        ? documents.filter((d) => d.file_type === "MD" || d.file_type === "TXT")
        : filter === "slides"
          ? documents.filter((d) => d.file_type === "PPTX")
          : documents;

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-deep-onyx flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-cyber-yellow border-t-transparent rounded-full animate-spin" />
          <span className="text-white/40 text-sm font-bold uppercase tracking-widest">Loading...</span>
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
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.pptx,.png,.jpg,.jpeg,.webp"
                className="hidden"
                onChange={onFileSelect}
              />
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

          {uploads.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-cyber-yellow/60 pl-2">Processing</h4>
              {uploads.map((u, i) => (
                <div key={i} className="glass-card rounded-[28px] p-5 flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400 border border-blue-500/20">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                        <path d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold">{u.filename}</h4>
                      <p className="text-[10px] text-white/40 uppercase tracking-widest mt-1">{u.status === "done" ? "Uploaded & indexing" : u.status}</p>
                    </div>
                  </div>
                  <div className="w-48 text-right">
                    {(u.status === "uploading" || u.status === "indexing") && (
                      <div className="flex items-center gap-2 justify-end">
                        <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                        <span className="text-[10px] font-bold uppercase text-blue-400">{u.status === "uploading" ? "Uploading" : "Indexing"}</span>
                      </div>
                    )}
                    {u.status === "pending" && (
                      <span className="text-[10px] font-bold uppercase text-white/40">Queued</span>
                    )}
                    {u.status === "done" && (
                      <span className="text-[10px] font-bold uppercase text-green-400">Done</span>
                    )}
                    {u.status === "error" && (
                      <span className="text-[10px] font-bold uppercase text-red-400">{u.error || "Failed"}</span>
                    )}
                  </div>
                </div>
              ))}
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
                    filter === f.key
                      ? "bg-cyber-yellow text-black"
                      : "bg-white/5 text-white/60 hover:bg-white/10"
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
                  <div key={doc.id} className="glass-card rounded-[28px] p-5 flex items-center justify-between group transition-all hover:border-cyber-yellow/20">
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
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <SidebarRight />
    </div>
  );
}
