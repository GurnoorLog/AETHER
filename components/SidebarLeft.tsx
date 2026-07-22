"use client";

import { useState } from "react";
import { useAuth } from "@/providers/AuthProvider";

const navItems = [
  { href: "/dashboard", icon: "home", label: "Home", key: "home" },
  { href: "/chat", icon: "tutor", label: "AI Tutor", key: "tutor" },
  { href: "/knowledge", icon: "knowledge", label: "Knowledge", key: "knowledge" },
  { href: "/study", icon: "file-text", label: "Documents", key: "docs" },
  { href: "/quizzes", icon: "pencil-line", label: "Quizzes", key: "quizzes" },
  { href: "/progress", icon: "bar-chart-3", label: "Progress", key: "progress" },
  { href: "/roadmap", icon: "route", label: "Roadmap", key: "roadmap" },
  { href: "/music", icon: "music", label: "Focus Music", key: "music" },
];

const navIcons: Record<string, React.ReactNode> = {
  home: <path d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />,
  tutor: <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />,
  knowledge: <path d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75" />,
  "file-text": <path d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />,
  "pencil-line": <path d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />,
  "bar-chart-3": <path d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />,
  route: <path d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />,
  music: <path d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />,
};

export default function SidebarLeft({ currentPage }: { currentPage: string }) {
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const userName = user?.user_metadata?.full_name?.split(" ")[0] || "Student";

  return (
    <div className={`${collapsed ? "w-[72px]" : "w-[15%]"} shrink-0 transition-all duration-300`}>
      <aside className="h-full flex flex-col border-r border-white/5 bg-deep-onyx p-4 relative">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-6 w-6 h-6 bg-cyber-yellow rounded-full flex items-center justify-center text-black hover:scale-110 transition-all z-10 cursor-pointer"
        >
          <svg className={`w-3 h-3 transition-transform ${collapsed ? "" : "rotate-180"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
            <path d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className={`flex items-center gap-3 mb-8 ${collapsed ? "justify-center" : ""}`}>
          <div className="w-10 h-10 bg-cyber-yellow rounded-xl flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </div>
          {!collapsed && <span className="text-2xl font-bold tracking-tighter uppercase">Aether</span>}
        </div>

        <nav className="space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <a
              key={item.key}
              href={item.href}
              className={`flex items-center gap-3 p-3 rounded-xl transition-all ${collapsed ? "justify-center" : ""} ${item.key === currentPage ? "bg-white/5 text-cyber-yellow" : "opacity-60 hover:opacity-100"}`}
              title={collapsed ? item.label : undefined}
            >
              <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                {navIcons[item.icon]}
              </svg>
              {!collapsed && item.label}
            </a>
          ))}
        </nav>

        <div className={`pt-6 border-t border-white/5 mt-auto flex items-center gap-3 opacity-60 ${collapsed ? "justify-center" : ""}`}>
          {user?.user_metadata?.avatar_url ? (
            <img src={user.user_metadata.avatar_url} alt="" className="w-8 h-8 rounded-full border border-white/20 object-cover shrink-0" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyber-yellow to-amber-500 border border-white/20 flex items-center justify-center text-[10px] font-bold text-black shrink-0">
              {userName.charAt(0).toUpperCase()}
            </div>
          )}
          {!collapsed && <span className="text-xs font-semibold">{userName}</span>}
        </div>
      </aside>
    </div>
  );
}
