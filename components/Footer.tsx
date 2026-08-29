export default function Footer() {
  return (
    <footer className="relative px-12 md:px-24 py-28 border-t border-[#E7E1D6] bg-[#FDFBF7]">
      <div className="max-w-7xl mx-auto grid md:grid-cols-5 gap-16">
        <div className="col-span-2">
          <a href="#" className="flex items-center gap-3 mb-8 group w-fit">
            <img src="/landing/logo.png" alt="Aether" className="w-9 h-9 rounded-xl object-cover shadow-sm ring-1 ring-[#E7E1D6] group-hover:scale-110 premium-transition" />
            <span className="text-xl font-bold tracking-tight text-[#2D3436] serif-display">Aether</span>
          </a>
          <p className="text-[#2D3436]/60 font-bold text-sm max-w-xs leading-relaxed mb-10">
            The AI tutor that truly understands you. Upload anything, learn everything.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-[#2D3436]/40 text-sm font-bold hover:text-[#3F5C3A] premium-transition">Twitter</a>
            <a href="https://github.com/GurnoorLog/AETHER" className="text-[#2D3436]/40 text-sm font-bold hover:text-[#3F5C3A] premium-transition">GitHub</a>
            <a href="https://discord.gg/j493qpnD" target="_blank" rel="noopener noreferrer" className="text-[#2D3436]/40 text-sm font-bold hover:text-[#3F5C3A] premium-transition">Discord</a>
          </div>
        </div>
        {[
          {
            title: "Product",
            links: [
              { label: "Features", href: "#" },
              { label: "Pricing", href: "/pricing" },
              { label: "Integrations", href: "#" },
              { label: "Changelog", href: "#" },
              { label: "Documentation", href: "#" },
            ],
          },
          {
            title: "Company",
            links: [
              { label: "About", href: "#" },
              { label: "Blog", href: "#" },
              { label: "Careers", href: "#" },
              { label: "Press", href: "#" },
              { label: "Contact", href: "#" },
            ],
          },
          {
            title: "Legal",
            links: [
              { label: "Privacy", href: "/privacy" },
              { label: "Security", href: "#" },
              { label: "Cookies", href: "#" },
              { label: "GDPR", href: "#" },
            ],
          },
        ].map((col) => (
          <div key={col.title}>
            <h4 className="text-[#2D3436] text-sm font-black mb-8 uppercase tracking-wider">{col.title}</h4>
            <ul className="space-y-5">
              {col.links.map((item) => (
                <li key={item.label}>
                  <a href={item.href} className="text-[#2D3436]/50 text-sm font-bold hover:text-[#3F5C3A] premium-transition">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="max-w-7xl mx-auto mt-24">
        <div className="rounded-[48px] border border-[#E7E1D6] bg-[#F4F0E9] p-12 md:p-16 text-center relative overflow-hidden editorial">
          <div className="absolute top-[-50%] left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#3F5C3A]/5 rounded-full blur-[120px] pointer-events-none" />
          <span className="text-[#3F5C3A] text-xs font-black tracking-[0.25em] uppercase">Made by the Founder</span>
          <h3 className="text-4xl md:text-6xl font-black text-[#2D3436] mt-6 mb-6 tracking-tighter serif-display">
            Gurnoor <span className="text-[#3F5C3A]">Tamber</span>
          </h3>
          <p className="text-[#2D3436]/50 font-bold text-sm md:text-base max-w-md mx-auto mb-10">
            Founder &amp; developer of Aether, building the AI tutor that never forgets.
          </p>
          <div className="flex flex-col items-center gap-6">
            <div className="w-32 h-32 rounded-full border-2 border-dashed border-[#3F5C3A]/30 bg-[#FDFBF7] flex items-center justify-center text-[#2D3436]/30">
              <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>
            <a href="https://praknoor.dev" target="_blank" rel="noopener noreferrer" className="btn-editorial font-black px-8 py-4 rounded-full text-sm uppercase tracking-widest hover:scale-105 active:scale-95 transition-all btn-hard cursor-pointer">
              View Portfolio &rarr; praknoor.dev
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-24 pt-10 border-t border-[#E7E1D6] flex items-center justify-between">
        <p className="text-[#2D3436]/40 text-sm font-bold">
          &copy; 2026 Aether Learning. All rights reserved.
        </p>
        <p className="text-[#2D3436]/30 text-sm font-bold">
          Made with &#10084;&#65039; for lifelong learners.
        </p>
      </div>
    </footer>
  );
}