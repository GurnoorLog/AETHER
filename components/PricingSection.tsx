const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    desc: "Dip your toes into personalized AI learning.",
    features: [
      "1 active learning session",
      "10 AI chat messages / day",
      "3 knowledge uploads total",
      "2 quizzes / day",
      "5 min voice tutor / day",
      "Basic progress tracking",
    ],
    cta: "Get Started",
    href: "#",
    popular: false,
  },
  {
    name: "Pro",
    price: "$12",
    period: "/month",
    desc: "For serious learners who want depth and flexibility.",
    features: [
      "Up to 10 active sessions",
      "200 AI chat messages / day",
      "50 knowledge uploads / month",
      "Unlimited quizzes",
      "60 min voice tutor / day",
      "AI music generation (5/mo)",
      "Code challenges & runner",
      "Full analytics & mastery tracking",
    ],
    cta: "Subscribe",
    href: "#",
    popular: true,
  },
  {
    name: "Unlimited",
    price: "$29",
    period: "/month",
    desc: "Zero limits. For power users who want it all.",
    features: [
      "Unlimited sessions",
      "Unlimited AI chat",
      "Unlimited knowledge uploads",
      "Unlimited quizzes",
      "Unlimited voice tutor",
      "Unlimited music generation",
      "Priority AI model access",
      "Early access to new features",
      "Priority support",
    ],
    cta: "Go Unlimited",
    href: "#",
    popular: false,
  },
];

export default function PricingSection() {
  return (
    <section className="relative py-28 px-6 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-cyber-yellow text-xs font-black tracking-[0.25em] uppercase">Pricing</span>
          <h2 className="text-4xl md:text-5xl font-black text-white mt-4 mb-4 tracking-tight">
            Choose Your Path
          </h2>
          <p className="text-white/40 text-sm font-bold max-w-xl mx-auto">
            Start free, upgrade when you outgrow it. No hidden fees, no surprises.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 items-start">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-8 flex flex-col ${
                plan.popular
                  ? "bg-white/5 border-2 border-cyber-yellow/40 shadow-[0_0_40px_rgba(253,224,71,0.08)]"
                  : "bg-white/[0.03] border border-white/10"
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-cyber-yellow text-black text-[10px] font-black px-4 py-1 rounded-full uppercase tracking-widest">
                  Most Popular
                </span>
              )}

              <div className="mb-8">
                <h3 className="text-white text-lg font-black mb-1">{plan.name}</h3>
                <p className="text-white/30 text-xs font-bold mb-6">{plan.desc}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-white text-4xl font-black">{plan.price}</span>
                  <span className="text-white/20 text-sm font-bold">{plan.period}</span>
                </div>
              </div>

              <ul className="space-y-3 mb-10 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-3">
                    <svg className="w-4 h-4 mt-0.5 text-cyber-yellow shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    <span className="text-white/60 text-xs font-bold leading-relaxed">{f}</span>
                  </li>
                ))}
              </ul>

              <a
                href={plan.href}
                className={`block text-center text-sm font-black py-4 rounded-xl premium-transition ${
                  plan.popular
                    ? "bg-cyber-yellow text-black hover:bg-cyber-yellow/90 hover:shadow-[0_0_30px_rgba(253,224,71,0.25)]"
                    : "bg-white/5 text-white/80 border border-white/10 hover:bg-white/10 hover:text-white"
                }`}
              >
                {plan.cta}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
