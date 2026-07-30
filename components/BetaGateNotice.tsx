"use client";

import { useEffect, useState } from "react";

export default function BetaGateNotice() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (window.location.search.includes("beta=unapproved")) {
      setShow(true);
      window.history.replaceState({}, "", "/");
    }
  }, []);

  if (!show) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[300] animate-[slideDown_0.4s_cubic-bezier(.16,1,.24,1)]">
      <div className="bg-[#FDE047] text-[#0a0a0c] px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-4 max-w-lg">
        <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
        <p className="text-sm font-bold leading-snug">
          Your account is not approved for beta access yet.{" "}
          <a href="#beta-section" className="underline underline-offset-2 hover:no-underline" onClick={() => setShow(false)}>
            Join the waitlist
          </a>{" "}
          to get early access.
        </p>
        <button
          onClick={() => setShow(false)}
          className="ml-auto shrink-0 w-6 h-6 rounded-full bg-black/10 flex items-center justify-center hover:bg-black/20 transition-colors cursor-pointer"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <style>{`@keyframes slideDown{from{opacity:0;transform:translate(-50%,-20px)}to{opacity:1;transform:translate(-50%,0)}}`}</style>
    </div>
  );
}
