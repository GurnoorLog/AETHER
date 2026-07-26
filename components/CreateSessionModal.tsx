"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { createClient } from "@/lib/supabase/client";

interface CreateSessionModalProps {
  open: boolean;
  onClose: () => void;
  subjects: string[];
}

const SUBJECTS = [
  { name: "Mathematics", icon: "M4.745 3A23.933 23.933 0 003 12c0 3.183.62 6.22 1.745 9M19.5 3c.967 2.78 1.5 5.817 1.5 9s-.533 6.22-1.5 9M8.25 8.885l1.444-.89a.75.75 0 011.105.402l2.402 7.206a.75.75 0 001.104.401l1.445-.889m-8.25.75l.213.09a1.687 1.687 0 002.062-.617l4.45-6.676a1.688 1.688 0 012.062-.618l.213.09" },
  { name: "Physics", icon: "M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" },
  { name: "Biology", icon: "M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" },
  { name: "Chemistry", icon: "M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5" },
  { name: "History", icon: "M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" },
  { name: "Literature", icon: "M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" },
  { name: "Comp. Sci.", icon: "M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" },
];

const ALLOWED_EXTENSIONS = ["pdf", "pptx", "png", "jpg", "jpeg", "webp"];
const EXT_TO_LABEL: Record<string, string> = {
  pdf: "PDF", pptx: "PPTX", png: "PNG", jpg: "JPG", jpeg: "JPG", webp: "WebP",
};
function getExt(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() || "";
}

interface RoadmapModule {
  title: string;
  status: "completed" | "current" | "locked";
  description: string;
}

