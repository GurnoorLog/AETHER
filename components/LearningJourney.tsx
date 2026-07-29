"use client";

import { useRef, useEffect, useState } from "react";

const steps = [
  {
    month: "",
    title: "Upload Your Material",
    description: "Drag and drop any learning material—PDFs, slides, code, lecture notes, or YouTube links. Aether automatically processes everything into a structured knowledge base.",
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
    accent: "#60A5FA",
  },
  {
    month: "",
    title: "AI Generates Your Curriculum",
    description: "Aether analyzes the material, creates a concept graph, and generates a personalized curriculum tailored to your goals, with prerequisite chains and learning milestones.",
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
      </svg>
    ),
    accent: "#A78BFA",
  },
  {
    month: "",
    title: "Conversational Tutoring",
    description: "Chat or speak naturally with your AI tutor. Ask questions, get Socratic guidance, explore tangents, and receive real-time feedback just like a human tutor.",
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
      </svg>
    ),
    accent: "#34D399",
  },
  {
    month: "",
    title: "Mastery Assessment",
    description: "Adaptive quizzes and challenges target your weak areas. Aether uses space repetition to reinforce concepts at optimal intervals for long-term retention.",
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" />
      </svg>
    ),
    accent: "#FBBF24",
  },
  {
    month: "",
    title: "Review & Revisit",
    description: "At any time, revisit past concepts. Aether retrieves the full context, finds knowledge gaps, and re-adapts the curriculum to close them.",
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
      </svg>
    ),
    accent: "#F472B6",
  },
];

export default function LearningJourney() {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [activeStep, setActiveStep] = useState(-1);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.getAttribute("data-index"));
            setActiveStep((prev) => Math.max(prev, index));
          }
        });
      },
      { threshold: 0.3 }
    );

    const steps = timelineRef.current?.querySelectorAll(".step-card");
    steps?.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <section id="methodology" className="px-12 md:px-24 py-48 max-w-7xl mx-auto">
      <div className="flex flex-col items-center mb-32 text-center">
        <h2 className="text-6xl md:text-8xl font-black text-white leading-[0.9] tracking-tight max-w-4xl">
          Your Learning Journey in{" "}
          <span className="relative">
            <span className="text-cyber-yellow">5 Steps</span>
            <svg className="absolute -bottom-4 left-0 w-full" height="10" viewBox="0 0 300 10" fill="none">
              <path d="M4 6C75 2 225 2 296 6" stroke="#FBBF24" strokeWidth="6" strokeLinecap="round" />
            </svg>
          </span>
        </h2>
        <p className="text-xl md:text-2xl text-white/30 font-bold mt-10 max-w-2xl leading-relaxed">
          From your first upload to mastery, Aether guides you through a proven learning loop.
        </p>
      </div>

      <div ref={timelineRef} className="relative">
        {/* Timeline line */}
        <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-cyber-yellow/40 via-white/20 to-transparent" />

        {steps.map((step, index) => {
          const isLeft = index % 2 === 0;
          return (
            <div
              key={index}
              className="relative flex items-center mb-24 last:mb-0 flex-col lg:flex-row"
            >
              {/* Content */}
              <div
                className={`w-full lg:w-[calc(50%-3rem)] step-card ${
                  isLeft ? "lg:mr-auto lg:pr-8" : "lg:ml-auto lg:pl-8"
                } ${isLeft ? "lg:text-right" : "lg:text-left"}`}
                data-index={index}
                style={{
                  opacity: activeStep >= index ? 1 : 0,
                  transform: activeStep >= index ? "translateY(0)" : "translateY(40px)",
                  transition: `all 0.6s ease ${index * 0.1}s`,
                }}
              >
                <div className={`glass-card-darker p-10 rounded-[32px] border border-white/10 ${isLeft ? "lg:mr-8" : "lg:ml-8"}`}>
                  <div className={`flex items-center gap-6 mb-6 ${isLeft ? "lg:flex-row-reverse" : ""}`}>
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${step.accent}20`, color: step.accent }}
                    >
                      {step.icon}
                    </div>
                    <h3 className="text-2xl font-black text-white">{step.title}</h3>
                  </div>
                  <p className={`text-white/40 font-bold leading-relaxed ${isLeft ? "lg:text-right" : ""}`}>
                    {step.description}
                  </p>
                </div>
              </div>

              {/* Timeline node */}
              <div className="hidden lg:flex absolute left-1/2 -translate-x-1/2 w-8 h-8 rounded-full border-2 border-white/20 bg-black z-10 items-center justify-center">
                <div
                  className={`w-3 h-3 rounded-full transition-all duration-500 ${
                    activeStep >= index ? "bg-cyber-yellow" : "bg-white/10"
                  }`}
                />
              </div>

              {/* Empty space for the other side */}
              <div className="hidden lg:block w-[calc(50%-3rem)]" />
            </div>
          );
        })}
      </div>
    </section>
  );
}
