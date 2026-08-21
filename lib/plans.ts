export interface Plan {
  name: string;
  tier: "pro" | "unlimited" | null;
  price: string;
  period: string;
  desc: string;
  features: string[];
  cta: string;
  popular: boolean;
}

export const plans: Plan[] = [
  {
    name: "Free",
    tier: null,
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
    popular: false,
  },
  {
    name: "Pro",
    tier: "pro",
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
    popular: true,
  },
  {
    name: "Unlimited",
    tier: "unlimited",
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
    popular: false,
  },
];