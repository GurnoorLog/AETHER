"use client";

import { useEffect, useRef, useState } from "react";

export default function MermaidBlock({ chart }: { chart: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [showSvg, setShowSvg] = useState(false);

  useEffect(() => {
    if (!chart.trim()) return;
    setShowSvg(false);
    const el = ref.current;
    if (!el) return;
    el.textContent = chart;
    import("mermaid").then((m) => {
      m.default.initialize({ startOnLoad: false, theme: "dark", themeVariables: { background: "transparent" } });
      return m.default.run({ nodes: [el] });
    }).then(() => setShowSvg(true))
    .catch(() => {});
  }, [chart]);

  return (
    <div className="relative">
      <div ref={ref} className={`mermaid glass-card rounded-[28px] p-4 overflow-x-auto ${showSvg ? "" : "absolute inset-0 opacity-0 pointer-events-none"}`} />
      {!showSvg && (
        <pre className="glass-card rounded-[28px] p-4 overflow-x-auto text-xs text-white/60 font-mono whitespace-pre-wrap">{chart}</pre>
      )}
    </div>
  );
}
