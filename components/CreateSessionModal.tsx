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
  { name: "Mathematics", icon: "M6 3h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM8 7h8M8 11h2M14 11h2M8 15h2M14 15h2" },
  { name: "Physics", icon: "M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09zM12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" },
  { name: "Biology", icon: "M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 0 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 1-6 2.292m0-14.25v14.25" },
  { name: "Chemistry", icon: "M9.75 3h4.5M10 3v6.75l-5.2 9.46a2 2 0 0 0 1.75 3h11.4a2 2 0 0 0 1.75-3L14 9.75V3M7.5 14h9" },
  { name: "History", icon: "M12 7v5l3 3M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" },
  { name: "Literature", icon: "M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 0 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 1-6 2.292m0-14.25v14.25" },
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
  const [createError, setCreateError] = useState("");

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
    setCreateError("");
    const supabase = createClient();
    const slug = `${slugify(subject)}-${Date.now()}`;

    try {
      // Enforce plan limit before hitting RLS (friendly error instead of cryptic one)
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("subscription_tier")
        .eq("user_id", user.id)
        .maybeSingle();
      const tier = profile?.subscription_tier ?? "free";
      if (tier === "free") {
        const { count } = await supabase
          .from("sessions")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id);
        if ((count ?? 0) >= 1) {
          setCreateError("Free plan includes 1 active session. Upgrade to Pro for up to 10.");
          setCreating(false);
          return;
        }
      }

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

      // 2. Create progress tracking
      try {
        await supabase.from("progress_tracking").upsert({
          user_id: user.id,
          subject,
          mastery_level: 0,
          session_id: session.id,
        });
      } catch {} // ponytail: 409 = row already exists, no action needed

      // 3. Generate roadmap via Gemini
      const res = await fetch("/api/session-creation/generate-roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, mode: "Interactive", difficulty: "Intermediate", duration: "60m", objectives }),
      });

      const data = await res.json();
      if (data.modules && data.modules.length > 0) {
        // 4. Update session title with AI-generated name
        if (data.title) {
          await supabase.from("sessions").update({ title: data.title }).eq("id", session.id);
        }

        // 5. Save roadmap modules to DB with lesson structure
        const modulesToInsert = data.modules.map((mod: {
          title: string;
          description: string;
          lessons?: { title: string; description: string; duration_minutes: number; key_topics: string[] }[];
          learning_objectives?: string;
          key_concepts?: string;
        }, i: number) => ({
          session_id: session.id,
          user_id: user.id,
          module_index: i,
          title: mod.title,
          description: mod.description,
          status: i === 0 ? "current" : "locked",
          lessons: JSON.stringify(mod.lessons || []),
          learning_objectives: mod.learning_objectives || null,
          key_concepts: mod.key_concepts || null,
        }));

        await supabase.from("session_roadmap_modules").insert(modulesToInsert);

        setRoadmapModules(data.modules.map((mod: {
          title: string;
          description: string;
          lessons?: { title: string; description: string; duration_minutes: number; key_topics: string[] }[];
          learning_objectives?: string;
          key_concepts?: string;
        }, i: number) => ({
          ...mod,
          status: i === 0 ? "current" : "locked",
        })));
        setRoadmapSubject(subject);
        setCreatedSlug(session.slug);
        setShowRoadmap(true);
      } else {
        onClose();
        router.push(`/${session.slug}/dashboard`);
      }
    } catch (err) {
      console.error("Failed to create session:", err);
      setCreateError("Could not create session. Please try again.");
      setCreating(false);
    } finally {
      setCreating(false);
    }
  };

  const handleStartLearning = () => {
    setShowRoadmap(false);
    onClose();
    router.push(`/${createdSlug}/dashboard`);
  };

  if (!open) return null;

  // Roadmap popup
  if (showRoadmap) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleStartLearning} />

        <div className="relative w-full max-w-[420px] mx-4 rounded-[32px] overflow-hidden bg-[#FDFBF7] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.35)] z-10">
          {/* Sakura leaf decoration (top-right) */}
          <img
            src="/design/sakura_leaves.png"
            alt=""
            className="absolute top-0 right-0 w-40 h-40 object-contain opacity-50 pointer-events-none select-none"
          />

          <div className="relative z-10 p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[22px] font-bold text-[#333]">Roadmap Ready</h2>
              <button
                onClick={handleStartLearning}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/5 transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5 text-[#999]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-[#E8F0E5] flex items-center justify-center shrink-0">
                <svg className="w-[22px] h-[22px] text-[#6B8E61]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z" />
                </svg>
              </div>
              <div>
                <h3 className="text-[17px] font-bold text-[#333]">{roadmapSubject} Study Session</h3>
                <p className="text-[14px] text-[#999]">Your personalized learning path is ready.</p>
              </div>
            </div>

            <button
              onClick={handleStartLearning}
              className="w-full flex items-center justify-center gap-2 bg-[#6B8E61] text-white py-4 rounded-full text-[16px] font-bold hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer"
              style={{ boxShadow: "0 8px 20px rgba(107,142,97,0.25)" }}
            >
              <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09zM12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
              </svg>
              Start Learning
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main create modal
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-[420px] mx-4 max-h-[88vh] rounded-[32px] overflow-hidden bg-[#FDFBF7] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.35)] z-10">
        {/* Sakura leaf decoration (top-right) */}
        <img
          src="/design/sakura_leaves.png"
          alt=""
          className="absolute top-0 right-0 w-40 h-40 object-contain opacity-50 pointer-events-none select-none"
        />

        <div className="relative z-10 p-6 sm:p-8 overflow-y-auto max-h-[88vh]">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[22px] font-bold text-[#333]">New Study Session</h2>
            <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/5 transition-colors cursor-pointer">
              <svg className="w-5 h-5 text-[#999]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          {/* Subject */}
          <label className="block text-[12px] font-bold uppercase tracking-wide text-[#999] mb-3">Subject</label>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {SUBJECTS.map((subject, i) => {
              const active = selectedSubject === i;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => { setSelectedSubject(i); setCustomSubject(""); }}
                  className={`flex flex-col items-center gap-1.5 py-3.5 rounded-2xl border transition-all cursor-pointer ${active ? "border-[#6B8E61] bg-[#F0F5EE]" : "border-[#F3EDE3] bg-white hover:border-[#E5DDD0]"}`}
                >
                  <svg className={`w-5 h-5 ${active ? "text-[#6B8E61]" : "text-[#999]"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d={subject.icon} />
                  </svg>
                  <span className={`text-[11px] font-semibold ${active ? "text-[#6B8E61]" : "text-[#999]"}`}>{subject.name}</span>
                </button>
              );
            })}
          </div>
          <input
            type="text"
            placeholder="Or type any topic you want to learn..."
            value={customSubject}
            onChange={(e) => { setCustomSubject(e.target.value); if (e.target.value) setSelectedSubject(null); }}
            className="w-full bg-white border border-[#F3EDE3] rounded-2xl px-4 py-3 text-sm text-[#333] placeholder-[#CCC] focus:outline-none focus:border-[#6B8E61]/50"
          />

          {/* Objectives */}
          <label className="block text-[12px] font-bold uppercase tracking-wide text-[#999] mt-5 mb-2">What do you want to learn? (optional)</label>
          <textarea
            placeholder="e.g. I want to understand derivatives and integrals for my exam next week..."
            value={objectives}
            onChange={(e) => setObjectives(e.target.value)}
            rows={3}
            className="w-full bg-white border border-[#F3EDE3] rounded-2xl px-4 py-3 text-sm text-[#333] placeholder-[#CCC] focus:outline-none focus:border-[#6B8E61]/50 resize-none"
          />

          {/* File Upload */}
          <label className="block text-[12px] font-bold uppercase tracking-wide text-[#999] mt-5 mb-2">Attach study materials (optional)</label>
          <div
            onDrop={onDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all ${dragOver ? "border-[#6B8E61]/50 bg-[#F0F5EE]" : "border-[#E5DDD0] hover:border-[#6B8E61]/40"}`}
          >
            <svg className="w-7 h-7 mx-auto text-[#999] mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
            </svg>
            <p className="text-xs text-[#999]">Drop PDF, PPTX, or images here</p>
            <input ref={fileInputRef} type="file" multiple accept=".pdf,.pptx,.png,.jpg,.jpeg,.webp" className="hidden" onChange={onFileSelect} />
          </div>
          {uploads.length > 0 && (
            <div className="mt-3 space-y-1.5">
              {uploads.map((u, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  {u.status === "done" ? (
                    <svg className="w-3.5 h-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                  ) : u.status === "error" ? (
                    <svg className="w-3.5 h-3.5 text-[#C05050]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  ) : (
                    <div className="w-3.5 h-3.5 border-2 border-[#6B8E61] border-t-transparent rounded-full animate-spin" />
                  )}
                  <span className={u.status === "done" ? "text-green-500" : u.status === "error" ? "text-[#C05050]" : "text-[#999]"}>
                    {u.filename}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {createError && (
            <div className="mt-4 bg-[#FFF0F0] border border-[#FDD] rounded-2xl p-4">
              <p className="text-[14px]" style={{ color: "#C05050" }}>{createError}</p>
              <button
                onClick={() => router.push("/#pricing")}
                className="mt-2 text-[#6B8E61] font-bold underline cursor-pointer"
              >
                View pricing plans →
              </button>
            </div>
          )}

          {/* Create button */}
          <button
            onClick={handleCreate}
            disabled={creating || !getSubject()}
            className="mt-6 w-full flex items-center justify-center gap-2 bg-[#6B8E61] text-white py-4 rounded-full text-[16px] font-bold hover:brightness-105 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            style={{ boxShadow: "0 8px 20px rgba(107,142,97,0.25)" }}
          >
            {creating ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generating your roadmap...
              </span>
            ) : (
              <>
                <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.5 8.5L12 3l9.5 5.5L12 14 2.5 8.5zM6 11v4.5c0 1 3 2.5 6 2.5s6-1.5 6-2.5V11M22 8.5V14" />
                </svg>
                Create Session
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
