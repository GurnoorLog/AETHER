const badges = [
  { icon: '⚡', label: 'Real-Time Voice', hoverColor: 'hover:border-cyber-yellow/60 hover:bg-cyber-yellow/5', textColor: 'group-hover:text-cyber-yellow', glowColor: 'rgba(253,224,71,0.5)' },
  { icon: '🧠', label: 'Personal Memory', hoverColor: 'hover:border-cyan-400/60 hover:bg-cyan-400/5', textColor: 'group-hover:text-cyan-accent', glowColor: 'rgba(34,211,238,0.5)' },
  { icon: '📄', label: 'Private RAG Base', hoverColor: 'hover:border-blue-400/60 hover:bg-blue-400/5', textColor: 'group-hover:text-blue-400', glowColor: 'rgba(96,165,250,0.5)' },
  { icon: '🎯', label: 'Adaptive Mastery', hoverColor: 'hover:border-green-400/60 hover:bg-green-400/5', textColor: 'group-hover:text-green-400', glowColor: 'rgba(74,222,128,0.5)' },
  { icon: '🎧', label: 'Focus Music', hoverColor: 'hover:border-purple-400/60 hover:bg-purple-400/5', textColor: 'group-hover:text-purple-400', glowColor: 'rgba(192,132,252,0.5)' },
];

export default function FeatureBadges() {
  return (
    <section className="bg-deep-onyx py-48 px-8 -mt-32 relative z-20">
      <div className="max-w-7xl mx-auto flex flex-wrap justify-center gap-6">
        {badges.map((badge) => (
          <div
            key={badge.label}
            className={`px-10 py-5 bg-white/5 border border-white/10 rounded-full flex items-center gap-5 ${badge.hoverColor} premium-transition group cursor-default shadow-xl`}
          >
            <span
              className="text-2xl transition-all duration-500"
              style={{ filter: 'none' }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.filter = `drop-shadow(0 0 8px ${badge.glowColor})`;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.filter = 'none';
              }}
            >
              {badge.icon}
            </span>
            <span className={`text-sm font-black uppercase tracking-[0.2em] text-white/60 ${badge.textColor} premium-transition`}>
              {badge.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