interface UploadState {
  filename: string;
  status: "uploading" | "done" | "error";
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export default function CreateSessionModal({ open, onClose, subjects: existingSubjects }: CreateSessionModalProps) {
  const { user } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedSubject, setSelectedSubject] = useState<number | null>(null);
  const [customSubject, setCustomSubject] = useState("");
  const [objectives, setObjectives] = useState("");
  const [uploads, setUploads] = useState<UploadState[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [creating, setCreating] = useState(false);

  const [showRoadmap, setShowRoadmap] = useState(false);
  const [roadmapModules, setRoadmapModules] = useState<RoadmapModule[]>([]);
  const [roadmapSubject, setRoadmapSubject] = useState("");
  const [createdSlug, setCreatedSlug] = useState("");

  const getSubject = (): string => {
    if (customSubject.trim()) return customSubject.trim();
    if (selectedSubject !== null) return SUBJECTS[selectedSubject].name;
    return "";
  };

  const processFiles = useCallback(async (files: FileList | File[]) => {
    if (!user) return;
    const supabase = createClient();
    const validFiles = Array.from(files).filter((f) => ALLOWED_EXTENSIONS.includes(getExt(f.name)));
    if (validFiles.length === 0) return;

    const newUploads: UploadState[] = validFiles.map((f) => ({ filename: f.name, status: "uploading" }));
    setUploads((prev) => [...prev, ...newUploads]);

    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      const idx = uploads.length + i;
      const ext = getExt(file.name);
      const label = EXT_TO_LABEL[ext] || ext.toUpperCase();
      const storagePath = `${user.id}/${Date.now()}_${file.name}`;

      try {
        const { error: uploadError } = await supabase.storage
          .from("user_documents")
          .upload(storagePath, file, { upsert: true });
        if (uploadError) throw new Error(uploadError.message);

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
          if (next[idx]) next[idx] = { ...next[idx], status: "done" };
          return next;
        });
      } catch (err) {
        setUploads((prev) => {
          const next = [...prev];
          if (next[idx]) next[idx] = { ...next[idx], status: "error" };
          return next;
        });
      }
    }
  }, [user, uploads.length]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) processFiles(e.dataTransfer.files);
  }, [processFiles]);

  const onFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) processFiles(e.target.files);
    e.target.value = "";
  }, [processFiles]);

  const handleCreate = async () => {
    if (!user) return;
    const subject = getSubject();
    if (!subject) return;

    setCreating(true);
    const supabase = createClient();
    const slug = slugify(subject);

    try {
      // 1. Create session
      const { data: session, error: sessionError } = await supabase
        .from("sessions")
        .insert({
          user_id: user.id,
          title: `${subject} Study Session`,
          slug,
          subject,
          objectives: objectives || null,
        })
        .select("id, slug")
        .single();

      if (sessionError || !session) throw new Error(sessionError?.message || "Failed to create session");

      // 2. Create conversation for this session
      await supabase.from("conversations").insert({
        user_id: user.id,
        session_id: session.id,
        title: `${subject} Study Session`,
      });

      // 3. Create progress tracking
      await supabase.from("progress_tracking").upsert({
        user_id: user.id,
        subject,
        mastery_level: 0,
        session_id: session.id,
      });

      // 4. Generate roadmap via Gemini
      const res = await fetch("/api/session-creation/generate-roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, mode: "Interactive", difficulty: "Intermediate", duration: "60m", objectives }),
      });

      const data = await res.json();
      if (data.modules && data.modules.length > 0) {
        // 5. Save roadmap modules to DB
        const modulesToInsert = data.modules.map((mod: { title: string; description: string }, i: number) => ({
          session_id: session.id,
          user_id: user.id,
          module_index: i,
          title: mod.title,
          description: mod.description,
          status: i === 0 ? "current" : "locked",
        }));

        await supabase.from("session_roadmap_modules").insert(modulesToInsert);

        setRoadmapModules(data.modules.map((mod: { title: string; description: string }, i: number) => ({
          ...mod,
          status: i === 0 ? "current" : "locked",
        })));
        setRoadmapSubject(subject);
        setCreatedSlug(session.slug);
        setShowRoadmap(true);
      } else {
        onClose();
        router.push(`/${session.slug}/chat`);
      }
    } catch (err) {
      console.error("Failed to create session:", err);
      onClose();
      router.push("/hub");
    } finally {
      setCreating(false);
    }
  };

  const handleStartLearning = () => {
    setShowRoadmap(false);
    onClose();
    router.push(`/${createdSlug}/chat`);
  };

  if (!open) return null;

  // Roadmap popup
  if (showRoadmap) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleStartLearning} />
        <div className="relative glass-card rounded-[32px] p-8 max-w-2xl w-full mx-4 z-10 max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-black">{roadmapSubject} Roadmap</h2>
              <p className="text-xs text-white/40 mt-1">{roadmapModules.length} modules generated</p>
            </div>
            <button onClick={handleStartLearning} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="space-y-3 mb-8">
            {roadmapModules.map((mod, i) => (
              <div key={i} className="glass-card rounded-[20px] p-5 flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-sm font-black ${
                  i === 0 ? "bg-cyber-yellow text-black" : "bg-white/5 text-white/40"
                }`}>
                  {i + 1}
                </div>
                <div>
                  <h4 className="font-bold text-sm">{mod.title}</h4>
                  <p className="text-xs text-white/40 mt-1">{mod.description}</p>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleStartLearning}
            className="w-full bg-cyber-yellow text-black py-3 rounded-full text-sm font-black uppercase hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            Start Learning
          </button>
        </div>
      </div>
    );
  }

  // Main create modal
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative glass-card rounded-[32px] p-8 max-w-2xl w-full mx-4 z-10 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black">Create New Session</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Subject Selection */}
        <div className="mb-6">
          <label className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-3">Subject</label>
          <div className="grid grid-cols-4 gap-2 mb-3">
            {SUBJECTS.map((subject, i) => (
              <button
                key={i}
                type="button"
                onClick={() => { setSelectedSubject(i); setCustomSubject(""); }}
                className={`p-3 rounded-[16px] border text-center transition-all cursor-pointer ${
                  selectedSubject === i
                    ? "border-cyber-yellow bg-cyber-yellow/10"
                    : "border-white/10 hover:border-white/20"
                }`}
              >
                <svg className={`w-5 h-5 mx-auto mb-1 ${selectedSubject === i ? "text-cyber-yellow" : "text-white/40"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d={subject.icon} />
                </svg>
                <span className="text-[10px] font-bold">{subject.name}</span>
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="Or type a custom subject..."
            value={customSubject}
            onChange={(e) => { setCustomSubject(e.target.value); if (e.target.value) setSelectedSubject(null); }}
            className="w-full bg-white/5 border border-white/10 rounded-[16px] px-4 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:border-cyber-yellow/50"
          />
        </div>

        {/* Objectives */}
        <div className="mb-6">
          <label className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-2">What do you want to learn?</label>
          <textarea
            placeholder="e.g. I want to understand derivatives and integrals for my exam next week..."
            value={objectives}
            onChange={(e) => setObjectives(e.target.value)}
            rows={3}
            className="w-full bg-white/5 border border-white/10 rounded-[20px] px-4 py-3 text-sm text-white placeholder-white/40 focus:outline-none focus:border-cyber-yellow/50 resize-none"
          />
        </div>

        {/* File Upload */}
        <div className="mb-6">
          <label className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-2">Attach study materials (optional)</label>
          <div
            onDrop={onDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-[20px] p-6 text-center cursor-pointer transition-all ${
              dragOver ? "border-cyber-yellow/40 bg-cyber-yellow/[0.03]" : "border-white/10 hover:border-white/20"
            }`}
          >
            <svg className="w-8 h-8 mx-auto text-white/20 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
            </svg>
            <p className="text-xs text-white/40">Drop PDF, PPTX, or images here</p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.pptx,.png,.jpg,.jpeg,.webp"
              className="hidden"
              onChange={onFileSelect}
            />
          </div>
          {uploads.length > 0 && (
            <div className="mt-3 space-y-1.5">
              {uploads.map((u, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  {u.status === "done" ? (
                    <svg className="w-3.5 h-3.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                  ) : u.status === "error" ? (
                    <svg className="w-3.5 h-3.5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  ) : (
                    <div className="w-3.5 h-3.5 border-2 border-cyber-yellow border-t-transparent rounded-full animate-spin" />
                  )}
                  <span className={u.status === "done" ? "text-green-400" : u.status === "error" ? "text-red-400" : "text-white/60"}>
                    {u.filename}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-full text-sm font-bold text-white/40 hover:text-white transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={creating || !getSubject()}
            className="flex-1 bg-cyber-yellow text-black py-3 rounded-full text-sm font-black uppercase hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {creating ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                Creating...
              </span>
            ) : (
              "Create Session"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
