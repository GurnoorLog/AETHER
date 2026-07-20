import FeatureCard from "./FeatureCard";

export default function FeatureCards() {
  return (
    <section className="bg-deep-onyx py-48 px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <FeatureCard
            icon={
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
              </svg>
            }
            title="Personalized RAG"
            description="Aether maps every sentence into a connected knowledge graph that lives exclusively in your browser."
          >
            <div className="aspect-video relative flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-cyber-yellow/5 animate-pulse" />
              <svg className="w-full h-full relative z-10" viewBox="0 0 200 120">
                <circle cx="100" cy="60" r="8" fill="#FDE047" className="animate-pulse" />
                <circle cx="60" cy="30" r="4" fill="white" fillOpacity="0.4" />
                <circle cx="140" cy="30" r="4" fill="white" fillOpacity="0.4" />
                <circle cx="60" cy="90" r="4" fill="white" fillOpacity="0.4" />
                <circle cx="140" cy="90" r="4" fill="white" fillOpacity="0.4" />
                <line x1="100" y1="60" x2="60" y2="30" stroke="white" strokeOpacity="0.2" strokeWidth="1" />
                <line x1="100" y1="60" x2="140" y2="30" stroke="white" strokeOpacity="0.2" strokeWidth="1" />
                <line x1="100" y1="60" x2="60" y2="90" stroke="white" strokeOpacity="0.2" strokeWidth="1" />
                <line x1="100" y1="60" x2="140" y2="90" stroke="white" strokeOpacity="0.2" strokeWidth="1" />
              </svg>
              <div className="absolute bottom-4 left-4 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-cyber-yellow" />
                <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Nodes Connected</span>
              </div>
            </div>
          </FeatureCard>

          <FeatureCard
            icon={
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
              </svg>
            }
            title="Voice First"
            description="No more cold chats. Learn through low-latency, professor-grade natural dialogue."
          >
            <div className="aspect-video flex flex-col items-center justify-center gap-6">
              <div className="flex items-end gap-1.5 h-12">
                <div className="waveform-bar bg-cyber-yellow w-1.5 rounded-full" style={{ animationDuration: '0.5s' }} />
                <div className="waveform-bar bg-cyber-yellow w-1.5 rounded-full" style={{ animationDuration: '0.8s' }} />
                <div className="waveform-bar bg-cyan-400 w-1.5 rounded-full" style={{ animationDuration: '0.6s' }} />
                <div className="waveform-bar bg-cyber-yellow w-1.5 rounded-full" style={{ animationDuration: '1.1s' }} />
                <div className="waveform-bar bg-white w-1.5 rounded-full" style={{ animationDuration: '0.7s' }} />
                <div className="waveform-bar bg-cyber-yellow w-1.5 rounded-full" style={{ animationDuration: '0.9s' }} />
              </div>
              <p className="text-[11px] font-bold text-cyber-yellow/60 uppercase tracking-widest italic">&ldquo;I understand the concept...&rdquo;</p>
            </div>
          </FeatureCard>

          <FeatureCard
            icon={
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0016.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.023 6.023 0 01-2.77.896m0 0a6.022 6.022 0 01-2.77-.896" />
              </svg>
            }
            title="Adaptive Mastery"
            description="Custom quizzes built around your session history to lock in concepts for the long term."
          >
            <div className="aspect-video flex flex-col justify-end gap-6">
              <div className="flex justify-between items-end gap-3 h-24">
                <div className="flex-1 bg-white/5 rounded-xl relative overflow-hidden" style={{ height: '40%' }}>
                  <div className="absolute bottom-0 left-0 right-0 bg-cyber-yellow/20 h-full animate-pulse" />
                </div>
                <div className="flex-1 bg-white/5 rounded-xl relative overflow-hidden" style={{ height: '90%' }}>
                  <div className="absolute bottom-0 left-0 right-0 bg-cyber-yellow h-full shadow-[0_0_20px_rgba(253,224,71,0.4)]" />
                </div>
                <div className="flex-1 bg-white/5 rounded-xl relative overflow-hidden" style={{ height: '65%' }}>
                  <div className="absolute bottom-0 left-0 right-0 bg-cyan-accent/50 h-full" />
                </div>
                <div className="flex-1 bg-white/5 rounded-xl relative overflow-hidden" style={{ height: '30%' }}>
                  <div className="absolute bottom-0 left-0 right-0 bg-white/10 h-full" />
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Learning velocity</span>
                <span className="text-xs font-black text-cyber-yellow">+24%</span>
              </div>
            </div>
          </FeatureCard>
        </div>
      </div>
    </section>
  );
}
