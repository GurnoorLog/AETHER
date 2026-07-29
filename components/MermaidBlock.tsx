"use client";

import { useEffect, useRef, useState } from "react";

export default function MermaidBlock({ chart }: { chart: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!chart.trim()) return;
    setFailed(false);
    const el = ref.current;
    if (!el) return;
    el.textContent = chart;
    import("mermaid").then((mermaid) => {
      mermaid.default.initialize({ startOnLoad: false, theme: "dark", themeVariables: { background: "transparent" } });
      mermaid.default.run({ nodes: [el] }).catch(() => setFailed(true));
    });
  }, [chart]);

  if (failed) {
    return (
      <pre className="glass-card rounded-[28px] p-4 overflow-x-auto text-xs text-white/60 font-mono whitespace-pre-wrap">{chart}</pre>
    );
  }

  return (
    <div className="mermaid glass-card rounded-[28px] p-4 overflow-x-auto" ref={ref} />
  );
}
