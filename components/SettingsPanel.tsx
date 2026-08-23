"use client";

import { useState, useEffect } from "react";
import PricingModal from "@/components/PricingModal";

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
}

interface PlanState {
  tier: string;
  status: string;
  currentPeriodEnd?: string | null;
}

const NAV_ITEMS = [
  { id: "general", label: "General" },
  { id: "speech", label: "Speech & Language" },
  { id: "privacy", label: "Privacy" },
  { id: "subscription", label: "Subscription" },
  { id: "about", label: "About" },
];

export default function SettingsPanel({ open, onClose }: SettingsPanelProps) {
  const [theme, setTheme] = useState<"dark" | "system">("dark");
  const [active, setActive] = useState("general");
  const [plan, setPlan] = useState<PlanState | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [planError, setPlanError] = useState("");
  const [showUpgrade, setShowUpgrade] = useState(false);

  useEffect(() => {
    if (!open) return;
    setActive("general");
    fetch("/api/stripe/subscription")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setPlan({ tier: d.tier, status: d.status, currentPeriodEnd: d.current_period_end ?? null }))
      .catch(() => {});
  }, [open]);

  if (!open) return null;

  const handleManagePlan = async () => {
    setPortalLoading(true);
    setPlanError("");
    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setPlanError(data.error || "Could not open the billing portal.");
        setPortalLoading(false);
      }
    } catch {
      setPlanError("Could not open the billing portal.");
      setPortalLoading(false);
    }
  };

  const isPaid = plan?.status === "active" || plan?.status === "trialing";

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="pointer-events-auto w-full max-w-2xl bg-[#1a1a1a] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
            <h2 className="text-sm font-bold text-white/90">Settings</h2>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-warm-ink/[0.04] flex items-center justify-center hover:bg-warm-ink/[0.05] transition-all cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 text-warm-ink-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Body: two-column like ChatGPT settings */}
          <div className="flex min-h-[380px]">
            {/* Left nav */}
            <nav className="w-44 shrink-0 border-r border-white/[0.06] px-3 py-4 space-y-0.5">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActive(item.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    active === item.id ? "bg-warm-ink/[0.04] text-warm-ink" : "text-warm-ink-muted hover:text-warm-ink-soft hover:bg-warm-ink/[0.05]"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>

            {/* Right content */}
            <div className="flex-1 px-6 py-5 overflow-y-auto max-h-[60vh]">
              {active === "general" && (
                <section>
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-warm-ink-faint mb-3">General</h3>
                  <div className="space-y-3">
                    <label className="flex items-center justify-between py-2">
                      <div>
                        <p className="text-xs font-medium text-warm-ink-soft">Theme</p>
                        <p className="text-[10px] text-warm-ink-muted mt-0.5">Choose your preferred appearance</p>
                      </div>
                      <select
                        value={theme}
                        onChange={(e) => setTheme(e.target.value as "dark" | "system")}
                        className="bg-warm-ink/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-warm-ink-soft focus:outline-none focus:border-sage/50 cursor-pointer"
                      >
                        <option value="dark">Dark</option>
                        <option value="system">System</option>
                      </select>
                    </label>
                  </div>
                </section>
              )}

              {active === "speech" && (
                <section>
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-warm-ink-faint mb-3">Speech & Language</h3>
                  <div className="space-y-3">
                    <label className="flex items-center justify-between py-2">
                      <div>
                        <p className="text-xs font-medium text-warm-ink-soft">Voice Input Language</p>
                        <p className="text-[10px] text-warm-ink-muted mt-0.5">Language for speech recognition</p>
                      </div>
                      <select className="bg-warm-ink/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-warm-ink-soft focus:outline-none focus:border-sage/50 cursor-pointer">
                        <option value="en">English</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                        <option value="de">German</option>
                      </select>
                    </label>
                    <label className="flex items-center justify-between py-2">
                      <div>
                        <p className="text-xs font-medium text-warm-ink-soft">TTS Voice</p>
                        <p className="text-[10px] text-warm-ink-muted mt-0.5">Voice for AI responses</p>
                      </div>
                      <select className="bg-warm-ink/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-warm-ink-soft focus:outline-none focus:border-sage/50 cursor-pointer">
                        <option value="aura-2-odysseus-en">Odysseus (Default)</option>
                      </select>
                    </label>
                  </div>
                </section>
              )}

              {active === "privacy" && (
                <section>
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-warm-ink-faint mb-3">Privacy</h3>
                  <div className="space-y-3">
                    <label className="flex items-center justify-between py-2">
                      <div>
                        <p className="text-xs font-medium text-warm-ink-soft">Save conversation history</p>
                        <p className="text-[10px] text-warm-ink-muted mt-0.5">Store your learning conversations</p>
                      </div>
                      <div className="relative inline-flex h-5 w-9 items-center rounded-full bg-warm-ink/[0.04] cursor-pointer">
                        <input type="checkbox" defaultChecked className="peer sr-only" />
                        <span className="absolute inset-0 rounded-full bg-warm-ink/[0.04] peer-checked:bg-sage transition-colors" />
                        <span className="absolute left-0.5 h-4 w-4 rounded-full bg-white peer-checked:translate-x-4 peer-checked:bg-black transition-all" />
                      </div>
                    </label>
                  </div>
                </section>
              )}

              {active === "subscription" && (
                <section>
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-warm-ink-faint mb-3">Subscription</h3>
                  <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-warm-ink capitalize">{plan?.tier ?? "Free"} plan</p>
                        <p className="text-[10px] text-warm-ink-muted mt-0.5">
                          {isPaid
                            ? plan?.currentPeriodEnd
                              ? `Renews ${new Date(plan.currentPeriodEnd).toLocaleDateString()}`
                              : "Active"
                            : plan?.status === "past_due"
                              ? "Payment issue — update your billing details."
                              : "You're on the free plan."}
                        </p>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                          isPaid ? "bg-green-500/10 text-green-400" : "bg-warm-ink/[0.04] text-warm-ink-muted"
                        }`}
                      >
                        {isPaid ? "ACTIVE" : plan?.status === "past_due" ? "PAST DUE" : "FREE"}
                      </span>
                    </div>
                    <div className="mt-4 space-y-2">
                      {isPaid ? (
                        <button
                          onClick={handleManagePlan}
                          disabled={portalLoading}
                          className="w-full py-2.5 rounded-lg bg-sage text-white text-xs font-black hover:opacity-90 disabled:opacity-40 transition-all cursor-pointer"
                        >
                          {portalLoading ? "Opening billing portal..." : "Manage Subscription"}
                        </button>
                      ) : (
                        <button
                          onClick={() => setShowUpgrade(true)}
                          className="block w-full py-2.5 rounded-lg bg-sage text-white text-xs font-black text-center hover:opacity-90 transition-all cursor-pointer"
                        >
                          Upgrade Plan
                        </button>
                      )}
                    </div>
                    {planError && <p className="mt-3 text-xs text-red-400">{planError}</p>}
                  </div>
                </section>
              )}

              {active === "about" && (
                <section>
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-warm-ink-faint mb-3">About</h3>
                  <div className="space-y-2 text-xs text-warm-ink-muted">
                    <p>Aether v0.1.0</p>
                    <p>Personalized AI learning platform.</p>
                  </div>
                </section>
              )}
            </div>
          </div>
        </div>
      </div>

      {showUpgrade && <PricingModal onClose={() => setShowUpgrade(false)} />}
    </>
  );
}