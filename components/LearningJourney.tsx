const steps = [
  {
    number: '01',
    title: 'Upload',
    description: 'Feed Aether your materials. It builds a map of your knowledge instantly.',
    icon: null,
    isActive: false,
  },
  {
    number: '02',
    title: 'Organize',
    description: 'AI identifies core themes and links previous lessons to your new content.',
    icon: null,
    isActive: false,
  },
  {
    number: '03',
    title: 'Converse',
    description: 'Start a voice session. Ask questions, get explanations, learn naturally.',
    icon: null,
    isActive: false,
  },
  {
    number: null,
    title: 'Master',
    description: 'Verify your understanding with adaptive practice and interactive sessions.',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0016.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.023 6.023 0 01-2.77.896m0 0a6.022 6.022 0 01-2.77-.896" />
      </svg>
    ),
    isActive: true,
  },
];

export default function LearningJourney() {
  return (
    <section id="methodology" className="bg-deep-onyx py-48 px-12 relative">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-40">
          <h2 className="text-6xl md:text-[6rem] font-black mb-8 tracking-tighter">
            Build Your <span className="text-cyber-yellow italic">Knowledge.</span>
          </h2>
          <p className="text-white/40 max-w-2xl mx-auto text-2xl font-medium">
            A living cycle of discovery, organized by intelligence.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row items-start justify-between gap-16 lg:gap-8 relative">
          {steps.map((step, index) => (
            <div key={step.title} className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left group relative step-container">
              <div
                className={`w-24 h-24 rounded-[32px] flex items-center justify-center mb-10 premium-transition shadow-2xl group-hover:scale-110 ${
                  step.isActive
                    ? 'bg-cyber-yellow border border-cyber-yellow text-black shadow-[0_20px_60px_rgba(253,224,71,0.3)]'
                    : 'bg-[#171717] border border-white/10 group-hover:bg-cyber-yellow group-hover:text-black'
                }`}
              >
                {step.icon || <span className="text-3xl font-black">{step.number}</span>}
              </div>
              <div className="space-y-6">
                <h5 className="text-4xl font-black text-white">{step.title}</h5>
                <p className="text-white/40 text-xl leading-relaxed font-medium">
                  {step.description}
                </p>
              </div>
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute left-[85%] top-12 w-1/2 step-line-draw z-0" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
