"use client";

import { useEffect, useRef } from "react";
import Nav from "@/components/Nav";
import HeroSection from "@/components/HeroSection";
import FeatureBadges from "@/components/FeatureBadges";
import FeatureCards from "@/components/FeatureCards";
import LearningJourney from "@/components/LearningJourney";
import CtaSection from "@/components/CtaSection";
import Footer from "@/components/Footer";

export default function Home() {
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("active");
          }
        });
      },
      { threshold: 0.1 }
    );

    const currentRefs = sectionRefs.current;
    currentRefs.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => {
      currentRefs.forEach((el) => {
        if (el) observer.unobserve(el);
      });
    };
  }, []);

  const addToRefs = (el: HTMLElement | null) => {
    if (el && !sectionRefs.current.includes(el)) {
      sectionRefs.current.push(el);
    }
  };

  return (
    <div className="flex flex-col min-h-screen relative">
      <div className="fixed top-[-15%] right-[-10%] w-[800px] h-[800px] bg-cyber-yellow/10 rounded-full blur-[160px] pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[140px] pointer-events-none z-0" />

      <Nav />
      <HeroSection />
      <FeatureBadges />
      <section ref={addToRefs} className="reveal-on-scroll">
        <FeatureCards />
      </section>
      <section ref={addToRefs} className="reveal-on-scroll">
        <LearningJourney />
      </section>
      <section ref={addToRefs} className="reveal-on-scroll">
        <CtaSection />
      </section>
      <Footer />
    </div>
  );
}
