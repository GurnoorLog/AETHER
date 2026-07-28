import type { ReactNode } from "react";

interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  children?: ReactNode;
}

export default function FeatureCard({ icon, title, description, children }: FeatureCardProps) {
  return (
    <div className="glass-card p-6 sm:p-8 md:p-12 lg:p-14 rounded-[32px] md:rounded-[56px] border-white/5 flex flex-col group hover:-translate-y-4 lg:hover:-translate-y-8 transition-all duration-1000 overflow-hidden shadow-2xl">
      <div className="w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-2xl sm:rounded-3xl bg-cyber-yellow flex items-center justify-center text-black mb-6 sm:mb-8 lg:mb-12 shadow-[0_20px_40px_rgba(253,224,71,0.2)] group-hover:rotate-[15deg] premium-transition">
        {icon}
      </div>
      <h4 className="text-2xl sm:text-3xl lg:text-4xl font-black mb-4 sm:mb-6">{title}</h4>
      <p className="text-white/50 text-sm sm:text-base lg:text-lg leading-relaxed mb-8 sm:mb-10 lg:mb-14">{description}</p>
      {children && (
        <div className="mt-auto bg-black/60 rounded-[24px] sm:rounded-[32px] p-4 sm:p-6 lg:p-8 border border-white/10">
          {children}
        </div>
      )}
    </div>
  );
}
