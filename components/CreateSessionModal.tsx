"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { createClient } from "@/lib/supabase/client";

interface CreateSessionModalProps {
  open: boolean;
  onClose: () => void;
  subjects: string[];
}

export default function CreateSessionModal({ open, onClose, subjects }: CreateSessionModalProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [customSubject, setCustomSubject] = useState<string>("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!user) return;
    const subject = selectedSubject || customSubject.trim();
    if (!subject) return;

    setIsCreating(true);
    const supabase = createClient();

    try {
      await supabase.from("conversations").insert({
        user_id: user.id,
        title: `${subject} Study Session`,
      });

      await supabase.from("progress_tracking").upsert({
        user_id: user.id,
        subject: subject,
        mastery_level: 0,
      });

      onClose();
      router.push("/dashboard");
    } catch (err) {
      console.error("Failed to create session:", err);
    } finally {
      setIsCreating(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative glass-card rounded-[32px] p-8 max-w-2xl w-full mx-4 z-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black">Create New Session</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="text-sm text-white/60 mb-6">
          Select a subject or enter a new one. This will become your study focus for this session.
        </p>

        <div className="space-y-3 mb-6 max-h-60 overflow-y-auto">
          {subjects.length === 0 ? (
            <p className="text-white/30 text-sm">No subjects yet. Enter a new one below.</p>
          ) : (
            subjects.map((subject) => (
              <button
                key={subject}
                type="button"
                onClick={() => {
                  setSelectedSubject(subject);
                  setCustomSubject("");
                }}
                className={`w-full text-left p-4 rounded-[20px] border transition-all ${
                  selectedSubject === subject
                    ? "border-cyber-yellow bg-cyber-yellow/10"
                    : "border-white/10 hover:border-white/20"
                }`}
              >
                <span className="font-bold text-white">{subject}</span>
                <span className="text-xs text-white/40 ml-2">— existing subject</span>
              </button>
            ))
          )}
        </div>

        <div className="mb-6">
          <label className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-2">
            Or enter a new subject
          </label>
          <input
            type="text"
            placeholder="e.g. Organic Chemistry, World History..."
            value={customSubject}
            onChange={(e) => {
              setCustomSubject(e.target.value);
              if (e.target.value) setSelectedSubject("");
            }}
            className="w-full bg-white/5 border border-white/10 rounded-[20px] px-4 py-3 text-sm text-white placeholder-white/40 focus:outline-none focus:border-cyber-yellow/50"
          />
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-full text-sm font-bold text-white/40 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={isCreating || (!selectedSubject && !customSubject.trim())}
            className="flex-1 bg-[#FDE047] text-black py-3 rounded-full text-sm font-black uppercase hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreating ? "Creating..." : "Create Session"}
          </button>
        </div>
      </div>
    </div>
  );
}
