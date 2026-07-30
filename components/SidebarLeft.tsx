"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import SettingsPanel from "./SettingsPanel";
import SidebarNav from "./SidebarNav";

export default function SidebarLeft({ currentPage }: { currentPage: string }) {
  const { user, signOut } = useAuth();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const userName = user?.user_metadata?.full_name?.split(" ")[0] || "Student";
  const pathParts = pathname.split("/").filter(Boolean);
  const sessionSlug = pathParts.length >= 2 ? pathParts[0] : null;

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <div className={`sidebar-desktop ${collapsed ? "w-[72px]" : "w-[15%]"} shrink-0 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] h-screen`}>
        <aside className="h-full flex flex-col border-r border-white/[0.04] bg-deep-onyx p-4 relative">
          {/* Collapse toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="absolute -right-3 top-8 w-6 h-6 bg-surface-elevated border border-white/[0.08] rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/[0.08] hover:scale-110 transition-all z-10 cursor-pointer"
          >
            <svg className={`w-2.5 h-2.5 transition-transform duration-300 ${collapsed ? "" : "rotate-180"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Logo */}
          <div className={`flex items-center gap-3 mb-10 ${collapsed ? "justify-center" : ""}`}>
            <div className="w-9 h-9 bg-cyber-yellow rounded-[10px] flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
              </svg>
            </div>
            {!collapsed && (
              <span className="text-[15px] font-bold tracking-[-0.03em] text-white/90">Aether</span>
            )}
          </div>

          {/* Navigation */}
          <SidebarNav collapsed={collapsed} />

          {/* User */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className={`w-full pt-5 border-t border-white/[0.04] mt-auto flex items-center gap-3 hover:bg-white/[0.02] rounded-lg transition-all cursor-pointer ${collapsed ? "justify-center px-0" : "px-2"}`}
            >
              {user?.user_metadata?.avatar_url ? (
                <img src={user.user_metadata.avatar_url} alt="" className="w-8 h-8 rounded-full border border-white/[0.08] object-cover shrink-0" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-cyber-yellow/10 border border-cyber-yellow/20 flex items-center justify-center text-[10px] font-bold text-cyber-yellow shrink-0">
                  {userName.charAt(0).toUpperCase()}
                </div>
              )}
              {!collapsed && (
                <div className="min-w-0 flex-1 text-left">
                  <p className="text-xs font-semibold text-white/80 truncate">{userName}</p>
                  <p className="text-[10px] text-white/30">Student</p>
                </div>
              )}
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <div className={`absolute bottom-full mb-2 ${collapsed ? "left-1/2 -translate-x-1/2" : "left-2"} w-[200px] bg-[#1a1a1a] border border-white/[0.08] rounded-xl shadow-2xl overflow-hidden z-50`}>
                  <div className="px-4 py-3 border-b border-white/[0.04]">
                    <p className="text-xs font-semibold text-white/90 truncate">{user?.user_metadata?.full_name || "Student"}</p>
                    <p className="text-[10px] text-white/40 truncate">{user?.email || ""}</p>
                  </div>
                  <button
                    onClick={() => { setMenuOpen(false); setSettingsOpen(true); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-white/70 hover:bg-white/[0.04] hover:text-white transition-all cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                      <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Settings
                  </button>
                  <button
                    onClick={() => { setMenuOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-white/70 hover:bg-white/[0.04] hover:text-white transition-all cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                    </svg>
                    Help & Support
                  </button>
                  <div className="border-t border-white/[0.04]" />
                  <button
                    onClick={() => { setMenuOpen(false); signOut(); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-red-400 hover:bg-white/[0.04] hover:text-red-300 transition-all cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                    </svg>
                    Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        </aside>
      </div>

      {/* ── Mobile hamburger ── */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-[60] w-10 h-10 bg-surface-elevated border border-white/[0.08] rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-white/[0.08] transition-all cursor-pointer"
        aria-label={mobileOpen ? "Close menu" : "Open menu"}
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          {mobileOpen ? (
            <path d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          )}
        </svg>
      </button>

      {/* ── Mobile drawer backdrop ── */}
      {mobileOpen && (
        <div
          className="sidebar-mobile fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Mobile drawer panel ── */}
      <aside
        className={`sidebar-mobile fixed top-0 left-0 h-full w-[280px] bg-deep-onyx border-r border-white/[0.04] p-4 flex flex-col transform transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] z-50 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
        style={{ pointerEvents: mobileOpen ? "auto" : "none" }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 mb-10">
          <div className="w-9 h-9 bg-cyber-yellow rounded-[10px] flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
            </svg>
          </div>
          <span className="text-[15px] font-bold tracking-[-0.03em] text-white/90">Aether</span>
        </div>

        {/* Navigation */}
        <SidebarNav collapsed={false} />

        {/* User */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-full pt-5 border-t border-white/[0.04] mt-auto flex items-center gap-3 px-2 hover:bg-white/[0.02] rounded-lg transition-all cursor-pointer"
          >
            {user?.user_metadata?.avatar_url ? (
              <img src={user.user_metadata.avatar_url} alt="" className="w-8 h-8 rounded-full border border-white/[0.08] object-cover shrink-0" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-cyber-yellow/10 border border-cyber-yellow/20 flex items-center justify-center text-[10px] font-bold text-cyber-yellow shrink-0">
                {userName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1 text-left">
              <p className="text-xs font-semibold text-white/80 truncate">{userName}</p>
              <p className="text-[10px] text-white/30">Student</p>
            </div>
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <div className="absolute bottom-full mb-2 left-2 w-[200px] bg-[#1a1a1a] border border-white/[0.08] rounded-xl shadow-2xl overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-white/[0.04]">
                  <p className="text-xs font-semibold text-white/90 truncate">{user?.user_metadata?.full_name || "Student"}</p>
                  <p className="text-[10px] text-white/40 truncate">{user?.email || ""}</p>
                </div>
                <button
                  onClick={() => { setMenuOpen(false); setSettingsOpen(true); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-white/70 hover:bg-white/[0.04] hover:text-white transition-all cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                    <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Settings
                </button>
                <button
                  onClick={() => { setMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-white/70 hover:bg-white/[0.04] hover:text-white transition-all cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                  </svg>
                  Help & Support
                </button>
                <div className="border-t border-white/[0.04]" />
                <button
                  onClick={() => { setMenuOpen(false); signOut(); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-red-400 hover:bg-white/[0.04] hover:text-red-300 transition-all cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                  </svg>
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </aside>

      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}
