interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  accentColor: string;
  gradientFrom: string;
  gradientTo: string;
}

export default function FeatureCard({ icon, title, description, accentColor, gradientFrom, gradientTo }: FeatureCardProps) {
  return (
    <div
      className="group relative p-10 rounded-3xl border border-white/10 glass-card-darker hover:border-white/20 premium-transition cursor-default overflow-hidden"
    >
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 premium-transition"
        style={{
          background: `radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), ${gradientFrom}, transparent 40%)`,
        }}
      />
      <div className="relative z-10">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-8 text-3xl"
          style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
        >
          {icon}
        </div>
        <h3 className="text-2xl font-black text-white mb-5">{title}</h3>
        <p className="text-white/50 font-bold text-md leading-relaxed">{description}</p>

        <div
          className="mt-10 w-12 h-12 rounded-2xl flex items-center justify-center group-hover:scale-110 premium-transition"
          style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </div>
      </div>
    </div>
  );
}
