import type { ReactNode } from "react";

interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  children?: ReactNode;
}

export default function FeatureCard({ icon, title, description, children }: FeatureCardProps) {
  return (
    <div className="glass-card p-14 rounded-[56px] border-white/5 flex flex-col group hover:-translate-y-8 transition-all duration-1000 overflow-hidden shadow-2xl">
      <div className="w-20 h-20 rounded-3xl bg-cyber-yellow flex items-center justify-center text-black mb-12 shadow-[0_20px_40px_rgba(253,224,71,0.2)] group-hover:rotate-[15deg] premium-transition">
        {icon}
      </div>
      <h4 className="text-4xl font-black mb-6">{title}</h4>
      <p className="text-white/50 text-lg leading-relaxed mb-14">{description}</p>
      {children && (
        <div className="mt-auto bg-black/60 rounded-[32px] p-8 border border-white/10">
          {children}
        </div>
      )}
    </div>
  );
}
