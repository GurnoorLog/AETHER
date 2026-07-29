"use client";

import { useEffect, useRef } from "react";
import mermaid from "mermaid";

mermaid.initialize({ startOnLoad: false, theme: "dark", themeVariables: { background: "transparent" } });

export default function MermaidBlock({ chart }: { chart: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || !chart.trim()) return;
    mermaid.run({ nodes: [ref.current] });
  }, [chart]);

  return (
    <div className="mermaid glass-card rounded-[28px] p-4 overflow-x-auto" ref={ref}>
      {chart}
    </div>
  );
}
