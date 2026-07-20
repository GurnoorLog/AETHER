export default function CtaSection() {
  return (
    <section className="bg-white py-64 px-12 flex justify-center text-center relative overflow-hidden">
      <div className="absolute top-24 left-1/2 -translate-x-1/2 animate-float z-10">
        <div className="bg-deep-onyx p-10 rounded-[48px] shadow-[0_80px_150px_-20px_rgba(0,0,0,0.8)] border border-white/15 w-[450px] text-left overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-cyber-yellow" />
          <div className="flex items-center gap-5 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-cyber-yellow flex items-center justify-center shadow-xl">
              <svg className="text-black w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-black text-white uppercase tracking-widest">Aether Memory</p>
              <p className="text-xs font-bold text-cyber-yellow uppercase tracking-tight">System Online</p>
            </div>
          </div>
          <p className="text-lg text-white/90 font-medium leading-relaxed italic mb-4">
            &ldquo;Welcome back, Sarah. Last session you struggled with calculus concepts on derivatives.&rdquo;
          </p>
          <div className="p-4 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-between">
            <span className="text-xs font-bold text-white/40 uppercase tracking-widest">Ready to continue?</span>
            <svg className="w-5 h-5 text-cyber-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </div>
        </div>
      </div>

      <div className="max-w-5xl relative pt-52">
        <h2 className="text-7xl md:text-[9rem] font-black text-black leading-[0.8] tracking-tighter mb-16">
          Stop Searching. <br />
          <span className="text-cyber-yellow drop-shadow-sm">Start Knowing.</span>
        </h2>
        <p className="text-black/60 text-2xl md:text-3xl font-bold mb-20 max-w-3xl mx-auto">
          I&apos;ve prepared 3 new practice questions based on yesterday&apos;s lesson. Ready to ace them?
        </p>
        <button className="px-20 py-10 bg-black text-white rounded-full font-black text-3xl hover:scale-110 active:scale-95 transition-all shadow-[0_40px_100px_-15px_rgba(0,0,0,0.5)] glow-pulse-yellow mb-12 cursor-pointer">
          Create Your Account
        </button>
        <p className="text-black/40 font-black uppercase tracking-[0.3em] text-xs">Join 12,500+ students reimagining education</p>
      </div>
    </section>
  );
}
