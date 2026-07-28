"use client";

import { useState } from "react";

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
}

export default function SettingsPanel({ open, onClose }: SettingsPanelProps) {
  const [theme, setTheme] = useState<"dark" | "system">("dark");

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="pointer-events-auto w-full max-w-lg bg-[#1a1a1a] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
            <h2 className="text-sm font-bold text-white/90">Settings</h2>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-6 max-h-[60vh] overflow-y-auto">
            {/* General */}
            <section>
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 mb-3">General</h3>
              <div className="space-y-3">
                <label className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-xs font-medium text-white/80">Theme</p>
                    <p className="text-[10px] text-white/40 mt-0.5">Choose your preferred appearance</p>
                  </div>
                  <select
                    value={theme}
                    onChange={(e) => setTheme(e.target.value as "dark" | "system")}
                    className="bg-white/5 border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-white/70 focus:outline-none focus:border-cyber-yellow/50 cursor-pointer"
                  >
                    <option value="dark">Dark</option>
                    <option value="system">System</option>
                  </select>
                </label>
              </div>
            </section>

            {/* Language */}
            <section>
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 mb-3">Speech & Language</h3>
              <div className="space-y-3">
                <label className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-xs font-medium text-white/80">Voice Input Language</p>
                    <p className="text-[10px] text-white/40 mt-0.5">Language for speech recognition</p>
                  </div>
                  <select className="bg-white/5 border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-white/70 focus:outline-none focus:border-cyber-yellow/50 cursor-pointer">
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                  </select>
                </label>
                <label className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-xs font-medium text-white/80">TTS Voice</p>
                    <p className="text-[10px] text-white/40 mt-0.5">Voice for AI responses</p>
                  </div>
                  <select className="bg-white/5 border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-white/70 focus:outline-none focus:border-cyber-yellow/50 cursor-pointer">
                    <option value="aura-2-odysseus-en">Odysseus (Default)</option>
                  </select>
                </label>
              </div>
            </section>

            {/* Privacy */}
            <section>
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 mb-3">Privacy</h3>
              <div className="space-y-3">
                <label className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-xs font-medium text-white/80">Save conversation history</p>
                    <p className="text-[10px] text-white/40 mt-0.5">Store your learning conversations</p>
                  </div>
                  <div className="relative inline-flex h-5 w-9 items-center rounded-full bg-white/10 cursor-pointer">
                    <input type="checkbox" defaultChecked className="peer sr-only" />
                    <span className="absolute inset-0 rounded-full bg-white/10 peer-checked:bg-cyber-yellow transition-colors" />
                    <span className="absolute left-0.5 h-4 w-4 rounded-full bg-white peer-checked:translate-x-4 peer-checked:bg-black transition-all" />
                  </div>
                </label>
              </div>
            </section>

            {/* About */}
            <section>
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 mb-3">About</h3>
              <div className="space-y-2 text-xs text-white/50">
                <p>Aether v0.1.0</p>
                <p>Powered by Gemini & Deepgram</p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
