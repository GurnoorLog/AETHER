import FeatureCard from "./FeatureCard";

const features = [
  {
    icon: <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" /></svg>,
    title: "Multi-Format Upload",
    description: "Upload PDFs, slides, textbooks, code, or even web links. Aether instantly ingests and indexes everything into your personal knowledge graph, ready for adaptive learning.",
    accentColor: "#60A5FA",
    gradientFrom: "rgba(96, 165, 250, 0.3)",
    gradientTo: "transparent",
  },
  {
    icon: <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" /></svg>,
    title: "Voice Conversational",
    description: "Speak naturally to your AI tutor. Real-time voice interaction for questions, clarifications, and discussions. Fine-tune pronunciation and speaking skills simultaneously.",
    accentColor: "#F472B6",
    gradientFrom: "rgba(244, 114, 182, 0.3)",
    gradientTo: "transparent",
  },
  {
    icon: <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>,
    title: "Visual Mind Palace",
    description: "Watch your knowledge grow as an interactive concept map. Aether dynamically builds connections between topics, showing how everything fits together in real-time.",
    accentColor: "#34D399",
    gradientFrom: "rgba(52, 211, 153, 0.3)",
    gradientTo: "transparent",
  },
  {
    icon: <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605" /></svg>,
    title: "Infinite Context Memory",
    description: "Aether never forgets. Every concept you've learned, every question you've asked, every connection you've made stays accessible. Pick up exactly where you left off.",
    accentColor: "#FBBF24",
    gradientFrom: "rgba(251, 191, 36, 0.3)",
    gradientTo: "transparent",
  },
  {
    icon: <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg>,
    title: "Global Community",
    description: "Compare mastery scores, share insights, and compete on leaderboards. Learn together with a global community of students using Aether to accelerate their growth.",
    accentColor: "#A78BFA",
    gradientFrom: "rgba(167, 139, 250, 0.3)",
    gradientTo: "transparent",
  },
  {
    icon: <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>,
    title: "Adaptive Learning Engine",
    description: "Real-time curriculum adjustment based on your mastery. Aether identifies weak spots, reinforces concepts, and accelerates through areas you've already mastered.",
    accentColor: "#F97316",
    gradientFrom: "rgba(249, 115, 22, 0.3)",
    gradientTo: "transparent",
  },
];

export default function FeatureCards() {
  return (
    <section id="features" className="px-12 md:px-24 py-48 max-w-7xl mx-auto">
      <div className="flex flex-col items-center mb-28 text-center">
        <h2 className="text-6xl md:text-8xl font-black text-white leading-[0.9] tracking-tight max-w-4xl">
          Everything You Need to <span className="text-cyber-yellow">Learn Faster</span>
        </h2>
        <p className="text-xl md:text-2xl text-white/30 font-bold mt-10 max-w-2xl leading-relaxed">
          Neural language models adapt to your unique learning style, creating a personalized educational experience that evolves with you.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {features.map((feature, index) => (
          <FeatureCard key={index} {...feature} />
        ))}
      </div>
    </section>
  );
}
