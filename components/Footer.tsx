export default function Footer() {
  return (
    <footer className="relative px-12 md:px-24 py-28 border-t border-white/5">
      <div className="max-w-7xl mx-auto grid md:grid-cols-5 gap-16">
        {/* Brand */}
        <div className="col-span-2">
          <a href="#" className="flex items-center gap-4 mb-8 group w-fit">
            <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center shadow-xl group-hover:scale-110 premium-transition">
              <svg className="text-cyber-yellow w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
              </svg>
            </div>
            <span className="text-xl font-black text-white tracking-tighter">AETHER</span>
          </a>
          <p className="text-white/30 font-bold text-sm max-w-xs leading-relaxed mb-10">
            The AI tutor that truly understands you. Upload anything, learn everything.
          </p>
          <div className="flex gap-6">
            {["Twitter", "GitHub", "Discord"].map((social) => (
              <a
                key={social}
                href="#"
                className="text-white/20 text-sm font-bold hover:text-cyber-yellow premium-transition"
              >
                {social}
              </a>
            ))}
          </div>
        </div>

        {/* Links */}
        {[
          {
            title: "Product",
            links: ["Features", "Pricing", "Integrations", "Changelog", "Documentation"],
          },
          {
            title: "Company",
            links: ["About", "Blog", "Careers", "Press", "Contact"],
          },
          {
            title: "Legal",
            links: ["Privacy", "Terms", "Security", "Cookies", "GDPR"],
          },
        ].map((group) => (
          <div key={group.title}>
            <h4 className="text-white text-sm font-black mb-8 uppercase tracking-wider">{group.title}</h4>
            <ul className="space-y-5">
              {group.links.map((link) => (
                <li key={link}>
                  <a href="#" className="text-white/30 text-sm font-bold hover:text-cyber-yellow premium-transition">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="max-w-7xl mx-auto mt-24 pt-10 border-t border-white/5 flex items-center justify-between">
        <p className="text-white/10 text-sm font-bold">
          &copy; 2024 AETHER. All rights reserved.
        </p>
        <p className="text-white/5 text-sm font-bold">
          Made with ❤️ for lifelong learners.
        </p>
      </div>
    </footer>
  );
}
