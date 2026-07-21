import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      { source: "/dashboard", destination: "/dio/index.html" },
      { source: "/chat", destination: "/dio/tutor.html" },
      { source: "/knowledge", destination: "/dio/knowledge.html" },
      { source: "/study", destination: "/dio/session.html" },
      { source: "/music", destination: "/dio/music.html" },
      { source: "/progress", destination: "/dio/progress.html" },
      { source: "/quizzes", destination: "/dio/quizzes.html" },
      { source: "/roadmap", destination: "/dio/roadmap.html" },
    ];
  },
};

export default nextConfig;
