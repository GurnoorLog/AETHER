import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy · Aether",
  description: "How Aether collects, uses, and protects your data.",
};

const SECTIONS = [
  {
    h: "1. Who we are",
    p: "Aether (\"we\", \"us\", \"our\") is an AI study companion that helps you learn through personalized sessions, roadmaps, quizzes, and a private knowledge base. This policy explains what information we collect and how we use it. If you have questions, contact us at gurnoor.tamber.x.01@gmail.com.",
  },
  {
    h: "2. Information we collect",
    items: [
      "Account information: your name, email address, and authentication provider (such as Google) when you sign up.",
      "Learning data: the subjects and sessions you create, your progress, mastery, quiz results, chat conversations, and generated roadmaps.",
      "Content you upload: files you add to your knowledge base (PDF, PPTX, PNG, JPG, WebP). We extract and process their text to power search and tutoring.",
      "Payment information: if you subscribe, your billing details are handled by our payment processors (Stripe and RevenueCat). We store only your subscription status and plan tier, never your full card number.",
      "Usage information: basic analytics about how the app is used (for example, sessions started) to improve the product, plus standard crash and device data reported by your app store.",
    ],
  },
  {
    h: "3. How we use your information",
    items: [
      "Provide and personalize your learning experience (roadmaps, quizzes, explanations).",
      "Store and retrieve the files and notes you upload to your knowledge base.",
      "Process your subscription and grant access to paid features.",
      "Improve, secure, and troubleshoot the service.",
    ],
  },
  {
    h: "4. Third-party services",
    p: "We share data only with the service providers needed to run Aether, including: Supabase (hosting, database, authentication, and file storage); Google (sign-in and AI model services); our AI model providers (to generate explanations, roadmaps, and quizzes); and Stripe / RevenueCat (payments and subscriptions). These providers process your data on our behalf under their own privacy terms. We do not sell your personal information.",
  },
  {
    h: "5. Your files and content",
    p: "Files you upload are used solely to provide your learning experience. We do not use your personal documents for advertising or share their contents with other users. You can delete any file or session at any time from within the app.",
  },
  {
    h: "6. Data retention and deletion",
    p: "We keep your account and learning data for as long as your account is active. You can delete individual sessions, files, and conversations at any time. To delete your entire account and all associated data, email gurnoor.tamber.x.01@gmail.com and we will erase it within 30 days, except where we must retain limited information to comply with legal obligations.",
  },
  {
    h: "7. Children's privacy",
    p: "Aether is intended for users aged 13 and older (or the minimum age in your country). We do not knowingly collect personal information from children under 13. If you believe a child has provided us data, contact us and we will delete it.",
  },
  {
    h: "8. Security",
    p: "We protect your data with industry-standard measures including encrypted storage and transport (HTTPS/TLS) and restricted access controls. No method of transmission or storage is 100% secure, but we work to safeguard your information.",
  },
  {
    h: "9. Your rights",
    p: "Depending on your location, you may have the right to access, correct, export, or delete your personal data, and to object to or restrict certain processing. To exercise these rights, contact gurnoor.tamber.x.01@gmail.com.",
  },
  {
    h: "10. Changes to this policy",
    p: "We may update this policy from time to time. Material changes will be reflected by the \"Last updated\" date below, and we will notify you where required.",
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen w-full" style={{ backgroundColor: "#FDFBF7" }}>
      <div className="mx-auto max-w-3xl px-6 py-16">
        <div className="mb-10">
          <h1 className="text-[34px] font-bold tracking-tight" style={{ color: "#333", fontFamily: "'Outfit', sans-serif" }}>
            Privacy Policy
          </h1>
          <p className="text-sm mt-2" style={{ color: "#999" }}>
            Last updated: August 24, 2026
          </p>
        </div>

        <div className="space-y-9">
          {SECTIONS.map((s) => (
            <section key={s.h}>
              <h2 className="text-[18px] font-bold mb-3" style={{ color: "#6B8E61" }}>
                {s.h}
              </h2>
              {s.p && (
                <p className="text-[15px] leading-relaxed" style={{ color: "#555" }}>
                  {s.p}
                </p>
              )}
              {s.items && (
                <ul className="list-disc pl-5 space-y-2">
                  {s.items.map((it, i) => (
                    <li key={i} className="text-[15px] leading-relaxed" style={{ color: "#555" }}>
                      {it}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        <div
          className="mt-14 p-6 rounded-[24px] text-center"
          style={{ backgroundColor: "#FFFDF9", border: "1px solid #EFEBE5" }}
        >
          <p className="text-[14px]" style={{ color: "#666" }}>
            Questions about your privacy? Email us at{" "}
            <a href="mailto:gurnoor.tamber.x.01@gmail.com" className="font-bold" style={{ color: "#6B8E61" }}>
              gurnoor.tamber.x.01@gmail.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
