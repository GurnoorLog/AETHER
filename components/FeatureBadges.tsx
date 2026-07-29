export default function FeatureBadges() {
  const badges = [
    { label: "Neural Learning", icon: "🧠" },
    { label: "Voice Conversational", icon: "🎤" },
    { label: "Infinite Context Memory", icon: "∞" },
    { label: "Personalized Pathways", icon: "✨" },
    { label: "Multi-Format Upload", icon: "📄" },
    { label: "Real-Time Analytics", icon: "📊" },
    { label: "Socratic Tutoring", icon: "⚡" },
    { label: "Global Community", icon: "🌍" },
  ];

  const doubled = [...badges, ...badges];

  return (
    <section className="relative py-24 overflow-hidden">
      <div className="mx-auto">
        {/* Row 1 — left to right */}
        <div className="flex gap-6 mb-8 animate-scroll-left">
          {doubled.map((badge, i) => (
            <div
              key={`r1-${i}`}
              className="flex items-center gap-6 px-10 py-6 bg-black/50 border border-white/10 rounded-full shrink-0 hover:bg-black/70 hover:border-cyber-yellow/40 premium-transition group"
            >
              <span className="text-3xl">{badge.icon}</span>
              <span className="text-sm font-black text-white/80 tracking-wider uppercase group-hover:text-cyber-yellow premium-transition">
                {badge.label}
              </span>
              <svg className="w-5 h-5 text-cyber-yellow/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            </div>
          ))}
        </div>

        {/* Row 2 — right to left */}
        <div className="flex gap-6 animate-scroll-right">
          {doubled.map((badge, i) => (
            <div
              key={`r2-${i}`}
              className="flex items-center gap-6 px-10 py-6 bg-white/5 border border-white/10 rounded-full shrink-0 hover:bg-black/50 hover:border-cyber-yellow/40 premium-transition group"
            >
              <span className="text-3xl">{badge.icon}</span>
              <span className="text-sm font-black text-white/80 tracking-wider uppercase group-hover:text-cyber-yellow premium-transition">
                {badge.label}
              </span>
              <svg className="w-5 h-5 text-cyber-yellow/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
