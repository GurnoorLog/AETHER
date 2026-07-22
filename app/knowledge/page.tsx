"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import type { Document } from "@/types/database";
import SidebarRight from "@/components/SidebarRight";
import SidebarLeft from "@/components/SidebarLeft";

const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "image/png",
  "image/jpeg",
  "image/webp",
];

const TYPE_LABELS: Record<string, string> = {
  "application/pdf": "PDF",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "PPTX",
  "image/png": "PNG",
  "image/jpeg": "JPG",
  "image/webp": "WebP",
};

const FILE_ICONS: Record<string, { icon: string; bg: string; text: string; border: string }> = {
  PDF: { icon: "file-text", bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20" },
  PPTX: { icon: "presentation", bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20" },
  default: { icon: "file", bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/20" },
};

interface UploadState {
  filename: string;
  progress: number;
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
  file: File;
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

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

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
    if (!authLoading && !user) {
      router.replace("/");
    }
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

  const getToken = useCallback(async () => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token;
  }, []);

  const uploadFile = useCallback(async (file: File, token: string, onProgress: (p: number) => void) => {
    const ext = file.name.split(".").pop() || "file";
    const path = `${user!.id}/${Date.now()}_${ext}`;

    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          onProgress(100);
          resolve();
        } else {
          reject(new Error(`Upload failed (${xhr.status})`));
        }
      };
      xhr.onerror = () => reject(new Error("Network error"));
      xhr.open("PUT", `${SUPABASE_URL}/storage/v1/object/user_documents/${path}`);
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      xhr.setRequestHeader("x-upsert", "true");
      xhr.send(file);
    });

    return path;
  }, [user]);

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const token = await getToken();
    if (!token || !user) return;

    const validFiles = Array.from(files).filter((f) => ALLOWED_TYPES.includes(f.type));
    if (validFiles.length === 0) return;

    const newUploads: UploadState[] = validFiles.map((f) => ({
      filename: f.name,
      progress: 0,
      status: "pending" as const,
      file: f,
    }));

    setUploads((prev) => [...prev, ...newUploads]);

    const supabase = createClient();

    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      const idx = uploads.length + i;

      setUploads((prev) => {
        const next = [...prev];
        next[idx] = { ...next[idx], status: "uploading" };
        return next;
      });

      try {
        const storagePath = await uploadFile(file, token, (progress) => {
          setUploads((prev) => {
            const next = [...prev];
            next[idx] = { ...next[idx], progress };
            return next;
          });
        });

        const { error: insertError } = await supabase.from("documents").insert({
          user_id: user.id,
          filename: file.name,
          file_type: TYPE_LABELS[file.type] || file.type,
          file_size: file.size,
          storage_path: storagePath,
          status: "INDEXING",
        });

        if (insertError) throw new Error(insertError.message);

        setUploads((prev) => {
          const next = [...prev];
          next[idx] = { ...next[idx], status: "done", progress: 100 };
          return next;
        });
      } catch (err) {
        setUploads((prev) => {
          const next = [...prev];
          next[idx] = { ...next[idx], status: "error", error: (err as Error).message };
          return next;
        });
      }
    }

    fetchDocuments();
  }, [user, uploads.length, getToken, uploadFile, fetchDocuments]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const onDragLeave = useCallback(() => setDragOver(false), []);

  const onFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) handleFiles(e.target.files);
    e.target.value = "";
  }, [handleFiles]);

  const stats = {
    indexing: documents.filter((d) => d.status === "INDEXING").length + uploads.filter((u) => u.status === "uploading" || u.status === "pending").length,
    embedding: documents.filter((d) => d.status === "READY" || !d.status).length,
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
    <div className="min-h-screen bg-deep-onyx text-white flex overflow-hidden">

      <SidebarLeft currentPage="knowledge" />

      {/* Center */}
      <main className="flex-1 flex flex-col relative z-0 min-w-0">
        <div className="h-[40vh] bg-cyber-yellow text-black p-12 liquid-wave relative overflow-hidden flex flex-col justify-end">
          <div className="absolute top-10 right-10 flex gap-4">
            <div className="bg-black text-white px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">STUDENT BRAIN</div>
            <div className="bg-black/10 border border-black/10 backdrop-blur-md px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">{stats.total} Files</div>
          </div>
          <div className="max-w-3xl mb-8">
            <p className="text-sm font-bold uppercase tracking-[0.3em] mb-4 opacity-70">Vault of Intelligence</p>
            <h1 className="text-7xl font-bold tracking-tighter leading-tight mb-4">Knowledge Base</h1>
            <p className="text-xl font-medium opacity-80">Your private library. Aether indexes every word to build your unique learning model.</p>
          </div>
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-black/5 rounded-full -mb-48 -mr-24" />
        </div>

        <div className="flex-1 -mt-16 px-12 pb-24 overflow-y-auto space-y-10">
          <div className="grid grid-cols-3 gap-6">
            <div
              onDrop={onDrop}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
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
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-widest text-cyber-yellow mb-4">Indexing Stats</h4>
                  <div className="flex justify-between items-center py-2 border-b border-white/5">
                    <span className="text-xs text-white/60">In Queue / Indexing</span>
                    <span className="text-sm font-bold">{stats.indexing}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-white/5">
                    <span className="text-xs text-white/60">Ready</span>
                    <span className="text-sm font-bold text-green-400">{stats.embedding}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-xs text-white/60">Failed</span>
                    <span className="text-sm font-bold text-red-400">{stats.failed}</span>
                  </div>
                </div>
                <div className="pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-4 h-4 text-cyber-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                    <span className="text-[10px] font-bold uppercase tracking-tight">System Load: Normal</span>
                  </div>
                  <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="w-[35%] h-full bg-cyber-yellow rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {uploads.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-cyber-yellow/60 pl-2">Uploading</h4>
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
                      <p className="text-[10px] text-white/40 uppercase tracking-widest mt-1">{formatSize(u.file.size)}</p>
                    </div>
                  </div>
                  <div className="w-48 text-right">
                    {u.status === "uploading" && (
                      <>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold uppercase text-blue-400">Uploading</span>
                          <span className="text-[10px] font-bold">{u.progress}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-400 rounded-full shimmer transition-all duration-300" style={{ width: `${u.progress}%` }} />
                        </div>
                      </>
                    )}
                    {u.status === "pending" && (
                      <span className="text-[10px] font-bold uppercase text-white/40">Queued</span>
                    )}
                    {u.status === "done" && (
                      <span className="text-[10px] font-bold uppercase text-green-400">Uploaded</span>
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
                { key: "notes", label: "Notes" },
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
            <div className="relative w-full max-w-sm">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input type="text" placeholder="Search your vault..."
                className="w-full bg-white/5 border border-white/10 rounded-full py-3 pl-12 pr-6 text-sm focus:outline-none focus:border-cyber-yellow/50" />
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
                  <div className="w-24 h-6 bg-white/5 rounded-full" />
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
                  <div key={doc.id} className={`glass-card rounded-[28px] p-5 flex items-center justify-between group transition-all ${
                    doc.status === "FAILED" ? "hover:border-red-500/20" : "hover:border-cyber-yellow/20"
                  }`}>
                    <div className="flex items-center gap-5">
                      <div className={`w-14 h-14 ${icon.bg} rounded-2xl flex items-center justify-center ${icon.text} border ${icon.border}`}>
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                          {doc.file_type === "PDF" && <path d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />}
                          {doc.file_type === "PPTX" && <path d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605" />}
                          {!["PDF", "PPTX"].includes(doc.file_type) && <path d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />}
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold">{doc.filename}</h4>
                        <p className="text-[10px] text-white/40 uppercase tracking-widest mt-1">{formatSize(doc.file_size)} • Uploaded {timeAgo(doc.uploaded_at)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-10">
                      {doc.status === "INDEXING" ? (
                        <div className="text-right">
                          <span className="text-[10px] font-bold uppercase text-blue-400">Indexing</span>
                          <div className="w-full h-1 bg-white/5 rounded-full mt-1 overflow-hidden">
                            <div className="w-[60%] h-full bg-blue-400 rounded-full shimmer" />
                          </div>
                        </div>
                      ) : doc.status === "FAILED" ? (
                        <span className="text-[10px] font-bold uppercase text-red-400">Failed</span>
                      ) : (
                        <span className="bg-green-500/10 text-green-400 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase border border-green-500/20">Ready</span>
                      )}
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button type="button" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all cursor-pointer">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                            <path d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                            <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </button>
                        <button type="button" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-red-500/20 hover:text-red-500 transition-all cursor-pointer">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                            <path d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </button>
                      </div>
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
