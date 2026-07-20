export default function Footer() {
  return (
    <footer className="bg-deep-onyx py-32 px-12 md:px-24 border-t border-white/5">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-20 items-start">
        <div className="space-y-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-cyber-yellow rounded-full flex items-center justify-center">
              <svg className="text-black w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            </div>
            <span className="text-3xl font-black tracking-tighter">AETHER</span>
          </div>
          <p className="text-white/40 max-w-xs text-lg font-medium leading-relaxed">
            The world&apos;s first AI tutor that builds a private, hyper-local knowledge graph for every student.
          </p>
        </div>

        <div className="flex flex-col gap-6">
          <p className="text-[11px] uppercase font-black tracking-[0.3em] text-white/20 mb-4">Product</p>
          <a href="#" className="text-lg font-bold text-white/60 hover:text-cyber-yellow premium-transition">Voice Learning</a>
          <a href="#" className="text-lg font-bold text-white/60 hover:text-cyber-yellow premium-transition">Memory Sync</a>
          <a href="#" className="text-lg font-bold text-white/60 hover:text-cyber-yellow premium-transition">Adaptive Exams</a>
        </div>

        <div className="flex flex-col gap-6">
          <p className="text-[11px] uppercase font-black tracking-[0.3em] text-white/20 mb-4">Legal</p>
          <a href="#" className="text-lg font-bold text-white/60 hover:text-cyber-yellow premium-transition">Privacy Policy</a>
          <a href="#" className="text-lg font-bold text-white/60 hover:text-cyber-yellow premium-transition">Terms of Service</a>
          <a href="#" className="text-lg font-bold text-white/60 hover:text-cyber-yellow premium-transition">Data Security</a>
        </div>

        <div className="flex flex-col gap-10">
          <p className="text-[11px] uppercase font-black tracking-[0.3em] text-white/20">Connect</p>
          <div className="flex gap-8">
            <a href="#" className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group hover:border-cyber-yellow/40 premium-transition">
              <svg className="w-6 h-6 text-white/40 group-hover:text-cyber-yellow premium-transition" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84" />
              </svg>
            </a>
            <a href="#" className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group hover:border-cyber-yellow/40 premium-transition">
              <svg className="w-6 h-6 text-white/40 group-hover:text-cyber-yellow premium-transition" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            </a>
          </div>
          <div className="space-y-4 pt-6">
            <p className="text-[11px] font-black text-white/20 uppercase tracking-widest">Status</p>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-sm font-bold text-white/60">All systems operational</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-32 pt-16 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-10">
        <p className="text-white/20 text-xs font-bold uppercase tracking-[0.4em]">© 2024 Aether Labs Inc.</p>
        <p className="text-white/20 text-xs font-bold uppercase tracking-[0.4em] italic">Made for the curious.</p>
      </div>
    </footer>
  );
}
